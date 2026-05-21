from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.db.session import get_db
from app.db.models import User, Place
from app.core.dependencies import get_current_user, get_or_create_current_user
from app.schemas.user import UserMeResponse
from app.services.activity_service import log_activity

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserMeResponse)
def read_current_user(
    current_user: User = Depends(get_or_create_current_user),
):
    return current_user

@router.post("/favorite/{restaurant_id}")
def toggle_favorite(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Bật/tắt trạng thái yêu thích của một nhà hàng cho người dùng hiện tại.
    Đồng thời ghi nhận hành vi FAVORITE vào nhật ký.
    """
    # Kiểm tra nhà hàng có tồn tại không
    place = db.query(Place).filter(Place.id == restaurant_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="RESTAURANT_NOT_FOUND")

    # Đảm bảo preferences là dict
    if current_user.preferences is None:
        current_user.preferences = {}
    
    favorites = current_user.preferences.get("favorites", [])
    
    if restaurant_id in favorites:
        favorites.remove(restaurant_id)
        action = "UNFAVORITE"
    else:
        favorites.append(restaurant_id)
        action = "FAVORITE"
    
    current_user.preferences["favorites"] = favorites
    # Cần flag_modified vì SQLAlchemy không tự nhận biết thay đổi bên trong JSONB dict
    flag_modified(current_user, "preferences")
    
    db.commit()

    # Ghi nhận hành vi FAVORITE (chỉ ghi khi người dùng bật yêu thích)
    if action == "FAVORITE":
        log_activity(db, user_id=current_user.id, action_type="FAVORITE", place_id=restaurant_id)

    return {"status": "success", "action": action, "favorites": favorites}
