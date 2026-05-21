from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AdminStatsResponse(BaseModel):
    pending_contributions: int
    total_contributions: int
    total_places: int
    total_users: int


class ContributionAdminResponse(BaseModel):
    id: int
    user_id: int
    user_email: str | None = None
    user_display_name: str | None = None
    name: str
    description: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    open_hours: str | None = None
    price_range: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ContributionListResponse(BaseModel):
    items: list[ContributionAdminResponse]
    total: int
    limit: int
    offset: int


class ContributionRejectRequest(BaseModel):
    reason: str | None = None


class ContributionReviewResponse(BaseModel):
    contribution_id: int
    status: str
    place_id: int | None = None


class AdminPlaceResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    phone: str | None = None
    open_hours: str | None = None
    price_range: str | None = None
    cover_image: str | None = None


class AdminPlaceListResponse(BaseModel):
    items: list[AdminPlaceResponse]
    total: int
    limit: int
    offset: int


class AdminPlaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    phone: str | None = None
    open_hours: str | None = None
    price_range: str | None = None
    cover_image: str | None = None


from app.schemas.user import AdminUserResponse


class AdminUserListResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    limit: int
    offset: int
