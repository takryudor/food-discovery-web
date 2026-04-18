from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


def _normalize_tag_ids(v: object) -> list[int]:
	"""
	Dedupe (giữ thứ tự), bỏ id không hợp lệ (<=0), bool, và phần tử không parse được int.
	Cho phép chuỗi số từ JSON/query lỏng lẻo.
	"""
	if v is None:
		return []
	if not isinstance(v, list):
		raise ValueError("expected a list of ids")
	out: list[int] = []
	seen: set[int] = set()
	for raw in v:
		if raw is None or isinstance(raw, bool):
			continue
		try:
			i = int(raw) if not isinstance(raw, int) else raw
		except (TypeError, ValueError):
			continue
		if i <= 0:
			continue
		if i not in seen:
			seen.add(i)
			out.append(i)
	return out


class SearchLocation(BaseModel):
	"""
	Vị trí của user để tính khoảng cách (km) tới từng địa điểm.
	"""

	lat: float = Field(..., ge=-90, le=90)
	lng: float = Field(..., ge=-180, le=180)


class SearchRequest(BaseModel):
	"""
	Input cho POST /search.

	Chuẩn hoá khi parse (tránh lỗi vặt từ client):
	- `query`: strip; chuỗi chỉ khoảng trắng → null.
	- `*_ids`: bỏ trùng (giữ thứ tự), bỏ id ≤ 0, bool, null, không parse được.
	- `*_match`: chấp nhận không phân biệt hoa thường (ví dụ ANY → any).
	"""

	# Query text. Nếu rỗng thì trả kết quả dựa trên filter + khoảng cách.
	query: str | None = None

	# Vị trí user để tính khoảng cách và sort
	location: SearchLocation | None = None

	# Chỉ lấy kết quả trong bán kính radius_km (khi có location).
	radius_km: float | None = Field(default=None, gt=0)

	# Lọc theo ID tag mà user chọn (ID lấy từ DB).
	concept_ids: list[int] = Field(default_factory=list)
	purpose_ids: list[int] = Field(default_factory=list)
	amenity_ids: list[int] = Field(default_factory=list)

	# Match mode per group:
	# - "any": place matches if it has at least one selected tag in that group
	# - "all": place matches only if it has all selected tags in that group
	concept_match: Literal["any", "all"] = "any"
	purpose_match: Literal["any", "all"] = "any"
	amenity_match: Literal["any", "all"] = "any"

	# Phân trang
	limit: int = Field(default=20, ge=1, le=100)
	offset: int = Field(default=0, ge=0)

	# Xếp hạng:
	# - "default": ILIKE + sort theo id (ổn định, giống MVP cũ).
	# - "smart": Postgres dùng FTS + ts_rank ưu tiên relevance; kèm boost rating trong match_score.
	ranking: Literal["default", "smart"] = "smart"

	@field_validator("query", mode="before")
	@classmethod
	def normalize_query(cls, v: object) -> str | None:
		if v is None:
			return None
		if not isinstance(v, str):
			raise ValueError("query must be a string or null")
		s = v.strip()
		return s if s else None

	@field_validator("concept_ids", "purpose_ids", "amenity_ids", mode="before")
	@classmethod
	def normalize_tag_id_lists(cls, v: object) -> list[int]:
		return _normalize_tag_ids(v)

	@field_validator("concept_match", "purpose_match", "amenity_match", mode="before")
	@classmethod
	def normalize_match_mode(cls, v: object) -> str:
		if v is None:
			return "any"
		if isinstance(v, str):
			s = v.strip().lower()
			if s in ("any", "all"):
				return s
			raise ValueError('match mode must be "any" or "all"')
		raise ValueError('match mode must be a string')

	@field_validator("radius_km", mode="before")
	@classmethod
	def normalize_radius(cls, v: object) -> float | None:
		if v is None or v == "":
			return None
		return v

	@field_validator("ranking", mode="before")
	@classmethod
	def normalize_ranking(cls, v: object) -> str:
		if v is None:
			return "smart"
		if isinstance(v, str):
			s = v.strip().lower()
			if s in ("default", "smart"):
				return s
			raise ValueError('ranking must be "default" or "smart"')
		raise ValueError("ranking must be a string")


class PlaceOut(BaseModel):
	"""
	1 item kết quả search.
	"""

	id: int
	name: str
	address: str | None = None
	latitude: float
	longitude: float

	# Computed fields
	# Field tính toán (không lưu DB)
	distance_km: float | None = None
	match_score: float = 0.0


class SearchResponse(BaseModel):
	total: int
	items: list[PlaceOut]

