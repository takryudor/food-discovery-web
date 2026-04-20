"""geo bbox indexes for places (PostgreSQL)

Adds btree indexes on latitude/longitude to speed up bbox pre-filter before
exact Haversine distance checks.

Revision ID: e3f4a5b6c7d8
Revises: d1e2f3a4b5c6
Create Date: 2026-04-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return

	op.create_index("ix_places_latitude", "places", ["latitude"], unique=False)
	op.create_index("ix_places_longitude", "places", ["longitude"], unique=False)
	# Helpful for combined bbox filters; planner may choose either single or composite.
	op.create_index("ix_places_lat_lng", "places", ["latitude", "longitude"], unique=False)

	op.execute(sa.text("ANALYZE places"))


def downgrade() -> None:
	bind = op.get_bind()
	if bind.dialect.name != "postgresql":
		return
	op.drop_index("ix_places_lat_lng", table_name="places")
	op.drop_index("ix_places_longitude", table_name="places")
	op.drop_index("ix_places_latitude", table_name="places")

