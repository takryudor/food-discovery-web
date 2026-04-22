from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Table, Text, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


# Bảng phụ many-to-many.
# 1 địa điểm (place) có thể có nhiều concept/purpose/amenity và 1 tag cũng có thể thuộc nhiều place.
place_concepts = Table(
	"place_concepts",
	Base.metadata,
	Column("place_id", ForeignKey("places.id", ondelete="CASCADE"), primary_key=True),
	Column("concept_id", ForeignKey("concepts.id", ondelete="CASCADE"), primary_key=True),
)

place_purposes = Table(
	"place_purposes",
	Base.metadata,
	Column("place_id", ForeignKey("places.id", ondelete="CASCADE"), primary_key=True),
	Column("purpose_id", ForeignKey("purposes.id", ondelete="CASCADE"), primary_key=True),
)

place_amenities = Table(
	"place_amenities",
	Base.metadata,
	Column("place_id", ForeignKey("places.id", ondelete="CASCADE"), primary_key=True),
	Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)

place_budget_ranges = Table(
	"place_budget_ranges",
	Base.metadata,
	Column("place_id", ForeignKey("places.id", ondelete="CASCADE"), primary_key=True),
	Column("budget_range_id", ForeignKey("budget_ranges.id", ondelete="CASCADE"), primary_key=True),
)

place_dishes = Table(
	"place_dishes",
	Base.metadata,
	Column("place_id", ForeignKey("places.id", ondelete="CASCADE"), primary_key=True),
	Column("dish_id", ForeignKey("dishes.id", ondelete="CASCADE"), primary_key=True),
)


class Province(Base):
	__tablename__ = "provinces"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
	code: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)

	districts: Mapped[list[District]] = relationship(back_populates="province", cascade="all, delete-orphan")


class District(Base):
	__tablename__ = "districts"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	province_id: Mapped[int] = mapped_column(ForeignKey("provinces.id", ondelete="CASCADE"), index=True)
	name: Mapped[str] = mapped_column(String(255), index=True)
	slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
	code: Mapped[str | None] = mapped_column(String(50), nullable=True)

	province: Mapped[Province] = relationship(back_populates="districts")
	wards: Mapped[list[Ward]] = relationship(back_populates="district", cascade="all, delete-orphan")


class Ward(Base):
	__tablename__ = "wards"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	district_id: Mapped[int] = mapped_column(ForeignKey("districts.id", ondelete="CASCADE"), index=True)
	name: Mapped[str] = mapped_column(String(255), index=True)
	slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
	code: Mapped[str | None] = mapped_column(String(50), nullable=True)

	district: Mapped[District] = relationship(back_populates="wards")
	places: Mapped[list[Place]] = relationship(back_populates="ward")


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	supabase_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
	avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
	
	# Sở thích người dùng (Tag IDs, Budget profile...)
	preferences: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
	
	created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

	reviews: Mapped[list[Review]] = relationship(back_populates="user", cascade="all, delete-orphan")
	activities: Mapped[list[UserActivity]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Place(Base):
	__tablename__ = "places"

	# Các field chính phục vụ search
	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), index=True)
	# Accent-insensitive helper columns for autocomplete (maintained by DB trigger).
	name_unaccent: Mapped[str | None] = mapped_column(Text, nullable=True)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	# Full-text search vector (PostgreSQL). Maintained by DB trigger (Alembic migration).
	search_tsv: Mapped[TSVECTOR | None] = mapped_column(TSVECTOR, nullable=True)
	
	# Liên kết địa chỉ có cấu trúc
	ward_id: Mapped[int | None] = mapped_column(ForeignKey("wards.id"), nullable=True, index=True)
	address: Mapped[str | None] = mapped_column(String(512), nullable=True) # Số nhà, tên đường
	address_unaccent: Mapped[str | None] = mapped_column(Text, nullable=True)
	
	latitude: Mapped[float] = mapped_column(Float)
	longitude: Mapped[float] = mapped_column(Float)

	# Additional fields for detail view
	rating: Mapped[float | None] = mapped_column(Float, nullable=True)
	phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
	open_hours: Mapped[str | None] = mapped_column(String(100), nullable=True)
	price_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
	cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)

	# Quan hệ (dùng `selectin` để load tag hiệu quả, tránh N+1 queries)
	concepts: Mapped[list[Concept]] = relationship(
		secondary=place_concepts,
		back_populates="places",
		lazy="selectin",
	)
	purposes: Mapped[list[Purpose]] = relationship(
		secondary=place_purposes,
		back_populates="places",
		lazy="selectin",
	)
	amenities: Mapped[list[Amenity]] = relationship(
		secondary=place_amenities,
		back_populates="places",
		lazy="selectin",
	)
	budget_ranges: Mapped[list[BudgetRange]] = relationship(
		secondary=place_budget_ranges,
		back_populates="places",
		lazy="selectin",
	)
	dishes: Mapped[list[Dish]] = relationship(
		secondary=place_dishes,
		back_populates="places",
		lazy="selectin",
	)

	ward: Mapped[Ward | None] = relationship(back_populates="places")
	reviews: Mapped[list[Review]] = relationship(back_populates="place", cascade="all, delete-orphan")
	activities: Mapped[list[UserActivity]] = relationship(back_populates="place", cascade="all, delete-orphan")


class Review(Base):
	__tablename__ = "reviews"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
	place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), index=True)
	
	rating: Mapped[float] = mapped_column(Float)
	content: Mapped[str | None] = mapped_column(Text, nullable=True)
	image_urls: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
	
	created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

	user: Mapped[User] = relationship(back_populates="reviews")
	place: Mapped[Place] = relationship(back_populates="reviews")


class UserActivity(Base):
	__tablename__ = "user_activities"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
	place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), index=True)
	
	action_type: Mapped[str] = mapped_column(String(50)) # VIEW, FAVORITE, SEARCH
	timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

	user: Mapped[User] = relationship(back_populates="activities")
	place: Mapped[Place] = relationship(back_populates="activities")


class Concept(Base):
	__tablename__ = "concepts"

	# `slug` là optional, nhưng hữu ích cho frontend (URL thân thiện / định danh ổn định)
	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

	places: Mapped[list[Place]] = relationship(
		secondary=place_concepts,
		back_populates="concepts",
		lazy="selectin",
	)


class Purpose(Base):
	__tablename__ = "purposes"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

	places: Mapped[list[Place]] = relationship(
		secondary=place_purposes,
		back_populates="purposes",
		lazy="selectin",
	)


class Amenity(Base):
	__tablename__ = "amenities"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

	places: Mapped[list[Place]] = relationship(
		secondary=place_amenities,
		back_populates="amenities",
		lazy="selectin",
	)


class BudgetRange(Base):
	__tablename__ = "budget_ranges"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
	# Optional numeric range (VND). Useful for min/max budget filter.
	min_vnd: Mapped[int | None] = mapped_column(Integer, nullable=True)
	max_vnd: Mapped[int | None] = mapped_column(Integer, nullable=True)

	places: Mapped[list[Place]] = relationship(
		secondary=place_budget_ranges,
		back_populates="budget_ranges",
		lazy="selectin",
	)


class Dish(Base):
	__tablename__ = "dishes"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
	# Accent-insensitive helper column for autocomplete (maintained by DB trigger).
	name_unaccent: Mapped[str | None] = mapped_column(Text, nullable=True)
	slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

	places: Mapped[list[Place]] = relationship(
		secondary=place_dishes,
		back_populates="dishes",
		lazy="selectin",
	)

