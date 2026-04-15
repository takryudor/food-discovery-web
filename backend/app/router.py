from fastapi import APIRouter

from app.core.config import get_settings
from app.api.v1 import geo_routes

settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix)

# Include geo module routes
router.include_router(geo_routes.router)


@router.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "environment": settings.app_env,
    }
