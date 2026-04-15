from __future__ import annotations

from pydantic import BaseModel, Field


class SearchLocation(BaseModel):
	"""
	Vị trí của user để tính khoảng cách (km) tới từng địa điểm.
	"""

	lat: float = Field(..., ge=-90, le=90)
	lng: float = Field(..., ge=-180, le=180)


class SearchRequest(BaseModel):
	"""
	Input cho POST /search.

	Bạn có thể mở rộng thêm sau:
	- price range
	- opening hours
	- rating, etc.
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

	# Phân trang
	limit: int = Field(default=20, ge=1, le=100)
	offset: int = Field(default=0, ge=0)


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

