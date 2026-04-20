"""ensure geo bbox indexes exist for places (PostgreSQL)

Some environments may miss indexes even after a revision is marked applied.
This revision uses CREATE INDEX IF NOT EXISTS for safety.

Revision ID: f0a1b2c3d4e5
Revises: e3f4a5b6c7d8
Create Date: 2026-04-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f0a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        bind = op.get_bind()
        if bind.dialect.name != "postgresql":
                return

        op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_places_latitude ON places (latitude)"))
        op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_places_longitude ON places (longitude)"))
        op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_places_lat_lng ON places (latitude, longitude)"))
        op.execute(sa.text("ANALYZE places"))


def downgrade() -> None:
        # Keep downgrade minimal (indexes can remain).
        pass