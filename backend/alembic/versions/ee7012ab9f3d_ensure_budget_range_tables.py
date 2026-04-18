"""ensure budget_ranges + place_budget_ranges exist

Partial dev DBs (e.g. created before full initial_schema) may be missing these
tables. Place.budget_ranges uses lazy=\"selectin\" and is loaded with other
selectin collections, so search breaks if the association table is absent.

Revision ID: ee7012ab9f3d
Revises: c4a8f31b2e90
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ee7012ab9f3d"
down_revision: Union[str, Sequence[str], None] = "c4a8f31b2e90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	bind = op.get_bind()
	existing = sa.inspect(bind).get_table_names()
	if "budget_ranges" not in existing:
		op.create_table(
			"budget_ranges",
			sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
			sa.Column("name", sa.String(length=255), nullable=False),
			sa.Column("slug", sa.String(length=255), nullable=True),
			sa.PrimaryKeyConstraint("id"),
			sa.UniqueConstraint("slug"),
		)
		op.create_index(op.f("ix_budget_ranges_name"), "budget_ranges", ["name"], unique=True)
	if "place_budget_ranges" not in existing:
		op.create_table(
			"place_budget_ranges",
			sa.Column("place_id", sa.Integer(), nullable=False),
			sa.Column("budget_range_id", sa.Integer(), nullable=False),
			sa.ForeignKeyConstraint(["budget_range_id"], ["budget_ranges.id"], ondelete="CASCADE"),
			sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
			sa.PrimaryKeyConstraint("place_id", "budget_range_id"),
		)


def downgrade() -> None:
	bind = op.get_bind()
	existing = sa.inspect(bind).get_table_names()
	if "place_budget_ranges" in existing:
		op.drop_table("place_budget_ranges")
	if "budget_ranges" in existing:
		op.drop_index(op.f("ix_budget_ranges_name"), table_name="budget_ranges")
		op.drop_table("budget_ranges")
