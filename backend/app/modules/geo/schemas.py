from pydantic import BaseModel, Field
from typing import List, Tuple


class MapMarkerRequest(BaseModel):
    restaurant_ids: List[int] = Field(
        ..., description="Danh sách ID của các quán ăn cần hiển thị trên bản đồ"
    )


class GeoJSONProperties(BaseModel):
    id: int
    name: str
    avg_price: int = Field(gt=0, description="Giá trung bình (phải > 0)")
    rating: float = Field(ge=0, le=5, description="Đánh giá (0-5)")
    is_open_now: bool


class GeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: Tuple[float, float]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: GeoJSONProperties


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


class RouteResponse(BaseModel):
    distance_km: float = Field(gt=0, description="Khoảng cách (km)")
    eta_minutes: int = Field(gt=0, description="Thời gian ước tính (phút)")
    maps_link: str = Field(description="Link Google Maps")
    mode: str = Field(pattern="^(driving|walking|bicycling|transit)$")