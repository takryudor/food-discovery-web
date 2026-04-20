from __future__ import annotations

"""
Seed local/private dataset into DB for testing.

How to use:
  1) Put your real dataset JSON at: backend/data/data.json   (this folder is gitignored)
  2) Run:
       cd backend
       python3 seed_local.py

If you don't have a dataset yet, copy `data.example.json` to `data/data.json`:
  cp data.example.json data/data.json
"""

import json
from pathlib import Path

from sqlalchemy import select

from app.db.models import Amenity, Concept, Place, Purpose
from app.db.session import SessionLocal
from app.utils.cache import cache_clear


DATA_PATH = Path(__file__).resolve().parent / "data" / "data.json"


def _get_or_create_by_slug(session, model, *, name: str, slug: str | None):
	if slug:
		obj = session.scalar(select(model).where(model.slug == slug))
		if obj is not None:
			# keep name updated if changed
			obj.name = name
			return obj
	obj = session.scalar(select(model).where(model.name == name))
	if obj is not None:
		if slug and getattr(obj, "slug", None) != slug:
			obj.slug = slug
		return obj
	obj = model(name=name, slug=slug)
	session.add(obj)
	return obj


def main() -> None:
	if not DATA_PATH.exists():
		raise SystemExit(
			f"Missing dataset file at: {DATA_PATH}\n"
			"Create it by copying the example:\n"
			"  cd backend\n"
			"  mkdir -p data\n"
			"  cp data.example.json data/data.json\n"
		)

	payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))

	concepts = payload.get("concepts", [])
	purposes = payload.get("purposes", [])
	amenities = payload.get("amenities", [])
	places = payload.get("places", [])

	with SessionLocal() as session:
		concept_by_slug: dict[str, Concept] = {}
		purpose_by_slug: dict[str, Purpose] = {}
		amenity_by_slug: dict[str, Amenity] = {}

		for c in concepts:
			obj = _get_or_create_by_slug(session, Concept, name=c["name"], slug=c.get("slug"))
			if obj.slug:
				concept_by_slug[obj.slug] = obj

		for p in purposes:
			obj = _get_or_create_by_slug(session, Purpose, name=p["name"], slug=p.get("slug"))
			if obj.slug:
				purpose_by_slug[obj.slug] = obj

		for a in amenities:
			obj = _get_or_create_by_slug(session, Amenity, name=a["name"], slug=a.get("slug"))
			if obj.slug:
				amenity_by_slug[obj.slug] = obj

		session.flush()

		existing_places = {p.name: p for p in session.scalars(select(Place)).all()}

		for pl in places:
			name = pl["name"]
			obj = existing_places.get(name)
			if obj is None:
				obj = Place(
					name=name,
					description=pl.get("description"),
					address=pl.get("address"),
					latitude=float(pl["latitude"]),
					longitude=float(pl["longitude"]),
				)
				session.add(obj)
				existing_places[name] = obj
			else:
				# update basic fields (safe for local seed)
				obj.description = pl.get("description")
				obj.address = pl.get("address")
				obj.latitude = float(pl["latitude"])
				obj.longitude = float(pl["longitude"])

			# replace tag lists
			obj.concepts = [concept_by_slug[s] for s in pl.get("concepts", []) if s in concept_by_slug]
			obj.purposes = [purpose_by_slug[s] for s in pl.get("purposes", []) if s in purpose_by_slug]
			obj.amenities = [amenity_by_slug[s] for s in pl.get("amenities", []) if s in amenity_by_slug]

		session.commit()

	# Clear in-memory cache so /filters/options reflects new data immediately
	cache_clear("filters:options:v1")

	print("Seed local completed.")
	print("Now test:")
	print("  - GET  http://127.0.0.1:8000/filters/options")
	print("  - POST http://127.0.0.1:8000/search")


if __name__ == "__main__":
	main()

