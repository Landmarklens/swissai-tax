#!/usr/bin/env python3
"""
Parse Zug canton tax brackets from official Grundtarif PDF.

Source: https://zg.ch/dam/jcr:e15fc182-a10a-4883-947d-619aea90265b/Grundtarif%20ab%202001-2025-28.11.24.pdf
"""

from decimal import Decimal

# Extract the 2024 income tax brackets for "Grundtarif" (single/basic tariff)
# Lines 49-66 in the PDF contain the 2024 data

zug_income_brackets_2024 = [
    # (rate, step, cumulative_income, tax_for_step, cumulative_tax)
    (Decimal('0.0050'), 1100, 1100, Decimal('5.50'), Decimal('5.50')),
    (Decimal('0.0100'), 2200, 3300, Decimal('22.00'), Decimal('27.50')),
    (Decimal('0.0200'), 2800, 6100, Decimal('56.00'), Decimal('83.50')),
    (Decimal('0.0300'), 3900, 10000, Decimal('117.00'), Decimal('200.50')),
    (Decimal('0.0325'), 5100, 15100, Decimal('165.75'), Decimal('366.25')),
    (Decimal('0.0350'), 5700, 20800, Decimal('199.50'), Decimal('565.75')),
    (Decimal('0.0400'), 5700, 26500, Decimal('228.00'), Decimal('793.75')),
    (Decimal('0.0450'), 7900, 34400, Decimal('355.50'), Decimal('1149.25')),
    (Decimal('0.0550'), 11300, 45700, Decimal('621.50'), Decimal('1770.75')),
    (Decimal('0.0550'), 13100, 58800, Decimal('720.50'), Decimal('2491.25')),
    (Decimal('0.0650'), 14800, 73600, Decimal('962.00'), Decimal('3453.25')),
    (Decimal('0.0800'), 19800, 93400, Decimal('1584.00'), Decimal('5037.25')),
    (Decimal('0.1000'), 24900, 118300, Decimal('2490.00'), Decimal('7527.25')),
    (Decimal('0.0900'), 29400, 147700, Decimal('2646.00'), Decimal('10173.25')),
    (Decimal('0.0800'), None, None, None, None),  # 8.00% over 147,700
]

print("Zug Canton 2024 Income Tax Brackets (Grundtarif - Single)")
print("=" * 70)
print()
print("Progressive brackets:")
for i, (rate, step, cum_income, tax_step, cum_tax) in enumerate(zug_income_brackets_2024):
    if step is None:
        print(f"{i+1}. {rate*100:.2f}% over CHF {zug_income_brackets_2024[i-1][2]:,}")
    else:
        print(f"{i+1}. {rate*100:.2f}% for the {'first' if i == 0 else 'next'} CHF {step:,} (cumulative: CHF {cum_income:,})")

print()
print("Canton multiplier: 82%")
print()

# Convert to the format we use in our calculators
# We need: (max_income, rate) for each bracket
brackets_for_calculator = []
prev_cum_income = 0

for i, (rate, step, cum_income, tax_step, cum_tax) in enumerate(zug_income_brackets_2024[:-1]):
    brackets_for_calculator.append({
        'min': prev_cum_income,
        'max': cum_income,
        'rate': float(rate),
        'cumulative_tax': float(cum_tax) if cum_tax else 0.0
    })
    prev_cum_income = cum_income

# Add the final bracket (over 147,700 at 8%)
brackets_for_calculator.append({
    'min': 147700,
    'max': float('inf'),
    'rate': 0.08,
    'cumulative_tax': float(zug_income_brackets_2024[-2][4])  # 10,173.25
})

print("\nBrackets in calculator format:")
for b in brackets_for_calculator:
    if b['max'] == float('inf'):
        print(f"  Over CHF {b['min']:,}: {b['rate']*100:.2f}%")
    else:
        print(f"  CHF {b['min']:,} - {b['max']:,}: {b['rate']*100:.2f}%")

print()
print("Validation - Test with CHF 100,000 income:")
# Calculate tax for CHF 100,000
test_income = 100000
simple_tax = 0

for bracket in brackets_for_calculator:
    if test_income <= bracket['min']:
        break

    if test_income > bracket['max']:
        # Full bracket
        taxable_in_bracket = bracket['max'] - bracket['min']
    else:
        # Partial bracket
        taxable_in_bracket = test_income - bracket['min']

    tax_in_bracket = taxable_in_bracket * bracket['rate']
    simple_tax += tax_in_bracket
    print(f"  Bracket {bracket['min']:,}-{bracket['max'] if bracket['max'] != float('inf') else '∞'}: CHF {taxable_in_bracket:,} × {bracket['rate']*100:.2f}% = CHF {tax_in_bracket:.2f}")

print(f"\nSimple tax: CHF {simple_tax:.2f}")
canton_tax = simple_tax * 0.82  # Canton multiplier
print(f"Canton tax (82%): CHF {canton_tax:.2f}")

# Example with municipality (e.g., Zug city at 52.11%)
muni_tax = simple_tax * 0.5211
print(f"Municipal tax (52.11% for Zug city): CHF {muni_tax:.2f}")
print(f"Total tax: CHF {canton_tax + muni_tax:.2f}")
print(f"Effective rate: {(canton_tax + muni_tax) / test_income * 100:.2f}%")
