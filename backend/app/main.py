from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .db.base import Base
from .db.session import engine
from .db import models as _models  # noqa: F401
from .router import router


settings = get_settings()
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
	"""Run startup tasks and keep app lifecycle compatible with FastAPI deprecations."""
	docs_path = app.docs_url or "/docs"
	host = os.getenv("UVICORN_HOST", "127.0.0.1")
	port = os.getenv("UVICORN_PORT", "8000")

	if host == "0.0.0.0":
		logger.info("Swagger docs: http://127.0.0.1:%s%s", port, docs_path)
	else:
		logger.info("Swagger docs: http://%s:%s%s", host, port, docs_path)

	yield

app = FastAPI(
	title=settings.app_name,
	version="0.1.0",
	description="FoOdyssey backend API",
	lifespan=lifespan,
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.cors_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

@app.get("/", tags=["Backend status"])
def root() -> dict[str, str]:
	"""
	Root API endpoint pointing to API documentation and health status.

	Returns:
		dict[str, str]: A dictionary with a welcome message and links to docs and health checks.
	"""
	return {
		"message": "FoOdyssey API is running",
		"docs": "/docs",
		"health": "/health",
	}


app.include_router(router)


# @app.on_event("startup")
# def _create_tables_for_dev() -> None:
# 	"""
# 	Tiện cho DEV: tự tạo table nếu chưa có.
# 
# 	- Khi deploy thật (production), nên quản lý schema bằng Alembic migration.
# 	- Chỉ chạy khi app_env == "development" để tránh tạo schema ngoài Alembic
# 	  trong các môi trường khác.
# 	"""
# 	if settings.app_env == "development":
# 		Base.metadata.create_all(bind=engine)
