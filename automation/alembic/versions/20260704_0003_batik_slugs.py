"""add permanent batik slugs

Revision ID: 20260704_0003
Revises: 20260701_0002
Create Date: 2026-07-04
"""

from alembic import op
import sqlalchemy as sa

from app.utils.slugs import deduplicate_slug, slugify_batik


revision = "20260704_0003"
down_revision = "20260701_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("batiks", sa.Column("slug", sa.String(length=255), nullable=True))

    connection = op.get_bind()
    batiks = sa.table(
        "batiks",
        sa.column("id", sa.Integer()),
        sa.column("keyword", sa.Text()),
        sa.column("slug", sa.String(length=255)),
    )
    used: set[str] = set()
    rows = connection.execute(sa.select(batiks.c.id, batiks.c.keyword).order_by(batiks.c.id)).all()
    for row in rows:
        slug = deduplicate_slug(slugify_batik(row.keyword), used)
        connection.execute(batiks.update().where(batiks.c.id == row.id).values(slug=slug))
        used.add(slug)

    with op.batch_alter_table("batiks") as batch_op:
        batch_op.alter_column("slug", existing_type=sa.String(length=255), nullable=False)
        batch_op.create_index("ix_batiks_slug", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_batiks_slug", table_name="batiks")
    with op.batch_alter_table("batiks") as batch_op:
        batch_op.drop_column("slug")
