from pydantic import BaseModel, Field
from typing import List, Tuple, Optional


class MapMarkerRequest(BaseModel):
    restaurant_ids: List[int] = Field(
        ..., description="Danh sách ID của các quán ăn cần hiển thị trên bản đồ"
    )
    # Nhận vị trí người dùng từ Frontend
    user_lat: Optional[float] = Field(None, description="Vĩ độ của người dùng")
    user_lng: Optional[float] = Field(None, description="Kinh độ của người dùng")

class GeoJSONProperties(BaseModel):
    id: int
    name: str
    avg_price: Optional[str] = Field(None, description="Giá trung bình (ví dụ: '50k' hoặc 'N/A')")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Đánh giá (0-5), có thể trống")
    is_open_now: bool = True
    distance: Optional[float] = Field(None, description="Khoảng cách ước tính (km)")
    eta: Optional[int] = Field(None, description="Thời gian ước tính (phút)")


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
    # Áp dụng dung lỗi nếu tính toán gặp sự cố 
    distance_km: float = Field(0.0, description="Khoảng cách (km)")
    eta_minutes: int = Field(0, description="Thời gian ước tính (phút)")
    maps_link: Optional[str] = Field(None, description="Link Google Maps")
    mode: str = Field("driving", pattern="^(driving|walking|bicycling|transit)$")