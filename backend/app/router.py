from fastapi import APIRouter

from .core.config import get_settings
from .api.v1 import geo_routes
from .api.v1.ai_routes import router as ai_router
from .api.v1.filters import router as filters_router
from .api.v1.search import router as search_router
from .api.v1.restaurants import router as restaurants_router


settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix)

# Include geo module routes
router.include_router(geo_routes.router)
router.include_router(ai_router)


@router.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
	return {
		"status": "ok",
		"app_name": settings.app_name,
		"environment": settings.app_env,
	}


router.include_router(search_router)
router.include_router(filters_router)
router.include_router(restaurants_router)

# Alias: POST /map-markers -> POST /geo/map-markers
# Để tương thích với spec MVP mà vẫn giữ endpoint gốc /geo/map-markers
router.include_router(
    geo_routes.router_map_markers_alias,
    prefix="",
    tags=["map-markers"],
)
