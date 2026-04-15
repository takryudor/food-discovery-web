from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "FoOdyssey API"
	app_env: str = "development"
	api_v1_prefix: str = "/api/v1"
	cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
	database_url: str = "sqlite:///./foodyssey.db"
	filters_cache_ttl_seconds: int = 300  # cache filter options for 5 minutes (in-memory)

	model_config = SettingsConfigDict(
		env_file=str(Path(__file__).resolve().parents[3] / ".env"),
		env_file_encoding="utf-8",
		case_sensitive=False,
	)


@lru_cache
def get_settings() -> Settings:
	return Settings()
