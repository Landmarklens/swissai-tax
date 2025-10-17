#!/usr/bin/env python3
"""
Parse Zug canton municipality tax rates from official PDF.

Zug has only 11 municipalities (Einwohnergemeinden), all clearly listed in a simple table.
"""

# Manual extraction from the PDF (it's very clear and small)
# The 2024 column shows the tax rates as percentages of simple tax

zug_municipalities_2024 = [
    ("Zug", 52.11),           # With discount applied
    ("Oberägeri", 57),
    ("Unterägeri", 56),       # With discount applied
    ("Menzingen", 61),        # With discount applied
    ("Baar", 50.88),          # With discount applied
    ("Cham", 56),
    ("Hünenberg", 57),
    ("Steinhausen", 54),      # With discount applied
    ("Risch", 55),
    ("Walchwil", 53),
    ("Neuheim", 65),
]

print(f"Zug Canton Municipalities - 2024 Tax Rates")
print("=" * 50)
print(f"Total municipalities: {len(zug_municipalities_2024)}")
print()

# Canton rate
canton_rate = 82  # Canton Zug: 82% for 2024

print(f"Canton tax rate: {canton_rate}%")
print()

# Sort and display
zug_municipalities_2024.sort(key=lambda x: x[0])

print("Municipalities (sorted):")
for name, rate in zug_municipalities_2024:
    print(f"  {name}: {rate}%")

print()
print(f"Tax rate range: {min(m[1] for m in zug_municipalities_2024)}% to {max(m[1] for m in zug_municipalities_2024)}%")

# Convert to decimal format for database (divide by 100)
print("\nDatabase format (as decimals):")
for name, rate in zug_municipalities_2024:
    decimal_rate = rate / 100
    print(f"  {name}: {decimal_rate:.4f}")

# Save to file
with open('/tmp/zug_municipalities_parsed.txt', 'w') as f:
    f.write("# Zug Canton Municipalities - 2024 Tax Rates\n")
    f.write(f"# Canton rate: {canton_rate}%\n")
    f.write("# Source: https://zg.ch/dam/jcr:3286163b-1522-4b63-92cf-0aecfbd6a1e9/Steuerfuesse%202024-22.1.24.pdf\n")
    f.write("#\n")
    for name, rate in zug_municipalities_2024:
        f.write(f"{name}\t{rate}\n")

print(f"\nSaved to: /tmp/zug_municipalities_parsed.txt")
print("\n✓ All 11 Zug municipalities successfully extracted!")
