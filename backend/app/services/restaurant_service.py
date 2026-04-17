from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db.models import Place


def get_restaurant_by_id(db: Session, restaurant_id: int) -> Place | None:
    """
    Lấy chi tiết một nhà hàng theo ID, kèm theo tags (concepts, purposes, amenities).

    Args:
        db: Database session
        restaurant_id: ID của nhà hàng cần tìm

    Returns:
        Place object nếu tìm thấy, None nếu không tìm thấy
    """
    stmt = (
        select(Place)
        .where(Place.id == restaurant_id)
        .options(
            selectinload(Place.concepts),
            selectinload(Place.purposes),
            selectinload(Place.amenities),
        )
    )
    return db.scalar(stmt)


def search_restaurant_suggestions(
    db: Session, query: str, limit: int = 8
) -> list[dict]:
    """
    Tìm kiếm gợi ý nhà hàng theo tên hoặc địa chỉ.

    Args:
        db: Database session
        query: Từ khóa tìm kiếm (đã được chuẩn hóa: trim + lowercase)
        limit: Số lượng kết quả tối đa (mặc định 8, tối đa 20)

    Returns:
        List các dict chứa id, name, address của nhà hàng

    Logic sắp xếp:
    - Ưu tiên tên bắt đầu bằng query
    - Sau đó đến tên chứa query
    - Cuối cùng sort theo độ dài tên tăng dần để gợi ý gọn
    """
    if not query:
        return []

    # Tìm kiếm theo tên hoặc địa chỉ (case-insensitive)
    search_pattern = f"%{query}%"
    stmt = select(Place).where(
        (Place.name.ilike(search_pattern))
        | (Place.address.ilike(search_pattern))
    )

    places = list(db.scalars(stmt).all())

    # Sắp xếp: tên bắt đầu bằng query -> tên chứa query -> theo độ dài tên
    def sort_key(place: Place) -> tuple[int, int, str]:
        name_lower = place.name.lower()
        # Ưu tiên 0: bắt đầu bằng query (0) hay chỉ chứa query (1)
        starts_with = 0 if name_lower.startswith(query) else 1
        # Ưu tiên 1: độ dài tên (ngắn hơn lên trước)
        name_length = len(place.name)
        # Ưu tiên 2: tên để sort alphabet nếu cùng độ dài
        return (starts_with, name_length, name_lower)

    sorted_places = sorted(places, key=sort_key)

    # Giới hạn số kết quả
    limited_places = sorted_places[:limit]

    return [
        {
            "id": place.id,
            "name": place.name,
            "address": place.address,
        }
        for place in limited_places
    ]
