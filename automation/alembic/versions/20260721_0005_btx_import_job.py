"""add persistent BTX import job

Revision ID: 20260721_0005
Revises: 20260721_0004
"""

from alembic import op
import sqlalchemy as sa

revision = "20260721_0005"
down_revision = "20260721_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "btx_import_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("requested_limit", sa.Integer(), nullable=False),
        sa.Column("examined", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("imported", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skipped_duplicates", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("errors_json", sa.JSON(), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("locked_by", sa.String(120), nullable=True),
        sa.Column("locked_at", sa.DateTime(), nullable=True),
        sa.Column("available_at", sa.DateTime(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_btx_import_jobs_status", "btx_import_jobs", ["status"])
    op.create_index("ix_btx_import_jobs_available_at", "btx_import_jobs", ["available_at"])


def downgrade() -> None:
    op.drop_table("btx_import_jobs")
