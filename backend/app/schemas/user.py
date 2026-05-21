from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.db.models import UserRole


class UserMeResponse(BaseModel):
    id: int
    email: str
    display_name: str | None = None
    avatar_url: str | None = None
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserResponse(BaseModel):
    id: int
    email: str
    display_name: str | None = None
    avatar_url: str | None = None
    role: UserRole
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    role: UserRole
    display_name: Optional[str] = None
