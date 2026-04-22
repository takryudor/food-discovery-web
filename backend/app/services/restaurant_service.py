from __future__ import annotations

import unicodedata

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, selectinload

from ..db.models import Dish, Place


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


def _normalize_search_text(text: str) -> str:
    """Normalize autocomplete text for accent-insensitive matching."""
    stripped = text.strip().lower()
    normalized = unicodedata.normalize("NFKD", stripped)
    return "".join(char for char in normalized if not unicodedata.combining(char))


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
    query = _normalize_search_text(query)

    if not query:
        return []

    # Làm toàn bộ trong DB: filter + sort + limit (tránh load hết rồi sort Python).
    q_prefix = f"{query}%"
    q_contains = f"%{query}%"

    dialect = db.get_bind().dialect.name
    if dialect == "postgresql":
        name_col = func.coalesce(Place.name_unaccent, func.lower(Place.name))
        addr_col = func.coalesce(Place.address_unaccent, func.lower(Place.address))
        dish_col = func.coalesce(Dish.name_unaccent, func.lower(Dish.name))
    else:
        name_col = func.lower(Place.name)
        addr_col = func.lower(Place.address)
        dish_col = func.lower(Dish.name)

    name_starts = name_col.like(q_prefix)
    name_contains = name_col.like(q_contains)
    addr_contains = addr_col.like(q_contains)
    dish_contains = Place.dishes.any(dish_col.like(q_contains))

    # Rank: 0 = name startswith, 1 = name contains, 2 = address contains, 3 = dish contains, 4 = others
    rank_expr = case(
        (name_starts, 0),
        (name_contains, 1),
        (addr_contains, 2),
        (dish_contains, 3),
        else_=4,
    )

    stmt = (
        select(Place.id, Place.name, Place.address, Place.latitude, Place.longitude)
        .where(name_contains | addr_contains | dish_contains)
        .order_by(rank_expr.asc(), func.length(Place.name).asc(), func.lower(Place.name).asc(), Place.id.asc())
        .limit(limit)
    )

    rows = list(db.execute(stmt).all())
    return [
        {
            "id": int(r[0]),
            "name": r[1],
            "address": r[2],
            "latitude": float(r[3]) if r[3] is not None else None,
            "longitude": float(r[4]) if r[4] is not None else None,
        }
        for r in rows
    ]
