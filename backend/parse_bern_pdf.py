#!/usr/bin/env python3
"""
Parse Bern canton municipality tax rates from official PDF.

The Bern PDF has a complex table structure with multiple columns.
We need to extract municipality names and their tax rates for natural persons (natürliche Personen).
"""

import re

# Read the extracted text
with open('/tmp/bern_steuerfuesse_2024.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the main data table section (after line 367 based on our grep)
# The table starts with municipality names and then has columns for different tax rates

# Split into lines
lines = content.split('\n')

# Find where the actual municipality data starts
start_idx = None
for i, line in enumerate(lines):
    if 'Aarberg' in line and i > 300:  # After the table header
        # Look backwards to find the header
        for j in range(i-1, max(0, i-50), -1):
            if 'Gemeinden' in lines[j] or 'Communes' in lines[j]:
                start_idx = i
                break
        if start_idx:
            break

if not start_idx:
    print("ERROR: Could not find municipality data start")
    exit(1)

print(f"Found municipality data starting at line {start_idx}")

# Known Bern municipalities (we'll use this to validate)
known_municipalities = [
    'Aarberg', 'Aarwangen', 'Adelboden', 'Bern', 'Biel/Bienne', 'Thun',
    'Interlaken', 'Burgdorf', 'Langenthal', 'Steffisburg'
]

# Parse the data
# The structure seems to be:
# Municipality name on one line
# Followed by tax rates on subsequent lines

municipalities = []
i = start_idx
current_muni = None

# Strategy: Look for lines that match municipality name pattern
# Then look for decimal numbers (tax rates) in the following lines

while i < len(lines) and len(municipalities) < 400:  # Bern has 342 municipalities
    line = lines[i].strip()

    # Skip empty lines
    if not line:
        i += 1
        continue

    # Check if this looks like a municipality name
    # (alphabetic characters, possibly with spaces, dots, slashes)
    if re.match(r'^[A-Za-zäöüÄÖÜéèêàâôûç\.\-\s/()]+$', line) and len(line) >= 3:
        # Could be a municipality name
        # Skip known header keywords
        if any(keyword in line for keyword in [
            'Gemeinden', 'Communes', 'Anzahl', 'Nombre', 'Anlage', 'Quotité',
            'Kirchensteuersatz', 'paroissi', 'Steuer', 'Personen', 'personnes',
            'Liegenschaft', 'immob', 'sowie', 'Tabellen', 'Inhalts'
        ]):
            i += 1
            continue

        potential_name = line

        # Look ahead for a decimal number (tax rate)
        # Tax rates in Bern are typically between 1.0 and 2.5 (as fractions of simple tax)
        found_rate = False
        for j in range(i+1, min(i+10, len(lines))):
            next_line = lines[j].strip()
            # Check if it's a decimal number in reasonable range
            if re.match(r'^\d+\.\d+$', next_line):
                try:
                    rate = float(next_line)
                    if 1.0 <= rate <= 3.0:  # Reasonable range for Bern
                        municipalities.append((potential_name, rate))
                        found_rate = True
                        i = j + 1  # Skip past the rate
                        break
                except ValueError:
                    pass

        if not found_rate:
            i += 1
    else:
        i += 1

print(f"\nFound {len(municipalities)} potential municipalities")

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

# Check if we got the known ones
print("\nValidation - checking known municipalities:")
for known in known_municipalities:
    found = [m for m in municipalities if m[0] == known]
    if found:
        print(f"  ✓ {known}: {found[0][1]}")
    else:
        print(f"  ✗ {known}: NOT FOUND")

if municipalities:
    print(f"\nTax rate range: {min(m[1] for m in municipalities):.2f} to {max(m[1] for m in municipalities):.2f}")

# Save to file
with open('/tmp/bern_municipalities_parsed.txt', 'w') as f:
    for name, rate in municipalities:
        f.write(f"{name}\t{rate}\n")

print(f"\nSaved to: /tmp/bern_municipalities_parsed.txt")
print(f"\nNote: Bern canton should have 342 municipalities.")
print(f"We found {len(municipalities)}. May need manual verification if count is off.")
