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
        self, restaurant_ids: List[int], db: Session
    ) -> GeoJSONFeatureCollection:
        """
        Lấy thông tin nhà hàng từ DB và map sang định dạng GeoJSON.
        """
        if not restaurant_ids:
            return GeoJSONFeatureCollection(features=[])

        from app.db.models import Place
        from sqlalchemy import select

        stmt = select(Place).where(Place.id.in_(restaurant_ids))
        result = db.execute(stmt)
        restaurants = result.scalars().all()

        restaurants_data = [
            {
                "id": r.id,
                "lat": r.latitude,
                "lng": r.longitude,
                "name": r.name,
                "avg_price": r.price_range or "N/A",
                "rating": r.rating or 0.0,
                "is_open_now": True,  # TODO: Implement open/close logic if needed
            }
            for r in restaurants
        ]
        return self.map_service.create_geojson_collection(restaurants_data)

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
        """
        if not restaurant_id:
            raise HTTPException(status_code=400, detail="INVALID_RESTAURANT_ID")

        from app.db.models import Place
        restaurant = db.query(Place).filter(
            Place.id == restaurant_id
        ).first()

        if not restaurant:
            raise HTTPException(status_code=404, detail="RESTAURANT_NOT_FOUND")

        dest_lat = restaurant.latitude
        dest_lng = restaurant.longitude

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