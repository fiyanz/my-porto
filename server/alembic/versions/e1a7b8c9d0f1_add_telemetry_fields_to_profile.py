"""add telemetry fields to profile

Revision ID: e1a7b8c9d0f1
Revises: d8f4e21a9b73
Create Date: 2026-10-19 23:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e1a7b8c9d0f1'
down_revision: Union[str, Sequence[str], None] = 'd8f4e21a9b73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('weekly_hours_fallback', sa.String(), nullable=True, server_default='38.5 hrs'))
    op.add_column('profiles', sa.Column('daily_driver', sa.String(), nullable=True, server_default='Neovim + Hyprland'))
    op.add_column('profiles', sa.Column('coding_status', sa.String(), nullable=True, server_default='Active Coding'))


def downgrade() -> None:
    op.drop_column('profiles', 'coding_status')
    op.drop_column('profiles', 'daily_driver')
    op.drop_column('profiles', 'weekly_hours_fallback')
