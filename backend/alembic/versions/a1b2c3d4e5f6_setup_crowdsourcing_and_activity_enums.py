"""setup_crowdsourcing_and_activity_enums (canonical successor revision)

Revision ID: a1b2c3d4e5f6
Revises: a2b3c4d5e6f7
Create Date: 2026-05-19 11:00:00.000000

Schema changes live in a2b3c4d5e6f7 (legacy id) or were applied under this revision id
before the chain was split. This revision is a no-op so databases already at either
a2b3c4d5e6f7 or a1b2c3d4e5f6 can advance to head without re-applying DDL.
"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op: schema applied in a2b3c4d5e6f7 or previously under this revision id."""
    pass


def downgrade() -> None:
    """No-op: downgrade via a2b3c4d5e6f7."""
    pass
