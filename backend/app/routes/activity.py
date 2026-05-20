from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db  
from app.schemas.activity import ActivityCreate, ActivityResponse
from app.modules.discovery.services import activity_service
from sqlalchemy import text

router = APIRouter(
    prefix="/activities",
    tags=["Activities"]
)

@router.get("/setup-mock-user")
def setup_mock_user(db: Session = Depends(get_db)):
    try:
        # mock user ID = 1 để test, tránh lỗi foreign key khi tạo activity
        db.execute(text("INSERT INTO users (id, email, supabase_id) VALUES (1, 'test@gmail.com', 'mock_id_123') ON CONFLICT (id) DO NOTHING;"))
        db.commit()
        return {"status": "Success", "message": "Đã tạo mồi User ID = 1 ngon lành cành đào!"}
    except Exception as e:
        return {"status": "Error", "detail": str(e)}

@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def log_activity(activity_in: ActivityCreate, db: Session = Depends(get_db)):
    current_user_id = 1  # Tạm thời fix cứng cho Phase 1
    return activity_service.create_user_activity(db=db, activity_in=activity_in, user_id=current_user_id)