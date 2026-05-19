from fastapi import APIRouter

from .core.config import get_settings
from .routes import geo, ai, filters, search, restaurants, users
from .routes import contribution
from .routes import activity

settings = get_settings()
router = APIRouter(prefix=settings.api_v1_prefix)


# Health check endpoint
@router.get("/health", tags=["Backend status"])
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


# Geo & Routing module routes
router.include_router(geo.router)

# AI Interactions
router.include_router(ai.router)

# Search functionality
router.include_router(search.router)

# Filters
router.include_router(filters.router)

# Restaurants
router.include_router(restaurants.router)

# Users
router.include_router(users.router)

# User Activities (Crowdsourcing)
router.include_router(activity.router)

# Contributions
router.include_router(contribution.router)

# Alias: POST /map-markers -> POST /geo/map-markers
# Để tương thích với spec MVP mà vẫn giữ endpoint gốc /geo/map-markers
router.include_router(
	geo.router_map_markers_alias,
    prefix="",
	tags=["Geo & Routing"],
)
