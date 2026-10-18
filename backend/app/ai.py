from typing import Protocol

import httpx
from pydantic import SecretStr


class ChatProvider(Protocol):
    async def reply(self, system_prompt: str, messages: list[dict[str, str]]) -> str: ...


class AudioTranscriptionProvider(Protocol):
    async def transcribe(
        self,
        audio: bytes,
        filename: str,
        content_type: str,
        language: str | None,
    ) -> str: ...


class ProviderUnavailable(Exception):
    pass


class GroqChatProvider:
    def __init__(self, api_key: SecretStr | None, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def reply(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        if self.api_key is None or not self.api_key.get_secret_value().strip():
            raise ProviderUnavailable("Le fournisseur IA n'est pas configuré")

        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "temperature": 0.55,
            "max_tokens": 350,
        }
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key.get_secret_value()}", "Content-Type": "application/json"},
                    json=payload,
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as error:
            status_code = error.response.status_code
            if status_code in (401, 403):
                detail = f"Le fournisseur a refusé l'authentification ou l'accès (HTTP {status_code}); vérifie la clé et les permissions."
            elif status_code == 429:
                detail = "Le fournisseur a limité la requête ou le quota est épuisé (HTTP 429)."
            elif status_code == 404:
                detail = "Le modèle ou l'adresse du fournisseur est introuvable (HTTP 404)."
            else:
                detail = f"Le fournisseur IA a répondu avec une erreur HTTP {status_code}."
            raise ProviderUnavailable(detail) from error
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
            raise ProviderUnavailable("Le fournisseur IA n'a pas pu répondre") from error

        if not isinstance(content, str) or not content.strip():
            raise ProviderUnavailable("Le fournisseur IA a renvoyé une réponse vide")
        return content.strip()


class GroqAudioTranscriptionProvider:
    def __init__(self, api_key: SecretStr | None, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def transcribe(
        self,
        audio: bytes,
        filename: str,
        content_type: str,
        language: str | None,
    ) -> str:
        if self.api_key is None or not self.api_key.get_secret_value().strip():
            raise ProviderUnavailable("Le fournisseur IA n'est pas configuré")

        data = {"model": self.model}
        if language:
            data["language"] = language
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    f"{self.base_url}/audio/transcriptions",
                    headers={"Authorization": f"Bearer {self.api_key.get_secret_value()}"},
                    data=data,
                    files={"file": (filename, audio, content_type)},
                )
                response.raise_for_status()
                text = response.json()["text"]
        except httpx.HTTPStatusError as error:
            status_code = error.response.status_code
            if status_code in (401, 403):
                detail = f"Le fournisseur a refusé l'authentification ou l'accès (HTTP {status_code}); vérifie la clé et les permissions."
            elif status_code == 429:
                detail = "Le fournisseur a limité la requête ou le quota est épuisé (HTTP 429)."
            elif status_code == 404:
                detail = "Le modèle de transcription ou l'adresse du fournisseur est introuvable (HTTP 404)."
            else:
                detail = f"Le fournisseur de transcription a répondu avec une erreur HTTP {status_code}."
            raise ProviderUnavailable(detail) from error
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as error:
            raise ProviderUnavailable("Le fournisseur n'a pas pu transcrire l'audio") from error

        if not isinstance(text, str) or not text.strip():
            raise ProviderUnavailable("Le fournisseur de transcription n'a renvoyé aucun texte")
        return text.strip()
