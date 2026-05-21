from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.db.models import User
from app.db.session import get_db
from app.modules.discovery.services import admin_service
from app.schemas.admin import (
    AdminPlaceResponse,
    AdminPlaceUpdate,
    AdminStatsResponse,
    ContributionListResponse,
    ContributionRejectRequest,
    ContributionReviewResponse,
)
from app.schemas.user import AdminUserResponse, AdminUserUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def read_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return admin_service.get_admin_stats(db)


@router.get("/contributions", response_model=ContributionListResponse)
def list_admin_contributions(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return admin_service.list_contributions(
        db,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/contributions/{contribution_id}/approve",
    response_model=ContributionReviewResponse,
)
def approve_admin_contribution(
    contribution_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return admin_service.approve_contribution(db, contribution_id)


@router.post(
    "/contributions/{contribution_id}/reject",
    response_model=ContributionReviewResponse,
)
def reject_admin_contribution(
    contribution_id: int,
    body: ContributionRejectRequest | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    reason = body.reason if body else None
    return admin_service.reject_contribution(db, contribution_id, reason)


@router.get("/places")
def list_admin_places(
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return admin_service.list_places(db, search=search, limit=limit, offset=offset)


@router.patch("/places/{place_id}", response_model=AdminPlaceResponse)
def update_admin_place(
    place_id: int,
    body: AdminPlaceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return admin_service.update_place(db, place_id, body)


@router.delete("/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_place(
    place_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    admin_service.delete_place(db, place_id)


@router.get("/users")
def list_admin_users(
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return admin_service.list_users(db, search=search, limit=limit, offset=offset)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def update_admin_user(
    user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return admin_service.update_user(
        db,
        user_id,
        role=body.role,
        display_name=body.display_name,
    )
