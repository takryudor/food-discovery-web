from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db  # Hàm kết nối database của dự án
from app.schemas.contribution import ContributionCreate, ContributionResponse
from app.modules.discovery.services import contribution_service

router = APIRouter(
    prefix="/contributions",
    tags=["Contributions"]
)

# Link 1: Nhận form đóng góp quán ăn từ Frontend gửi lên
@router.post("/", response_model=ContributionResponse, status_code=status.HTTP_201_CREATED)
def create_contribution(
    contribution_in: ContributionCreate, 
    db: Session = Depends(get_db)
):
    # Tạm thời fix cứng user_id = 1 cho Phase 1 để dễ test, Phase sau làm Auth sẽ truyền động sau
    current_user_id = 1 
    
    return contribution_service.create_restaurant_contribution(
        db=db, 
        contribution_in=contribution_in, 
        user_id=current_user_id
    )

# Link 2: Trả về danh sách các quán mà user đó đã đóng góp
@router.get("/my-contributions", response_model=List[ContributionResponse])
def read_my_contributions(db: Session = Depends(get_db)):
    current_user_id = 1
    return contribution_service.get_user_contributions(db=db, user_id=current_user_id)