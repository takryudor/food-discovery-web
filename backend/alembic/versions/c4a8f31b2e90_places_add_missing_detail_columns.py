"""places: add missing detail columns (rating, phone, ...)

Some dev DBs were created from older schema branches and are missing columns
that exist in models.py / initial_schema. This revision adds them idempotently.

Revision ID: c4a8f31b2e90
Revises: ef73c6a9a68b
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a8f31b2e90"
down_revision: Union[str, Sequence[str], None] = "ef73c6a9a68b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _place_columns() -> list[tuple[str, sa.Column]]:
	return [
		("rating", sa.Column("rating", sa.Float(), nullable=True)),
		("phone", sa.Column("phone", sa.String(length=50), nullable=True)),
		("open_hours", sa.Column("open_hours", sa.String(length=100), nullable=True)),
		("price_range", sa.Column("price_range", sa.String(length=100), nullable=True)),
		("cover_image", sa.Column("cover_image", sa.String(length=512), nullable=True)),
	]


def upgrade() -> None:
	bind = op.get_bind()
	insp = sa.inspect(bind)
	existing = {c["name"] for c in insp.get_columns("places")}
	for name, col in _place_columns():
		if name not in existing:
			op.add_column("places", col)


def downgrade() -> None:
	bind = op.get_bind()
	insp = sa.inspect(bind)
	existing = {c["name"] for c in insp.get_columns("places")}
	for name, _ in reversed(_place_columns()):
		if name in existing:
			op.drop_column("places", name)
