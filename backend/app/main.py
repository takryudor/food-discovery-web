from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
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


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
	"""
	Root API endpoint pointing to API documentation and health status.

	Returns:
		dict[str, str]: A dictionary with a welcome message and links to docs and health checks.
	"""
	return {
		"message": "FoOdyssey API is running",
		"docs": "/docs",
		"health": "/api/v1/health",
	}
