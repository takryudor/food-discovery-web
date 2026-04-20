from __future__ import annotations

import math

import sqlalchemy as sa
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..db.models import (
	Dish,
	Place,
	place_amenities,
	place_budget_ranges,
	place_concepts,
	place_dishes,
	place_purposes,
)


def _place_tsvector():
	"""Tsvector cho FTS (Postgres). Dùng config 'simple' để không phụ thuộc ngôn ngữ cụ thể."""
	# Prefer stored tsvector column when present (faster with GIN index).
	# Fallback to computed expression for non-migrated DBs / non-Postgres.
	return func.coalesce(
		Place.search_tsv,
		func.to_tsvector(
			"simple",
			func.concat_ws(" ", func.coalesce(Place.name, ""), func.coalesce(Place.description, "")),
		),
	)


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


def _sql_haversine_km(
	*,
	ulat: float,
	ulng: float,
	plat,
	plng,
):
	"""
	SQL expression tính khoảng cách Haversine (km).

	- Dùng cho lọc radius + order-by distance ở DB để pagination/total đúng.
	- Hoạt động tốt trên PostgreSQL (mục tiêu chính của project).
	"""
	r = 6371.0
	phi1 = func.radians(sa.literal(ulat))
	phi2 = func.radians(plat)
	dphi = func.radians(plat - sa.literal(ulat))
	dlambda = func.radians(plng - sa.literal(ulng))

	a = (
		func.pow(func.sin(dphi / 2.0), 2)
		+ func.cos(phi1) * func.cos(phi2) * func.pow(func.sin(dlambda / 2.0), 2)
	)
	c = 2.0 * func.atan2(func.sqrt(a), func.sqrt(1.0 - a))
	return (sa.literal(r) * c).cast(sa.Float)


def _bbox_for_radius_km(*, lat: float, lng: float, radius_km: float) -> tuple[float, float, float, float]:
	"""
	Bounding box (min_lat, max_lat, min_lng, max_lng) for quick pre-filter.

	This is an approximation that greatly reduces candidate rows before applying
	the exact Haversine distance filter.
	"""
	# 1 degree latitude ~ 111 km
	dlat = radius_km / 111.0
	# longitude degrees shrink by cos(latitude)
	cos_lat = math.cos(math.radians(lat))
	dlng = radius_km / (111.0 * max(0.000001, cos_lat))
	return (lat - dlat, lat + dlat, lng - dlng, lng + dlng)

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
	place_dish_names: set[str],
	text_relevance: float | None = None,
) -> float:
	"""
	Tính điểm match_score trong khoảng [0..1] để xếp hạng kết quả.

	- Tag overlap: tín hiệu chính.
	- Text: ưu tiên `text_relevance` (ts_rank chuẩn hoá) nếu có; không thì substring name/mô tả.
	- Rating: boost nhẹ nếu `places.rating` có giá trị (0..5 → 0..1).
	"""

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
			
			# Check substring in name/description
			substr_score = 1.0 if q in name else (0.5 if q in desc else 0.0)
			
			# Check exact match in dishes (stronger signal)
			dish_match = any(q in dn.lower() for dn in place_dish_names)
			if dish_match:
				substr_score = max(substr_score, 0.9) # High score for dish match

			if text_relevance is not None:
				# Kết hợp relevance từ DB + substring để không bỏ sót khớp ILIKE-only
				text_score = max(float(text_relevance), substr_score)
			else:
				text_score = substr_score

	raw_weights: list[tuple[float, float]] = []
	if concept_ids:
		raw_weights.append((0.35, concept_score))
	if purpose_ids:
		raw_weights.append((0.35, purpose_score))
	if amenity_ids:
		raw_weights.append((0.2, amenity_score))
	if query and query.strip():
		raw_weights.append((0.1, text_score))

	rr = getattr(place, "rating", None)
	if rr is not None:
		try:
			rw = max(0.0, min(1.0, float(rr) / 5.0))
			raw_weights.append((0.08, rw))
		except (TypeError, ValueError):
			pass

	if not raw_weights:
		return 0.0

	total_w = sum(w for w, _ in raw_weights)
	score = sum((w / total_w) * s for w, s in raw_weights)

	return max(0.0, min(1.0, score))


def _fetch_pg_text_ranks(db: Session, *, page_ids: list[int], q: str) -> dict[int, float]:
	if not page_ids:
		return {}
	tsvector = _place_tsvector()
	# websearch_to_tsquery handles multi-word queries better (like Google style).
	# Fallback to plainto_tsquery for compatibility if needed.
	tsq = func.websearch_to_tsquery("simple", q.strip())
	stmt = select(Place.id, func.ts_rank_cd(tsvector, tsq)).where(Place.id.in_(page_ids))
	rows = list(db.execute(stmt))
	out = {int(r[0]): float(r[1] or 0.0) for r in rows}
	mx = max(out.values(), default=0.0)
	if mx <= 0.0:
		return {k: 0.0 for k in out}
	return {k: v / mx for k, v in out.items()}


def search_places(
	*,
	db: Session,
	query: str | None,
	location: tuple[float, float] | None,
	radius_km: float | None,
	concept_ids: list[int],
	purpose_ids: list[int],
	amenity_ids: list[int],
	budget_range_ids: list[int],
	dish_ids: list[int],
	concept_match: str = "any",
	purpose_match: str = "any",
	amenity_match: str = "any",
	budget_range_match: str = "any",
	dish_match: str = "any",
	ranking: str = "smart",
	limit: int = 20,
	offset: int = 0,
) -> tuple[int, list[dict]]:
	"""
	Search: filter tag ở DB + paginate ở DB.

	- ranking=smart + Postgres + có query: lọc bằng (FTS @@) OR ILIKE, sort page theo ts_rank_cd.
	- ranking=default: chỉ ILIKE khi có query, sort theo id (MVP).
	"""

	dialect = db.get_bind().dialect.name
	selected_concepts = set(concept_ids)
	selected_purposes = set(purpose_ids)
	selected_amenities = set(amenity_ids)
	selected_budget_ranges = set(budget_range_ids)
	selected_dishes = set(dish_ids)

	distance_expr = None
	if location is not None:
		ulat, ulng = location
		distance_expr = _sql_haversine_km(ulat=ulat, ulng=ulng, plat=Place.latitude, plng=Place.longitude).label(
			"distance_km"
		)
		ids_stmt = select(Place.id, distance_expr).select_from(Place)
	else:
		ids_stmt = select(Place.id).select_from(Place)

	if query and query.strip():
		q = query.strip()
		like = f"%{q}%"
		ilike = or_(
			Place.name.ilike(like), 
			Place.description.ilike(like),
			Place.dishes.any(Dish.name.ilike(like))
		)
		if dialect == "postgresql" and ranking == "smart":
			tsvector = _place_tsvector()
			tsq = func.websearch_to_tsquery("simple", q)
			fts = tsvector.op("@@")(tsq)
			ids_stmt = ids_stmt.where(or_(fts, ilike))
		else:
			ids_stmt = ids_stmt.where(ilike)

	# Geo radius filter at DB-level (correct total/pagination)
	if distance_expr is not None and radius_km is not None:
		# Fast bbox pre-filter (uses btree indexes on latitude/longitude when available)
		min_lat, max_lat, min_lng, max_lng = _bbox_for_radius_km(lat=ulat, lng=ulng, radius_km=float(radius_km))
		ids_stmt = ids_stmt.where(
			and_(
				Place.latitude >= min_lat,
				Place.latitude <= max_lat,
				Place.longitude >= min_lng,
				Place.longitude <= max_lng,
			)
		)
		# Exact radius filter
		ids_stmt = ids_stmt.where(distance_expr <= float(radius_km))

	def _apply_tag_filter(
		stmt,
		*,
		selected: set[int],
		mode: str,
		assoc_table,
		tag_col,
	):
		if not selected:
			return stmt
		subq = select(assoc_table.c.place_id).where(tag_col.in_(selected))
		if mode == "all":
			subq = (
				subq.group_by(assoc_table.c.place_id)
				.having(func.count(func.distinct(tag_col)) == len(selected))
			)
		return stmt.where(Place.id.in_(subq))

	ids_stmt = _apply_tag_filter(
		ids_stmt,
		selected=selected_concepts,
		mode=concept_match,
		assoc_table=place_concepts,
		tag_col=place_concepts.c.concept_id,
	)
	ids_stmt = _apply_tag_filter(
		ids_stmt,
		selected=selected_purposes,
		mode=purpose_match,
		assoc_table=place_purposes,
		tag_col=place_purposes.c.purpose_id,
	)
	ids_stmt = _apply_tag_filter(
		ids_stmt,
		selected=selected_amenities,
		mode=amenity_match,
		assoc_table=place_amenities,
		tag_col=place_amenities.c.amenity_id,
	)
	ids_stmt = _apply_tag_filter(
		ids_stmt,
		selected=selected_budget_ranges,
		mode=budget_range_match,
		assoc_table=place_budget_ranges,
		tag_col=place_budget_ranges.c.budget_range_id,
	)
	ids_stmt = _apply_tag_filter(
		ids_stmt,
		selected=selected_dishes,
		mode=dish_match,
		assoc_table=place_dishes,
		tag_col=place_dishes.c.dish_id,
	)

	total = int(db.scalar(select(func.count()).select_from(ids_stmt.subquery())) or 0)

	score_expr = None
	if query and query.strip() and ranking == "smart" and dialect == "postgresql":
		tsvector = _place_tsvector()
		tsq = func.websearch_to_tsquery("simple", query.strip())
		rank_expr = func.ts_rank_cd(tsvector, tsq)

		# Multi-signal DB ordering for stable pagination:
		# - text rank: primary
		# - rating: secondary boost
		# - tag match count: small boost when user selected tags
		rating_expr = (func.coalesce(Place.rating, 0.0) / 5.0).cast(sa.Float)

		tag_count_terms = []
		if selected_concepts:
			tag_count_terms.append(
				select(func.count(func.distinct(place_concepts.c.concept_id)))
				.where(
					and_(
						place_concepts.c.place_id == Place.id,
						place_concepts.c.concept_id.in_(selected_concepts),
					)
				)
				.scalar_subquery()
			)
		if selected_purposes:
			tag_count_terms.append(
				select(func.count(func.distinct(place_purposes.c.purpose_id)))
				.where(
					and_(
						place_purposes.c.place_id == Place.id,
						place_purposes.c.purpose_id.in_(selected_purposes),
					)
				)
				.scalar_subquery()
			)
		if selected_amenities:
			tag_count_terms.append(
				select(func.count(func.distinct(place_amenities.c.amenity_id)))
				.where(
					and_(
						place_amenities.c.place_id == Place.id,
						place_amenities.c.amenity_id.in_(selected_amenities),
					)
				)
				.scalar_subquery()
			)
		if selected_budget_ranges:
			tag_count_terms.append(
				select(func.count(func.distinct(place_budget_ranges.c.budget_range_id)))
				.where(
					and_(
						place_budget_ranges.c.place_id == Place.id,
						place_budget_ranges.c.budget_range_id.in_(selected_budget_ranges),
					)
				)
				.scalar_subquery()
			)
		if selected_dishes:
			tag_count_terms.append(
				select(func.count(func.distinct(place_dishes.c.dish_id)))
				.where(and_(place_dishes.c.place_id == Place.id, place_dishes.c.dish_id.in_(selected_dishes)))
				.scalar_subquery()
			)

		if tag_count_terms:
			tag_count_expr = sa.literal(0.0)
			for term in tag_count_terms:
				tag_count_expr = tag_count_expr + func.coalesce(term, 0.0)
		else:
			tag_count_expr = sa.literal(0.0)

		# Weights tuned to keep text relevance dominant.
		score_expr = (
			(rank_expr * 0.80)
			+ (rating_expr * 0.18)
			+ (tag_count_expr * 0.02)
		)

	if distance_expr is not None:
		# When searching "near me", distance is primary ordering.
		if score_expr is not None:
			ordered = (
				ids_stmt.order_by(
					distance_expr.asc(),
					score_expr.desc().nulls_last(),
					Place.id.asc(),
				)
				.limit(limit)
				.offset(offset)
			)
		else:
			ordered = ids_stmt.order_by(distance_expr.asc(), Place.id.asc()).limit(limit).offset(offset)
	else:
		if score_expr is not None:
			ordered = ids_stmt.order_by(score_expr.desc().nulls_last(), Place.id.asc()).limit(limit).offset(offset)
		else:
			ordered = ids_stmt.order_by(Place.id.asc()).limit(limit).offset(offset)

	distance_by_id: dict[int, float] = {}
	if distance_expr is not None:
		rows = list(db.execute(ordered).all())
		page_ids = [int(r[0]) for r in rows]
		distance_by_id = {int(r[0]): float(r[1]) for r in rows}
	else:
		page_ids = list(db.scalars(ordered).all())

	if not page_ids:
		return total, []

	stmt = (
		select(Place)
		.where(Place.id.in_(page_ids))
		.options(
			selectinload(Place.concepts),
			selectinload(Place.purposes),
			selectinload(Place.amenities),
			selectinload(Place.budget_ranges),
			selectinload(Place.dishes),
		)
	)
	places = list(db.scalars(stmt).all())

	places_by_id = {p.id: p for p in places}
	ordered_places = [places_by_id[i] for i in page_ids if i in places_by_id]

	text_ranks: dict[int, float] = {}
	if ranking == "smart" and dialect == "postgresql" and query and query.strip():
		text_ranks = _fetch_pg_text_ranks(db, page_ids=page_ids, q=query)

	results: list[dict] = []
	for place in ordered_places:
		place_concept_ids = {c.id for c in place.concepts}
		place_purpose_ids = {p.id for p in place.purposes}
		place_amenity_ids = {a.id for a in place.amenities}

		distance_km = distance_by_id.get(place.id) if distance_by_id else None

		tr = text_ranks.get(place.id) if text_ranks else None
		match_score = compute_match_score(
			place=place,
			query=query,
			concept_ids=selected_concepts,
			purpose_ids=selected_purposes,
			amenity_ids=selected_amenities,
			place_concept_ids=place_concept_ids,
			place_purpose_ids=place_purpose_ids,
			place_amenity_ids=place_amenity_ids,
			place_dish_names={d.name for d in place.dishes},
			text_relevance=tr,
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

	if location is not None:
		results.sort(key=lambda x: ((x["distance_km"] or 10**9), -x["match_score"]))
	elif ranking == "smart" and query and query.strip() and dialect == "postgresql":
		# Giữ thứ tự theo ts_rank (đã phản ánh relevance trên toàn DB cho trang hiện tại).
		pass
	else:
		results.sort(key=lambda x: -x["match_score"])

	return total, results
