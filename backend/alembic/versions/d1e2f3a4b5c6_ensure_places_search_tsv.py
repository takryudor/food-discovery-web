"""ensure places.search_tsv + trigger + GIN index exist (PostgreSQL)

Some environments may have the revision marked as applied without the objects
being present (e.g. interrupted deploy or edited migration). This revision is
idempotent and re-creates the FTS column, trigger and index if missing.

Revision ID: d1e2f3a4b5c6
Revises: c9a1f2e3d4b5
Create Date: 2026-04-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c9a1f2e3d4b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return

	# Column
	op.execute(sa.text("ALTER TABLE places ADD COLUMN IF NOT EXISTS search_tsv tsvector"))

	# Backfill
	op.execute(
		sa.text(
			"UPDATE places SET search_tsv = to_tsvector('simple', concat_ws(' ', coalesce(name,''), coalesce(description,''))) "
			"WHERE search_tsv IS NULL"
		)
	)

	# Trigger function + trigger
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

	# Index
	op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_places_search_tsv_gin ON places USING gin (search_tsv)"))


def downgrade() -> None:
	# Keep downgrade minimal: do not drop the column automatically to avoid data loss.
	pass

