from __future__ import annotations

import math

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from ..db.models import Place


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
	"""
	Tính khoảng cách (km) giữa 2 toạ độ bằng công thức Haversine.

	- Độ chính xác đủ tốt cho tính năng “quanh đây”.
	- Kết quả trả về là km.
	"""
	r = 6371.0  # Bán kính trái đất (km)
	phi1 = math.radians(lat1)
	phi2 = math.radians(lat2)
	dphi = math.radians(lat2 - lat1)
	dlambda = math.radians(lng2 - lng1)

	a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
	c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
	return r * c


def compute_match_score(
	*,
	place: Place,
	query: str | None,
	concept_ids: set[int],
	purpose_ids: set[int],
	amenity_ids: set[int],
	place_concept_ids: set[int],
	place_purpose_ids: set[int],
	place_amenity_ids: set[int],
) -> float:
	"""
	Tính điểm match_score trong khoảng [0..1] để xếp hạng kết quả.

	Đây là phần “logic nặng”. Chiến lược hiện tại:
	- Độ khớp tag (concept/purpose/amenity) là tín hiệu chính.
	- Query text (tên/mô tả) chỉ cộng thêm một phần nhỏ.

	Bạn có thể chỉnh weight cho phù hợp UX của đồ án.
	"""

	# --- Điểm overlap tag (0..1) ---
	def _overlap(selected: set[int], actual: set[int]) -> float:
		if not selected or not actual:
			return 0.0
		return len(selected & actual) / len(selected)

	concept_score = _overlap(concept_ids, place_concept_ids)
	purpose_score = _overlap(purpose_ids, place_purpose_ids)
	amenity_score = _overlap(amenity_ids, place_amenity_ids)

	# --- Điểm text (0..1) ---
	text_score = 0.0
	if query:
		q = query.strip().lower()
		if q:
			name = (place.name or "").lower()
			desc = (place.description or "").lower()
			if q in name:
				text_score = 1.0
			elif q in desc:
				text_score = 0.5

	# Dynamically normalise weights to only the groups the user selected
	# (plus text when a query is provided). Unselected groups are excluded
	# so the maximum achievable score is always 1.0.
	raw_weights: list[tuple[float, float]] = []
	if concept_ids:
		raw_weights.append((0.35, concept_score))
	if purpose_ids:
		raw_weights.append((0.35, purpose_score))
	if amenity_ids:
		raw_weights.append((0.2, amenity_score))
	if query and query.strip():
		raw_weights.append((0.1, text_score))

	if not raw_weights:
		return 0.0

	total_w = sum(w for w, _ in raw_weights)
	score = sum((w / total_w) * s for w, s in raw_weights)

	# Chặn trong [0..1]
	return max(0.0, min(1.0, score))


def search_places(
	*,
	db: Session,
	query: str | None,
	location: tuple[float, float] | None,
	radius_km: float | None,
	concept_ids: list[int],
	purpose_ids: list[int],
	amenity_ids: list[int],
) -> list[dict]:
	"""
	Thuật toán search (lọc dữ liệu + tính distance + tính match_score).

	Cách triển khai:
	- Lọc text cơ bản ngay ở DB cho nhanh.
	- Load tag bằng `selectinload` để tránh N+1.
	- Tính distance và match_score bằng Python (dễ đọc, dễ mở rộng).
	"""

	stmt = select(Place).options(
		selectinload(Place.concepts),
		selectinload(Place.purposes),
		selectinload(Place.amenities),
	)

	# Lọc text nhẹ ở DB level.
	if query and query.strip():
		q = f"%{query.strip()}%"
		stmt = stmt.where(or_(Place.name.ilike(q), Place.description.ilike(q)))

	places = list(db.scalars(stmt).all())

	selected_concepts = set(concept_ids)
	selected_purposes = set(purpose_ids)
	selected_amenities = set(amenity_ids)

	results: list[dict] = []
	for place in places:
		# Compute tag-id sets once per place and reuse for filtering + scoring.
		place_concept_ids = {c.id for c in place.concepts}
		place_purpose_ids = {p.id for p in place.purposes}
		place_amenity_ids = {a.id for a in place.amenities}

		# Lọc theo tag (quy tắc ANY):
		# - Nếu user có chọn tag trong 1 nhóm, place phải khớp *ít nhất 1* tag trong nhóm đó.
		# - Cách này làm kết quả “chặt” hơn (thường đúng kỳ vọng khi bật filter).
		if selected_concepts and not (place_concept_ids & selected_concepts):
			continue
		if selected_purposes and not (place_purpose_ids & selected_purposes):
			continue
		if selected_amenities and not (place_amenity_ids & selected_amenities):
			continue

		# Tính khoảng cách (nếu user có gửi location)
		distance_km = None
		if location is not None:
			ulat, ulng = location
			distance_km = haversine_km(ulat, ulng, place.latitude, place.longitude)
			if radius_km is not None and distance_km > radius_km:
				continue

		# Tính điểm match_score để xếp hạng
		match_score = compute_match_score(
			place=place,
			query=query,
			concept_ids=selected_concepts,
			purpose_ids=selected_purposes,
			amenity_ids=selected_amenities,
			place_concept_ids=place_concept_ids,
			place_purpose_ids=place_purpose_ids,
			place_amenity_ids=place_amenity_ids,
		)

		results.append(
			{
				"id": place.id,
				"name": place.name,
				"address": place.address,
				"latitude": place.latitude,
				"longitude": place.longitude,
				"distance_km": distance_km,
				"match_score": match_score,
			}
		)

	# Chiến lược sort:
	# - Nếu có location: ưu tiên gần trước, rồi match_score cao hơn.
	# - Nếu không có location: ưu tiên match_score cao hơn.
	if location is not None:
		results.sort(key=lambda x: ((x["distance_km"] or 10**9), -x["match_score"]))
	else:
		results.sort(key=lambda x: -x["match_score"])

	return results

