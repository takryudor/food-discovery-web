from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.modules.geo.services.map_service import MapService
from app.modules.geo.services.nav_calculator import NavCalculator
from app.modules.geo.schemas import GeoJSONFeatureCollection, RouteResponse
# Note: Bạn cần import model Restaurant thực tế từ module định nghĩa nó (thường ở core hoặc discovery)
# from app.models.restaurant import Restaurant 

class GeoFacade:
    """
    Facade điều phối luồng map và routing, đóng gói logic của module Geo.
    """
    def __init__(self):
        self.map_service = MapService()
        self.nav_calculator = NavCalculator()

    async def get_map_markers(self, restaurant_ids: List[int], db: Session) -> GeoJSONFeatureCollection:
        """
        Lấy thông tin nhà hàng từ DB và map sang định dạng GeoJSON.
        """
        if not restaurant_ids:
            return GeoJSONFeatureCollection(features=[])

        # Placeholder cho truy vấn SQLAlchemy lấy dữ liệu nhà hàng
        # stmt = select(Restaurant).where(Restaurant.id.in_(restaurant_ids))
        # result = db.execute(stmt)
        # restaurants = result.scalars().all()
        
        # Mocking data chuyển đổi thành dict để truyền vào map_service
        # (Bạn cần thay thế bằng việc parse SQLAlchemy models thực tế)
        mock_restaurants_data = [
            {"id": r_id, "lat": 10.7769, "lng": 106.6977, "name": f"Quán {r_id}", "avg_price": 50000, "rating": 4.5, "is_open_now": True}
            for r_id in restaurant_ids
        ]

        return self.map_service.create_geojson_collection(mock_restaurants_data)

    async def get_route(self, restaurant_id: int, user_lat: float, user_lng: float, mode: str, db: Session) -> RouteResponse:
        """
        Lấy tọa độ nhà hàng từ DB và tính toán lộ trình từ vị trí user.
        """
        # Placeholder cho truy vấn lấy tọa độ quán
        # restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
        # if not restaurant:
        #     raise HTTPException(status_code=404, detail="RESTAURANT_NOT_FOUND")
        
        # Mock tọa độ quán (Ví dụ tọa độ Bitexco)
        dest_lat = 10.7716
        dest_lng = 106.7044

        # Gọi service tính toán đường đi
        return await self.nav_calculator.get_route_info(
            origin_lat=user_lat, 
            origin_lng=user_lng, 
            dest_lat=dest_lat, 
            dest_lng=dest_lng, 
            mode=mode
        )

# Instance singleton duy nhất được export ra ngoài
geo_facade = GeoFacade()