"""search/filter performance indexes

- Bảng liên kết many-to-many: thêm index theo cột tag (concept_id, purpose_id, …)
  để subquery `WHERE tag_id IN (...)` và GROUP BY place_id chạy nhanh hơn khi dữ liệu lớn.
- PostgreSQL: bật pg_trgm + GIN index trên places.name / places.description
  để tăng tốc `ILIKE '%query%'` (search text hiện tại).

Revision ID: f8c2a1d0e4b7
Revises: ee7012ab9f3d
Create Date: 2026-04-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f8c2a1d0e4b7"
down_revision: Union[str, Sequence[str], None] = "ee7012ab9f3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	bind = op.get_bind()
	dialect = bind.dialect.name
	tables = set(sa.inspect(bind).get_table_names())

	# --- Association tables: lookup theo tag id (pattern của search_places) ---
	op.create_index(
		"ix_place_concepts_concept_id",
		"place_concepts",
		["concept_id"],
		unique=False,
	)
	op.create_index(
		"ix_place_purposes_purpose_id",
		"place_purposes",
		["purpose_id"],
		unique=False,
	)
	op.create_index(
		"ix_place_amenities_amenity_id",
		"place_amenities",
		["amenity_id"],
		unique=False,
	)
	# Dùng khi sau này lọc budget ở DB (bảng có thể chưa có ở DB cũ / partial migrate)
	if "place_budget_ranges" in tables:
		op.create_index(
			"ix_place_budget_ranges_budget_range_id",
			"place_budget_ranges",
			["budget_range_id"],
			unique=False,
		)

	# --- PostgreSQL: trigram cho ILIKE '%...%' ---
	if dialect == "postgresql":
		op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
		op.execute(
			sa.text(
				"CREATE INDEX IF NOT EXISTS ix_places_name_trgm "
				"ON places USING gin (name gin_trgm_ops)"
			)
		)
		op.execute(
			sa.text(
				"CREATE INDEX IF NOT EXISTS ix_places_description_trgm "
				"ON places USING gin (description gin_trgm_ops)"
			)
		)


def downgrade() -> None:
	bind = op.get_bind()
	dialect = bind.dialect.name
	tables = set(sa.inspect(bind).get_table_names())

	if dialect == "postgresql":
		op.execute(sa.text("DROP INDEX IF EXISTS ix_places_description_trgm"))
		op.execute(sa.text("DROP INDEX IF EXISTS ix_places_name_trgm"))

	if "place_budget_ranges" in tables:
		op.drop_index("ix_place_budget_ranges_budget_range_id", table_name="place_budget_ranges")
	op.drop_index("ix_place_amenities_amenity_id", table_name="place_amenities")
	op.drop_index("ix_place_purposes_purpose_id", table_name="place_purposes")
	op.drop_index("ix_place_concepts_concept_id", table_name="place_concepts")
