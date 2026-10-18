from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.config import Settings
from app.main import create_app
from app.prompts import build_system_prompt


class FakeProvider:
    def __init__(self):
        self.calls: list[tuple[str, list[dict[str, str]]]] = []

    async def reply(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        self.calls.append((system_prompt, messages))
        return "On peut choisir une petite étape ensemble."


class FakeTranscriptionProvider:
    def __init__(self):
        self.calls: list[tuple[bytes, str, str, str | None]] = []

    async def transcribe(self, audio: bytes, filename: str, content_type: str, language: str | None) -> str:
        self.calls.append((audio, filename, content_type, language))
        return "Je suis stressée pour mon examen."


@pytest.fixture
def client(tmp_path) -> Generator[tuple[TestClient, FakeProvider, FakeTranscriptionProvider], None, None]:
    provider = FakeProvider()
    transcription_provider = FakeTranscriptionProvider()
    settings = Settings(
        database_url=f"sqlite+aiosqlite:///{tmp_path / 'hermind-test.db'}",
        groq_api_key=SecretStr("test-key"),
        allowed_origins="http://localhost:8083,http://localhost:8084",
    )
    app = create_app(settings=settings, chat_provider=provider, transcription_provider=transcription_provider)
    with TestClient(app) as test_client:
        yield test_client, provider, transcription_provider


def create_account(client: TestClient) -> str:
    response = client.post(
        "/users",
        json={"pseudonym": "Amira", "language": "Français", "goals": ["PFE et soutenance"]},
    )
    assert response.status_code == 201
    return response.json()["access_token"]


def test_chat_requires_anonymous_bearer_token(client):
    test_client, _, _ = client
    response = test_client.post(
        "/chat",
        json={"message": "Je suis stressée", "mode": "talk", "language": "Français"},
    )
    assert response.status_code == 401


def test_web_preview_origin_is_allowed_by_cors(client):
    test_client, _, _ = client
    response = test_client.options(
        "/users",
        headers={
            "Origin": "http://localhost:8083",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8083"


def test_chat_uses_local_context_until_history_consent(client):
    test_client, provider, _ = client
    token = create_account(test_client)
    headers = {"Authorization": f"Bearer {token}"}
    body = {
        "message": "Je bloque devant ma soutenance",
        "mode": "act",
        "language": "Français",
        "context": [{"role": "assistant", "content": "Tu peux me parler."}],
    }

    response = test_client.post("/chat", headers=headers, json=body)
    assert response.status_code == 200
    assert response.json()["stored"] is False
    assert response.json()["conversation_id"] is None
    assert provider.calls[-1][1][0]["content"] == "Tu peux me parler."
    assert provider.calls[-1][0].find("one small, realistic next step") >= 0


def test_chat_provider_is_instructed_to_redirect_out_of_scope_requests(client):
    test_client, provider, _ = client
    token = create_account(test_client)

    response = test_client.post(
        "/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Écris du code Python", "mode": "talk", "language": "Français"},
    )

    assert response.status_code == 200
    system_prompt = provider.calls[-1][0]
    assert "Stay strictly within HERmind's scope" in system_prompt
    assert "do not provide code" in system_prompt
    assert "Prioritize immediate safety" in system_prompt


def test_a7kili_prompt_adds_supportive_youtube_search_suggestions(client):
    test_client, provider, _ = client
    token = create_account(test_client)

    response = test_client.post(
        "/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Je suis découragée par mes études",
            "mode": "a7kili",
            "language": "Français",
        },
    )

    assert response.status_code == 200
    system_prompt = provider.calls[-1][0]
    assert "A7kili listening-and-encouragement feature" in system_prompt
    assert "[ECOUTE]" in system_prompt
    assert "[PODCAST]" in system_prompt
    assert "[MUSIQUE]" in system_prompt
    assert "search phrases, not URLs" in system_prompt


@pytest.mark.parametrize(
    ("mode", "prompt_guidance"),
    [
        ("study_plan", "Create a flexible, realistic plan"),
        ("study_tutor", "Act as a patient university tutor"),
        ("study_quiz", "Run an interactive revision quiz"),
        ("success_coach", "Be a practical, encouraging success coach"),
    ],
)
def test_study_modes_add_specialized_groq_guidance(client, mode, prompt_guidance):
    test_client, provider, _ = client
    token = create_account(test_client)

    response = test_client.post(
        "/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Je veux avancer dans mes études",
            "mode": mode,
            "language": "Français",
        },
    )

    assert response.status_code == 200
    assert prompt_guidance in provider.calls[-1][0]


def test_tunisian_darija_prompt_uses_natural_local_language_and_matches_script():
    system_prompt = build_system_prompt("Darija tunisienne", "talk", "Amira", [], "Rani mstressia barcha")

    assert "Tunisian Derja (Aeb), not generic Arabic" in system_prompt
    assert "Follow the user's latest script" in system_prompt
    assert "write in Latin-script Tunisian Arabizi" in system_prompt
    assert "Do not switch the reply into Arabic script" in system_prompt
    assert "Words like 'barcha', 'mouch', 'tawa', 'chwaya', 'ma lezmekch', and 'chnowa' are examples" in system_prompt
    assert "Avoid Modern Standard Arabic and Moroccan forms" in system_prompt
    assert "reflect the user's specific feeling briefly" in system_prompt
    assert "Modern Standard Arabic" in system_prompt
    assert "rather than guessing at dialect vocabulary" in system_prompt


def test_tunisian_darija_prompt_uses_arabic_script_for_arabic_input():
    system_prompt = build_system_prompt(
        "Darija tunisienne",
        "talk",
        "Amira",
        [],
        "راني مقلقة على الامتحان",
    )

    assert "write in colloquial Tunisian Arabic script" in system_prompt
    assert "Do not transliterate the reply into Latin characters" in system_prompt


def test_chat_script_guidance_is_based_on_the_current_message(client):
    test_client, provider, _ = client
    token = create_account(test_client)

    for message, expected_script in (
        ("Rani mstressia barcha 3al examen", "Latin-script Tunisian Arabizi"),
        ("راني مقلقة على الامتحان", "colloquial Tunisian Arabic script"),
    ):
        response = test_client.post(
            "/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": message, "mode": "talk", "language": "Darija tunisienne"},
        )
        assert response.status_code == 200
        assert expected_script in provider.calls[-1][0]


def test_default_groq_model_is_multilingual_qwen():
    settings = Settings(_env_file=None)

    assert settings.groq_model == "qwen/qwen3.8-27b"
    assert settings.groq_transcription_model == "whisper-large-v3-turbo"


def test_history_is_stored_only_after_explicit_consent_and_can_be_deleted(client):
    test_client, _, _ = client
    token = create_account(test_client)
    headers = {"Authorization": f"Bearer {token}"}
    consent = test_client.patch("/users/me/consent", headers=headers, json={"chat_history_enabled": True})
    assert consent.status_code == 204

    response = test_client.post(
        "/chat",
        headers=headers,
        json={"message": "Je prépare mon PFE", "mode": "talk", "language": "Français"},
    )
    assert response.status_code == 200
    assert response.json()["stored"] is True
    assert response.json()["conversation_id"]

    deleted = test_client.patch("/users/me/consent", headers=headers, json={"chat_history_enabled": False})
    assert deleted.status_code == 204
    assert test_client.delete("/chat/history", headers=headers).status_code == 204


def test_unconfigured_provider_returns_service_unavailable(tmp_path):
    settings = Settings(database_url=f"sqlite+aiosqlite:///{tmp_path / 'no-key.db'}", groq_api_key=SecretStr(""))
    app = create_app(settings=settings)
    with TestClient(app) as test_client:
        token = create_account(test_client)
        response = test_client.post(
            "/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "Bonjour", "mode": "talk", "language": "Français"},
        )
    assert response.status_code == 503


def test_transcription_requires_anonymous_bearer_token(client):
    test_client, _, _ = client
    response = test_client.post(
        "/transcribe",
        files={"file": ("recording.webm", b"audio-data", "audio/webm")},
        data={"language": "fr"},
    )
    assert response.status_code == 401


def test_transcription_sends_audio_to_provider_without_storing_it(client):
    test_client, _, provider = client
    token = create_account(test_client)

    response = test_client.post(
        "/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("recording.webm", b"audio-data", "audio/webm")},
        data={"language": "fr"},
    )

    assert response.status_code == 200
    assert response.json() == {"text": "Je suis stressée pour mon examen."}
    assert provider.calls == [(b"audio-data", "recording.webm", "audio/webm", "fr")]


def test_transcription_accepts_automatic_language_detection_for_tunisian_darija(client):
    test_client, _, provider = client
    token = create_account(test_client)

    response = test_client.post(
        "/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("recording.webm", b"audio-data", "audio/webm")},
    )

    assert response.status_code == 200
    assert provider.calls[-1][3] is None


def test_transcription_rejects_empty_audio(client):
    test_client, _, provider = client
    token = create_account(test_client)

    response = test_client.post(
        "/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("recording.webm", b"", "audio/webm")},
    )

    assert response.status_code == 400
    assert provider.calls == []


def test_transcription_rejects_audio_over_25_megabytes(client):
    test_client, _, provider = client
    token = create_account(test_client)

    response = test_client.post(
        "/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("recording.webm", b"x" * 25_000_001, "audio/webm")},
    )

    assert response.status_code == 413
    assert provider.calls == []


def test_transcription_rejects_unsupported_language(client):
    test_client, _, provider = client
    token = create_account(test_client)

    response = test_client.post(
        "/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("recording.webm", b"audio-data", "audio/webm")},
        data={"language": "xx"},
    )

    assert response.status_code == 400
    assert provider.calls == []
