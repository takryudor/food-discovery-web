"""Add User Review and UserActivity tables

Revision ID: c4f9a4d76202
Revises: 
Create Date: 2026-04-16 20:35:29.442109

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4f9a4d76202'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create base entity tables first.
    op.create_table(
        'places',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.String(length=512), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('open_hours', sa.String(length=100), nullable=True),
        sa.Column('price_range', sa.String(length=100), nullable=True),
        sa.Column('cover_image', sa.String(length=512), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_places_name'), 'places', ['name'], unique=False)

    op.create_table(
        'concepts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_concepts_name'), 'concepts', ['name'], unique=True)
    op.create_index(op.f('ix_concepts_slug'), 'concepts', ['slug'], unique=True)

    op.create_table(
        'purposes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_purposes_name'), 'purposes', ['name'], unique=True)
    op.create_index(op.f('ix_purposes_slug'), 'purposes', ['slug'], unique=True)

    op.create_table(
        'amenities',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_amenities_name'), 'amenities', ['name'], unique=True)
    op.create_index(op.f('ix_amenities_slug'), 'amenities', ['slug'], unique=True)

    op.create_table(
        'budget_ranges',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_budget_ranges_name'), 'budget_ranges', ['name'], unique=True)
    op.create_index(op.f('ix_budget_ranges_slug'), 'budget_ranges', ['slug'], unique=True)

    # 2. Create users table.
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('firebase_uid', sa.String(length=128), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('display_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=512), nullable=True),
        sa.Column('preferences', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_firebase_uid'), 'users', ['firebase_uid'], unique=True)

    # 3. Create association tables.
    op.create_table(
        'place_concepts',
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('concept_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['concept_id'], ['concepts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('place_id', 'concept_id')
    )

    op.create_table(
        'place_purposes',
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('purpose_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['purpose_id'], ['purposes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('place_id', 'purpose_id')
    )

    op.create_table(
        'place_amenities',
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('amenity_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['amenity_id'], ['amenities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('place_id', 'amenity_id')
    )

    op.create_table(
        'place_budget_ranges',
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('budget_range_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['budget_range_id'], ['budget_ranges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('place_id', 'budget_range_id')
    )

    # 4. Create tables that depend on users/places.
    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('image_urls', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reviews_place_id'), 'reviews', ['place_id'], unique=False)
    op.create_index(op.f('ix_reviews_user_id'), 'reviews', ['user_id'], unique=False)

    # 5. Create user activities.
    op.create_table(
        'user_activities',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_activities_place_id'), 'user_activities', ['place_id'], unique=False)
    op.create_index(op.f('ix_user_activities_user_id'), 'user_activities', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_activities_user_id'), table_name='user_activities')
    op.drop_index(op.f('ix_user_activities_place_id'), table_name='user_activities')
    op.drop_table('user_activities')

    op.drop_index(op.f('ix_reviews_user_id'), table_name='reviews')
    op.drop_index(op.f('ix_reviews_place_id'), table_name='reviews')
    op.drop_table('reviews')

    op.drop_table('place_budget_ranges')
    op.drop_table('place_amenities')
    op.drop_table('place_purposes')
    op.drop_table('place_concepts')

    op.drop_index(op.f('ix_users_firebase_uid'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_budget_ranges_slug'), table_name='budget_ranges')
    op.drop_index(op.f('ix_budget_ranges_name'), table_name='budget_ranges')
    op.drop_table('budget_ranges')

    op.drop_index(op.f('ix_amenities_slug'), table_name='amenities')
    op.drop_index(op.f('ix_amenities_name'), table_name='amenities')
    op.drop_table('amenities')

    op.drop_index(op.f('ix_purposes_slug'), table_name='purposes')
    op.drop_index(op.f('ix_purposes_name'), table_name='purposes')
    op.drop_table('purposes')

    op.drop_index(op.f('ix_concepts_slug'), table_name='concepts')
    op.drop_index(op.f('ix_concepts_name'), table_name='concepts')
    op.drop_table('concepts')

    op.drop_index(op.f('ix_places_name'), table_name='places')
    op.drop_table('places')
