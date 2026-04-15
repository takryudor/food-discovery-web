from typing import List, Dict, Any

from app.modules.geo.schemas import (
    GeoJSONFeatureCollection,
    GeoJSONFeature,
    GeoJSONGeometry,
    GeoJSONProperties,
)


class MapService:
    """
    Service xử lý logic liên quan đến bản đồ và tọa độ hiển thị.
    """

    @staticmethod
    def create_geojson_collection(
        restaurants_data: List[Dict[str, Any]],
    ) -> GeoJSONFeatureCollection:
        """
        Tạo GeoJSON FeatureCollection từ danh sách dữ liệu quán ăn.
        
        Args:
            restaurants_data: Danh sách dữ liệu quán ăn với keys: id, lat, lng, name, avg_price, rating, (optional) is_open_now
            
        Returns:
            GeoJSONFeatureCollection: GeoJSON collection ready for map display
        """
        features = []
        for r in restaurants_data:
            geometry = GeoJSONGeometry(coordinates=(r["lng"], r["lat"]))

            properties = GeoJSONProperties(
                id=r["id"],
                name=r["name"],
                avg_price=r["avg_price"],
                rating=r["rating"],
                is_open_now=r.get("is_open_now", True),
            )

            feature = GeoJSONFeature(geometry=geometry, properties=properties)
            features.append(feature)

        return GeoJSONFeatureCollection(features=features)