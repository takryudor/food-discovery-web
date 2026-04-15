from __future__ import annotations

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Table, Text
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


class Place(Base):
	__tablename__ = "places"

	# Các field chính phục vụ search
	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name: Mapped[str] = mapped_column(String(255), index=True)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	address: Mapped[str | None] = mapped_column(String(512), nullable=True)
	latitude: Mapped[float] = mapped_column(Float)
	longitude: Mapped[float] = mapped_column(Float)

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

