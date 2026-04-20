from __future__ import annotations

from sqlalchemy import case, func, select
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

    # Làm toàn bộ trong DB: filter + sort + limit (tránh load hết rồi sort Python).
    q_prefix = f"{query}%"
    q_contains = f"%{query}%"

    name_starts = Place.name.ilike(q_prefix)
    name_contains = Place.name.ilike(q_contains)
    addr_contains = Place.address.ilike(q_contains)

    # Rank: 0 = name startswith, 1 = name contains, 2 = address contains, 3 = others (shouldn't happen)
    rank_expr = case(
        (name_starts, 0),
        (name_contains, 1),
        (addr_contains, 2),
        else_=3,
    )

    stmt = (
        select(Place.id, Place.name, Place.address)
        .where(name_contains | addr_contains)
        .order_by(rank_expr.asc(), func.length(Place.name).asc(), func.lower(Place.name).asc(), Place.id.asc())
        .limit(limit)
    )

    rows = list(db.execute(stmt).all())
    return [{"id": int(r[0]), "name": r[1], "address": r[2]} for r in rows]
