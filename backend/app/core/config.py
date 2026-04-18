from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "FoOdyssey API"
	app_env: str = "development"
	api_v1_prefix: str = "/api/v1"
	cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
	# Database connection URL (env `DATABASE_URL` can override).
	# Default sqlite makes local dev easier; switch to Postgres via `.env`.
	database_url: str = "sqlite:///./foodyssey.db"

	# Cache filter options for a short time (in-memory).
	filters_cache_ttl_seconds: int = 300

	# External API keys (used by AI chatbox module on dev branch).
	groq_api_key: str = ""
	model_config = SettingsConfigDict(
		env_file=str(Path(__file__).resolve().parents[3] / ".env"),
		env_file_encoding="utf-8",
		case_sensitive=False,
		extra="ignore",
	)


@lru_cache
def get_settings() -> Settings:
	"""
	Retrieve the application settings.
	Using lru_cache to ensure we only read the environment variables once.

	Returns:
		Settings: The application settings object.
	"""
	return Settings()
