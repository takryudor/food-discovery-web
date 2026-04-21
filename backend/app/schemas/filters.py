from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from .common import IdName


class FilterGroup(BaseModel):
	key: Literal["concepts", "purposes", "amenities", "budget_ranges", "dishes"]
	label: str
	placeholder: str | None = None
	items: list[IdName]
	items_count: int = 0


class FiltersOptionsLookup(BaseModel):
	"""
	Lookup tables giúp frontend map ID -> tag nhanh, không cần loop O(n) mỗi lần render.
	"""

	concepts: dict[int, IdName] = Field(default_factory=dict)
	purposes: dict[int, IdName] = Field(default_factory=dict)
	amenities: dict[int, IdName] = Field(default_factory=dict)
	budget_ranges: dict[int, IdName] = Field(default_factory=dict)
	dishes: dict[int, IdName] = Field(default_factory=dict)


class FiltersOptionsMeta(BaseModel):
	"""
	Metadata để frontend xử lý UI “sướng” hơn:
	- version: cho phép FE biết shape response đang dùng
	- generated_at: debug/cache bust
	- cache_ttl_seconds: hint để FE tuỳ chọn cache client-side (nếu muốn)
	- match_modes: FE có thể render toggle ANY/ALL theo danh sách này
	"""

	version: str = Field(default="v2")
	generated_at: datetime
	cache_ttl_seconds: int
	match_modes: list[Literal["any", "all"]] = Field(default_factory=lambda: ["any", "all"])
	default_match_mode: Literal["any", "all"] = "any"
	group_order: list[Literal["concepts", "purposes", "amenities", "budget_ranges", "dishes"]] = Field(
		default_factory=lambda: ["concepts", "purposes", "amenities", "budget_ranges", "dishes"]
	)


class FiltersOptionsResponse(BaseModel):
	"""
	V2 response (giữ backward-compatible):
	- Vẫn có 4 key cũ: concepts/purposes/amenities/budget_ranges
	- Thêm meta + groups để FE render động và debug dễ hơn
	"""

	meta: FiltersOptionsMeta
	concepts: list[IdName]
	purposes: list[IdName]
	amenities: list[IdName]
	budget_ranges: list[IdName]
	dishes: list[IdName]
	groups: list[FilterGroup]
	lookup: FiltersOptionsLookup

