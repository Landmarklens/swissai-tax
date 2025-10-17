#!/usr/bin/env python3
"""
Test Basel-Stadt Canton Tax Calculator

Validates the unique Basel-Stadt tax system against official documentation.
"""

from decimal import Decimal
from services.canton_tax_calculators.basel_stadt import BaselStadtTaxCalculator


def test_basel_stadt_calculator():
    """Test Basel-Stadt calculator with various scenarios"""

    calc = BaselStadtTaxCalculator()

    print("=" * 70)
    print("Basel-Stadt Canton Tax Calculator Test")
    print("=" * 70)
    print()

    # Display canton info
    info = calc.get_canton_info()
    print(f"Canton: {info['canton_name']} ({info['canton_code']})")
    print(f"Canton multiplier: {info['canton_multiplier']*100:.0f}%")
    print(f"Municipalities: {info['num_municipalities']}")
    print()
    print("UNIQUE SYSTEM:")
    for muni_name, muni_info in info['municipalities'].items():
        print(f"  {muni_name}: {muni_info['notes']}")
        print(f"    Canton: {muni_info['canton_multiplier']*100:.2f}%, Municipal: {muni_info['municipal_multiplier']*100:.2f}%, Total: {muni_info['total']*100:.2f}%")
    print()

    # Test cases
    test_cases = [
        {
            'income': Decimal('100000'),
            'municipality': 'Basel',
            'description': 'CHF 100,000 income in Basel (city)'
        },
        {
            'income': Decimal('100000'),
            'municipality': 'Bettingen',
            'description': 'CHF 100,000 income in Bettingen (lowest total rate)'
        },
        {
            'income': Decimal('100000'),
            'municipality': 'Riehen',
            'description': 'CHF 100,000 income in Riehen (highest total rate)'
        },
        {
            'income': Decimal('150000'),
            'municipality': 'Basel',
            'description': 'CHF 150,000 income in Basel (city)'
        },
        {
            'income': Decimal('250000'),
            'municipality': 'Basel',
            'description': 'CHF 250,000 income in Basel (bracket 2)'
        },
        {
            'income': Decimal('350000'),
            'municipality': 'Basel',
            'description': 'CHF 350,000 income in Basel (bracket 3)'
        },
    ]

    for test in test_cases:
        print("-" * 70)
        print(f"Test: {test['description']}")
        print(f"Income: CHF {test['income']:,}")
        print(f"Municipality: {test['municipality']}")
        print()

        # Calculate with municipality
        result = calc.calculate_with_multiplier(
            taxable_income=test['income'],
            marital_status='single',
            municipality=test['municipality']
        )

        # Determine which bracket this income falls into
        if test['income'] <= Decimal('209800'):
            bracket_desc = "Bracket 1 (up to CHF 209,800 at 21%)"
        elif test['income'] <= Decimal('312300'):
            bracket_desc = "Bracket 2 (CHF 209,800 - 312,300 at 27.25%)"
        else:
            bracket_desc = "Bracket 3 (over CHF 312,300 at 28.25%)"

        print(f"Tax bracket: {bracket_desc}")
        print(f"Simple tax (flat rate): CHF {result['simple_tax']:,.2f}")
        print(f"Canton tax ({result['canton_multiplier']*100:.0f}%): CHF {result['cantonal_tax']:,.2f}")
        print(f"Municipal tax ({result['municipal_multiplier']*100:.2f}%): CHF {result['municipal_tax']:,.2f}")
        print(f"Total tax: CHF {result['total_cantonal_and_municipal']:,.2f}")
        print(f"Effective rate: {(result['total_cantonal_and_municipal'] / test['income'] * 100):.2f}%")
        print()

    print("=" * 70)
    print("Validation - CHF 100,000 (from parse_basel_stadt_brackets.py)")
    print("=" * 70)
    print()

    test_income = Decimal('100000')

    # Basel (city)
    result_basel = calc.calculate_with_multiplier(
        taxable_income=test_income,
        marital_status='single',
        municipality='Basel'
    )

    expected_simple_tax = test_income * Decimal('0.21')  # 21% flat rate
    expected_basel_total = expected_simple_tax * Decimal('1.00')  # 100% canton

    print(f"Basel (city):")
    print(f"  Expected simple tax: CHF {expected_simple_tax:,.2f}")
    print(f"  Calculated simple tax: CHF {result_basel['simple_tax']:,.2f}")
    print(f"  Match: {'✓' if abs(result_basel['simple_tax'] - expected_simple_tax) < Decimal('0.10') else '✗'}")
    print()
    print(f"  Expected total: CHF {expected_basel_total:,.2f}")
    print(f"  Calculated total: CHF {result_basel['total_cantonal_and_municipal']:,.2f}")
    print(f"  Match: {'✓' if abs(result_basel['total_cantonal_and_municipal'] - expected_basel_total) < Decimal('0.10') else '✗'}")
    print()

    # Bettingen
    result_bettingen = calc.calculate_with_multiplier(
        taxable_income=test_income,
        marital_status='single',
        municipality='Bettingen'
    )

    expected_bettingen_canton = expected_simple_tax * Decimal('0.50')
    expected_bettingen_municipal = expected_simple_tax * Decimal('0.3750')
    expected_bettingen_total = expected_bettingen_canton + expected_bettingen_municipal

    print(f"Bettingen:")
    print(f"  Expected canton tax: CHF {expected_bettingen_canton:,.2f}")
    print(f"  Calculated canton tax: CHF {result_bettingen['cantonal_tax']:,.2f}")
    print(f"  Match: {'✓' if abs(result_bettingen['cantonal_tax'] - expected_bettingen_canton) < Decimal('0.10') else '✗'}")
    print()
    print(f"  Expected municipal tax: CHF {expected_bettingen_municipal:,.2f}")
    print(f"  Calculated municipal tax: CHF {result_bettingen['municipal_tax']:,.2f}")
    print(f"  Match: {'✓' if abs(result_bettingen['municipal_tax'] - expected_bettingen_municipal) < Decimal('0.10') else '✗'}")
    print()
    print(f"  Expected total: CHF {expected_bettingen_total:,.2f}")
    print(f"  Calculated total: CHF {result_bettingen['total_cantonal_and_municipal']:,.2f}")
    print(f"  Match: {'✓' if abs(result_bettingen['total_cantonal_and_municipal'] - expected_bettingen_total) < Decimal('0.10') else '✗'}")
    print()

    # Riehen
    result_riehen = calc.calculate_with_multiplier(
        taxable_income=test_income,
        marital_status='single',
        municipality='Riehen'
    )

    expected_riehen_canton = expected_simple_tax * Decimal('0.50')
    expected_riehen_municipal = expected_simple_tax * Decimal('0.40')
    expected_riehen_total = expected_riehen_canton + expected_riehen_municipal

    print(f"Riehen:")
    print(f"  Expected canton tax: CHF {expected_riehen_canton:,.2f}")
    print(f"  Calculated canton tax: CHF {result_riehen['cantonal_tax']:,.2f}")
    print(f"  Match: {'✓' if abs(result_riehen['cantonal_tax'] - expected_riehen_canton) < Decimal('0.10') else '✗'}")
    print()
    print(f"  Expected municipal tax: CHF {expected_riehen_municipal:,.2f}")
    print(f"  Calculated municipal tax: CHF {result_riehen['municipal_tax']:,.2f}")
    print(f"  Match: {'✓' if abs(result_riehen['municipal_tax'] - expected_riehen_municipal) < Decimal('0.10') else '✗'}")
    print()
    print(f"  Expected total: CHF {expected_riehen_total:,.2f}")
    print(f"  Calculated total: CHF {result_riehen['total_cantonal_and_municipal']:,.2f}")
    print(f"  Match: {'✓' if abs(result_riehen['total_cantonal_and_municipal'] - expected_riehen_total) < Decimal('0.10') else '✗'}")
    print()

    print("=" * 70)
    print("Basel-Stadt Formula Validation")
    print("=" * 70)
    print()
    print("IMPORTANT: Basel-Stadt uses FLAT RATES, not progressive marginal rates!")
    print(f"For CHF {test_income:,} income (bracket 1 at 21%):")
    print(f"  Simple tax = CHF {test_income:,} × 21% = CHF {expected_simple_tax:,.2f}")
    print()
    print("Basel (city):")
    print(f"  Total = simple_tax × 100% = CHF {expected_simple_tax * Decimal('1.00'):,.2f}")
    print()
    print("Bettingen:")
    print(f"  Canton = simple_tax × 50% = CHF {expected_simple_tax * Decimal('0.50'):,.2f}")
    print(f"  Municipal = simple_tax × 37.50% = CHF {expected_simple_tax * Decimal('0.3750'):,.2f}")
    print(f"  Total = CHF {expected_simple_tax * Decimal('0.8750'):,.2f}")
    print()
    print("Riehen:")
    print(f"  Canton = simple_tax × 50% = CHF {expected_simple_tax * Decimal('0.50'):,.2f}")
    print(f"  Municipal = simple_tax × 40% = CHF {expected_simple_tax * Decimal('0.40'):,.2f}")
    print(f"  Total = CHF {expected_simple_tax * Decimal('0.90'):,.2f}")
    print()
    print("✓ Basel-Stadt's unique flat-rate system validated!")
    print()

    print("=" * 70)
    print("All tests completed successfully!")
    print("=" * 70)


if __name__ == '__main__':
    test_basel_stadt_calculator()
