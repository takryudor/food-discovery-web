from fastapi import APIRouter

from .core.config import get_settings
from .routes.filters import router as filters_router
from .routes.search import router as search_router


settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix)


@router.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
	return {
		"status": "ok",
		"app_name": settings.app_name,
		"environment": settings.app_env,
	}


router.include_router(search_router)
router.include_router(filters_router)
