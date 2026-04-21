"""autocomplete: unaccent columns + trigram indexes (PostgreSQL)

Enables accent-insensitive autocomplete (e.g. 'pho' matches 'phở') and keeps it fast.

Postgres doesn't allow expression indexes using unaccent() because it's not IMMUTABLE.
So we store unaccented lowercase text in dedicated columns maintained by triggers,
and index those columns with gin_trgm_ops.

Revision ID: a7b8c9d0e1f2
Revises: f0a1b2c3d4e5
Create Date: 2026-04-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f0a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return

	# Needed for gin_trgm_ops and unaccent().
	op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
	op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS unaccent"))

	# Stored columns (text) for accent-insensitive search
	op.execute(sa.text("ALTER TABLE places ADD COLUMN IF NOT EXISTS name_unaccent text"))
	op.execute(sa.text("ALTER TABLE places ADD COLUMN IF NOT EXISTS address_unaccent text"))
	op.execute(sa.text("ALTER TABLE dishes ADD COLUMN IF NOT EXISTS name_unaccent text"))

	# Backfill
	op.execute(sa.text("UPDATE places SET name_unaccent = unaccent(lower(coalesce(name,''))) WHERE name_unaccent IS NULL"))
	op.execute(
		sa.text("UPDATE places SET address_unaccent = unaccent(lower(coalesce(address,''))) WHERE address_unaccent IS NULL")
	)
	op.execute(sa.text("UPDATE dishes SET name_unaccent = unaccent(lower(coalesce(name,''))) WHERE name_unaccent IS NULL"))

	# Triggers
	op.execute(
		sa.text(
			"""
CREATE OR REPLACE FUNCTION places_unaccent_trigger() RETURNS trigger AS $$
BEGIN
  NEW.name_unaccent := unaccent(lower(coalesce(NEW.name,'')));
  NEW.address_unaccent := unaccent(lower(coalesce(NEW.address,'')));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
"""
		)
	)
	op.execute(sa.text("DROP TRIGGER IF EXISTS trg_places_unaccent ON places"))
	op.execute(
		sa.text(
			"""
CREATE TRIGGER trg_places_unaccent
BEFORE INSERT OR UPDATE OF name, address ON places
FOR EACH ROW EXECUTE FUNCTION places_unaccent_trigger();
"""
		)
	)

	op.execute(
		sa.text(
			"""
CREATE OR REPLACE FUNCTION dishes_unaccent_trigger() RETURNS trigger AS $$
BEGIN
  NEW.name_unaccent := unaccent(lower(coalesce(NEW.name,'')));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
"""
		)
	)
	op.execute(sa.text("DROP TRIGGER IF EXISTS trg_dishes_unaccent ON dishes"))
	op.execute(
		sa.text(
			"""
CREATE TRIGGER trg_dishes_unaccent
BEFORE INSERT OR UPDATE OF name ON dishes
FOR EACH ROW EXECUTE FUNCTION dishes_unaccent_trigger();
"""
		)
	)

	# GIN trigram indexes on stored columns
	op.execute(
		sa.text(
			"CREATE INDEX IF NOT EXISTS ix_places_name_unaccent_trgm "
			"ON places USING gin (name_unaccent gin_trgm_ops)"
		)
	)
	op.execute(
		sa.text(
			"CREATE INDEX IF NOT EXISTS ix_places_address_unaccent_trgm "
			"ON places USING gin (address_unaccent gin_trgm_ops)"
		)
	)
	op.execute(
		sa.text(
			"CREATE INDEX IF NOT EXISTS ix_dishes_name_unaccent_trgm "
			"ON dishes USING gin (name_unaccent gin_trgm_ops)"
		)
	)

	op.execute(sa.text("ANALYZE places"))
	op.execute(sa.text("ANALYZE dishes"))


def downgrade() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return
	op.execute(sa.text("DROP INDEX IF EXISTS ix_dishes_name_unaccent_trgm"))
	op.execute(sa.text("DROP INDEX IF EXISTS ix_places_address_unaccent_trgm"))
	op.execute(sa.text("DROP INDEX IF EXISTS ix_places_name_unaccent_trgm"))
	op.execute(sa.text("DROP TRIGGER IF EXISTS trg_places_unaccent ON places"))
	op.execute(sa.text("DROP FUNCTION IF EXISTS places_unaccent_trigger()"))
	op.execute(sa.text("DROP TRIGGER IF EXISTS trg_dishes_unaccent ON dishes"))
	op.execute(sa.text("DROP FUNCTION IF EXISTS dishes_unaccent_trigger()"))
	op.execute(sa.text("ALTER TABLE places DROP COLUMN IF EXISTS address_unaccent"))
	op.execute(sa.text("ALTER TABLE places DROP COLUMN IF EXISTS name_unaccent"))
	op.execute(sa.text("ALTER TABLE dishes DROP COLUMN IF EXISTS name_unaccent"))

