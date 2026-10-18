# HERmind

HERmind is a mobile-first well-being and study-support app for university students and young graduates in Tunisia. It combines private self-reflection, practical study tools, and an optional AI companion in French, Arabic, and Tunisian Derja/Arabizi.

> **Prototype notice:** HERmind is a hackathon prototype, not a medical or mental-health service. The AI does not provide therapy, diagnosis, or emergency support. Do not use real sensitive information in demos.

## The problem

Students can face academic pressure, stress, isolation, and uncertainty about where to find approachable support. Well-being and study tools are often disconnected, while generic advice may not reflect a student's immediate needs or language.

## HERmind's approach

HERmind offers a private, low-pressure place to pause and choose a next step:

- **Mood check-ins and reflection:** record a mood, write a private note, and track small actions on the device.
- **Companion:** optional AI conversations with listening, small-action, and breathing modes.
- **A7kili:** supportive listening with optional YouTube search phrases for podcasts and music. The app does not verify individual search results.
- **Réussite:** AI-assisted study plans, patient explanations, one-question-at-a-time quizzes, and practical motivation.
- **Avatar:** an animated companion with optional voice input, spoken replies, and a local camera preview.
- **Planning and journey:** organize study events and review personal check-ins.
- **HerCircle:** a community-style interface; circles and member counts are illustrative demo content, not a live social network.

Some visual examples and indicators are explicitly demo content. Reflection suggestions are rule-based on-device, not an AI diagnosis.

## AI integration

The mobile app does not call Groq directly. Its optional AI flow is:

```text
Expo / React Native app
  ├── HTTPS/HTTP JSON ──> HERmind FastAPI backend ──> Groq chat model
  └── authenticated audio ──> HERmind FastAPI backend ──> Groq Whisper
```

- The backend keeps `HER_GROQ_API_KEY` and calls Groq's OpenAI-compatible API. The default chat model is `qwen/qwen3.8-27b`; voice transcription uses `whisper-large-v3-turbo`.
- Dedicated prompts support listening, next steps, relaxation, A7kili, study planning, tutoring, quizzes, and motivation. For Tunisian Derja, prompts ask the model to follow the user's Arabic or Latin (Arabizi) script. This improves guidance but cannot guarantee dialect quality.
- Avatar voice input is recorded in the app, transcribed by the backend, and sent as text to chat. Spoken replies use device text-to-speech. The optional camera preview stays on the device and is not sent to the AI.
- AI features require a reachable backend and a valid Groq key. Without them, connected chat and transcription report that the service is unavailable; local app features remain usable.
- Conversation history on the server is off by default and requires separate consent. The uploaded audio is not persisted by HERmind. Mood notes and planning data are stored locally by the app.

See [the presentation dossier](presentation/HERmind-Dossier-presentation.md) for a detailed product and AI walkthrough, limitations, and screenshots.

## Tech stack

| Area | Technologies |
| --- | --- |
| Mobile app | Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router |
| Device features | Expo Audio, Camera, SecureStore, Speech, FileSystem |
| API | Python 3.11+, FastAPI, Pydantic Settings, SQLAlchemy async |
| AI | Groq chat completions and Whisper transcription |
| Database | SQLite by default; PostgreSQL can be configured |
| Tests | Pytest for the backend |

## Run locally

### Requirements

- Node.js and npm
- Python 3.11+ and [uv](https://docs.astral.sh/uv/)
- Expo Go for running on a physical phone (or an Android/iOS simulator)
- A Groq API key for AI chat and voice transcription

### 1. Install mobile dependencies

From the repository root:

```bash
npm ci
```

### 2. Configure and run the backend

In a second terminal:

```bash
cd backend
```

Copy `backend/.env.example` to `backend/.env` (PowerShell):

```powershell
Copy-Item .env.example .env
```

Edit `backend/.env` and set `HER_GROQ_API_KEY` to your own key from [Groq Console](https://console.groq.com/keys). Keep this key in the backend environment only; never put it in an `EXPO_PUBLIC_` variable or commit it. The example uses SQLite, so PostgreSQL is not required for local development.

Install backend dependencies and start the API:

```bash
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run these commands from the `backend` directory. The API health endpoint is `http://localhost:8000/health`.

### 3. Configure and run the app

In a terminal at the repository root, copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Set `EXPO_PUBLIC_API_URL` in `.env.local`:

- **Web or Android emulator on the same computer:** `http://localhost:8000`
- **Physical phone:** `http://<computer-LAN-IP>:8000` (for example, `http://192.168.1.20:8000`)

For a physical phone, connect the phone and computer to the same Wi-Fi network, use the computer's LAN IP instead of `localhost`, and allow port 8000 through the computer firewall if needed. Do not expose the development API directly to the public internet.

Start Expo:

```bash
npm run start -- --go --lan
```

Scan the QR code with Expo Go. If the app was already running when `.env.local` was changed, stop and restart Expo so the updated API URL is loaded. If you only want to preview the app in a browser, use `npm run web`.

### AI and offline/local use

The app can be explored without a Groq key, but connected AI chat and transcription need both a configured key on the backend and a working app-to-backend connection. The backend responds with an unavailable-service error rather than returning a fabricated AI answer. Device-local features do not require Groq.

## Tests and checks

From `backend`:

```bash
uv run pytest
```

From the repository root:

```bash
npm run lint
npx tsc --noEmit
```

## Privacy and production limitations

HERmind is a prototype. Server-stored conversations are optional and require user consent, but stored message text is currently plaintext in the configured database. The local development API is not production-hardened. Before production, add TLS, access controls, encrypted storage, migrations, rate limiting, monitoring, backups, retention controls, and a reviewed safety process. See [the backend documentation](backend/README.md) for more details.

## Équipe

Projet réalisé en équipe de 3 lors du **HERwin Hackathon** (IEEE WIE, École Polytechnique de Sousse, 2026).

| Membre | Rôle |
|---|---|
| Mariem Werghemmi ([@Mariem-werghemmi](https://github.com/Mariem-werghemmi)) 
| Melek Nagat ([@Meleknagat](https://github.com/Meleknagat)) 


Dépôt original : [Meleknagat/Hackathon-HerWin](https://github.com/Meleknagat/Hackathon-HerWin)

HERmind is a mobile-first well-being...