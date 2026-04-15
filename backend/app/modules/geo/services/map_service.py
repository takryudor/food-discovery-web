from typing import List, Dict, Any
from app.modules.geo.schemas import (
    GeoJSONFeatureCollection,
    GeoJSONFeature,
    GeoJSONGeometry,
    GeoJSONProperties
)

class MapService:
    """
    Service xử lý logic liên quan đến bản đồ và tọa độ hiển thị.
    """
    
    @staticmethod
    def create_geojson_collection(restaurants_data: List[Dict[str, Any]]) -> GeoJSONFeatureCollection:
        """
        Tạo GeoJSON FeatureCollection từ danh sách dữ liệu quán ăn.
        """
        features = []
        for r in restaurants_data:
            geometry = GeoJSONGeometry(
                coordinates=(r["lng"], r["lat"])
            )
            
            properties = GeoJSONProperties(
                id=r["id"],
                name=r["name"],
                avg_price=r["avg_price"],
                rating=r["rating"],
                is_open_now=r.get("is_open_now", True)
            )
            
            feature = GeoJSONFeature(
                geometry=geometry,
                properties=properties
            )
            features.append(feature)
            
        return GeoJSONFeatureCollection(features=features)