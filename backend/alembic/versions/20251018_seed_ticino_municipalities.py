"""Seed Ticino municipalities

Revision ID: 20251018_ti_munic
Revises: 20251018_fr_munic
Create Date: 2025-10-18

Source: https://www.fiduciariamega.ch/wp-content/uploads/2024/10/FM_Moltiplicatori_2024.pdf
Canton: Ticino (TI), Municipalities: 107, NO canton multiplier
Italian-speaking canton. Municipal multipliers only: 55%-100%
"""
from alembic import op

revision = '20251018_ti_munic'
down_revision = '20251018_fr_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'TI' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('TI', 'Lugano', 0.77, 2024), ('TI', 'Bellinzona', 0.88, 2024), ('TI', 'Locarno', 0.85, 2024), ('TI', 'Mendrisio', 0.85, 2024),
        ('TI', 'Chiasso', 0.90, 2024), ('TI', 'Giubiasco', 0.88, 2024), ('TI', 'Minusio', 0.75, 2024), ('TI', 'Paradiso', 0.75, 2024),
        ('TI', 'Stabio', 0.80, 2024), ('TI', 'Caslano', 0.80, 2024), ('TI', 'Agno', 0.75, 2024), ('TI', 'Biasca', 0.90, 2024),
        ('TI', 'Castel San Pietro', 0.55, 2024), ('TI', 'Massagno', 0.75, 2024), ('TI', 'Muzzano', 0.75, 2024), ('TI', 'Pregassona', 0.75, 2024),
        ('TI', 'Arbedo-Castione', 0.90, 2024), ('TI', 'Ascona', 0.75, 2024), ('TI', 'Balerna', 0.85, 2024), ('TI', 'Bedano', 0.85, 2024),
        ('TI', 'Blenio', 1.00, 2024), ('TI', 'Bodio', 0.90, 2024), ('TI', 'Breggia', 0.85, 2024), ('TI', 'Brissago', 0.90, 2024),
        ('TI', 'Cadempino', 0.80, 2024), ('TI', 'Canobbio', 0.75, 2024), ('TI', 'Capriasca', 0.85, 2024), ('TI', 'Collina d''Oro', 0.65, 2024),
        ('TI', 'Comano', 0.75, 2024), ('TI', 'Cureglia', 0.80, 2024), ('TI', 'Faido', 0.95, 2024), ('TI', 'Gambarogno', 0.85, 2024),
        ('TI', 'Giornico', 0.95, 2024), ('TI', 'Gordola', 0.85, 2024), ('TI', 'Grono', 0.90, 2024), ('TI', 'Lamone', 0.80, 2024),
        ('TI', 'Lavertezzo', 0.95, 2024), ('TI', 'Leventina', 1.00, 2024), ('TI', 'Losone', 0.80, 2024), ('TI', 'Lumino', 0.88, 2024),
        ('TI', 'Maggia', 0.95, 2024), ('TI', 'Manno', 0.80, 2024), ('TI', 'Melano', 0.80, 2024), ('TI', 'Melide', 0.75, 2024),
        ('TI', 'Morbio Inferiore', 0.85, 2024), ('TI', 'Morcote', 0.70, 2024), ('TI', 'Muralto', 0.85, 2024), ('TI', 'Novaggio', 0.85, 2024),
        ('TI', 'Novazzano', 0.80, 2024), ('TI', 'Onsernone', 1.00, 2024), ('TI', 'Origlio', 0.85, 2024), ('TI', 'Personico', 0.95, 2024),
        ('TI', 'Pollegio', 0.90, 2024), ('TI', 'Ponte Capriasca', 0.85, 2024), ('TI', 'Ponte Tresa', 0.80, 2024), ('TI', 'Porza', 0.75, 2024),
        ('TI', 'Pura', 0.80, 2024), ('TI', 'Quinto', 1.00, 2024), ('TI', 'Riva San Vitale', 0.85, 2024), ('TI', 'Ronco sopra Ascona', 0.80, 2024),
        ('TI', 'Rovio', 0.80, 2024), ('TI', 'San Vittore', 0.90, 2024), ('TI', 'Sant''Antonino', 0.85, 2024), ('TI', 'Savosa', 0.75, 2024),
        ('TI', 'Serravalle', 0.90, 2024), ('TI', 'Sorengo', 0.75, 2024), ('TI', 'Tenero-Contra', 0.85, 2024), ('TI', 'Terre di Pedemonte', 0.95, 2024),
        ('TI', 'Torricella-Taverne', 0.85, 2024), ('TI', 'Vacallo', 0.85, 2024), ('TI', 'Vezia', 0.75, 2024), ('TI', 'Vico Morcote', 0.75, 2024),
        ('TI', 'Acquarossa', 1.00, 2024), ('TI', 'Airolo', 1.00, 2024), ('TI', 'Alto Malcantone', 0.85, 2024), ('TI', 'Astano', 0.90, 2024),
        ('TI', 'Avegno Gordevio', 0.95, 2024), ('TI', 'Bedretto', 1.00, 2024), ('TI', 'Bedigliora', 0.85, 2024), ('TI', 'Bellinzonese', 0.88, 2024),
        ('TI', 'Bignasco', 1.00, 2024), ('TI', 'Bissone', 0.75, 2024), ('TI', 'Bosco/Gurin', 1.00, 2024), ('TI', 'Brusino Arsizio', 0.80, 2024),
        ('TI', 'Cademario', 0.80, 2024), ('TI', 'Calonico', 0.95, 2024), ('TI', 'Campo (Vallemaggia)', 1.00, 2024), ('TI', 'Cavergno', 1.00, 2024),
        ('TI', 'Cevio', 0.95, 2024), ('TI', 'Claro', 0.90, 2024), ('TI', 'Coldrerio', 0.85, 2024), ('TI', 'Croglio', 0.85, 2024),
        ('TI', 'Cugnasco-Gerra', 0.85, 2024), ('TI', 'Dalpe', 1.00, 2024), ('TI', 'Fusio', 1.00, 2024), ('TI', 'Genestrerio', 0.85, 2024),
        ('TI', 'Lavizzara', 1.00, 2024), ('TI', 'Lottigna', 0.95, 2024), ('TI', 'Magliaso', 0.80, 2024), ('TI', 'Monteceneri', 0.85, 2024),
        ('TI', 'Neggio', 0.85, 2024), ('TI', 'Rivera', 0.85, 2024), ('TI', 'Vernate', 0.85, 2024), ('TI', 'Arogno', 0.75, 2024),
        ('TI', 'Barbengo', 0.75, 2024), ('TI', 'Cadenazzo', 0.88, 2024), ('TI', 'Carona', 0.70, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 107 Ticino municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'TI' AND tax_year = 2024")
    print("✓ Removed TI 2024 municipalities")
