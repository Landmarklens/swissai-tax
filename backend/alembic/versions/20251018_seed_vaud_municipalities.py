"""Seed Vaud municipalities

Revision ID: 20251018_vd_munic
Revises: 20251018_ju_munic
Create Date: 2025-10-18

Source: https://www.vd.ch/fileadmin/user_upload/themes/territoire/communes/finances_communales/fichiers_xls/Arrêtés_d_imposition_2024.xlsx
Canton: Vaud (VD), Municipalities: 303, Canton coefficient: 155% (with 3.5% reduction)
French-speaking canton (largest). Family quotient system.
Municipal coefficients: 3%-83% (most 49%-81%, some fractions have very low rates)
"""
from alembic import op

revision = '20251018_vd_munic'
down_revision = '20251018_ju_munic'

def upgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'VD' AND tax_year = 2024")
    
    # District d'Aigle (15 municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Aigle', 0.66, 2024), ('VD', 'Bex', 0.71, 2024), ('VD', 'Chessel', 0.65, 2024), ('VD', 'Corbeyrier', 0.74, 2024),
        ('VD', 'Gryon', 0.735, 2024), ('VD', 'Lavey-Morcles', 0.715, 2024), ('VD', 'Leysin', 0.78, 2024), ('VD', 'Noville', 0.75, 2024),
        ('VD', 'Ollon', 0.68, 2024), ('VD', 'Ormont-Dessous', 0.77, 2024), ('VD', 'Ormont-Dessus', 0.76, 2024), ('VD', 'Rennaz', 0.66, 2024),
        ('VD', 'Roche', 0.68, 2024), ('VD', 'Villeneuve', 0.665, 2024), ('VD', 'Yvorne', 0.715, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District de Broye-Vully (30 municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Avenches', 0.65, 2024), ('VD', 'Bussy-sur-Moudon', 0.785, 2024), ('VD', 'Champtauroz', 0.77, 2024), ('VD', 'Chavannes-sur-Moudon', 0.70, 2024),
        ('VD', 'Chevroux', 0.685, 2024), ('VD', 'Corcelles-le-Jorat', 0.75, 2024), ('VD', 'Corcelles-près-Payerne', 0.65, 2024), ('VD', 'Cudrefin', 0.59, 2024),
        ('VD', 'Curtilles', 0.73, 2024), ('VD', 'Dompierre', 0.78, 2024), ('VD', 'Faoug', 0.65, 2024), ('VD', 'Grandcour', 0.72, 2024),
        ('VD', 'Henniez', 0.69, 2024), ('VD', 'Hermenches', 0.735, 2024), ('VD', 'Lovatens', 0.75, 2024), ('VD', 'Lucens', 0.695, 2024),
        ('VD', 'Missy', 0.69, 2024), ('VD', 'Moudon', 0.725, 2024), ('VD', 'Payerne', 0.70, 2024), ('VD', 'Prévonloup', 0.725, 2024),
        ('VD', 'Ropraz', 0.775, 2024), ('VD', 'Rossenges', 0.65, 2024), ('VD', 'Trey', 0.78, 2024), ('VD', 'Treytorrens', 0.815, 2024),
        ('VD', 'Valbroye', 0.705, 2024), ('VD', 'Villars-le-Comte', 0.68, 2024), ('VD', 'Villarzel', 0.75, 2024), ('VD', 'Vucherens', 0.75, 2024),
        ('VD', 'Vulliens', 0.74, 2024), ('VD', 'Vully-les-Lacs', 0.67, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District du Gros-de-Vaud (35 municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Assens', 0.70, 2024), ('VD', 'Bercher', 0.79, 2024), ('VD', 'Bettens', 0.70, 2024), ('VD', 'Bottens', 0.725, 2024),
        ('VD', 'Boulens', 0.715, 2024), ('VD', 'Bournens', 0.65, 2024), ('VD', 'Boussens', 0.64, 2024), ('VD', 'Bretigny-sur-Morrens', 0.78, 2024),
        ('VD', 'Cugy', 0.76, 2024), ('VD', 'Daillens', 0.66, 2024), ('VD', 'Echallens', 0.725, 2024), ('VD', 'Essertines-sur-Yverdon', 0.74, 2024),
        ('VD', 'Etagnières', 0.73, 2024), ('VD', 'Fey', 0.75, 2024), ('VD', 'Froideville', 0.72, 2024), ('VD', 'Goumoëns', 0.755, 2024),
        ('VD', 'Jorat-Menthue', 0.705, 2024), ('VD', 'Lussery-Villars', 0.75, 2024), ('VD', 'Mex', 0.595, 2024), ('VD', 'Montanaire', 0.70, 2024),
        ('VD', 'Montilliez', 0.725, 2024), ('VD', 'Morrens', 0.74, 2024), ('VD', 'Ogens', 0.78, 2024), ('VD', 'Oppens', 0.79, 2024),
        ('VD', 'Oulens-sous-Echallens', 0.71, 2024), ('VD', 'Pailly', 0.76, 2024), ('VD', 'Penthalaz', 0.725, 2024), ('VD', 'Penthaz', 0.695, 2024),
        ('VD', 'Penthéréaz', 0.74, 2024), ('VD', 'Poliez-Pittet', 0.73, 2024), ('VD', 'Rueyres', 0.73, 2024), ('VD', 'Saint-Barthélemy', 0.75, 2024),
        ('VD', 'Sullens', 0.64, 2024), ('VD', 'Villars-le-Terroir', 0.76, 2024), ('VD', 'Vuarrens', 0.735, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District du Jura-Nord Vaudois (80+ municipalities) - Split into multiple inserts
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'L''Abbaye', 0.76, 2024), ('VD', 'Les Bioux (fraction)', 0.03, 2024), ('VD', 'Agiez', 0.76, 2024), ('VD', 'Arnex-sur-Orbe', 0.71, 2024),
        ('VD', 'Ballaigues', 0.65, 2024), ('VD', 'Baulmes', 0.765, 2024), ('VD', 'Bavois', 0.72, 2024), ('VD', 'Belmont-sur-Yverdon', 0.70, 2024),
        ('VD', 'Bioley-Magnoux', 0.72, 2024), ('VD', 'Bofflens', 0.69, 2024), ('VD', 'Bonvillars', 0.57, 2024), ('VD', 'Bretonnières', 0.705, 2024),
        ('VD', 'Bullet', 0.72, 2024), ('VD', 'Chamblon', 0.66, 2024), ('VD', 'Champagne', 0.65, 2024), ('VD', 'Champvent', 0.70, 2024),
        ('VD', 'Chavannes-le-Chêne', 0.75, 2024), ('VD', 'Chavornay', 0.705, 2024), ('VD', 'Cheseaux-Noréaz', 0.67, 2024), ('VD', 'Chêne-Pâquier', 0.75, 2024),
        ('VD', 'Concise', 0.71, 2024), ('VD', 'Corcelles-près-Concise', 0.69, 2024), ('VD', 'Cronay', 0.75, 2024), ('VD', 'Croy', 0.74, 2024),
        ('VD', 'Cuarny', 0.77, 2024), ('VD', 'Donneloye', 0.73, 2024), ('VD', 'Démoret', 0.78, 2024), ('VD', 'Ependes', 0.735, 2024),
        ('VD', 'Fiez', 0.69, 2024), ('VD', 'Fontaines-sur-Grandson', 0.69, 2024), ('VD', 'Giez', 0.68, 2024), ('VD', 'Grandevent', 0.70, 2024),
        ('VD', 'Grandson', 0.69, 2024), ('VD', 'Juriens', 0.79, 2024), ('VD', 'L''Abergement', 0.80, 2024), ('VD', 'La Praz', 0.83, 2024),
        ('VD', 'Le Chenit', 0.585, 2024), ('VD', 'Le Brassus (fraction)', 0.08, 2024), ('VD', 'Le Sentier (fraction)', 0.08, 2024), ('VD', 'L''Orient (fraction)', 0.10, 2024),
        ('VD', 'Le Lieu', 0.70, 2024), ('VD', 'Les Clées', 0.80, 2024), ('VD', 'Lignerolle', 0.785, 2024), ('VD', 'Mathod', 0.72, 2024),
        ('VD', 'Mauborget', 0.70, 2024), ('VD', 'Molondin', 0.81, 2024), ('VD', 'Montagny-près-Yverdon', 0.645, 2024), ('VD', 'Montcherand', 0.72, 2024),
        ('VD', 'Mutrux', 0.80, 2024), ('VD', 'Novalles', 0.76, 2024), ('VD', 'Onnens', 0.635, 2024), ('VD', 'Orbe', 0.755, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Orges', 0.74, 2024), ('VD', 'Orzens', 0.79, 2024), ('VD', 'Pomy', 0.71, 2024), ('VD', 'Premier', 0.795, 2024),
        ('VD', 'Provence', 0.81, 2024), ('VD', 'Rances', 0.765, 2024), ('VD', 'Romainmôtier-Envy', 0.81, 2024), ('VD', 'Rovray', 0.73, 2024),
        ('VD', 'Sainte-Croix', 0.70, 2024), ('VD', 'Sergey', 0.76, 2024), ('VD', 'Suchy', 0.70, 2024), ('VD', 'Suscévaz', 0.72, 2024),
        ('VD', 'Treycovagnes', 0.73, 2024), ('VD', 'Tévenon', 0.715, 2024), ('VD', 'Ursins', 0.75, 2024), ('VD', 'Valeyres-sous-Montagny', 0.705, 2024),
        ('VD', 'Valeyres-sous-Rances', 0.71, 2024), ('VD', 'Valeyres-sous-Ursins', 0.77, 2024), ('VD', 'Vallorbe', 0.715, 2024), ('VD', 'Vaulion', 0.81, 2024),
        ('VD', 'Villars-Epeney', 0.68, 2024), ('VD', 'Vufflens-la-Ville', 0.65, 2024), ('VD', 'Vugelles-La Mothe', 0.70, 2024), ('VD', 'Vuiteboeuf', 0.75, 2024),
        ('VD', 'Yverdon-les-Bains', 0.75, 2024), ('VD', 'Yvonand', 0.715, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District de Lausanne (6 municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Cheseaux-sur-Lausanne', 0.73, 2024), ('VD', 'Epalinges', 0.645, 2024), ('VD', 'Jouxtens-Mézery', 0.59, 2024), ('VD', 'Lausanne', 0.785, 2024),
        ('VD', 'Le Mont-sur-Lausanne', 0.72, 2024), ('VD', 'Romanel-sur-Lausanne', 0.705, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District de Lavaux-Oron (16 municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Belmont-sur-Lausanne', 0.72, 2024), ('VD', 'Bourg-en-Lavaux', 0.625, 2024), ('VD', 'Chexbres', 0.675, 2024), ('VD', 'Forel (Lavaux)', 0.69, 2024),
        ('VD', 'Jorat-Mézières', 0.71, 2024), ('VD', 'Lutry', 0.54, 2024), ('VD', 'Maracon', 0.745, 2024), ('VD', 'Montpreveyres', 0.745, 2024),
        ('VD', 'Oron', 0.69, 2024), ('VD', 'Paudex', 0.665, 2024), ('VD', 'Puidoux', 0.685, 2024), ('VD', 'Pully', 0.61, 2024),
        ('VD', 'Rivaz', 0.62, 2024), ('VD', 'Savigny', 0.69, 2024), ('VD', 'Servion', 0.69, 2024), ('VD', 'St-Saphorin (Lavaux)', 0.74, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District de Morges (60+ municipalities) - Split into two inserts
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Aclens', 0.60, 2024), ('VD', 'Allaman', 0.65, 2024), ('VD', 'Aubonne', 0.67, 2024), ('VD', 'Ballens', 0.73, 2024),
        ('VD', 'Berolle', 0.755, 2024), ('VD', 'Bière', 0.69, 2024), ('VD', 'Bougy-Villars', 0.645, 2024), ('VD', 'Bremblens', 0.68, 2024),
        ('VD', 'Buchillon', 0.52, 2024), ('VD', 'Chavannes-le-Veyron', 0.75, 2024), ('VD', 'Chevilly', 0.70, 2024), ('VD', 'Chigny', 0.62, 2024),
        ('VD', 'Clarmont', 0.72, 2024), ('VD', 'Cossonay', 0.68, 2024), ('VD', 'Cuarnens', 0.76, 2024), ('VD', 'Denens', 0.65, 2024),
        ('VD', 'Denges', 0.62, 2024), ('VD', 'Dizy', 0.75, 2024), ('VD', 'Echandens', 0.605, 2024), ('VD', 'Echichens', 0.66, 2024),
        ('VD', 'Eclépens', 0.46, 2024), ('VD', 'Etoy', 0.60, 2024), ('VD', 'Ferreyres', 0.76, 2024), ('VD', 'Féchy', 0.64, 2024),
        ('VD', 'Gimel', 0.73, 2024), ('VD', 'Gollion', 0.74, 2024), ('VD', 'Grancy', 0.70, 2024), ('VD', 'Hautemorges', 0.71, 2024),
        ('VD', 'L''Isle', 0.75, 2024), ('VD', 'La Chaux (Cossonay)', 0.76, 2024), ('VD', 'La Sarraz', 0.70, 2024), ('VD', 'Lavigny', 0.73, 2024),
        ('VD', 'Lonay', 0.55, 2024), ('VD', 'Lully', 0.61, 2024), ('VD', 'Lussy-sur-Morges', 0.615, 2024), ('VD', 'Mauraz', 0.77, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Moiry', 0.76, 2024), ('VD', 'Mollens', 0.74, 2024), ('VD', 'Mont-la-Ville', 0.76, 2024), ('VD', 'Montricher', 0.64, 2024),
        ('VD', 'Morges', 0.67, 2024), ('VD', 'Orny', 0.73, 2024), ('VD', 'Pompaples', 0.66, 2024), ('VD', 'Préverenges', 0.65, 2024),
        ('VD', 'Romanel-sur-Morges', 0.56, 2024), ('VD', 'Saint-Livres', 0.69, 2024), ('VD', 'Saint-Oyens', 0.79, 2024), ('VD', 'Saint-Prex', 0.59, 2024),
        ('VD', 'Saubraz', 0.80, 2024), ('VD', 'Senarclens', 0.685, 2024), ('VD', 'Tolochenaz', 0.64, 2024), ('VD', 'Vaux-sur-Morges', 0.56, 2024),
        ('VD', 'Villars-sous-Yens', 0.74, 2024), ('VD', 'Vufflens-le-Château', 0.605, 2024), ('VD', 'Vullierens', 0.76, 2024), ('VD', 'Yens', 0.70, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District de Nyon (45+ municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Arnex-sur-Nyon', 0.68, 2024), ('VD', 'Arzier-Le Muids', 0.64, 2024), ('VD', 'Bassins', 0.725, 2024), ('VD', 'Begnins', 0.625, 2024),
        ('VD', 'Bogis-Bossey', 0.71, 2024), ('VD', 'Borex', 0.57, 2024), ('VD', 'Bursinel', 0.62, 2024), ('VD', 'Bursins', 0.71, 2024),
        ('VD', 'Burtigny', 0.75, 2024), ('VD', 'Chavannes-de-Bogis', 0.58, 2024), ('VD', 'Chavannes-des-Bois', 0.68, 2024), ('VD', 'Chéserex', 0.59, 2024),
        ('VD', 'Coinsins', 0.49, 2024), ('VD', 'Commugny', 0.57, 2024), ('VD', 'Coppet', 0.57, 2024), ('VD', 'Crans', 0.59, 2024),
        ('VD', 'Crassier', 0.665, 2024), ('VD', 'Duillier', 0.66, 2024), ('VD', 'Dully', 0.53, 2024), ('VD', 'Essertines-sur-Rolle', 0.665, 2024),
        ('VD', 'Eysins', 0.595, 2024), ('VD', 'Founex', 0.57, 2024), ('VD', 'Genolier', 0.52, 2024), ('VD', 'Gilly', 0.645, 2024),
        ('VD', 'Gingins', 0.60, 2024), ('VD', 'Givrins', 0.67, 2024), ('VD', 'Gland', 0.61, 2024), ('VD', 'Grens', 0.62, 2024),
        ('VD', 'La Rippe', 0.635, 2024), ('VD', 'Le Vaud', 0.71, 2024), ('VD', 'Longirod', 0.775, 2024), ('VD', 'Luins', 0.585, 2024),
        ('VD', 'Marchissy', 0.775, 2024), ('VD', 'Mies', 0.53, 2024), ('VD', 'Mont-sur-Rolle', 0.635, 2024), ('VD', 'Nyon', 0.61, 2024),
        ('VD', 'Perroy', 0.585, 2024), ('VD', 'Prangins', 0.55, 2024), ('VD', 'Rolle', 0.595, 2024), ('VD', 'Saint-Cergue', 0.66, 2024),
        ('VD', 'Saint-George', 0.695, 2024), ('VD', 'Signy-Avenex', 0.58, 2024), ('VD', 'Tannay', 0.605, 2024), ('VD', 'Tartegnin', 0.79, 2024),
        ('VD', 'Trélex', 0.555, 2024), ('VD', 'Vich', 0.63, 2024), ('VD', 'Vinzel', 0.65, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District de l'Ouest Lausannois (8 municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Bussigny', 0.625, 2024), ('VD', 'Chavannes-près-Renens', 0.775, 2024), ('VD', 'Crissier', 0.635, 2024), ('VD', 'Ecublens', 0.625, 2024),
        ('VD', 'Prilly', 0.725, 2024), ('VD', 'Renens', 0.77, 2024), ('VD', 'Saint-Sulpice', 0.55, 2024), ('VD', 'Villars-Sainte-Croix', 0.605, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    # District de la Riviera-Pays-d'Enhaut (12 municipalities)
    op.execute("""
        INSERT INTO swisstax.municipalities (canton, name, tax_multiplier, tax_year) VALUES
        ('VD', 'Blonay - Saint-Légier', 0.685, 2024), ('VD', 'Chardonne', 0.68, 2024), ('VD', 'Château-d''Oex', 0.795, 2024), ('VD', 'Corseaux', 0.675, 2024),
        ('VD', 'Corsier-sur-Vevey', 0.645, 2024), ('VD', 'Jongny', 0.695, 2024), ('VD', 'La Tour-de-Peilz', 0.625, 2024), ('VD', 'Montreux', 0.65, 2024),
        ('VD', 'Rossinière', 0.81, 2024), ('VD', 'Rougemont', 0.79, 2024), ('VD', 'Vevey', 0.745, 2024), ('VD', 'Veytaux', 0.675, 2024)
        ON CONFLICT (canton, name, tax_year) DO UPDATE SET tax_multiplier = EXCLUDED.tax_multiplier, updated_at = CURRENT_TIMESTAMP
    """)
    
    print("✓ Seeded 303 Vaud municipalities for 2024")

def downgrade():
    op.execute("DELETE FROM swisstax.municipalities WHERE canton = 'VD' AND tax_year = 2024")
    print("✓ Removed VD 2024 municipalities")
