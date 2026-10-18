from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, StringConstraints
from typing_extensions import Annotated

Language = Literal["Français", "Darija tunisienne", "العربية"]
SupportMode = Literal[
    "talk",
    "act",
    "relax",
    "a7kili",
    "study_plan",
    "study_tutor",
    "study_quiz",
    "success_coach",
]
MessageRole = Literal["user", "assistant"]


class CreateUserRequest(BaseModel):
    pseudonym: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
    language: Language
    goals: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]] = Field(default_factory=list, max_length=10)


class CreateUserResponse(BaseModel):
    user_id: UUID
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class ConsentUpdate(BaseModel):
    chat_history_enabled: bool


class ContextMessage(BaseModel):
    role: MessageRole
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class ChatRequest(BaseModel):
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
    mode: SupportMode
    language: Language
    conversation_id: UUID | None = None
    context: list[ContextMessage] = Field(default_factory=list, max_length=12)


class ChatResponse(BaseModel):
    conversation_id: UUID | None
    message: str
    stored: bool
