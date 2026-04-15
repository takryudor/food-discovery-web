import os
import httpx
from fastapi import HTTPException
from app.modules.geo.schemas import RouteResponse

class NavCalculator:
    """
    Service xử lý định tuyến và tính toán khoảng cách / ETA.
    """
    
    def __init__(self):
        # Lấy API Key từ biến môi trường (cấu hình trong file .env)
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.base_url = "https://maps.googleapis.com/maps/api/distancematrix/json"

    async def get_route_info(self, origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, mode: str) -> RouteResponse:
        """
        Gọi Google Distance Matrix API để tính ETA và khoảng cách thực tế.
        """
        if not self.api_key:
            # Fallback logic nếu chưa có API Key khi dev local
            return self._mock_route_response(origin_lat, origin_lng, dest_lat, dest_lng, mode)

        params = {
            "origins": f"{origin_lat},{origin_lng}",
            "destinations": f"{dest_lat},{dest_lng}",
            "mode": mode,
            "key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(self.base_url, params=params)
            
            if response.status_code != 200:
                raise HTTPException(status_code=503, detail="MAPS_SERVICE_ERROR") 

            data = response.json()
            
            if data.get("status") != "OK" or not data["rows"][0]["elements"]:
                raise HTTPException(status_code=400, detail="INVALID_COORDS") 

            element = data["rows"][0]["elements"][0]
            
            # Xử lý trường hợp không tìm thấy đường đi (ví dụ: bị ngăn cách bởi đại dương)
            if element.get("status") == "ZERO_RESULTS":
                raise HTTPException(status_code=400, detail="NO_ROUTE_FOUND")

            # Google API trả về mét và giây, ta convert sang km và phút
            distance_km = round(element["distance"]["value"] / 1000, 1)
            eta_minutes = round(element["duration"]["value"] / 60)

        maps_link = self._generate_google_maps_link(origin_lat, origin_lng, dest_lat, dest_lng, mode)

        return RouteResponse(
            distance_km=distance_km,
            eta_minutes=eta_minutes,
            maps_link=maps_link,
            mode=mode
        )

    def _generate_google_maps_link(self, origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, mode: str) -> str:
        """Tạo deep link mở Google Maps."""
        return f"https://www.google.com/maps/dir/?api=1&origin={origin_lat},{origin_lng}&destination={dest_lat},{dest_lng}&travelmode={mode}"

    def _mock_route_response(self, origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, mode: str) -> RouteResponse:
        """Mock data cho môi trường dev khi chưa gắn thẻ tín dụng vào Google Cloud."""
        return RouteResponse(
            distance_km=2.5,
            eta_minutes=15,
            maps_link=self._generate_google_maps_link(origin_lat, origin_lng, dest_lat, dest_lng, mode),
            mode=mode
        )