from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="HER_", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./hermind.db"
    groq_api_key: SecretStr | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "qwen/qwen3.8-27b"
    groq_transcription_model: str = "whisper-large-v3-turbo"
    allowed_origins: str = "http://localhost:8081,http://localhost:8083,http://localhost:8084"
    max_history_messages: int = 12

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
