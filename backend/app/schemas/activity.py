from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Lưới lọc đầu vào: Frontend âm thầm gửi lên loại hành động và dữ liệu đi kèm
class ActivityCreate(BaseModel):
    action_type: str  # VIEW, SEARCH, SHARE, ROUTE_REQUEST
    place_id: Optional[int] = None
    activity_metadata: Optional[Dict[str, Any]] = None  # Lưu keyword search, filter...

# Response schema — tách riêng để map đúng field `timestamp` trong DB model UserActivity
class ActivityResponse(BaseModel):
    id: int
    user_id: int
    action_type: str
    place_id: Optional[int] = None
    activity_metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime  # Tên field thật trong bảng user_activities (không phải created_at)

    class Config:
        from_attributes = True