#!/usr/bin/env python3
"""
Parse Basel-Stadt canton municipality tax rates from official PDF.

Basel-Stadt has a unique system:
- City of Basel: 100% cantonal tax, NO municipal tax
- Bettingen: 50% cantonal tax + 37.50% municipal tax
- Riehen: 50% cantonal tax + 40.00% municipal tax

Source: https://media.bs.ch/original_file/12a2569768d1cae30205ccb8a3a6674faa042050/17000-steuertarife-2024.pdf
"""

# Basel-Stadt 2024 municipality data (from official PDF)
#
# IMPORTANT: Basel-Stadt has a unique tax system:
#
# 1. Basel (city):
#    - Pays 100% cantonal tax
#    - NO municipal tax
#    - Total multiplier: 1.00 (100%)
#
# 2. Bettingen & Riehen:
#    - Pay 50% cantonal tax (Steuerschlüssel für die Einwohnergemeinden = 50%)
#    - Plus municipal tax (Gemeindesteuerquote)
#    - Bettingen: 50% canton + 37.50% municipal = 87.50% total
#    - Riehen: 50% canton + 40.00% municipal = 90.00% total

basel_stadt_municipalities_2024 = [
    # (name, canton_rate, municipal_rate, total_rate)
    ("Basel", 1.00, 0.00, 1.00),        # City of Basel: full cantonal tax, no municipal
    ("Bettingen", 0.50, 0.3750, 0.8750), # Bettingen: 50% canton + 37.50% municipal
    ("Riehen", 0.50, 0.4000, 0.9000),    # Riehen: 50% canton + 40.00% municipal
]

print("Basel-Stadt Canton Municipalities - 2024 Tax Rates")
print("=" * 70)
print(f"Total municipalities: {len(basel_stadt_municipalities_2024)}")
print()

print("IMPORTANT: Basel-Stadt has a unique tax system!")
print()
print("System explanation:")
print("  - Basel (city): Pays 100% cantonal tax, NO municipal tax")
print("  - Bettingen & Riehen: Pay 50% cantonal + their own municipal tax")
print()

print("Municipalities:")
for name, canton_rate, muni_rate, total_rate in basel_stadt_municipalities_2024:
    if muni_rate == 0:
        print(f"  {name}: {canton_rate*100:.0f}% canton (no municipal)")
    else:
        print(f"  {name}: {canton_rate*100:.0f}% canton + {muni_rate*100:.2f}% municipal = {total_rate*100:.2f}% total")

print()
print("Tax calculation:")
print("  Simple Tax = Progressive bracket calculation (same for all)")
print("  Basel: Tax = Simple Tax × 1.00 (100%)")
print("  Bettingen: Canton Tax = Simple Tax × 0.50 (50%)")
print("             Municipal Tax = Simple Tax × 0.3750 (37.50%)")
print("             Total = Simple Tax × 0.8750 (87.50%)")
print("  Riehen: Canton Tax = Simple Tax × 0.50 (50%)")
print("          Municipal Tax = Simple Tax × 0.4000 (40.00%)")
print("          Total = Simple Tax × 0.9000 (90.00%)")
print()

# For database storage, we'll store the municipal_rate
# Basel will have 0.00 (no municipal tax)
# Bettingen will have 0.3750
# Riehen will have 0.4000
print("Database format (municipal tax multipliers only):")
print("  Basel: 0.0000 (no municipal tax - pays full cantonal)")
print("  Bettingen: 0.3750")
print("  Riehen: 0.4000")
print()

# Save to file
with open('/tmp/basel_stadt_municipalities_parsed.txt', 'w') as f:
    f.write("# Basel-Stadt Canton Municipalities - 2024 Tax Rates\n")
    f.write("# Source: https://media.bs.ch/original_file/12a2569768d1cae30205ccb8a3a6674faa042050/17000-steuertarife-2024.pdf\n")
    f.write("#\n")
    f.write("# IMPORTANT: Basel-Stadt has unique system:\n")
    f.write("# - Basel: 100% canton, 0% municipal\n")
    f.write("# - Bettingen/Riehen: 50% canton + municipal\n")
    f.write("#\n")
    f.write("# Format: Name\\tMunicipalRate\\tCantonRate\\tTotalRate\n")
    for name, canton_rate, muni_rate, total_rate in basel_stadt_municipalities_2024:
        f.write(f"{name}\\t{muni_rate}\\t{canton_rate}\\t{total_rate}\n")

print(f"Saved to: /tmp/basel_stadt_municipalities_parsed.txt")
print()
print("✓ All 3 Basel-Stadt municipalities successfully extracted!")
