"""seed_basel_stadt_church_tax_special_case

Revision ID: 20251021_basel_stadt
Revises: 04958a9fc8b7
Create Date: 2025-10-21 16:00:00.000000

Seed church tax configuration for Basel-Stadt (BS) canton.

SPECIAL CASE: Basel-Stadt uses a CANTONAL UNIFORM RATE system, NOT municipal multipliers.
- Church tax = 8% of simple cantonal income tax (uniform across all 3 municipalities)
- Jewish community: 12% (min CHF 100, max CHF 21,700)
- No municipal variation - this is different from most other Swiss cantons

Official source: https://www.steuerverwaltung.bs.ch/steuersystem/steuerarten/kirchensteuern.html
Legal basis:
- Steuergesetz (StG) 640.100
- Kirchengesetz (SG) 190.100

Municipalities (no church tax variation):
- Basel (BFS: 2701)
- Riehen (BFS: 2703)
- Bettingen (BFS: 2702)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251021_basel_stadt'
down_revision: Union[str, Sequence[str], None] = '20251020_133030_sg_munic_v2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed Basel-Stadt church tax configuration."""

    # 1. First, check if we need to add special_case columns to church_tax_config
    # (They may already exist, so use IF NOT EXISTS pattern via raw SQL)
    op.execute("""
        -- Add special_case flag if it doesn't exist
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'church_tax_config'
                AND column_name = 'special_case'
            ) THEN
                ALTER TABLE swisstax.church_tax_config
                ADD COLUMN special_case BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;

        -- Add cantonal_rate column for special cases like BS
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'church_tax_config'
                AND column_name = 'cantonal_rate'
            ) THEN
                ALTER TABLE swisstax.church_tax_config
                ADD COLUMN cantonal_rate NUMERIC(5,2);
            END IF;
        END $$;

        -- Add cantonal_rate_jewish for special cases like BS
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'church_tax_config'
                AND column_name = 'cantonal_rate_jewish'
            ) THEN
                ALTER TABLE swisstax.church_tax_config
                ADD COLUMN cantonal_rate_jewish NUMERIC(5,2);
            END IF;
        END $$;

        -- Add jewish_min_amount for BS jewish community minimum
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'church_tax_config'
                AND column_name = 'jewish_min_amount'
            ) THEN
                ALTER TABLE swisstax.church_tax_config
                ADD COLUMN jewish_min_amount NUMERIC(10,2);
            END IF;
        END $$;

        -- Add jewish_max_amount for BS jewish community maximum
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'swisstax'
                AND table_name = 'church_tax_config'
                AND column_name = 'jewish_max_amount'
            ) THEN
                ALTER TABLE swisstax.church_tax_config
                ADD COLUMN jewish_max_amount NUMERIC(10,2);
            END IF;
        END $$;
    """)

    # 2. Delete any existing BS records (idempotent)
    op.execute("""
        DELETE FROM swisstax.church_tax_rates WHERE canton = 'BS' AND tax_year = 2024;
        DELETE FROM swisstax.church_tax_config WHERE canton = 'BS' AND tax_year = 2024;
    """)

    # 3. Insert Basel-Stadt cantonal configuration
    op.execute("""
        INSERT INTO swisstax.church_tax_config (
            canton,
            has_church_tax,
            recognized_denominations,
            calculation_method,
            tax_year,
            special_case,
            cantonal_rate,
            cantonal_rate_jewish,
            jewish_min_amount,
            jewish_max_amount,
            notes,
            official_source
        ) VALUES (
            'BS',
            true,
            ARRAY['catholic', 'protestant', 'christian_catholic', 'jewish'],
            'cantonal_uniform',
            2024,
            true,
            8.0,
            12.0,
            100.0,
            21700.0,
            'SPECIAL CASE: Basel-Stadt uses cantonal uniform rate (8% of simple cantonal income tax), NOT municipal multipliers. Jewish community: 12% with min CHF 100, max CHF 21,700. Mixed marriages: half rate (4% or 6%). No church tax for children. Legal basis: Steuergesetz (StG) 640.100, Kirchengesetz (SG) 190.100.',
            'https://www.steuerverwaltung.bs.ch/steuersystem/steuerarten/kirchensteuern.html'
        );
    """)

    # 4. Insert cantonal-level rates (for reference - these apply uniformly to all municipalities)
    # Using municipality_id = 0 to indicate cantonal-level rate
    # NOTE: rate_percentage is stored as decimal (0.08 = 8%, 0.12 = 12%)
    op.execute("""
        INSERT INTO swisstax.church_tax_rates (
            canton,
            municipality_id,
            municipality_name,
            denomination,
            rate_percentage,
            tax_year,
            source,
            parish_name,
            official_source
        ) VALUES
        -- Cantonal-level rates (apply to all municipalities)
        -- Stored as decimal: 0.08 = 8%, 0.12 = 12%
        ('BS', 0, 'Basel-Stadt (Canton-wide)', 'catholic', 0.08, 2024, 'official_canton',
         'Römisch-katholische Kirche Basel-Stadt',
         'https://www.steuerverwaltung.bs.ch/steuersystem/steuerarten/kirchensteuern.html'),

        ('BS', 0, 'Basel-Stadt (Canton-wide)', 'protestant', 0.08, 2024, 'official_canton',
         'Evangelisch-reformierte Kirche Basel-Stadt',
         'https://www.steuerverwaltung.bs.ch/steuersystem/steuerarten/kirchensteuern.html'),

        ('BS', 0, 'Basel-Stadt (Canton-wide)', 'christian_catholic', 0.08, 2024, 'official_canton',
         'Christkatholische Kirche Basel-Stadt',
         'https://www.steuerverwaltung.bs.ch/steuersystem/steuerarten/kirchensteuern.html'),

        ('BS', 0, 'Basel-Stadt (Canton-wide)', 'jewish', 0.12, 2024, 'official_canton',
         'Israelitische Gemeinde Basel',
         'https://www.steuerverwaltung.bs.ch/steuersystem/steuerarten/kirchensteuern.html');
    """)

    print("✅ Seeded Basel-Stadt (BS) church tax configuration")
    print("   - Special case: Cantonal uniform rate (8% for Christian churches, 12% for Jewish)")
    print("   - NO municipal multipliers (different from standard Swiss cantons)")
    print("   - Tax year: 2024")
    print("   - Official source: https://www.steuerverwaltung.bs.ch/")


def downgrade() -> None:
    """Remove Basel-Stadt church tax configuration."""
    op.execute("""
        DELETE FROM swisstax.church_tax_rates WHERE canton = 'BS' AND tax_year = 2024;
        DELETE FROM swisstax.church_tax_config WHERE canton = 'BS' AND tax_year = 2024;
    """)

    # Note: We don't drop the special_case columns as other migrations may use them
    print("✅ Removed Basel-Stadt church tax configuration")
