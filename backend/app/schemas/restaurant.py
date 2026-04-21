from __future__ import annotations

from pydantic import BaseModel, Field


class TagOut(BaseModel):
    """Schema chung cho concept/purpose/amenity trong response chi tiết."""

    id: int
    name: str
    slug: str | None = None


class RestaurantDetailResponse(BaseModel):
    """
    Response cho GET /restaurants/{id}
    Trả đầy đủ thông tin chi tiết nhà hàng + tags.
    """

    id: int
    name: str
    description: str | None = None
    address: str | None = None
    latitude: float
    longitude: float
    rating: float | None = Field(default=None, ge=0, le=5)
    phone: str | None = None
    open_hours: str | None = None
    price_range: str | None = None
    cover_image: str | None = None
    concepts: list[TagOut] = Field(default_factory=list)
    purposes: list[TagOut] = Field(default_factory=list)
    amenities: list[TagOut] = Field(default_factory=list)


class RestaurantSuggestion(BaseModel):
    """
    Schema cho một gợi ý trong autocomplete.
    """

    id: int
    name: str
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class FulltextSearchResponse(BaseModel):
    """
    Response cho GET /restaurants/search/fulltext
    Trả danh sách gợi ý nhanh theo tên/địa chỉ.
    """

    items: list[RestaurantSuggestion] = Field(default_factory=list)
