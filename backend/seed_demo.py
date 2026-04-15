from __future__ import annotations

"""
Seed demo data for FoOdyssey.

Run:
  cd backend
  python3 seed_demo.py
"""

from sqlalchemy import select

from app.db.models import Amenity, Concept, Place, Purpose
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
		# ---- Seed tag options ----
		concept_food = _get_or_create_by_name(session, Concept, name="Ẩm thực đường phố", slug="street-food")
		concept_coffee = _get_or_create_by_name(session, Concept, name="Cà phê view đẹp", slug="scenic-cafe")

		purpose_breakfast = _get_or_create_by_name(session, Purpose, name="Ăn sáng", slug="breakfast")
		purpose_chill = _get_or_create_by_name(session, Purpose, name="Chill / Tán gẫu", slug="chill")

		amenity_parking = _get_or_create_by_name(session, Amenity, name="Có bãi đỗ xe", slug="parking")
		amenity_wifi = _get_or_create_by_name(session, Amenity, name="Wi-Fi", slug="wifi")

		session.flush()  # get IDs

		# ---- Seed places ----
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
		) -> None:
			if name in existing:
				return
			p = Place(
				name=name,
				description=description,
				address=address,
				latitude=latitude,
				longitude=longitude,
			)
			p.concepts.extend(concepts)
			p.purposes.extend(purposes)
			p.amenities.extend(amenities)
			session.add(p)

		# Some demo coordinates around HCMC center
		add_place(
			name="Phở Nam Sài Gòn",
			description="Phở bò truyền thống, nước dùng đậm đà.",
			address="Q.1, TP.HCM",
			latitude=10.7769,
			longitude=106.7009,
			concepts=[concept_food],
			purposes=[purpose_breakfast],
			amenities=[amenity_parking],
		)
		add_place(
			name="Bánh mì Góc Phố",
			description="Bánh mì nóng giòn, nhiều topping.",
			address="Q.3, TP.HCM",
			latitude=10.7823,
			longitude=106.6843,
			concepts=[concept_food],
			purposes=[purpose_breakfast],
			amenities=[amenity_wifi],
		)
		add_place(
			name="Cafe Sân Thượng",
			description="Cafe rooftop, view thành phố, phù hợp ngắm hoàng hôn.",
			address="Q.Bình Thạnh, TP.HCM",
			latitude=10.8032,
			longitude=106.7170,
			concepts=[concept_coffee],
			purposes=[purpose_chill],
			amenities=[amenity_wifi, amenity_parking],
		)

		session.commit()

	print("Seed demo completed. Re-test /api/v1/filters/options and /api/v1/search in /docs.")


if __name__ == "__main__":
	main()

