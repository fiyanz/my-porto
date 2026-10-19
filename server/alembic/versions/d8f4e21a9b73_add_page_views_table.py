"""add page_views table

Revision ID: d8f4e21a9b73
Revises: c5a3a2ab7f42
Create Date: 2026-10-19 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd8f4e21a9b73'
down_revision: Union[str, Sequence[str], None] = 'c5a3a2ab7f42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'page_views',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('path', sa.String(length=255), nullable=False),
        sa.Column('visitor_hash', sa.String(length=64), nullable=False),
        sa.Column('referrer', sa.String(length=500), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_page_views_id'), 'page_views', ['id'], unique=False)
    op.create_index(op.f('ix_page_views_path'), 'page_views', ['path'], unique=False)
    op.create_index(op.f('ix_page_views_visitor_hash'), 'page_views', ['visitor_hash'], unique=False)
    op.create_index(op.f('ix_page_views_created_at'), 'page_views', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_page_views_created_at'), table_name='page_views')
    op.drop_index(op.f('ix_page_views_visitor_hash'), table_name='page_views')
    op.drop_index(op.f('ix_page_views_path'), table_name='page_views')
    op.drop_index(op.f('ix_page_views_id'), table_name='page_views')
    op.drop_table('page_views')
