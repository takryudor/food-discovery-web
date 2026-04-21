"""search: unaccent FTS + dish-aware ranking (PostgreSQL)

- Store unaccented text in places.search_tsv so queries without accents (e.g. "pho")
  can match Vietnamese text (e.g. "phở") via FTS.
- Keeps the existing weighted FTS (name A, description B) and just applies unaccent().

Revision ID: c1d2e3f4a5b6
Revises: b7c8d9e0f1a2
Create Date: 2026-04-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
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
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.name,''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.description,''))), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
"""
		)
	)

	op.execute(
		sa.text(
			"""
UPDATE places
SET search_tsv =
  setweight(to_tsvector('simple', unaccent(coalesce(name,''))), 'A') ||
  setweight(to_tsvector('simple', unaccent(coalesce(description,''))), 'B');
"""
		)
	)

	op.execute(sa.text("ANALYZE places"))


def downgrade() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return

	# revert to weighted, non-unaccent trigger
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

