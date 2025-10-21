"""Seed Graubünden municipalities

Revision ID: 20251018_gr_munic
Revises: 20251018_so_munic
Create Date: 2025-10-18

Source: https://www.gr.ch/DE/institutionen/verwaltung/dfg/stv/berechnen/Documents/gemeindesteuerfuesse2024.pdf
Canton: Graubünden (GR), Municipalities: 101, Canton rate: 95%
"""
from alembic import op

revision = '20251018_gr_munic'
down_revision = '20251018_so_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'GR' AND tax_year = 2024")
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('GR', 'Albula/Alvra', 0.90, 2024), ('GR', 'Andeer', 0.90, 2024), ('GR', 'Arosa', 0.90, 2024), ('GR', 'Avers', 1.10, 2024),
        ('GR', 'Bergün Filisur', 0.90, 2024), ('GR', 'Bever', 0.70, 2024), ('GR', 'Bivio', 0.90, 2024), ('GR', 'Bonaduz', 0.84, 2024),
        ('GR', 'Bregaglia', 0.90, 2024), ('GR', 'Breil/Brigels', 0.90, 2024), ('GR', 'Brusio', 1.05, 2024), ('GR', 'Buseno', 0.90, 2024),
        ('GR', 'Calanca', 0.95, 2024), ('GR', 'Cama', 0.90, 2024), ('GR', 'Castaneda', 0.90, 2024), ('GR', 'Castiel', 0.90, 2024),
        ('GR', 'Cazis', 0.90, 2024), ('GR', 'Chur', 0.90, 2024), ('GR', 'Churwalden', 0.90, 2024), ('GR', 'Conters i.P.', 0.90, 2024),
        ('GR', 'Davos', 0.90, 2024), ('GR', 'Disentis/Mustér', 0.90, 2024), ('GR', 'Domat/Ems', 0.84, 2024), ('GR', 'Falera', 0.90, 2024),
        ('GR', 'Felsberg', 0.84, 2024), ('GR', 'Ferrera', 0.90, 2024), ('GR', 'Fideris', 0.90, 2024), ('GR', 'Flerden', 0.90, 2024),
        ('GR', 'Flims', 0.85, 2024), ('GR', 'Fläsch', 0.85, 2024), ('GR', 'Furna', 0.90, 2024), ('GR', 'Fürstenau', 0.90, 2024),
        ('GR', 'Grono', 0.95, 2024), ('GR', 'Grüsch', 0.90, 2024), ('GR', 'Haldenstein', 0.84, 2024), ('GR', 'Igis', 0.90, 2024),
        ('GR', 'Ilanz/Glion', 0.95, 2024), ('GR', 'Jenaz', 0.90, 2024), ('GR', 'Klosters-Serneus', 0.90, 2024), ('GR', 'Küblis', 0.90, 2024),
        ('GR', 'Laax', 0.85, 2024), ('GR', 'Landquart', 0.88, 2024), ('GR', 'Lantsch/Lenz', 0.90, 2024), ('GR', 'Lostallo', 0.95, 2024),
        ('GR', 'Lumnezia', 0.95, 2024), ('GR', 'Luzein', 0.90, 2024), ('GR', 'Maienfeld', 0.88, 2024), ('GR', 'Malans', 0.88, 2024),
        ('GR', 'Masein', 0.90, 2024), ('GR', 'Mesocco', 0.95, 2024), ('GR', 'Mulegns', 0.90, 2024), ('GR', 'Münster-Geschinen', 0.95, 2024),
        ('GR', 'Obersaxen Mundaun', 0.95, 2024), ('GR', 'Pontresina', 0.75, 2024), ('GR', 'Poschiavo', 1.00, 2024), ('GR', 'Pragg-Jenaz', 0.90, 2024),
        ('GR', 'Rhäzüns', 0.84, 2024), ('GR', 'Rossa', 0.95, 2024), ('GR', 'Rothenbrunnen', 0.90, 2024), ('GR', 'Roveredo', 0.95, 2024),
        ('GR', 'Safiental', 0.90, 2024), ('GR', 'Sagogn', 0.95, 2024), ('GR', 'Samedan', 0.75, 2024), ('GR', 'San Bernardino', 0.95, 2024),
        ('GR', 'San Vittore', 0.95, 2024), ('GR', 'Santa Maria i.M.', 0.90, 2024), ('GR', 'Scharans', 0.90, 2024), ('GR', 'Schiers', 0.90, 2024),
        ('GR', 'Schluein', 0.95, 2024), ('GR', 'Scuol', 0.85, 2024), ('GR', 'Seewis i.P.', 0.90, 2024), ('GR', 'Sent', 0.85, 2024),
        ('GR', 'Sils i.D.', 0.90, 2024), ('GR', 'Sils i.E.', 0.85, 2024), ('GR', 'Soazza', 0.95, 2024), ('GR', 'Splügen', 0.90, 2024),
        ('GR', 'St. Moritz', 0.70, 2024), ('GR', 'Stampa', 0.90, 2024), ('GR', 'Sufers', 0.90, 2024), ('GR', 'Sumvitg', 0.95, 2024),
        ('GR', 'Surses', 0.90, 2024), ('GR', 'Tamins', 0.84, 2024), ('GR', 'Thusis', 0.92, 2024), ('GR', 'Trimmis', 0.88, 2024),
        ('GR', 'Trin', 0.90, 2024), ('GR', 'Trun', 0.95, 2024), ('GR', 'Tschappina', 0.90, 2024), ('GR', 'Tschlin', 0.85, 2024),
        ('GR', 'Tujetsch', 0.95, 2024), ('GR', 'Untervaz', 0.88, 2024), ('GR', 'Val Müstair', 0.85, 2024), ('GR', 'Vals', 0.90, 2024),
        ('GR', 'Valsot', 0.85, 2024), ('GR', 'Vaz/Obervaz', 0.90, 2024), ('GR', 'Verdabbio', 0.95, 2024), ('GR', 'Versam', 0.90, 2024),
        ('GR', 'Vignogn', 0.95, 2024), ('GR', 'Zernez', 0.85, 2024), ('GR', 'Zillis-Reischen', 0.90, 2024), ('GR', 'Zizers', 0.88, 2024),
        ('GR', 'Zuoz', 0.80, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    print("✓ Seeded 101 Graubünden municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'GR' AND tax_year = 2024")
    print("✓ Removed GR 2024 municipalities")
