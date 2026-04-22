from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import search_facets, search_places


router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
def post_search(payload: SearchRequest, db: Session = Depends(get_db)) -> SearchResponse:
	"""
	POST /search

	Trách nhiệm chính:
	- Lọc dữ liệu theo query + các bộ lọc
	- Tính match_score
	- Tính distance_km (nếu có location)
	- Sort + phân trang (limit/offset)
	"""

	location = None
	if payload.location is not None:
		location = (payload.location.lat, payload.location.lng)

	total, items = search_places(
		db=db,
		query=payload.query,
		location=location,
		radius_km=payload.radius_km,
		concept_ids=payload.concept_ids,
		purpose_ids=payload.purpose_ids,
		amenity_ids=payload.amenity_ids,
		budget_range_ids=payload.budget_range_ids,
		dish_ids=payload.dish_ids,
		budget_min_vnd=payload.budget_min_vnd,
		budget_max_vnd=payload.budget_max_vnd,
		open_now=payload.open_now,
		concept_match=payload.concept_match,
		purpose_match=payload.purpose_match,
		amenity_match=payload.amenity_match,
		budget_range_match=payload.budget_range_match,
		dish_match=payload.dish_match,
		ranking=payload.ranking,
		sort=payload.sort,
		limit=payload.limit,
		offset=payload.offset,
	)

	facets = None
	if payload.include_facets:
		facets = search_facets(
			db=db,
			query=payload.query,
			location=location,
			radius_km=payload.radius_km,
			concept_ids=payload.concept_ids,
			purpose_ids=payload.purpose_ids,
			amenity_ids=payload.amenity_ids,
			budget_range_ids=payload.budget_range_ids,
			dish_ids=payload.dish_ids,
			budget_min_vnd=payload.budget_min_vnd,
			budget_max_vnd=payload.budget_max_vnd,
			open_now=payload.open_now,
			concept_match=payload.concept_match,
			purpose_match=payload.purpose_match,
			amenity_match=payload.amenity_match,
			budget_range_match=payload.budget_range_match,
			dish_match=payload.dish_match,
			ranking=payload.ranking,
		)

	return SearchResponse(total=total, items=items, limit=payload.limit, offset=payload.offset, facets=facets)

