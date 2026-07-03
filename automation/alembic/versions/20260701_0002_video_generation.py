"""add video generation state

Revision ID: 20260701_0002
Revises: 20260616_0001
Create Date: 2026-07-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260701_0002"
down_revision = "20260616_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "generation_batches",
        sa.Column("video_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    with op.batch_alter_table("batik_costume_files") as batch_op:
        batch_op.add_column(sa.Column("file_video", sa.String(length=255), nullable=True))
        batch_op.create_unique_constraint("uq_batik_costume_files_file_video", ["file_video"])
    with op.batch_alter_table("generation_jobs") as batch_op:
        batch_op.add_column(sa.Column("source_costume_file_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_generation_jobs_source_costume_file_id",
            "batik_costume_files",
            ["source_costume_file_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("generation_jobs") as batch_op:
        batch_op.drop_constraint("fk_generation_jobs_source_costume_file_id", type_="foreignkey")
        batch_op.drop_column("source_costume_file_id")
    with op.batch_alter_table("batik_costume_files") as batch_op:
        batch_op.drop_constraint("uq_batik_costume_files_file_video", type_="unique")
        batch_op.drop_column("file_video")
    op.drop_column("generation_batches", "video_enabled")
