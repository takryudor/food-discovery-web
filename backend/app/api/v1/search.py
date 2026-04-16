from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import search_places


router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def post_search(payload: SearchRequest, db: Session = Depends(get_db)) -> SearchResponse:
	"""
	POST /api/v1/search

	Trách nhiệm chính:
	- Lọc dữ liệu theo query + các bộ lọc
	- Tính match_score
	- Tính distance_km (nếu có location)
	- Sort + phân trang (limit/offset)
	"""

	location = None
	if payload.location is not None:
		location = (payload.location.lat, payload.location.lng)

	all_results = search_places(
		db=db,
		query=payload.query,
		location=location,
		radius_km=payload.radius_km,
		concept_ids=payload.concept_ids,
		purpose_ids=payload.purpose_ids,
		amenity_ids=payload.amenity_ids,
	)

	total = len(all_results)
	items = all_results[payload.offset : payload.offset + payload.limit]
	return SearchResponse(total=total, items=items)

