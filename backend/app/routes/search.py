from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.core.dependencies import get_current_user
from app.services.activity_service import log_activity
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import search_facets, search_places


router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
def post_search(
    payload: SearchRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SearchResponse:
	"""
	POST /search
    ...
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
		concept_match=payload.concept_match,
		purpose_match=payload.purpose_match,
		amenity_match=payload.amenity_match,
		budget_range_match=payload.budget_range_match,
		dish_match=payload.dish_match,
		ranking=payload.ranking,
		limit=payload.limit,
		offset=payload.offset,
	)

	# Ghi nhận hành vi SEARCH (place_id=None cho search chung)
	log_activity(db, user_id=current_user.id, action_type="SEARCH", place_id=None)

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
			concept_match=payload.concept_match,
			purpose_match=payload.purpose_match,
			amenity_match=payload.amenity_match,
			budget_range_match=payload.budget_range_match,
			dish_match=payload.dish_match,
			ranking=payload.ranking,
		)

	return SearchResponse(total=total, items=items, limit=payload.limit, offset=payload.offset, facets=facets)

