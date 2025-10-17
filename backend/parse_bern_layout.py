#!/usr/bin/env python3
"""
Parse Bern canton municipality tax rates from layout-preserved PDF text.

The Bern PDF uses tabular format with columns:
Municipality Name | Anlage nat. Personen | Anlage jur. Personen | ... other columns

We want the "Anlage natürliche Personen" column (tax rate for natural persons).
"""

import re

# Read the layout-preserved text
with open('/tmp/bern_layout.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

municipalities = []

# Parse line by line
for line in lines:
    line = line.rstrip()
    if not line.strip():
        continue

    # Look for lines that match the pattern:
    # Municipality name (alphanumeric) followed by decimal numbers
    # Example: "Ittigen                        1.13         1.13         1.10    6 801       585"

    # Split by whitespace
    parts = line.split()

    if len(parts) < 4:
        continue

    # First part should be municipality name (could be multi-word)
    # Look for a pattern where we have: Name Number Number Number ...
    # where the first number is in range 0.50-2.50 (reasonable tax rates for Bern)

    # Try to identify where municipality name ends and numbers begin
    name_parts = []
    first_number_idx = None

    for i, part in enumerate(parts):
        # Check if this is a decimal number
        if re.match(r'^\d+\.\d+$', part):
            try:
                val = float(part)
                if 0.5 <= val <= 3.0:  # Reasonable range for tax rates
                    first_number_idx = i
                    break
            except ValueError:
                pass
        # Build municipality name
        if re.match(r'^[A-Za-zäöüÄÖÜéèêàâôûç\.\-/()]+$', part) and not part.isdigit():
            name_parts.append(part)

    if first_number_idx is None or not name_parts:
        continue

    municipality_name = ' '.join(name_parts)

    # Skip known headers
    if any(keyword in municipality_name for keyword in [
        'Gemeinden', 'Communes', 'Anzahl', 'Nombre', 'Anlage', 'Quotité',
        'Kirchensteuersatz', 'paroissi', 'Steuer', 'Personen', 'personnes',
        'Liegenschaft', 'immob', 'sowie', 'Tabellen', 'Inhalts', 'Verwaltungskreis',
        'Arrondissement', 'abteilungen', 'sections', 'physi', 'mora', 'contribu',
        'ables', 'et', 'und', 'Unter', 'impôt', 'multiplicateur', 'simple',
        'Steuer', 'provisoire', 'provisorische'
    ]):
        continue

    # Skip if name is too short or looks like data
    if len(municipality_name) < 3:
        continue

    # The first number after the name is the tax rate for natural persons
    try:
        tax_rate = float(parts[first_number_idx])
        if 0.5 <= tax_rate <= 3.0:
            municipalities.append((municipality_name, tax_rate))
    except (ValueError, IndexError):
        continue

print(f"Found {len(municipalities)} municipalities")

# Remove duplicates (keep first occurrence)
seen = set()
unique_municipalities = []
for name, rate in municipalities:
    if name not in seen:
        seen.add(name)
        unique_municipalities.append((name, rate))

municipalities = unique_municipalities
municipalities.sort(key=lambda x: x[0])

print(f"After deduplication: {len(municipalities)} unique municipalities")
print("\nFirst 10:")
for name, rate in municipalities[:10]:
    print(f"  {name}: {rate}")

print("\nLast 10:")
for name, rate in municipalities[-10:]:
    print(f"  {name}: {rate}")

# Known Bern municipalities for validation
known_municipalities = [
    ('Bern', None), ('Thun', None), ('Biel/Bienne', None), ('Interlaken', None),
    ('Burgdorf', None), ('Langenthal', None), ('Köniz', None), ('Steffisburg', None),
    ('Münsingen', None), ('Ostermundigen', None)
]

print("\nValidation - checking known municipalities:")
for known_name, _ in known_municipalities:
    found = [m for m in municipalities if m[0] == known_name]
    if found:
        print(f"  ✓ {known_name}: {found[0][1]}")
    else:
        print(f"  ✗ {known_name}: NOT FOUND")

if municipalities:
    print(f"\nTax rate range: {min(m[1] for m in municipalities):.2f} to {max(m[1] for m in municipalities):.2f}")

# Save to file
with open('/tmp/bern_municipalities_parsed.txt', 'w') as f:
    for name, rate in municipalities:
        f.write(f"{name}\t{rate}\n")

print(f"\nSaved to: /tmp/bern_municipalities_parsed.txt")
print(f"\nNote: Bern canton should have 342 municipalities.")
print(f"We found {len(municipalities)}.")

if len(municipalities) < 300:
    print("\nWARNING: Found fewer municipalities than expected.")
    print("The PDF may have subdivisions or complex formatting that needs manual review.")
