from sqlalchemy.orm import Session
from app.db.models import RestaurantContribution
from app.schemas.contribution import ContributionCreate

# 1. Hàm khuân dữ liệu từ Form đóng góp của Frontend lưu vào Database
def create_restaurant_contribution(db: Session, contribution_in: ContributionCreate, user_id: int):
    db_contribution = RestaurantContribution(
        user_id=user_id,
        name=contribution_in.name,
        description=contribution_in.description,
        address=contribution_in.address,
        latitude=contribution_in.latitude,
        longitude=contribution_in.longitude,
        phone=contribution_in.phone,
        open_hours=contribution_in.open_hours,
        price_range=contribution_in.price_range,
        status="PENDING"  # Mặc định quán mới đóng góp sẽ chờ duyệt
    )
    
    db.add(db_contribution)      # Bỏ vào giỏ hàng database
    db.commit()                   # Chốt lưu xuống ổ đĩa
    db.refresh(db_contribution)   # Lấy lại ID tự sinh để trả về
    return db_contribution

# 2. Hàm lấy danh sách các quán mà một User cụ thể đã đóng góp (để hiện ở trang Cá nhân)
def get_user_contributions(db: Session, user_id: int):
    return db.query(RestaurantContribution).filter(RestaurantContribution.user_id == user_id).all()