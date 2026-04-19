from __future__ import annotations

"""
Seed demo data for FoOdyssey.

Run:
  cd backend
  python3 scripts/seed_demo.py
"""

from sqlalchemy import select
from datetime import datetime

from app.db.models import Amenity, Concept, Dish, Place, Purpose, User, Review, Ward
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
		# ---- 1. Seed tag options ----
		concept_food = _get_or_create_by_name(session, Concept, name="Ẩm thực đường phố", slug="street-food")
		concept_coffee = _get_or_create_by_name(session, Concept, name="Cà phê view đẹp", slug="scenic-cafe")

		purpose_breakfast = _get_or_create_by_name(session, Purpose, name="Ăn sáng", slug="breakfast")
		purpose_chill = _get_or_create_by_name(session, Purpose, name="Chill / Tán gẫu", slug="chill")

		amenity_parking = _get_or_create_by_name(session, Amenity, name="Có bãi đỗ xe", slug="parking")
		amenity_wifi = _get_or_create_by_name(session, Amenity, name="Wi-Fi", slug="wifi")

		session.flush()  # get IDs

		# ---- 2. Seed Users ----
		print("Seeding users...")
		user_nam = session.scalar(select(User).where(User.email == "nam.tester@example.com"))
		if not user_nam:
		        user_nam = User(
		                supabase_id="demo_user_nam_123",
		                email="nam.tester@example.com",
		                display_name="Nam Tester",
		                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Nam",
		                preferences={"favorite_cuisines": ["Phở", "Bánh mì"]}
		        )
		        session.add(user_nam)

		user_phong = session.scalar(select(User).where(User.email == "phong.geo@example.com"))
		if not user_phong:
		        user_phong = User(
		                supabase_id="demo_user_phong_456",
		                email="phong.geo@example.com",
		                display_name="Phong Geo",
		                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Phong",
		                preferences={"favorite_cuisines": ["Coffee"]}
		        )
		        session.add(user_phong)

		session.flush()

		# ---- 4. Seed Dishes ----
		dish_pho_bo = _get_or_create_by_name(session, Dish, name="Phở bò", slug="pho-bo")
		dish_pho_ga = _get_or_create_by_name(session, Dish, name="Phở gà", slug="pho-ga")
		dish_bun_bo = _get_or_create_by_name(session, Dish, name="Bún bò Huế", slug="bun-bo-hue")
		dish_banh_mi_thit = _get_or_create_by_name(session, Dish, name="Bánh mì kẹp thịt", slug="banh-mi-thit")
		dish_cafe_sua = _get_or_create_by_name(session, Dish, name="Cà phê sữa đá", slug="cafe-sua")
		dish_nuoc_cam = _get_or_create_by_name(session, Dish, name="Nước cam", slug="nuoc-cam")

		# ---- 5. Seed places ----
		print("Seeding places...")
		existing = {p.name for p in session.scalars(select(Place)).all()}

		def add_place(
		        *,
		        name: str,
		        description: str,
		        address: str,
		        latitude: float,
		        longitude: float,
		        concepts: list[Concept],
		        purposes: list[Purpose],
		        amenities: list[Amenity],
		        dishes: list[Dish] = [],
		        ward_code: str | None = None,
		) -> Place:
		        p = session.scalar(select(Place).where(Place.name == name))
		        if not p:
		                p = Place(
		                        name=name,
		                        description=description,
		                        address=address,
		                        latitude=latitude,
		                        longitude=longitude,
		                )
		                session.add(p)
		        
		        # Always update relationships to ensure sync with latest seed data
		        p.concepts = concepts
		        p.purposes = purposes
		        p.amenities = amenities
		        p.dishes = dishes
		        
		        if ward_code:
		                ward = session.query(Ward).filter_by(code=ward_code).first()
		                if ward:
		                        p.ward_id = ward.id
		        return p

		# Some demo coordinates around HCMC center
		p1 = add_place(
		        name="Phở Nam Sài Gòn",
		        description="Phở bò truyền thống, nước dùng đậm đà.",
		        address="Q.1, TP.HCM",
		        latitude=10.7769,
		        longitude=106.7009,
		        concepts=[concept_food],
		        purposes=[purpose_breakfast],
		        amenities=[amenity_parking],
		        dishes=[dish_pho_bo, dish_pho_ga, dish_bun_bo, dish_nuoc_cam],
		        ward_code="26734", # Phường Bến Nghé, Q.1
		)
		p2 = add_place(
		        name="Bánh mì Góc Phố",
		        description="Bánh mì nóng giòn, nhiều topping.",
		        address="Q.3, TP.HCM",
		        latitude=10.7823,
		        longitude=106.6843,
		        concepts=[concept_food],
		        purposes=[purpose_breakfast],
		        amenities=[amenity_wifi],
		        dishes=[dish_banh_mi_thit],
		        ward_code="27082", # Mượn tạm Phường Tân Phong, Q.7 cho demo
		)
		p3 = add_place(
		        name="Cafe Sân Thượng",
		        description="Cafe rooftop, view thành phố, phù hợp ngắm hoàng hôn.",
		        address="Q.Bình Thạnh, TP.HCM",
		        latitude=10.8032,
		        longitude=106.7170,
		        concepts=[concept_coffee],
		        purposes=[purpose_chill],
		        amenities=[amenity_wifi, amenity_parking],
		        dishes=[dish_cafe_sua, dish_nuoc_cam],
		        ward_code="26839", # Phường 25, Q.Bình Thạnh
		)

		session.flush()

		# ---- 4. Seed Reviews ----
		print("Seeding reviews...")
		review_exists = session.scalar(select(Review).where(Review.user_id == user_nam.id, Review.place_id == p1.id))
		if not review_exists:
		        r1 = Review(
		                user_id=user_nam.id,
		                place_id=p1.id,
		                rating=5.0,
		                content="Nước lèo quá đỉnh, thịt bò mềm. Sẽ quay lại!",
		                image_urls=["https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43"]
		        )
		        session.add(r1)

		review_exists2 = session.scalar(select(Review).where(Review.user_id == user_phong.id, Review.place_id == p3.id))
		if not review_exists2:
		        r2 = Review(
		                user_id=user_phong.id,
		                place_id=p3.id,
		                rating=4.5,
		                content="View đẹp hết nấc, đồ uống hơi đắt nhưng xứng đáng.",
		                image_urls=["https://images.unsplash.com/photo-1554118811-1e0d58224f24"]
		        )
		        session.add(r2)

		session.commit()

	print("-" * 30)
	print("SUCCESS: Seed demo completed!")
	print(f"Places: {session.query(Place).count()}")
	print(f"Users: {session.query(User).count()}")
	print(f"Reviews: {session.query(Review).count()}")
	print("-" * 30)
	print("TIP: Re-test /api/v1/search and check your PopSQL Tables.")


if __name__ == "__main__":
	main()
