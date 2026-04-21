from pydantic import BaseModel
from typing import Optional

class ChatBoxRequest(BaseModel):
    message: str

class RestaurantRecommendation(BaseModel):
    name: str
    address: str
    reason: str
    restaurant_id: Optional[int] = None  # ID trong DB để sử dụng nếu cần
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ChatBoxResponse(BaseModel):
    recommendations: list[RestaurantRecommendation]
    message: Optional[str] = None  # Thông báo khi không đủ dữ liệu hoặc ngoài phạm vi
