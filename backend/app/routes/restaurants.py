from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.restaurant import (
    RestaurantDetailResponse,
    RestaurantSuggestion,
    FulltextSearchResponse,
    TagOut,
)
from app.services.restaurant_service import (
    get_restaurant_by_id,
    search_restaurant_suggestions,
)

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/{restaurant_id}", response_model=RestaurantDetailResponse)
def get_restaurant_detail(
    restaurant_id: int,
    db: Session = Depends(get_db),
) -> RestaurantDetailResponse:
    """
    GET /restaurants/{id}

    Trả chi tiết một nhà hàng để dùng cho detail card/drawer.
    Bao gồm: thông tin cơ bản + concepts + purposes + amenities.

    - **restaurant_id**: ID nhà hàng (số nguyên dương)

    Status codes:
    - 200: Tìm thấy
    - 404: Không tìm thấy restaurant id
    - 422: Id không hợp lệ
    """
    place = get_restaurant_by_id(db, restaurant_id)

    if place is None:
        raise HTTPException(
            status_code=404,
            detail="RESTAURANT_NOT_FOUND",
        )

    return RestaurantDetailResponse(
        id=place.id,
        name=place.name,
        description=place.description,
        address=place.address,
        latitude=place.latitude,
        longitude=place.longitude,
        rating=getattr(place, "rating", None),
        phone=getattr(place, "phone", None),
        open_hours=getattr(place, "open_hours", None),
        price_range=getattr(place, "price_range", None),
        cover_image=getattr(place, "cover_image", None),
        concepts=[TagOut(id=c.id, name=c.name, slug=c.slug) for c in place.concepts],
        purposes=[TagOut(id=p.id, name=p.name, slug=p.slug) for p in place.purposes],
        amenities=[TagOut(id=a.id, name=a.name, slug=a.slug) for a in place.amenities],
    )


@router.get("/search/fulltext", response_model=FulltextSearchResponse)
def get_restaurant_suggestions(
    q: str = Query(..., min_length=1, description="Từ khóa tìm kiếm, tối thiểu 1 ký tự"),
    limit: int = Query(default=8, ge=1, le=20, description="Số lượng kết quả tối đa (1-20, mặc định 8)"),
    lat: float | None = Query(default=None, ge=-90, le=90, description="Vĩ độ (optional) để trả distance_km"),
    lng: float | None = Query(default=None, ge=-180, le=180, description="Kinh độ (optional) để trả distance_km"),
    radius_km: float | None = Query(default=None, gt=0, le=50, description="Bán kính (km, optional) để lọc gợi ý"),
    db: Session = Depends(get_db),
) -> FulltextSearchResponse:
    """
    GET /restaurants/search/fulltext

    Trả danh sách gợi ý nhanh theo tên/địa chỉ.
    Dùng cho autocomplete trên frontend.

    Query params:
    - **q**: Bắt buộc, tối thiểu 1 ký tự
    - **limit**: Mặc định 8, tối đa 20

    Hành vi:
    - Chuẩn hóa q bằng trim + lowercase
    - Ưu tiên tên bắt đầu bằng q, sau đó mới đến chứa q
    - Sort bổ sung theo độ dài tên tăng dần để gợi ý gọn
    """
    # Chuẩn hóa query
    normalized_query = q.strip().lower()

    if not normalized_query:
        raise HTTPException(
            status_code=422,
            detail="QUERY_CANNOT_BE_EMPTY",
        )

    location = (lat, lng) if (lat is not None and lng is not None) else None
    if radius_km is not None and location is None:
        raise HTTPException(status_code=422, detail="RADIUS_REQUIRES_LOCATION")

    suggestions = search_restaurant_suggestions(
        db, normalized_query, limit, location=location, radius_km=radius_km
    )

    return FulltextSearchResponse(
        items=[
            RestaurantSuggestion(
                id=item["id"],
                name=item["name"],
                address=item["address"],
                distance_km=item.get("distance_km"),
            )
            for item in suggestions
        ]
    )
