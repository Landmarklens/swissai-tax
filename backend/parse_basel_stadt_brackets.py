#!/usr/bin/env python3
"""
Parse Basel-Stadt canton tax brackets from official PDF.

Basel-Stadt uses a very simple tax bracket system with only 3 brackets.

Source: https://media.bs.ch/original_file/12a2569768d1cae30205ccb8a3a6674faa042050/17000-steuertarife-2024.pdf
"""

from decimal import Decimal

# Basel-Stadt 2024 Income Tax Brackets (Tarif A - Single)
# The PDF shows:
#   Von CHF 100.– bis CHF 209'800.– ▸ CHF 21.– je CHF 100.–
#   Von CHF 209'800.– bis CHF 312'300.– ▸ CHF 27.25 je CHF 100.–
#   Über CHF 312'300.– ▸ CHF 28.25 je CHF 100.–

# Convert "CHF X je CHF 100" to rate:
# CHF 21 je CHF 100 = 21/100 = 21% = 0.21
# CHF 27.25 je CHF 100 = 27.25/100 = 27.25% = 0.2725
# CHF 28.25 je CHF 100 = 28.25/100 = 28.25% = 0.2825

basel_stadt_income_brackets_2024_single = [
    # (upper_limit, rate)
    (Decimal('209800'), Decimal('0.21')),      # 21% up to CHF 209,800
    (Decimal('312300'), Decimal('0.2725')),    # 27.25% from CHF 209,800 to CHF 312,300
    (Decimal('inf'), Decimal('0.2825')),       # 28.25% over CHF 312,300
]

print("Basel-Stadt Canton 2024 Income Tax Brackets (Tarif A - Single)")
print("=" * 70)
print()

print("IMPORTANT: Basel-Stadt uses simple flat rates within each bracket")
print("(Not progressive marginal rates like most cantons)")
print()

print("Tax brackets:")
for i, (upper_limit, rate) in enumerate(basel_stadt_income_brackets_2024_single):
    if upper_limit == Decimal('inf'):
        prev_limit = basel_stadt_income_brackets_2024_single[i-1][0]
        print(f"{i+1}. Over CHF {prev_limit:,}: {rate*100:.2f}% (CHF {rate*100} je CHF 100)")
    elif i == 0:
        print(f"{i+1}. CHF 100 - {upper_limit:,}: {rate*100:.2f}% (CHF {rate*100} je CHF 100)")
    else:
        prev_limit = basel_stadt_income_brackets_2024_single[i-1][0]
        print(f"{i+1}. CHF {prev_limit:,} - {upper_limit:,}: {rate*100:.2f}% (CHF {rate*100} je CHF 100)")

print()
print("Canton multiplier: 100% (1.00)")
print()

# Test calculation for CHF 100,000
test_income = Decimal('100000')
print(f"Validation - Test with CHF {test_income:,} income:")
print()

# Basel-Stadt uses the ENTIRE income at one rate (the rate for that bracket)
# This is different from progressive taxation!
# For CHF 100,000: entire amount is taxed at 21%
simple_tax = test_income * Decimal('0.21')

print(f"Income: CHF {test_income:,}")
print(f"This falls in bracket 1 (up to CHF 209,800)")
print(f"Simple tax = CHF {test_income:,} × 21% = CHF {simple_tax:,.2f}")
print()

# Municipality examples
print("Total tax with multipliers:")
print()

# Basel (100% canton, 0% municipal)
basel_tax = simple_tax * Decimal('1.00')
print(f"Basel (city): Simple tax × 100% = CHF {basel_tax:,.2f}")
print(f"  Effective rate: {(basel_tax / test_income * 100):.2f}%")
print()

# Bettingen (50% canton + 37.50% municipal = 87.50%)
bettingen_canton = simple_tax * Decimal('0.50')
bettingen_municipal = simple_tax * Decimal('0.3750')
bettingen_total = bettingen_canton + bettingen_municipal
print(f"Bettingen: Canton (50%) + Municipal (37.50%) = 87.50%")
print(f"  Canton tax: CHF {bettingen_canton:,.2f}")
print(f"  Municipal tax: CHF {bettingen_municipal:,.2f}")
print(f"  Total: CHF {bettingen_total:,.2f}")
print(f"  Effective rate: {(bettingen_total / test_income * 100):.2f}%")
print()

# Riehen (50% canton + 40% municipal = 90%)
riehen_canton = simple_tax * Decimal('0.50')
riehen_municipal = simple_tax * Decimal('0.40')
riehen_total = riehen_canton + riehen_municipal
print(f"Riehen: Canton (50%) + Municipal (40%) = 90%")
print(f"  Canton tax: CHF {riehen_canton:,.2f}")
print(f"  Municipal tax: CHF {riehen_municipal:,.2f}")
print(f"  Total: CHF {riehen_total:,.2f}")
print(f"  Effective rate: {(riehen_total / test_income * 100):.2f}%")
print()

print("=" * 70)
print("NOTE: Basel-Stadt's system is unique:")
print("  1. Very simple bracket structure (only 3 brackets)")
print("  2. Flat rate within each bracket (not progressive marginal rates)")
print("  3. Basel city pays full canton tax, no municipal tax")
print("  4. Bettingen & Riehen pay reduced canton + municipal taxes")
print("=" * 70)
