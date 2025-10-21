#!/usr/bin/env python3
"""
Generate consolidated migration SQL for 6 cantons with complete official church tax data:
AR, GR, JU, ZG, SH, TG
"""

import json
from pathlib import Path
from datetime import datetime

# Canton files to process (official data only)
CANTON_FILES = {
    'AR': 'church_tax_ar_municipalities.json',
    'GR': 'church_tax_gr_municipalities.json',
    'JU': 'church_tax_ju_municipalities.json',
    'ZG': 'church_tax_zg_municipalities.json',
    'SH': 'church_tax_sh_municipalities.json',
    'TG': 'church_tax_tg_municipalities.json',
}

def load_json_file(filepath: Path):
    """Load and return JSON data from file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_ar_sql(data):
    """Generate SQL for Appenzell Ausserrhoden (AR)."""
    sql_lines = []
    canton = data['canton']
    tax_year = data['tax_year']
    source = data.get('official_source', 'Official canton document')

    for muni in data['municipalities']:
        bfs = muni['bfs_number']
        name = muni['municipality_name'].replace("'", "''")
        rates = muni['rates']

        # AR has both reformed and catholic
        if 'reformed' in rates and rates['reformed'] is not None:
            rate = rates['reformed'] / 100  # Convert percentage to decimal
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'protestant', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

        if 'catholic' in rates and rates['catholic'] is not None:
            rate = rates['catholic'] / 100  # Convert percentage to decimal
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'catholic', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

    return sql_lines

def generate_gr_sql(data):
    """Generate SQL for Graubünden (GR) - handles special two-component system."""
    sql_lines = []
    canton = data['canton']
    tax_year = data['tax_year']
    source = data.get('official_source', 'Official canton document')

    for muni in data['municipalities']:
        bfs = muni['bfs_number']
        name = muni['municipality_name'].replace("'", "''")
        rates = muni['rates']

        # GR Reformed has two-component system (local + equalization)
        if 'reformed_total' in rates and rates['reformed_total'] is not None:
            rate = rates['reformed_total'] / 100  # Use total rate
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'protestant', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

        if 'catholic' in rates and rates['catholic'] is not None:
            rate = rates['catholic'] / 100
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'catholic', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

    return sql_lines

def generate_ju_sql(data):
    """Generate SQL for Jura (JU)."""
    sql_lines = []
    canton = data['canton']
    tax_year = data['tax_year']
    source = data.get('official_source', 'Official canton document')

    for muni in data['municipalities']:
        bfs = muni['bfs_number']
        name = muni['municipality_name'].replace("'", "''")
        rates = muni['rates']

        if 'reformed' in rates and rates['reformed'] is not None:
            rate = rates['reformed'] / 100
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'protestant', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

        if 'catholic' in rates and rates['catholic'] is not None:
            rate = rates['catholic'] / 100
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'catholic', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

    return sql_lines

def generate_zg_sh_sql(data):
    """Generate SQL for Zug and Schaffhausen (array format)."""
    sql_lines = []

    # Handle array format
    municipalities = data if isinstance(data, list) else []

    for muni in municipalities:
        canton = muni.get('canton')
        bfs = muni.get('bfs_number') or muni.get('municipality_id')
        name = muni.get('municipality_name', '').replace("'", "''")
        tax_year = muni.get('tax_year', 2024)
        source = muni.get('source', 'Official canton document')
        rates = muni.get('rates', {})

        if 'reformed' in rates and rates['reformed'] is not None:
            rate = rates['reformed'] / 100 if rates['reformed'] > 1 else rates['reformed']
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'protestant', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

        if 'catholic' in rates and rates['catholic'] is not None:
            rate = rates['catholic'] / 100 if rates['catholic'] > 1 else rates['catholic']
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'catholic', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

    return sql_lines

def generate_tg_sql(data):
    """Generate SQL for Thurgau (object format)."""
    sql_lines = []
    canton = data['canton']
    tax_year = data.get('tax_year', 2024)
    source = data.get('official_source', 'Official canton document')

    for muni in data.get('municipalities', []):
        bfs = muni['bfs_number']
        name = muni['municipality_name'].replace("'", "''")
        rates = muni.get('rates', {})

        if 'reformed' in rates and rates['reformed'] is not None:
            rate = rates['reformed'] / 100 if rates['reformed'] > 1 else rates['reformed']
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'protestant', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

        if 'catholic' in rates and rates['catholic'] is not None:
            rate = rates['catholic'] / 100 if rates['catholic'] > 1 else rates['catholic']
            sql_lines.append(
                f"    ('{canton}', {bfs}, '{name}', 'catholic', {rate:.4f}, {tax_year}, "
                f"'official_canton', '{source}', now())"
            )

    return sql_lines

def main():
    backend_dir = Path(__file__).parent

    all_sql_lines = []
    stats = {}

    for canton_code, filename in CANTON_FILES.items():
        filepath = backend_dir / filename

        if not filepath.exists():
            print(f"⚠️  File not found: {filename}")
            continue

        print(f"Processing {canton_code} from {filename}...")
        data = load_json_file(filepath)

        # Generate SQL based on canton
        if canton_code == 'AR':
            sql_lines = generate_ar_sql(data)
        elif canton_code == 'GR':
            sql_lines = generate_gr_sql(data)
        elif canton_code == 'JU':
            sql_lines = generate_ju_sql(data)
        elif canton_code in ['ZG', 'SH']:
            sql_lines = generate_zg_sh_sql(data)
        elif canton_code == 'TG':
            sql_lines = generate_tg_sql(data)
        else:
            print(f"⚠️  Unknown canton: {canton_code}")
            continue

        all_sql_lines.extend(sql_lines)
        stats[canton_code] = len(sql_lines)
        print(f"  ✓ Generated {len(sql_lines)} rows for {canton_code}")

    # Create full SQL statement
    full_sql = f"""-- Consolidated church tax data migration for 6 cantons
-- Generated: {datetime.now().isoformat()}
-- Cantons: AR (20), GR (97), JU (52), ZG (11), SH (26), TG (80)
-- Total: {len(all_sql_lines)} rows

DELETE FROM swisstax.church_tax_rates
WHERE canton IN ('AR', 'GR', 'JU', 'ZG', 'SH', 'TG')
  AND tax_year IN (2024, 2025);

INSERT INTO swisstax.church_tax_rates
(canton, municipality_id, municipality_name, denomination, rate_percentage, tax_year, source, official_source, created_at)
VALUES
{',\n'.join(all_sql_lines)};
"""

    # Write to file
    output_file = backend_dir / '6cantons_consolidated_migration_sql.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_sql)

    print(f"\n✅ Generated migration SQL:")
    print(f"   Output: {output_file}")
    print(f"   Total rows: {len(all_sql_lines)}")
    print(f"\n📊 Breakdown by canton:")
    for canton, count in stats.items():
        print(f"   {canton}: {count} rows")

if __name__ == '__main__':
    main()
