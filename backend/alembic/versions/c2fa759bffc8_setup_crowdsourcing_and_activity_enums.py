"""setup_crowdsourcing_and_activity_enums (canonical head revision)

Revision ID: c2fa759bffc8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-19 11:11:00.066342

Schema changes live in a1b2c3d4e5f6. Some shared databases were migrated with that
revision before this file was committed; this revision keeps the chain compatible.
"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "c2fa759bffc8"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op: schema already applied in a1b2c3d4e5f6."""
    pass


def downgrade() -> None:
    """No-op: downgrade via a1b2c3d4e5f6."""
    pass
