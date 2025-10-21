"""Fix wealth tax rates for UR, BE, and LU cantons

Revision ID: 20251021_fix_wealth_tax
Revises: d2437bf32c7a
Create Date: 2025-10-21

Changes:
1. Uri (UR): Correct rate from 2.500‰ to 2.300‰ (2011 tax reform rate)
2. Bern (BE): Add note that 2.400‰ is minimum floor, not standard rate
3. Lucerne (LU): Add note that thresholds are unverified

Official Sources:
- UR: https://www.ur.ch/dienstleistungen/3196 (Rate reduced in 2011 from 2.6‰ to 2.3‰)
- BE: https://www.sv.fin.be.ch/ (2.4‰ is minimum per Art. 66 StG - Vermögenssteuerbremse)
- LU: https://steuerbuch.lu.ch/band1/vermoegenssteuer/steuerfreie_betraege (Thresholds pending verification)
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '20251021_fix_wealth_tax'
down_revision = 'd2437bf32c7a'
branch_labels = None
depends_on = None


def upgrade():
    """
    Apply corrections to wealth tax data for UR, BE, and LU cantons.
    This migration is idempotent - can be run multiple times safely.
    """

    # 1. Fix Uri (UR) rate: 2.500‰ → 2.300‰
    print("Updating Uri (UR) wealth tax rate from 2.500‰ to 2.300‰...")
    op.execute("""
        UPDATE swisstax.wealth_tax_proportional
        SET
            rate_per_mille = 2.300,
            created_at = CURRENT_TIMESTAMP
        WHERE canton = 'UR'
          AND tax_year = 2024
          AND rate_per_mille = 2.500;
    """)

    # 2. Update Bern (BE) notes in thresholds table
    print("Updating Bern (BE) wealth tax notes with minimum floor warning...")
    op.execute("""
        UPDATE swisstax.wealth_tax_thresholds
        SET
            notes = 'WARNING: 2.4‰ is minimum floor per Art. 66 StG (Vermögenssteuerbremse). ' ||
                    'Actual rates per Art. 65 tariff: 0.2%-0.57% depending on wealth level. ' ||
                    'Using 2.4‰ may overestimate tax. Planned: Married threshold increase to CHF 200,000.',
            updated_at = CURRENT_TIMESTAMP
        WHERE canton = 'BE'
          AND tax_year = 2024;
    """)

    # 3. Update Lucerne (LU) notes with verification warning
    print("Updating Lucerne (LU) wealth tax notes with threshold verification warning...")
    op.execute("""
        UPDATE swisstax.wealth_tax_thresholds
        SET
            notes = 'Rate reduced from 0.875‰ to 0.750‰ in 2024. Max combined rate: 3.0‰. ' ||
                    'THRESHOLDS UNVERIFIED: CHF 80,000/160,000 pending official confirmation from § 52 StG. ' ||
                    'Based on pattern matching with similar cantons (ZH, AG). Medium confidence.',
            updated_at = CURRENT_TIMESTAMP
        WHERE canton = 'LU'
          AND tax_year = 2024;
    """)

    # Verify the changes
    print("\nVerifying changes...")
    conn = op.get_bind()

    # Check UR rate
    result_ur = conn.execute(sa.text("""
        SELECT canton, rate_per_mille
        FROM swisstax.wealth_tax_proportional
        WHERE canton = 'UR' AND tax_year = 2024
    """)).fetchone()

    if result_ur and float(result_ur[1]) == 2.300:
        print("✅ Uri (UR) rate updated successfully: 2.300‰")
    else:
        print(f"⚠️  Uri (UR) rate: {result_ur[1] if result_ur else 'NOT FOUND'}")

    # Check BE notes
    result_be = conn.execute(sa.text("""
        SELECT canton, notes
        FROM swisstax.wealth_tax_thresholds
        WHERE canton = 'BE' AND tax_year = 2024
    """)).fetchone()

    if result_be and 'WARNING' in result_be[1]:
        print("✅ Bern (BE) notes updated successfully")
    else:
        print("⚠️  Bern (BE) notes update may have failed")

    # Check LU notes
    result_lu = conn.execute(sa.text("""
        SELECT canton, notes
        FROM swisstax.wealth_tax_thresholds
        WHERE canton = 'LU' AND tax_year = 2024
    """)).fetchone()

    if result_lu and 'UNVERIFIED' in result_lu[1]:
        print("✅ Lucerne (LU) notes updated successfully")
    else:
        print("⚠️  Lucerne (LU) notes update may have failed")

    print("\nMigration completed!")


def downgrade():
    """
    Revert changes back to original values.
    """

    # Revert Uri (UR) rate: 2.300‰ → 2.500‰
    print("Reverting Uri (UR) wealth tax rate to 2.500‰...")
    op.execute("""
        UPDATE swisstax.wealth_tax_proportional
        SET
            rate_per_mille = 2.500,
            created_at = CURRENT_TIMESTAMP
        WHERE canton = 'UR'
          AND tax_year = 2024
          AND rate_per_mille = 2.300;
    """)

    # Revert Bern (BE) notes
    print("Reverting Bern (BE) notes...")
    op.execute("""
        UPDATE swisstax.wealth_tax_thresholds
        SET
            notes = 'Proportional rate 2.4‰. Per child: CHF 15K',
            updated_at = CURRENT_TIMESTAMP
        WHERE canton = 'BE'
          AND tax_year = 2024;
    """)

    # Revert Lucerne (LU) notes
    print("Reverting Lucerne (LU) notes...")
    op.execute("""
        UPDATE swisstax.wealth_tax_thresholds
        SET
            notes = 'Rate 0.75‰ (reduced from 0.875‰)',
            updated_at = CURRENT_TIMESTAMP
        WHERE canton = 'LU'
          AND tax_year = 2024;
    """)

    print("Downgrade completed!")
