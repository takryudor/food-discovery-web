from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .db.base import Base
from .db.session import engine
from .db import models as _models  # noqa: F401
from .router import router


settings = get_settings()

app = FastAPI(
	title=settings.app_name,
	version="0.1.0",
	description="FoOdyssey backend API",
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.cors_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def _create_tables_for_dev() -> None:
	"""
	Tiện cho DEV: tự tạo table nếu chưa có.

	- Khi deploy thật (production), nên quản lý schema bằng Alembic migration.
	- Giữ đoạn này giúp bạn chạy nhanh để tập trung làm logic search trước.
	"""
	Base.metadata.create_all(bind=engine)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
	return {
		"message": "FoOdyssey API is running",
		"docs": "/docs",
		"health": "/api/v1/health",
	}
