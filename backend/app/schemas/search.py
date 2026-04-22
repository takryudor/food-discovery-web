from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic.config import ConfigDict

_WS_RE = re.compile(r"\s+")

# Default demo location when only radius_km is provided (HCMC center).
_DEFAULT_LOCATION = {"lat": 10.7769, "lng": 106.7009}


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

	model_config = ConfigDict(extra="ignore")

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

	# Cho phép client gửi dư field (không gây 422), để tương thích khi FE/BE
	# update lệch phiên bản trong quá trình phát triển.
	model_config = ConfigDict(extra="ignore")

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
	budget_range_ids: list[int] = Field(default_factory=list)
	dish_ids: list[int] = Field(default_factory=list)

	# Budget numeric range (VND). Applied via BudgetRange.min_vnd/max_vnd overlap.
	budget_min_vnd: int | None = Field(default=None, ge=0)
	budget_max_vnd: int | None = Field(default=None, ge=0)

	# Match mode per group:
	# - "any": place matches if it has at least one selected tag in that group
	# - "all": place matches only if it has all selected tags in that group
	concept_match: Literal["any", "all"] = "any"
	purpose_match: Literal["any", "all"] = "any"
	amenity_match: Literal["any", "all"] = "any"
	budget_range_match: Literal["any", "all"] = "any"
	dish_match: Literal["any", "all"] = "any"

	# Phân trang
	limit: int = Field(default=20, ge=1, le=100)
	offset: int = Field(default=0, ge=0)

	# Xếp hạng:
	# - "default": ILIKE + sort theo id (ổn định, giống MVP cũ).
	# - "smart": Postgres dùng FTS + ts_rank ưu tiên relevance; kèm boost rating trong match_score.
	ranking: Literal["default", "smart"] = "smart"

	# Sort option cho FE:
	# - "relevance": theo ranking hiện tại (smart/default) và/hoặc distance nếu đang "near me".
	# - "distance": gần trước (chỉ có ý nghĩa khi có location).
	# - "rating": rating cao trước (null xuống cuối).
	# - "popular": dựa trên số user_activities (VIEW/FAVORITE/SEARCH...).
	sort: Literal["relevance", "distance", "rating", "popular"] = "relevance"

	# Nếu true: chỉ trả các quán đang mở (dựa trên places.open_hours).
	open_now: bool = False

	# Nếu true: trả thêm facet counts để FE render filter "có bao nhiêu kết quả"
	include_facets: bool = False

	@field_validator("query", mode="before")
	@classmethod
	def normalize_query(cls, v: object) -> str | None:
		if v is None:
			return None
		if not isinstance(v, str):
			raise ValueError("query must be a string or null")
		# Trim + collapse whitespace to avoid accidental mismatches like "pho   bo"
		s = _WS_RE.sub(" ", v.strip())
		return s if s else None

	@field_validator("query")
	@classmethod
	def validate_query_length(cls, v: str | None) -> str | None:
		# Keep payload small + prevent pathological queries
		if v is None:
			return None
		if len(v) > 200:
			raise ValueError("query is too long (max 200 characters)")
		return v

	@field_validator("concept_ids", "purpose_ids", "amenity_ids", "budget_range_ids", "dish_ids", mode="before")
	@classmethod
	def normalize_tag_id_lists(cls, v: object) -> list[int]:
		return _normalize_tag_ids(v)

	@field_validator("concept_ids", "purpose_ids", "amenity_ids", "budget_range_ids", "dish_ids")
	@classmethod
	def validate_max_ids(cls, v: list[int]) -> list[int]:
		# Anti-abuse / performance guardrail: too many ids makes SQL IN(...) heavy.
		if len(v) > 50:
			raise ValueError("too many ids in a filter group (max 50)")
		return v

	@field_validator("concept_match", "purpose_match", "amenity_match", "budget_range_match", "dish_match", mode="before")
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

	@field_validator("limit", mode="before")
	@classmethod
	def normalize_limit(cls, v: object) -> int:
		# Allow FE to send "20" or "" without breaking
		if v is None or v == "":
			return 20
		if isinstance(v, bool):
			raise ValueError("limit must be an integer")
		try:
			return int(v)
		except (TypeError, ValueError):
			raise ValueError("limit must be an integer") from None

	@field_validator("offset", mode="before")
	@classmethod
	def normalize_offset(cls, v: object) -> int:
		if v is None or v == "":
			return 0
		if isinstance(v, bool):
			raise ValueError("offset must be an integer")
		try:
			return int(v)
		except (TypeError, ValueError):
			raise ValueError("offset must be an integer") from None

	@field_validator("budget_min_vnd", "budget_max_vnd", mode="before")
	@classmethod
	def normalize_budget_vnd(cls, v: object) -> int | None:
		if v is None or v == "":
			return None
		if isinstance(v, bool):
			raise ValueError("budget must be an integer")
		try:
			return int(v)
		except (TypeError, ValueError):
			raise ValueError("budget must be an integer") from None

	@model_validator(mode="after")
	def validate_budget_range(self):
		if self.budget_min_vnd is not None and self.budget_max_vnd is not None:
			if self.budget_min_vnd > self.budget_max_vnd:
				raise ValueError("budget_min_vnd must be <= budget_max_vnd")
		return self

	@model_validator(mode="before")
	@classmethod
	def default_location_when_radius_only(cls, data: object):
		"""
		Allow payload with only radius_km (no location) by injecting a default location.
		Useful for demo/testing when FE cannot access geolocation yet.
		"""
		if not isinstance(data, dict):
			return data
		if data.get("radius_km") not in (None, "") and data.get("location") in (None, ""):
			data = dict(data)
			data["location"] = _DEFAULT_LOCATION
		return data

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

	@field_validator("sort", mode="before")
	@classmethod
	def normalize_sort(cls, v: object) -> str:
		if v is None:
			return "relevance"
		if isinstance(v, str):
			s = v.strip().lower()
			if s in ("relevance", "distance", "rating", "popular"):
				return s
			raise ValueError('sort must be one of: "relevance", "distance", "rating", "popular"')
		raise ValueError("sort must be a string")


class PlaceOut(BaseModel):
	"""
	1 item kết quả search.
	"""

	id: int
	name: str
	address: str | None = None

	# Computed fields
	# Field tính toán (không lưu DB)
	distance_km: float | None = None
	match_score: float = 0.0


class SearchResponse(BaseModel):
	total: int
	items: list[PlaceOut]
	limit: int
	offset: int
	facets: dict[str, list[dict]] | None = None

