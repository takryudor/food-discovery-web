import sys
import os
import json
from datetime import datetime, timedelta
from jose import jwt

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.db.models import User, UserActivity, Place

def create_test_jwt(supabase_id: str):
    """
    Tạo một JWT giả lập Supabase để test backend.
    """
    settings = get_settings()
    payload = {
        "sub": supabase_id,
        "aud": "authenticated",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm=settings.supabase_jwt_algorithm)
    return token

def test_auth_and_logging():
    db = SessionLocal()
    settings = get_settings()
    
    if not settings.supabase_jwt_secret:
        print("❌ LỖI: SUPABASE_JWT_SECRET trống. Vui lòng kiểm tra file .env")
        return

    # 1. Tìm hoặc tạo một user demo trong DB
    test_supabase_id = "test_user_123"
    user = db.query(User).filter(User.supabase_id == test_supabase_id).first()
    if not user:
        print(f"--- Tạo user test với supabase_id: {test_supabase_id} ---")
        user = User(
            supabase_id=test_supabase_id,
            email="test@example.com",
            display_name="Test User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Tạo Token
    token = create_test_jwt(test_supabase_id)
    print(f"✅ Đã tạo Test JWT cho user: {user.email}")

    # 3. Giả lập gọi API (test trực tiếp dependency logic)
    from app.core.dependencies import get_current_user
    try:
        authenticated_user = get_current_user(token=token, db=db)
        print(f"✅ Xác thực thành công: User {authenticated_user.display_name} (ID: {authenticated_user.id})")
    except Exception as e:
        print(f"❌ Xác thực thất bại: {e}")
        return

    # 4. Test Logging VIEW
    # Lấy đại 1 quán trong DB
    place = db.query(Place).first()
    if not place:
        print("⚠️ Không có quán nào trong DB để test logging VIEW.")
    else:
        from app.services.activity_service import log_activity
        print(f"--- Đang log VIEW cho quán: {place.name} ---")
        activity = log_activity(db, user_id=authenticated_user.id, action_type="VIEW", place_id=place.id)
        
        if activity:
            print(f"✅ Ghi log thành công: Activity ID {activity.id}, Type: {activity.action_type}")
            
            # Kiểm tra lại trong DB
            saved = db.query(UserActivity).filter(UserActivity.id == activity.id).first()
            if saved:
                print(f"📊 Kiểm tra DB: Đã tìm thấy bản ghi với Action: {saved.action_type} lúc {saved.timestamp}")
        else:
            print("❌ Ghi log thất bại.")

    db.close()

if __name__ == "__main__":
    test_auth_and_logging()
