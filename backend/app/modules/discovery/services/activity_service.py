from sqlalchemy.orm import Session
from app.db.models import UserActivity
from app.schemas.activity import ActivityCreate

def create_user_activity(db: Session, activity_in: ActivityCreate, user_id: int):
    # Khởi tạo object Model trực tiếp từ dữ liệu lọt qua lưới lọc Schema
    db_activity = UserActivity(
        user_id=user_id,
        place_id=activity_in.place_id,
        action_type=activity_in.action_type,  # Chuỗi "VIEW", "SEARCH"... truyền vào SAEnum tự nhận
        activity_metadata=activity_in.activity_metadata  # Truyền trực tiếp dict vào đây, giống hệt cách truyền list[str] của Review
    )
    
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity