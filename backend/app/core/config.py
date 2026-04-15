from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "FoOdyssey API"
	app_env: str = "development"
	api_v1_prefix: str = "/api/v1"
	cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
	
	database_url: str = "postgresql+psycopg://foodyssey:foodyssey@localhost:5432/foodyssey"
	groq_api_key: str = ""
	model_config = SettingsConfigDict(
		env_file=str(Path(__file__).resolve().parents[3] / ".env"),
		env_file_encoding="utf-8",
		case_sensitive=False,
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
