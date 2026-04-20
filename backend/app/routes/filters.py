from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Amenity, Concept, Purpose, BudgetRange
from app.db.session import get_db
from app.schemas.common import IdName
from app.schemas.filters import FiltersOptionsMeta, FiltersOptionsResponse
from app.utils.cache import cache_get, cache_set


router = APIRouter(prefix="/filters", tags=["Filters"])


@router.get("/options", response_model=FiltersOptionsResponse)
def get_filter_options(db: Session = Depends(get_db)) -> FiltersOptionsResponse:
	"""
	GET /filters/options

	Trả về danh sách option cho frontend (đổ ra UI bộ lọc):
	- Concepts
	- Purposes
	- Amenities
	- BudgetRanges

	Có cache in-memory (TTL) để giảm tải DB.
	Nếu DB trống, trả về mảng rỗng thay vì lỗi.
	"""

	settings = get_settings()
	cache_key = "filters:options:v2"

	cached = cache_get(cache_key)
	if cached is not None:
		return cached

	try:
		concepts = list(db.scalars(select(Concept).order_by(Concept.name.asc())).all())
		purposes = list(db.scalars(select(Purpose).order_by(Purpose.name.asc())).all())
		amenities = list(db.scalars(select(Amenity).order_by(Amenity.name.asc())).all())
		budget_ranges = list(db.scalars(select(BudgetRange).order_by(BudgetRange.id.asc())).all())

		out_concepts = [IdName(id=x.id, name=x.name, slug=x.slug) for x in concepts]
		out_purposes = [IdName(id=x.id, name=x.name, slug=x.slug) for x in purposes]
		out_amenities = [IdName(id=x.id, name=x.name, slug=x.slug) for x in amenities]
		out_budget_ranges = [IdName(id=x.id, name=x.name, slug=x.slug) for x in budget_ranges]

		resp = FiltersOptionsResponse(
			meta=FiltersOptionsMeta(
				generated_at=datetime.now(timezone.utc),
				cache_ttl_seconds=settings.filters_cache_ttl_seconds,
			),
			concepts=out_concepts,
			purposes=out_purposes,
			amenities=out_amenities,
			budget_ranges=out_budget_ranges,
			groups=[
				{"key": "concepts", "label": "Concepts", "items": out_concepts},
				{"key": "purposes", "label": "Purposes", "items": out_purposes},
				{"key": "amenities", "label": "Amenities", "items": out_amenities},
				{"key": "budget_ranges", "label": "Budget ranges", "items": out_budget_ranges},
			],
		)

		cache_set(cache_key, resp, ttl_seconds=settings.filters_cache_ttl_seconds)
		return resp
	except Exception as e:
		# Log lỗi nhưng vẫn trả về response hợp lệ với mảng rỗng
		import logging
		logging.error(f"Error loading filters: {e}")
		return FiltersOptionsResponse(
			meta=FiltersOptionsMeta(
				generated_at=datetime.now(timezone.utc),
				cache_ttl_seconds=settings.filters_cache_ttl_seconds,
			),
			concepts=[],
			purposes=[],
			amenities=[],
			budget_ranges=[],
			groups=[
				{"key": "concepts", "label": "Concepts", "items": []},
				{"key": "purposes", "label": "Purposes", "items": []},
				{"key": "amenities", "label": "Amenities", "items": []},
				{"key": "budget_ranges", "label": "Budget ranges", "items": []},
			],
		)

