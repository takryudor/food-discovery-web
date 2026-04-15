from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from ..core.config import get_settings


settings = get_settings()


def _create_engine() -> Engine:
	# Dùng SQLAlchemy engine dạng *sync* (đơn giản, phù hợp cho đa số đồ án FastAPI).
	# DATABASE_URL lấy từ file `.env` (tham khảo `backend/.env.example`).
	url = settings.database_url
	kwargs: dict = {"pool_pre_ping": True}
	if url.startswith("sqlite"):
		kwargs["connect_args"] = {"check_same_thread": False}
	return create_engine(url, **kwargs)


engine = _create_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
	"""
	Dependency của FastAPI để cấp 1 DB session cho mỗi request.

	Cách dùng:
	- Trong route: `db: Session = Depends(get_db)`
	- Session sẽ luôn được đóng sau khi request kết thúc (tránh leak connection).
	"""
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

