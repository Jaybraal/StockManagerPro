"""
Manual migration: Increase password_hash length to 512
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'manual_pwdhash_512'
down_revision = 'e4e7f06f878f'
branch_labels = None
depends_on = None

def upgrade():
    op.alter_column('user', 'password_hash',
        existing_type=sa.VARCHAR(length=128),
        type_=sa.VARCHAR(length=512),
        existing_nullable=True
    )

def downgrade():
    op.alter_column('user', 'password_hash',
        existing_type=sa.VARCHAR(length=512),
        type_=sa.VARCHAR(length=128),
        existing_nullable=True
    ) 