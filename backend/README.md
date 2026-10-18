# HERmind API

FastAPI service for the mobile companion. It uses SQLite for local development and PostgreSQL when `HER_DATABASE_URL` is configured. The server calls Groq's OpenAI-compatible chat-completions endpoint and transcribes short voice recordings; Groq credentials are read only by this backend.

The default Groq chat model is `qwen/qwen3.8-27b`, selected for its stronger response in Tunisian Darija testing. Set `HER_GROQ_MODEL` in `backend/.env` to use another model available to your Groq account.

### Tunisian Darija quality

The chat prompt asks the model to mirror the user's script (Arabizi or Tunisian Arabic), use common Tunisian spellings, and avoid literal translations and other Arabic dialects. Prompt guidance improves a general multilingual model but cannot guarantee native-level phrasing.

For a dialect-specific model, [ESPRIT-Derja-Qwen3-8B-v2](https://huggingface.co/ESPRIT-Group/ESPRIT-Derja-Qwen3-8B-v2) is Apache-2.0 licensed and fine-tuned for Tunisian Arabic and Arabizi. Its model card describes an 8B model requiring a separate inference host (the authors document vLLM on ESPRIT AI Forge); it is not the generic Qwen model served by Groq. [Labess-7b-chat](https://huggingface.co/linagora/Labess-7b-chat-16bit) is another Apache-2.0 Tunisian Derja model.

Datasets such as [Tunisian Darija-English](https://huggingface.co/datasets/Dhiadev-tn/tunisian-darija-english) (CC BY-NC-SA 4.0) have usage conditions and are not drop-in response libraries. [FineWeb2 Tunisian Arabic](https://huggingface.co/datasets/linagora/fineweb2_Tunisian_Arabic) is a large, general web-text corpus rather than a curated supportive-chat dataset. Check each resource's license and provenance before using it for retrieval or training.

## Local development

```powershell
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Copy `.env.example` to `.env`, add a Groq API key as `HER_GROQ_API_KEY`, and set `HER_DATABASE_URL` to the PostgreSQL URL if using PostgreSQL. Create a key from [Groq Console](https://console.groq.com/keys). Without a database URL, the service creates `hermind.db` in this directory. Without a provider key, `/chat` and `/transcribe` return `503` rather than pretending a mock response is real.

`POST /transcribe` accepts an authenticated audio upload up to 25 MB and forwards it to Groq's `whisper-large-v3-turbo` speech-to-text model. HERmind does not persist the uploaded audio. This transcription model is separate from `HER_GROQ_MODEL`, which continues to power chat.

The `/chat` endpoint also accepts `mode: "a7kili"` for supportive listening followed by optional podcast and music YouTube search phrases. The app turns those phrases into YouTube search links; it does not claim that a specific video has been verified.

Study support is available through the chat modes `study_plan`, `study_tutor`, `study_quiz`, and `success_coach`. These modes ask Groq for realistic study plans, patient explanations, one-question-at-a-time revision quizzes, and small achievable next steps; they do not create calendar events or guarantee academic results.

To start PostgreSQL with Docker Compose, configure `POSTGRES_PASSWORD`, run `docker compose up -d db`, then set `HER_DATABASE_URL=postgresql+asyncpg://hermind:<password>@localhost:5432/hermind` in `.env`.

## Mobile client

Set `EXPO_PUBLIC_API_URL=http://<computer-lan-ip>:8000` in the Expo app's `.env.local`, then restart Expo with `npx expo start --go --lan`. A physical phone must use the computer's reachable LAN IP, not `localhost`. Enable connected chat and, separately, server history in HERmind Settings.

For the local web preview, use `http://localhost:8083` for the Expo app; this origin is allowed by the development API defaults. If Expo selects a different web port, include that origin in `HER_ALLOWED_ORIGINS` before starting the API.

## Privacy and limits

`POST /users` creates an anonymous account and returns a high-entropy bearer token once; only its SHA-256 hash is stored. The app should keep the token in SecureStore. The backend stores chat messages only after the user enables chat-history storage. Turning that setting off deletes stored conversation history. `DELETE /users/me` deletes the anonymous account and its conversations.

The app-generated SQLAlchemy schema is intended for this hackathon prototype. Add Alembic migrations, rate limiting, monitoring, TLS, backups, retention controls, and reviewed safety operations before production. Do not expose this development server publicly.

Stored message content is currently plaintext in the configured database (transport encryption depends on deployment). Use synthetic demo data only. Production requires encrypted storage, strict database access controls, a retention policy, and a security/privacy review.

## Tests

```powershell
uv run pytest
```
