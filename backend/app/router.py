from fastapi import APIRouter

from .core.config import get_settings


settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix)


@router.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
	return {
		"status": "ok",
		"app_name": settings.app_name,
		"environment": settings.app_env,
	}
