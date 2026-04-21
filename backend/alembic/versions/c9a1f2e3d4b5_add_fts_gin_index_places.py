"""add FTS GIN index for places (PostgreSQL)

This improves smart ranking speed for full-text queries by indexing the
expression used in `_place_tsvector()`.

Revision ID: c9a1f2e3d4b5
Revises: b1cde844c734
Create Date: 2026-04-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c9a1f2e3d4b5"
down_revision: Union[str, Sequence[str], None] = "b1cde844c734"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        bind = op.get_bind()
        if bind.dialect.name != "postgresql":
                return
        # Use a stored tsvector column + trigger, because expression indexes require IMMUTABLE functions.
        op.execute(sa.text("ALTER TABLE places ADD COLUMN IF NOT EXISTS search_tsv tsvector"))
        op.execute(
                sa.text(
                        "UPDATE places SET search_tsv = to_tsvector('simple', concat_ws(' ', coalesce(name,''), coalesce(description,'')))"
                )
        )
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
        op.execute(sa.text("DROP TRIGGER IF EXISTS trg_places_search_tsv ON places"))
        op.execute(
                sa.text(
                        """
CREATE TRIGGER trg_places_search_tsv
BEFORE INSERT OR UPDATE OF name, description ON places
FOR EACH ROW EXECUTE FUNCTION places_search_tsv_trigger();
"""
                )
        )
        op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_places_search_tsv_gin ON places USING gin (search_tsv)"))


def downgrade() -> None:
        bind = op.get_bind()
        if bind.dialect.name != "postgresql":
                return
        op.execute(sa.text("DROP INDEX IF EXISTS ix_places_search_tsv_gin"))
        op.execute(sa.text("DROP TRIGGER IF EXISTS trg_places_search_tsv ON places"))
        op.execute(sa.text("DROP FUNCTION IF EXISTS places_search_tsv_trigger()"))
        op.execute(sa.text("ALTER TABLE places DROP COLUMN IF EXISTS search_tsv"))