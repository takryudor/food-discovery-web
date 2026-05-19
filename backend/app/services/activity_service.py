from sqlalchemy.orm import Session
from app.db.models import UserActivity
import logging

logger = logging.getLogger(__name__)

def log_activity(db: Session, user_id: int, action_type: str, place_id: int = None):
    """
    Ghi nhận hành vi người dùng (VIEW, SEARCH, FAVORITE) vào bảng user_activities.
    """
    try:
        new_activity = UserActivity(
            user_id=user_id,
            place_id=place_id,
            action_type=action_type
        )
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        return new_activity
    except Exception as e:
        db.rollback()
        logger.error(f"Error logging activity: {e}")
        return None
