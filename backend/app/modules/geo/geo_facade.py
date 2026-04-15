from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.geo.services.map_service import MapService
from app.modules.geo.services.nav_calculator import NavCalculator
from app.modules.geo.schemas import GeoJSONFeatureCollection, RouteResponse


class GeoFacade:
    """
    Facade điều phối luồng map và routing, đóng gói logic của module Geo.
    """

    def __init__(self):
        self.map_service = MapService()
        self.nav_calculator = NavCalculator()

    async def get_map_markers(
        self, restaurant_ids: List[int]
    ) -> GeoJSONFeatureCollection:
        """
        Lấy thông tin nhà hàng từ DB và map sang định dạng GeoJSON.
        
        Args:
            restaurant_ids: Danh sách ID quán ăn
            
        Returns:
            GeoJSONFeatureCollection: GeoJSON markers cho map
            
        Note:
            Cần khôi phục import Restaurant model từ app.modules.discovery.models
            khi model được định nghĩa đầy đủ.
        """
        if not restaurant_ids:
            return GeoJSONFeatureCollection(features=[])

        # TODO: Uncomment once Restaurant model is defined in app.modules.discovery.models
        # from app.modules.discovery.models import Restaurant
        # stmt = select(Restaurant).where(Restaurant.id.in_(restaurant_ids))
        # result = db.execute(stmt)
        # restaurants = result.scalars().all()
        #
        # restaurants_data = [
        #     {
        #         "id": r.id,
        #         "lat": r.latitude,
        #         "lng": r.longitude,
        #         "name": r.name,
        #         "avg_price": r.avg_price,
        #         "rating": r.rating,
        #         "is_open_now": r.is_open_now,
        #     }
        #     for r in restaurants
        # ]
        # return self.map_service.create_geojson_collection(restaurants_data)

        # Fallback: Return empty collection until Restaurant model is implemented
        return GeoJSONFeatureCollection(features=[])

    async def get_route(
        self,
        restaurant_id: int,
        user_lat: float,
        user_lng: float,
        mode: str,
        db: Session,
    ) -> RouteResponse:
        """
        Lấy tọa độ nhà hàng từ DB và tính toán lộ trình từ vị trí user.
        
        Args:
            restaurant_id: ID quán ăn
            user_lat: Vĩ độ vị trí người dùng
            user_lng: Kinh độ vị trí người dùng
            mode: Phương tiện di chuyển
            db: Database session
            
        Returns:
            RouteResponse: Thông tin lộ trình
            
        Raises:
            HTTPException: Lỗi khi quán ăn không tồn tại hoặc lỗi API
            
        Note:
            Cần khôi phục import Restaurant model từ app.modules.discovery.models
            khi model được định nghĩa đầy đủ.
        """
        # TODO: Uncomment once Restaurant model is defined in app.modules.discovery.models
        # from app.modules.discovery.models import Restaurant
        # restaurant = db.query(Restaurant).filter(
        #     Restaurant.id == restaurant_id
        # ).first()
        # if not restaurant:
        #     raise HTTPException(status_code=404, detail="RESTAURANT_NOT_FOUND")
        #
        # dest_lat = restaurant.latitude
        # dest_lng = restaurant.longitude

        if not restaurant_id:
            raise HTTPException(status_code=400, detail="INVALID_RESTAURANT_ID")

        # Temporary: Mock coordinates for Bitexco
        # TODO: Replace with real coordinates from Restaurant model
        dest_lat = 10.7716
        dest_lng = 106.7044

        # Gọi service tính toán đường đi
        return await self.nav_calculator.get_route_info(
            origin_lat=user_lat,
            origin_lng=user_lng,
            dest_lat=dest_lat,
            dest_lng=dest_lng,
            mode=mode,
        )


# Instance singleton duy nhất được export ra ngoài
geo_facade = GeoFacade()