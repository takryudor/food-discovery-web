from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.models import Place, RestaurantContribution, User, UserRole
from app.schemas.admin import (
    AdminPlaceUpdate,
    AdminStatsResponse,
    ContributionAdminResponse,
    ContributionListResponse,
    ContributionReviewResponse,
)
from app.schemas.user import AdminUserResponse

DEFAULT_LAT = 10.7769
DEFAULT_LNG = 106.7009


def get_admin_stats(db: Session) -> AdminStatsResponse:
    pending = (
        db.query(func.count(RestaurantContribution.id))
        .filter(RestaurantContribution.status == "PENDING")
        .scalar()
        or 0
    )
    total_contributions = db.query(func.count(RestaurantContribution.id)).scalar() or 0
    total_places = db.query(func.count(Place.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    return AdminStatsResponse(
        pending_contributions=pending,
        total_contributions=total_contributions,
        total_places=total_places,
        total_users=total_users,
    )


def _contribution_to_admin(row: RestaurantContribution) -> ContributionAdminResponse:
    return ContributionAdminResponse(
        id=row.id,
        user_id=row.user_id,
        user_email=row.user.email if row.user else None,
        user_display_name=row.user.display_name if row.user else None,
        name=row.name,
        description=row.description,
        address=row.address,
        latitude=row.latitude,
        longitude=row.longitude,
        phone=row.phone,
        open_hours=row.open_hours,
        price_range=row.price_range,
        status=row.status,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def list_contributions(
    db: Session,
    *,
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> ContributionListResponse:
    query = db.query(RestaurantContribution).join(User, isouter=True)
    if status_filter:
        query = query.filter(RestaurantContribution.status == status_filter.upper())

    total = query.count()
    rows = (
        query.order_by(RestaurantContribution.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return ContributionListResponse(
        items=[_contribution_to_admin(row) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


def approve_contribution(db: Session, contribution_id: int) -> ContributionReviewResponse:
    contribution = db.query(RestaurantContribution).filter_by(id=contribution_id).first()
    if not contribution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CONTRIBUTION_NOT_FOUND")
    if contribution.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ALREADY_REVIEWED")

    place = Place(
        name=contribution.name,
        description=contribution.description,
        address=contribution.address,
        latitude=contribution.latitude if contribution.latitude is not None else DEFAULT_LAT,
        longitude=contribution.longitude if contribution.longitude is not None else DEFAULT_LNG,
        phone=contribution.phone,
        open_hours=contribution.open_hours,
        price_range=contribution.price_range,
    )
    db.add(place)
    contribution.status = "APPROVED"
    db.commit()
    db.refresh(contribution)
    db.refresh(place)

    return ContributionReviewResponse(
        contribution_id=contribution.id,
        status=contribution.status,
        place_id=place.id,
    )


def reject_contribution(
    db: Session,
    contribution_id: int,
    reason: str | None = None,
) -> ContributionReviewResponse:
    contribution = db.query(RestaurantContribution).filter_by(id=contribution_id).first()
    if not contribution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CONTRIBUTION_NOT_FOUND")
    if contribution.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ALREADY_REVIEWED")

    contribution.status = "REJECTED"
    db.commit()
    db.refresh(contribution)

    return ContributionReviewResponse(
        contribution_id=contribution.id,
        status=contribution.status,
        place_id=None,
    )


def list_places(
    db: Session,
    *,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    query = db.query(Place)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(Place.name.ilike(pattern), Place.address.ilike(pattern)),
        )

    total = query.count()
    rows = query.order_by(Place.id.desc()).offset(offset).limit(limit).all()
    from app.schemas.admin import AdminPlaceListResponse, AdminPlaceResponse

    return AdminPlaceListResponse(
        items=[AdminPlaceResponse.model_validate(row) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


def update_place(db: Session, place_id: int, data: AdminPlaceUpdate):
    place = db.query(Place).filter_by(id=place_id).first()
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLACE_NOT_FOUND")

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(place, key, value)

    db.commit()
    db.refresh(place)
    from app.schemas.admin import AdminPlaceResponse

    return AdminPlaceResponse.model_validate(place)


def delete_place(db: Session, place_id: int) -> None:
    place = db.query(Place).filter_by(id=place_id).first()
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PLACE_NOT_FOUND")
    db.delete(place)
    db.commit()


def list_users(
    db: Session,
    *,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    query = db.query(User)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(User.email.ilike(pattern), User.display_name.ilike(pattern)),
        )

    total = query.count()
    rows = query.order_by(User.id.desc()).offset(offset).limit(limit).all()
    from app.schemas.admin import AdminUserListResponse

    return AdminUserListResponse(
        items=[AdminUserResponse.model_validate(row) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


def update_user(db: Session, user_id: int, *, role: UserRole, display_name: str | None = None):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")

    user.role = role
    if display_name is not None:
        user.display_name = display_name

    db.commit()
    db.refresh(user)
    return AdminUserResponse.model_validate(user)
