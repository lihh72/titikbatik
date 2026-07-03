"""initial schema

Revision ID: 20260616_0001
Revises:
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "20260616_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(length=120), primary_key=True),
        sa.Column("value_json", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "costume_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("filename"),
    )
    op.create_index("ix_costume_templates_is_active", "costume_templates", ["is_active"])
    op.create_table(
        "generation_batches",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("requested_count", sa.Integer(), nullable=False),
        sa.Column("generate_count", sa.Integer(), nullable=False),
        sa.Column("combine_enabled", sa.Boolean(), nullable=False),
        sa.Column("costume_template_mode", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("queued_count", sa.Integer(), nullable=False),
        sa.Column("running_count", sa.Integer(), nullable=False),
        sa.Column("completed_count", sa.Integer(), nullable=False),
        sa.Column("failed_count", sa.Integer(), nullable=False),
        sa.Column("cancelled_count", sa.Integer(), nullable=False),
        sa.Column("requested_by", sa.String(length=120), nullable=True),
        sa.Column("settings_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_generation_batches_status", "generation_batches", ["status"])
    op.create_table(
        "wordlist_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False),
        sa.Column("selection_min", sa.Integer(), nullable=False),
        sa.Column("selection_max", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_wordlist_categories_code", "wordlist_categories", ["code"])
    op.create_table(
        "generation_jobs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("batch_id", sa.String(length=36), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("job_type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("positive_prompt", sa.Text(), nullable=True),
        sa.Column("negative_prompt", sa.Text(), nullable=True),
        sa.Column("prompt_hash", sa.String(length=64), nullable=True),
        sa.Column("seed", sa.BigInteger(), nullable=True),
        sa.Column("workflow_name", sa.String(length=80), nullable=False),
        sa.Column("comfyui_prompt_id", sa.String(length=120), nullable=True),
        sa.Column("source_batik_id", sa.Integer(), nullable=True),
        sa.Column("costume_template_id", sa.Integer(), nullable=True),
        sa.Column("input_preview_filename", sa.String(length=255), nullable=True),
        sa.Column("output_filename", sa.String(length=255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("locked_by", sa.String(length=120), nullable=True),
        sa.Column("locked_at", sa.DateTime(), nullable=True),
        sa.Column("available_at", sa.DateTime(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("settings_json", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["generation_batches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["costume_template_id"], ["costume_templates.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_batik_id"], ["batiks.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("batch_id", "sequence_number", name="uq_generation_jobs_batch_sequence"),
        sa.UniqueConstraint("output_filename"),
    )
    op.create_index("ix_generation_jobs_available_at", "generation_jobs", ["available_at"])
    op.create_index("ix_generation_jobs_batch_id", "generation_jobs", ["batch_id"])
    op.create_index("ix_generation_jobs_job_type", "generation_jobs", ["job_type"])
    op.create_index("ix_generation_jobs_prompt_hash", "generation_jobs", ["prompt_hash"])
    op.create_index("ix_generation_jobs_status", "generation_jobs", ["status"])
    op.create_table(
        "batiks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("keyword", sa.Text(), nullable=False),
        sa.Column("warna", sa.String(length=255), nullable=False),
        sa.Column("style", sa.String(length=255), nullable=False),
        sa.Column("seed", sa.BigInteger(), nullable=False),
        sa.Column("positive_prompt", sa.Text(), nullable=False),
        sa.Column("negative_prompt", sa.Text(), nullable=False),
        sa.Column("file_preview", sa.String(length=255), nullable=False),
        sa.Column("file_video", sa.String(length=255), nullable=True),
        sa.Column("prompt_hash", sa.String(length=64), nullable=False),
        sa.Column("generation_job_id", sa.String(length=36), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["generation_job_id"], ["generation_jobs.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("file_preview"),
        sa.UniqueConstraint("prompt_hash"),
    )
    op.create_index("ix_batiks_prompt_hash", "batiks", ["prompt_hash"])
    op.create_table(
        "wordlist_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["wordlist_categories.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("category_id", "value", name="uq_wordlist_items_category_value"),
    )
    op.create_index("ix_wordlist_items_category_id", "wordlist_items", ["category_id"])
    op.create_index("ix_wordlist_items_is_active", "wordlist_items", ["is_active"])
    op.create_table(
        "batik_costume_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("batik_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("template_id", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["batik_id"], ["batiks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["template_id"], ["costume_templates.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("filename"),
    )
    op.create_index("ix_batik_costume_files_batik_id", "batik_costume_files", ["batik_id"])


def downgrade() -> None:
    op.drop_index("ix_batik_costume_files_batik_id", table_name="batik_costume_files")
    op.drop_table("batik_costume_files")
    op.drop_index("ix_wordlist_items_is_active", table_name="wordlist_items")
    op.drop_index("ix_wordlist_items_category_id", table_name="wordlist_items")
    op.drop_table("wordlist_items")
    op.drop_index("ix_batiks_prompt_hash", table_name="batiks")
    op.drop_table("batiks")
    op.drop_index("ix_generation_jobs_status", table_name="generation_jobs")
    op.drop_index("ix_generation_jobs_prompt_hash", table_name="generation_jobs")
    op.drop_index("ix_generation_jobs_job_type", table_name="generation_jobs")
    op.drop_index("ix_generation_jobs_batch_id", table_name="generation_jobs")
    op.drop_index("ix_generation_jobs_available_at", table_name="generation_jobs")
    op.drop_table("generation_jobs")
    op.drop_index("ix_wordlist_categories_code", table_name="wordlist_categories")
    op.drop_table("wordlist_categories")
    op.drop_index("ix_generation_batches_status", table_name="generation_batches")
    op.drop_table("generation_batches")
    op.drop_index("ix_costume_templates_is_active", table_name="costume_templates")
    op.drop_table("costume_templates")
    op.drop_table("app_settings")
