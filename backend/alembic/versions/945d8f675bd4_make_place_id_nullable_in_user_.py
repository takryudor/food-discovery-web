"""make_place_id_nullable_in_user_activities

Revision ID: 945d8f675bd4
Revises: 3b4f1236bd1a
Create Date: 2026-05-18 15:43:05.656683

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '945d8f675bd4'
down_revision: Union[str, Sequence[str], None] = '3b4f1236bd1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('user_activities', 'place_id',
               existing_type=sa.INTEGER(),
               nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('user_activities', 'place_id',
               existing_type=sa.INTEGER(),
               nullable=False)
