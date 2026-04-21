"""weighted FTS for places.search_tsv (PostgreSQL)

Improve smart search ranking by weighting Place.name higher than Place.description.
This updates the trigger that maintains places.search_tsv and backfills existing rows.

Weights:
- name: A (highest)
- description: B

Revision ID: b7c8d9e0f1a2
Revises: a7b8c9d0e1f2
Create Date: 2026-04-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return

	op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS unaccent"))

	op.execute(
		sa.text(
			"""
CREATE OR REPLACE FUNCTION places_search_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
"""
		)
	)

	# Backfill existing rows
	op.execute(
		sa.text(
			"""
UPDATE places
SET search_tsv =
  setweight(to_tsvector('simple', coalesce(name,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description,'')), 'B');
"""
		)
	)

	op.execute(sa.text("ANALYZE places"))


def downgrade() -> None:
	# Revert to unweighted concat version (still valid).
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return
	op.execute(
		sa.text(
			"""
CREATE OR REPLACE FUNCTION places_search_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple', concat_ws(' ', coalesce(NEW.name,''), coalesce(NEW.description,'')));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
"""
		)
	)
	op.execute(
		sa.text(
			"UPDATE places SET search_tsv = to_tsvector('simple', concat_ws(' ', coalesce(name,''), coalesce(description,'')));"
		)
	)

