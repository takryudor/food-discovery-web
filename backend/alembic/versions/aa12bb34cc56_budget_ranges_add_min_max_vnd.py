"""budget_ranges add min/max vnd

Add optional numeric range columns to budget_ranges so the API can filter by
budget_min_vnd / budget_max_vnd (overlap semantics).

Revision ID: aa12bb34cc56
Revises: c1d2e3f4a5b6
Create Date: 2026-04-22

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "aa12bb34cc56"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	bind = op.get_bind()
	inspector = sa.inspect(bind)
	cols = {c["name"] for c in inspector.get_columns("budget_ranges")} if "budget_ranges" in inspector.get_table_names() else set()
	if "budget_ranges" not in inspector.get_table_names():
		return

	if "min_vnd" not in cols:
		op.add_column("budget_ranges", sa.Column("min_vnd", sa.Integer(), nullable=True))
	if "max_vnd" not in cols:
		op.add_column("budget_ranges", sa.Column("max_vnd", sa.Integer(), nullable=True))

	# Optional helpful indexes for range checks
	op.execute("CREATE INDEX IF NOT EXISTS ix_budget_ranges_min_vnd ON budget_ranges (min_vnd)")
	op.execute("CREATE INDEX IF NOT EXISTS ix_budget_ranges_max_vnd ON budget_ranges (max_vnd)")


def downgrade() -> None:
	# Keep downgrade best-effort / idempotent.
	bind = op.get_bind()
	inspector = sa.inspect(bind)
	if "budget_ranges" not in inspector.get_table_names():
		return
	cols = {c["name"] for c in inspector.get_columns("budget_ranges")}

	op.execute("DROP INDEX IF EXISTS ix_budget_ranges_max_vnd")
	op.execute("DROP INDEX IF EXISTS ix_budget_ranges_min_vnd")

	if "max_vnd" in cols:
		op.drop_column("budget_ranges", "max_vnd")
	if "min_vnd" in cols:
		op.drop_column("budget_ranges", "min_vnd")

