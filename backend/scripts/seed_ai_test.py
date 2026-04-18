from __future__ import annotations

"""
Seed AI test data for FoOdyssey.
Tập trung vào các reviews có từ khóa đặc thù để test khả năng đọc dữ liệu của AI.

Run:
  docker compose exec backend python scripts/seed_ai_test.py
"""

from sqlalchemy import select
from datetime import datetime

from app.db.models import Place, User, Review, Ward, Concept, Purpose, Amenity
from app.db.session import SessionLocal

def _get_or_create_by_name(session, model, *, name: str, slug: str | None = None):
    obj = session.scalar(select(model).where(model.name == name))
    if obj is not None:
        return obj
    obj = model(name=name, slug=slug)
    session.add(obj)
    return obj

def main() -> None:
    with SessionLocal() as session:
        # 1. Lấy hoặc tạo tag cơ bản
        c_vn = _get_or_create_by_name(session, Concept, name="Ẩm thực Việt Nam", slug="vietnamese")
        c_fast = _get_or_create_by_name(session, Concept, name="Món ăn nhanh", slug="fast-food")
        p_lunch = _get_or_create_by_name(session, Purpose, name="Ăn trưa", slug="lunch")
        a_parking = _get_or_create_by_name(session, Amenity, name="Có bãi đỗ xe", slug="parking")
        
        session.flush()

        # 2. Lấy hoặc tạo User
        admin = session.scalar(select(User).where(User.email == "admin@foodyssey.com"))
        if not admin:
            admin = User(
                supabase_id="admin_uid_ai_test",
                email="admin@foodyssey.com",
                display_name="Hệ thống AI Tester",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
            )
            session.add(admin)
        
        session.flush()

        # 3. Định nghĩa các quán đặc biệt
        def add_test_place(name, description, address, reviews_content):
            p = session.scalar(select(Place).where(Place.name == name))
            if not p:
                p = Place(
                    name=name,
                    description=description,
                    address=address,
                    latitude=10.0, # Dummy coords for test
                    longitude=106.0
                )
                p.concepts.append(c_vn)
                p.purposes.append(p_lunch)
                p.amenities.append(a_parking)
                session.add(p)
                session.flush()

            # Thêm review cho quán
            for content in reviews_content:
                r_exists = session.scalar(select(Review).where(Review.place_id == p.id, Review.content == content))
                if not r_exists:
                    r = Review(
                        user_id=admin.id,
                        place_id=p.id,
                        rating=5.0,
                        content=content
                    )
                    session.add(r)
            return p

        print("Đang đổ dữ liệu mẫu chuyên biệt cho AI...")
        
        # Scenario 1: Món ăn độc lạ
        add_test_place(
            "Mì Bay Singapore - CN Tân Phong",
            "Quán mì bay nổi tiếng với cách trình bày độc lạ.",
            "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
            ["Món mì bay ở đây trang trí cực đẹp, sợi mì dai ngon, nước dùng đậm đà kiểu Sing.", "Rất thích hợp để chụp ảnh sống ảo với món mì bay."]
        )

        # Scenario 2: Dịch vụ dắt xe và nhiệt tình
        add_test_place(
            "Bún Bò Huế O Xuân",
            "Bún bò Huế chính gốc, phục vụ kiểu gia đình.",
            "456 CMT8, Quận 3, TP.HCM",
            ["Đồ ăn bình thường nhưng nhân viên nhiệt tình, dắt xe cho khách rất chu đáo, điểm 10 cho dịch vụ.", "Quán sạch sẽ, phục vụ nhanh nhẹn."]
        )

        # Scenario 3: Món ăn cực phẩm
        add_test_place(
            "Hải Sản Biển Đông",
            "Cung cấp hải sản tươi sống chất lượng cao.",
            "789 Phan Xích Long, Phú Nhuận, TP.HCM",
            ["Hải sản tươi sống, đặc biệt có món tôm hùm sốt bơ tỏi cực phẩm.", "Giá hơi cao nhưng chất lượng hải sản rất ổn."]
        )

        session.commit()

    print("-" * 30)
    print("SUCCESS: AI Test Seed completed!")
    print("-" * 30)

if __name__ == "__main__":
    main()
