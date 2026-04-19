"""merge multiple heads

Revision ID: merge_heads_fix
Revises: da64c06227ba, b2c3d4e5f6a7
Create Date: 2026-04-19 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'merge_heads_fix'
down_revision: Union[str, Sequence[str], None] = ('da64c06227ba', 'b2c3d4e5f6a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
