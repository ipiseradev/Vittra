"""clients active flag and gym scope

Revision ID: 0002_clients_multi_tenant_active
Revises: 0001_initial_schema
Create Date: 2026-04-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_clients_multi_tenant_active"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("clients", sa.Column("gym_id", sa.Integer(), nullable=True))
    op.add_column(
        "clients",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.add_column(
        "clients",
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_clients_gym_id", "clients", ["gym_id"], unique=False)
    op.create_index("ix_clients_is_active", "clients", ["is_active"], unique=False)

    op.drop_index("ix_clients_email", table_name="clients")
    op.create_index("ix_clients_email", "clients", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_clients_email", table_name="clients")
    op.create_index("ix_clients_email", "clients", ["email"], unique=True)
    op.drop_index("ix_clients_is_active", table_name="clients")
    op.drop_index("ix_clients_gym_id", table_name="clients")
    op.drop_column("clients", "updated_at")
    op.drop_column("clients", "is_active")
    op.drop_column("clients", "gym_id")
