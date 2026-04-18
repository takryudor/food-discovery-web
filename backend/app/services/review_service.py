from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.models import Review, Place

def get_relevant_reviews(db: Session, query: str, limit: int = 5) -> list[str]:
    """
    Tìm kiếm các đánh giá (reviews) có nội dung liên quan đến truy vấn của người dùng.
    
    Args:
        db (Session): Database session.
        query (str): Câu hỏi hoặc từ khóa từ người dùng.
        limit (int): Số lượng review tối đa trả về.
        
    Returns:
        list[str]: Danh sách các chuỗi review đã định dạng kèm tên nhà hàng.
    """
    if not query:
        return []

    # Tách từ khóa đơn giản (có thể cải tiến thêm)
    keywords = query.split()
    filters = [Review.content.ilike(f"%{kw}%") for kw in keywords if len(kw) > 2]
    
    if not filters:
        # Nếu không có từ khóa đủ dài, tìm kiếm toàn bộ chuỗi
        filters = [Review.content.ilike(f"%{query}%")]

    # Truy vấn lấy Review kèm thông tin Place
    stmt = (
        db.query(Review, Place.name)
        .join(Place, Review.place_id == Place.id)
        .filter(or_(*filters))
        .order_by(Review.rating.desc())
        .limit(limit)
    )
    
    results = stmt.all()
    
    formatted_reviews = []
    for review, place_name in results:
        formatted_reviews.append(
            f"[Restaurant ID: {review.place_id}] Tên: '{place_name}': {review.content} (Rating: {review.rating}/5)"
        )
        
    return formatted_reviews
