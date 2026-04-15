from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..db.models import Amenity, Concept, Purpose, BudgetRange
from ..db.session import get_db
from ..schemas.common import IdName
from ..utils.cache import cache_get, cache_set


router = APIRouter(prefix="/filters", tags=["filters"])


@router.get("/options")
def get_filter_options(db: Session = Depends(get_db)) -> dict[str, list[IdName]]:
	"""
	GET /api/v1/filters/options

	Trả về danh sách option cho frontend (đổ ra UI bộ lọc):
	- Concepts
	- Purposes
	- Amenities
	- BudgetRanges

	Có cache in-memory (TTL) để giảm tải DB.
	Nếu DB trống, trả về mảng rỗng thay vì lỗi.
	"""

	settings = get_settings()
	cache_key = "filters:options:v1"

	cached = cache_get(cache_key)
	if cached is not None:
		return cached

	try:
		concepts = list(db.scalars(select(Concept).order_by(Concept.name.asc())).all())
		purposes = list(db.scalars(select(Purpose).order_by(Purpose.name.asc())).all())
		amenities = list(db.scalars(select(Amenity).order_by(Amenity.name.asc())).all())
		budget_ranges = list(db.scalars(select(BudgetRange).order_by(BudgetRange.id.asc())).all())

		resp = {
			"concepts": [IdName(id=x.id, name=x.name, slug=x.slug) for x in concepts],
			"purposes": [IdName(id=x.id, name=x.name, slug=x.slug) for x in purposes],
			"amenities": [IdName(id=x.id, name=x.name, slug=x.slug) for x in amenities],
			"budget_ranges": [IdName(id=x.id, name=x.name, slug=x.slug) for x in budget_ranges],
		}

		cache_set(cache_key, resp, ttl_seconds=settings.filters_cache_ttl_seconds)
		return resp
	except Exception as e:
		# Log lỗi nhưng vẫn trả về response hợp lệ với mảng rỗng
		import logging
		logging.error(f"Error loading filters: {e}")
		return {
			"concepts": [],
			"purposes": [],
			"amenities": [],
			"budget_ranges": [],
		}

