from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Lưới lọc đầu vào: Frontend âm thầm gửi lên loại hành động và dữ liệu đi kèm
class ActivityCreate(BaseModel):
    action_type: str  # VIEW, SEARCH, SHARE, ROUTE_REQUEST
    place_id: Optional[int] = None
    activity_metadata: Optional[Dict[str, Any]] = None  # Lưu keyword search, filter...

# Lưới lọc đầu ra để kiểm tra
class ActivityResponse(ActivityCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True