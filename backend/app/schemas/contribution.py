from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Lưới lọc đầu vào: Bắt buộc có tên quán, các thông tin khác có thể trống
class ContributionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    open_hours: Optional[str] = None
    price_range: Optional[str] = None

# Lưới lọc đầu ra: Trả về thêm ID, user_id, status và thời gian tạo từ Database
class ContributionResponse(ContributionCreate):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True