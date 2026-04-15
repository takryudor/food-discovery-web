from fastapi import APIRouter

from .core.config import get_settings
from .api.v1.ai_routes import router as ai_router


settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix)

router.include_router(ai_router)


@router.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
	"""
	Health check endpoint to verify backend status.

	Returns:
		dict[str, str]: Status status, application name, and running environment.
	"""
	return {
		"status": "ok",
		"app_name": settings.app_name,
		"environment": settings.app_env,
	}
