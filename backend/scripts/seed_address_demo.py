from __future__ import annotations

"""
Seed demo administrative data (TP.HCM only).
"""

from app.db.models import Province, District, Ward
from app.db.session import SessionLocal

def main() -> None:
    print("Seeding demo administrative data...")
    with SessionLocal() as session:
        # 1. Create Province (TP.HCM)
        hcm = session.query(Province).filter_by(code="79").first()
        if not hcm:
            hcm = Province(name="Thành phố Hồ Chí Minh", slug="ho-chi-minh", code="79")
            session.add(hcm)
            session.flush()

        # 2. Create Districts (District 1, District 7)
        districts_data = [
            {"name": "Quận 1", "slug": "quan-1", "code": "760"},
            {"name": "Quận 7", "slug": "quan-7", "code": "769"},
            {"name": "Quận Bình Thạnh", "slug": "binh-thanh", "code": "765"},
        ]

        district_objs = {}
        for d in districts_data:
            obj = session.query(District).filter_by(code=d["code"]).first()
            if not obj:
                obj = District(name=d["name"], slug=d["slug"], code=d["code"], province_id=hcm.id)
                session.add(obj)
                session.flush()
            district_objs[d["code"]] = obj

        # 3. Create Wards (Some example wards)
        wards_data = [
            {"name": "Phường Bến Nghé", "slug": "ben-nghe", "code": "26734", "d_code": "760"},
            {"name": "Phường Bến Thành", "slug": "ben-thanh", "code": "26740", "d_code": "760"},
            {"name": "Phường Tân Phong", "slug": "tan-phong", "code": "27082", "d_code": "769"},
            {"name": "Phường Tân Kiểng", "slug": "tan-kieng", "code": "27088", "d_code": "769"},
            {"name": "Phường 25", "slug": "phuong-25", "code": "26839", "d_code": "765"},
        ]

        for w in wards_data:
            obj = session.query(Ward).filter_by(code=w["code"]).first()
            if not obj:
                obj = Ward(
                    name=w["name"], 
                    slug=w["slug"], 
                    code=w["code"], 
                    district_id=district_objs[w["d_code"]].id
                )
                session.add(obj)

        session.commit()
    print("Seed address demo completed.")

if __name__ == "__main__":
    main()
