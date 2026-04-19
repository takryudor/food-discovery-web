"""composite btree indexes on tag association tables

Thay index 1 cột trên concept_id/purpose_id/amenity_id bằng composite
(tag_id, place_id): vừa phục vụ `WHERE tag_id IN (...)`, vừa hỗ trợ
`GROUP BY place_id` + `COUNT(DISTINCT tag)` (ALL) tốt hơn, đỡ phải giữ 2 index.

Revision ID: b2c3d4e5f6a7
Revises: f8c2a1d0e4b7
Create Date: 2026-04-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "f8c2a1d0e4b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _analyze_if_postgres() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return
	for tbl in (
		"place_concepts",
		"place_purposes",
		"place_amenities",
		"places",
	):
		op.execute(sa.text(f"ANALYZE {tbl}"))
	if "place_budget_ranges" in set(sa.inspect(bind).get_table_names()):
		op.execute(sa.text("ANALYZE place_budget_ranges"))


def upgrade() -> None:
	bind = op.get_bind()
	tables = set(sa.inspect(bind).get_table_names())

	# place_concepts
	op.drop_index("ix_place_concepts_concept_id", table_name="place_concepts")
	op.create_index(
		"ix_place_concepts_concept_id_place_id",
		"place_concepts",
		["concept_id", "place_id"],
		unique=False,
	)

	# place_purposes
	op.drop_index("ix_place_purposes_purpose_id", table_name="place_purposes")
	op.create_index(
		"ix_place_purposes_purpose_id_place_id",
		"place_purposes",
		["purpose_id", "place_id"],
		unique=False,
	)

	# place_amenities
	op.drop_index("ix_place_amenities_amenity_id", table_name="place_amenities")
	op.create_index(
		"ix_place_amenities_amenity_id_place_id",
		"place_amenities",
		["amenity_id", "place_id"],
		unique=False,
	)

	if "place_budget_ranges" in tables:
		op.drop_index(
			"ix_place_budget_ranges_budget_range_id",
			table_name="place_budget_ranges",
		)
		op.create_index(
			"ix_place_budget_ranges_budget_range_id_place_id",
			"place_budget_ranges",
			["budget_range_id", "place_id"],
			unique=False,
		)

	_analyze_if_postgres()


def downgrade() -> None:
	bind = op.get_bind()
	tables = set(sa.inspect(bind).get_table_names())

	if "place_budget_ranges" in tables:
		op.drop_index(
			"ix_place_budget_ranges_budget_range_id_place_id",
			table_name="place_budget_ranges",
		)
		op.create_index(
			"ix_place_budget_ranges_budget_range_id",
			"place_budget_ranges",
			["budget_range_id"],
			unique=False,
		)

	op.drop_index("ix_place_amenities_amenity_id_place_id", table_name="place_amenities")
	op.create_index(
		"ix_place_amenities_amenity_id",
		"place_amenities",
		["amenity_id"],
		unique=False,
	)

	op.drop_index("ix_place_purposes_purpose_id_place_id", table_name="place_purposes")
	op.create_index(
		"ix_place_purposes_purpose_id",
		"place_purposes",
		["purpose_id"],
		unique=False,
	)

	op.drop_index("ix_place_concepts_concept_id_place_id", table_name="place_concepts")
	op.create_index(
		"ix_place_concepts_concept_id",
		"place_concepts",
		["concept_id"],
		unique=False,
	)
