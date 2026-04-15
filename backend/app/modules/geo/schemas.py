from pydantic import BaseModel, Field 
from typing import List, Optional, Tuple 

class MapMarkerRequest(BaseModel): 
    restaurant_ids: List[int] = Field(
        ..., 
        description="Danh sách ID của các quán ăn cần hiển thị trên bản đồ"
    )

class GeoJSONProperties(BaseModel): 
    id: int  
    name: str 
    avg_price: int 
    rating: float 
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
    distance_km: float
    eta_minutes: int
    maps_link: str
    mode: str