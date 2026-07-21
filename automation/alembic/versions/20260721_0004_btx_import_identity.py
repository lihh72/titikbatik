"""add BTX import identity

Revision ID: 20260721_0004
Revises: 20260704_0003
Create Date: 2026-07-21
"""

from alembic import op
import sqlalchemy as sa


revision = "20260721_0004"
down_revision = "20260704_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("batiks", sa.Column("source_provider", sa.String(length=32), nullable=True))
    op.add_column("batiks", sa.Column("source_id", sa.String(length=255), nullable=True))
    op.add_column("batiks", sa.Column("source_media_hash", sa.String(length=64), nullable=True))
    op.create_index("uq_batiks_source_provider_id", "batiks", ["source_provider", "source_id"], unique=True)
    op.create_index("uq_batiks_source_provider_media_hash", "batiks", ["source_provider", "source_media_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_batiks_source_provider_media_hash", table_name="batiks")
    op.drop_index("uq_batiks_source_provider_id", table_name="batiks")
    with op.batch_alter_table("batiks") as batch_op:
        batch_op.drop_column("source_media_hash")
        batch_op.drop_column("source_id")
        batch_op.drop_column("source_provider")
