from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import AudioTranscriptionProvider, ChatProvider, GroqAudioTranscriptionProvider, GroqChatProvider, ProviderUnavailable
from app.config import Settings, get_settings
from app.database import create_database, create_schema, get_session
from app.models import ChatMessage, Conversation, User
from app.prompts import build_system_prompt
from app.schemas import ChatRequest, ChatResponse, ConsentUpdate, CreateUserRequest, CreateUserResponse
from app.security import get_current_user, hash_access_token, issue_access_token


MAX_TRANSCRIPTION_BYTES = 25_000_000


def create_app(
    settings: Settings | None = None,
    chat_provider: ChatProvider | None = None,
    transcription_provider: AudioTranscriptionProvider | None = None,
) -> FastAPI:
    app_settings = settings or get_settings()
    engine, session_factory = create_database(app_settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.session_factory = session_factory
        await create_schema(engine)
        yield
        await engine.dispose()

    app = FastAPI(title="HERmind API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.state.chat_provider = chat_provider or GroqChatProvider(
        app_settings.groq_api_key,
        app_settings.groq_base_url,
        app_settings.groq_model,
    )
    app.state.transcription_provider = transcription_provider or GroqAudioTranscriptionProvider(
        app_settings.groq_api_key,
        app_settings.groq_base_url,
        app_settings.groq_transcription_model,
    )

    @app.get("/health")
    async def health(session: AsyncSession = Depends(get_session)) -> dict[str, str]:
        await session.execute(text("SELECT 1"))
        return {"status": "ok"}

    @app.post("/users", response_model=CreateUserResponse, status_code=status.HTTP_201_CREATED)
    async def create_user(body: CreateUserRequest, session: AsyncSession = Depends(get_session)) -> CreateUserResponse:
        access_token = issue_access_token()
        user = User(
            pseudonym=body.pseudonym,
            language=body.language,
            goals=body.goals,
            access_token_hash=hash_access_token(access_token),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return CreateUserResponse(user_id=UUID(user.id), access_token=access_token)

    @app.patch("/users/me/consent", status_code=status.HTTP_204_NO_CONTENT)
    async def update_history_consent(
        body: ConsentUpdate,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> Response:
        user.chat_history_enabled = body.chat_history_enabled
        if not body.chat_history_enabled:
            await _delete_chat_history(session, user.id)
        await session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.delete("/chat/history", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_chat_history(
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> Response:
        await _delete_chat_history(session, user.id)
        await session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
    async def delete_user(
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> Response:
        await _delete_chat_history(session, user.id)
        await session.delete(user)
        await session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.post("/chat", response_model=ChatResponse)
    async def chat(
        body: ChatRequest,
        request: Request,
        user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> ChatResponse:
        if app_settings.groq_api_key is None or not app_settings.groq_api_key.get_secret_value().strip():
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Le fournisseur IA n'est pas configuré sur le serveur")

        conversation: Conversation | None = None
        if user.chat_history_enabled:
            if body.conversation_id is not None:
                conversation = await session.scalar(
                    select(Conversation).where(
                        Conversation.id == str(body.conversation_id),
                        Conversation.user_id == user.id,
                    )
                )
                if conversation is None:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable")
            else:
                conversation = Conversation(user_id=user.id)
                session.add(conversation)
                await session.flush()

            stored_messages = await session.scalars(
                select(ChatMessage)
                .where(ChatMessage.conversation_id == conversation.id)
                .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
                .limit(app_settings.max_history_messages)
            )
            context = [{"role": item.role, "content": item.content} for item in reversed(list(stored_messages))]
        else:
            context = [{"role": item.role, "content": item.content} for item in body.context[-app_settings.max_history_messages :]]

        context.append({"role": "user", "content": body.message})
        system_prompt = build_system_prompt(
            body.language,
            body.mode,
            user.pseudonym,
            user.goals,
            body.message,
        )
        try:
            reply = await request.app.state.chat_provider.reply(system_prompt, context)
        except ProviderUnavailable as error:
            await session.rollback()
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error

        if conversation is not None:
            session.add_all(
                [
                    ChatMessage(conversation_id=conversation.id, role="user", content=body.message),
                    ChatMessage(conversation_id=conversation.id, role="assistant", content=reply),
                ]
            )
            await session.commit()
            conversation_id = UUID(conversation.id)
        else:
            await session.rollback()
            conversation_id = None

        return ChatResponse(conversation_id=conversation_id, message=reply, stored=conversation is not None)

    @app.post("/transcribe")
    async def transcribe(
        file: UploadFile = File(...),
        language: str | None = Form(default=None),
        user: User = Depends(get_current_user),
    ) -> dict[str, str]:
        if app_settings.groq_api_key is None or not app_settings.groq_api_key.get_secret_value().strip():
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Le fournisseur IA n'est pas configuré sur le serveur")
        if language not in (None, "ar", "fr"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Langue de transcription non prise en charge")

        audio = await file.read(MAX_TRANSCRIPTION_BYTES + 1)
        await file.close()
        if not audio:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'enregistrement audio est vide")
        if len(audio) > MAX_TRANSCRIPTION_BYTES:
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="L'enregistrement dépasse la limite de 25 Mo")

        try:
            text = await app.state.transcription_provider.transcribe(
                audio,
                file.filename or "recording.m4a",
                file.content_type or "application/octet-stream",
                language,
            )
        except ProviderUnavailable as error:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error
        return {"text": text}

    return app


async def _delete_chat_history(session: AsyncSession, user_id: str) -> None:
    conversation_ids = select(Conversation.id).where(Conversation.user_id == user_id)
    await session.execute(delete(ChatMessage).where(ChatMessage.conversation_id.in_(conversation_ids)))
    await session.execute(delete(Conversation).where(Conversation.user_id == user_id))


app = create_app()
