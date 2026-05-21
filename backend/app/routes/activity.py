from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.core.dependencies import get_or_create_current_user
from app.schemas.activity import ActivityCreate, ActivityResponse
from app.services.activity_service import log_activity

router = APIRouter(
    prefix="/activities",
    tags=["Activities"]
)


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_or_create_current_user),
):
    """
    Ghi nhận hành vi người dùng (VIEW, SEARCH, SHARE, ROUTE_REQUEST).
    Yêu cầu xác thực — chỉ log cho user đang đăng nhập.
    """
    result = log_activity(
        db=db,
        user_id=current_user.id,
        action_type=activity_in.action_type,
        place_id=activity_in.place_id,
    )
    return result