from typing import List 
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select 

from app.modules.geo.services.map_service import MapService
from app.modules.geo.services.nav_calculator import NavCalculator
from app.modules.geo.schemas import GeoJSONFeatureCollection, RouteResponse
from app.db.models import Place 


class GeoFacade:
    """
    Facade điều phối luồng map và routing, đóng gói logic của module Geo.
    """

    def __init__(self):
        self.map_service = MapService()
        self.nav_calculator = NavCalculator()

    async def get_map_markers(
        self, 
        restaurant_ids: List[int], 
        db: Session,
        user_lat: Optional[float] = None, # Thêm vị trí user để tính ETA
        user_lng: Optional[float] = None 
    ) -> GeoJSONFeatureCollection:
        """
        Lấy thông tin nhà hàng và tính toán ETA/ Khoảng cách sơ bộ nếu có vị trí user
        """
        if not restaurant_ids:
            return GeoJSONFeatureCollection(features=[])
        
        stmt = select(Place).where(Place.id.in_(restaurant_ids))
        result = db.execute(stmt)
        restaurants = result.scalars().all()

        restaurants_data = []
        for r in restaurants: 
            # Cơ chế dung lỗi: Gán giá trị mặc định nếu DB thiếu
            item = {
                "id": r.id, 
                "lat": r.latitude or 0.0, 
                "lng": r.longtitude or 0.0, 
                "name": r.name or "Unknown", 
                "avg_price": r.price_range or "N/A", 
                "rating": r.rating or 0.0, 
                "is_open_now": True, 
                "distance": None, 
                "eta": None 
            }

                # Nếu có tọa độ user, tính toán nhanh ETA/Distance sơ bộ 
            if user_lat is not None and user_lng is not None and r.latitude and r.longtitude: 
                # Gọi Navcalculator để tính toán logic thực tế
                nav_info = await self.nav_calculator.estimate_simple_nav(
                    user_lat, user_lng, r.latitude, r.longtitude
                )
                item["distance"] = nav_info.get("distance")
                item["eta"] = nav_info.get("duration")
            restaurants_data.append(item)

        return self.map_service.create_geojson_collection(restaurants_data)

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
        Lấy tọa độ chính xác và gọi routing engine để trả về đường đi chi tiết. 
        """
        if not restaurant_id:
            raise HTTPException(status_code=400, detail="INVALID_RESTAURANT_ID")

        from app.db.models import Place
        restaurant = db.query(Place).filter(
            Place.id == restaurant_id
        ).first()

        if not restaurant:
            raise HTTPException(status_code=404, detail="RESTAURANT_NOT_FOUND")

        # Kiểm tra tọa độ trong DB 
        if restaurant.latitude is None or restaurant.longtitude is None: 
            raise HTTPException(status_code=422, detail="RESTAURANT_LOCATION_MISSING")

        # Gọi service tính toán đường đi chi tiết (ETA thực tế dựa trên bản đồ)
        return await self.nav_calculator.get_route_info(
            origin_lat=user_lat,
            origin_lng=user_lng,
            dest_lat=restaurant.latitude,
            dest_lng=restaurant.longtitude,
            mode=mode,
        )


# Instance singleton duy nhất được export ra ngoài
geo_facade = GeoFacade()