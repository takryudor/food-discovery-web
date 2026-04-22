from __future__ import annotations

import math

from sqlalchemy import case, func, or_, select
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


def search_restaurant_suggestions(
    db: Session,
    query: str,
    limit: int = 8,
    *,
    location: tuple[float, float] | None = None,
    radius_km: float | None = None,
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

    distance_expr = None
    if location is not None:
        ulat, ulng = location
        r = 6371.0
        phi1 = func.radians(ulat)
        phi2 = func.radians(Place.latitude)
        dphi = func.radians(Place.latitude - ulat)
        dlng = func.radians(Place.longitude - ulng)
        a = (
            func.pow(func.sin(dphi / 2.0), 2)
            + func.cos(phi1) * func.cos(phi2) * func.pow(func.sin(dlng / 2.0), 2)
        )
        c = 2.0 * func.atan2(func.sqrt(a), func.sqrt(1.0 - a))
        distance_expr = (r * c).label("distance_km")

    # Làm toàn bộ trong DB: filter + sort + limit (tránh load hết rồi sort Python).
    # Add a tiny synonyms layer for better VN UX (no-diacritics typing).
    synonyms = {
        "banh mi": "bánh mì",
        "com tam": "cơm tấm",
        "tra sua": "trà sữa",
        "bun bo": "bún bò",
        "bun dau": "bún đậu",
        "pho bo": "phở bò",
        "pho ga": "phở gà",
    }
    q2 = synonyms.get(query, query)
    q_prefixes = [f"{query}%", f"{q2}%"] if q2 != query else [f"{query}%"]
    q_contains_list = [f"%{query}%", f"%{q2}%"] if q2 != query else [f"%{query}%"]

    dialect = db.get_bind().dialect.name
    if dialect == "postgresql":
        name_col = func.coalesce(Place.name_unaccent, func.lower(Place.name))
        addr_col = func.coalesce(Place.address_unaccent, func.lower(Place.address))
        dish_col = func.coalesce(Dish.name_unaccent, func.lower(Dish.name))
    else:
        name_col = func.lower(Place.name)
        addr_col = func.lower(Place.address)
        dish_col = func.lower(Dish.name)

    name_starts = or_(*[name_col.like(p) for p in q_prefixes])
    name_contains = or_(*[name_col.like(c) for c in q_contains_list])
    addr_contains = or_(*[addr_col.like(c) for c in q_contains_list])
    dish_contains = Place.dishes.any(or_(*[dish_col.like(c) for c in q_contains_list]))

    # Rank: 0 = name startswith, 1 = name contains, 2 = address contains, 3 = dish contains, 4 = others
    rank_expr = case(
        (name_starts, 0),
        (name_contains, 1),
        (addr_contains, 2),
        (dish_contains, 3),
        else_=4,
    )

    # We still select lat/lng for distance computation, but we don't return them to clients.
    cols = [Place.id, Place.name, Place.address, Place.latitude, Place.longitude]
    if distance_expr is not None:
        cols.append(distance_expr)

    order_by = [rank_expr.asc(), func.length(Place.name).asc(), func.lower(Place.name).asc(), Place.id.asc()]
    if distance_expr is not None:
        # Within the same rank bucket, prefer nearer results.
        order_by.insert(1, distance_expr.asc())

    where_expr = name_contains | addr_contains | dish_contains
    if distance_expr is not None and radius_km is not None:
        where_expr = where_expr & (distance_expr <= float(radius_km))

    stmt = select(*cols).where(where_expr).order_by(*order_by).limit(limit)

    rows = list(db.execute(stmt).all())
    return [
        {
            "id": int(r[0]),
            "name": r[1],
            "address": r[2],
            "distance_km": float(r[5]) if distance_expr is not None and r[5] is not None else None,
        }
        for r in rows
    ]
