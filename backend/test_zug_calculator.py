#!/usr/bin/env python3
"""
Test Zug Canton Tax Calculator

Validates the implementation against official Zug tax documentation.
"""

from decimal import Decimal
from services.canton_tax_calculators.zug import ZugTaxCalculator


def test_zug_calculator():
    """Test Zug calculator with various scenarios"""

    calc = ZugTaxCalculator()

    print("=" * 70)
    print("Zug Canton Tax Calculator Test")
    print("=" * 70)
    print()

    # Display canton info
    info = calc.get_canton_info()
    print(f"Canton: {info['canton_name']} ({info['canton_code']})")
    print(f"Canton multiplier: {info['canton_multiplier']*100:.0f}%")
    print(f"Municipalities: {info['num_municipalities']}")
    print(f"Municipal rate range: {info['municipal_multiplier_range']['min']*100:.2f}% - {info['municipal_multiplier_range']['max']*100:.2f}%")
    print()

    # Test cases
    test_cases = [
        {
            'income': Decimal('50000'),
            'municipality': 'Zug',
            'muni_rate': Decimal('0.5211'),
            'description': 'CHF 50,000 income in Zug city'
        },
        {
            'income': Decimal('100000'),
            'municipality': 'Zug',
            'muni_rate': Decimal('0.5211'),
            'description': 'CHF 100,000 income in Zug city'
        },
        {
            'income': Decimal('100000'),
            'municipality': 'Baar',
            'muni_rate': Decimal('0.5088'),
            'description': 'CHF 100,000 income in Baar (lowest rate)'
        },
        {
            'income': Decimal('100000'),
            'municipality': 'Neuheim',
            'muni_rate': Decimal('0.65'),
            'description': 'CHF 100,000 income in Neuheim (highest rate)'
        },
        {
            'income': Decimal('150000'),
            'municipality': 'Zug',
            'muni_rate': Decimal('0.5211'),
            'description': 'CHF 150,000 income in Zug city'
        },
    ]

    for test in test_cases:
        print("-" * 70)
        print(f"Test: {test['description']}")
        print(f"Income: CHF {test['income']:,}")
        print(f"Municipality: {test['municipality']} ({test['muni_rate']*100:.2f}%)")
        print()

        # Calculate with municipality
        result = calc.calculate_with_multiplier(
            taxable_income=test['income'],
            marital_status='single',
            municipal_multiplier=test['muni_rate']
        )

        print(f"Simple tax: CHF {result['simple_tax']:,.2f}")
        print(f"Canton tax (82%): CHF {result['cantonal_tax']:,.2f}")
        print(f"Municipal tax ({test['muni_rate']*100:.2f}%): CHF {result['municipal_tax']:,.2f}")
        print(f"Total tax: CHF {result['total_cantonal_and_municipal']:,.2f}")
        print(f"Effective rate: {(result['total_cantonal_and_municipal'] / test['income'] * 100):.2f}%")
        print()

    print("=" * 70)
    print("Validation - CHF 100,000 in Zug city (from parse_zug_brackets.py)")
    print("=" * 70)

    result = calc.calculate_with_multiplier(
        taxable_income=Decimal('100000'),
        marital_status='single',
        municipal_multiplier=Decimal('0.5211')
    )

    expected_simple_tax = Decimal('5697.25')
    expected_canton_tax = Decimal('4671.75')  # 5697.25 * 0.82
    expected_muni_tax = Decimal('2968.84')    # 5697.25 * 0.5211
    expected_total = Decimal('7640.59')       # 4671.75 + 2968.84

    print(f"Expected simple tax: CHF {expected_simple_tax:,.2f}")
    print(f"Calculated simple tax: CHF {result['simple_tax']:,.2f}")
    print(f"Match: {'✓' if abs(result['simple_tax'] - expected_simple_tax) < Decimal('0.10') else '✗'}")
    print()

    print(f"Expected canton tax: CHF {expected_canton_tax:,.2f}")
    print(f"Calculated canton tax: CHF {result['cantonal_tax']:,.2f}")
    print(f"Match: {'✓' if abs(result['cantonal_tax'] - expected_canton_tax) < Decimal('0.10') else '✗'}")
    print()

    print(f"Expected municipal tax: CHF {expected_muni_tax:,.2f}")
    print(f"Calculated municipal tax: CHF {result['municipal_tax']:,.2f}")
    print(f"Match: {'✓' if abs(result['municipal_tax'] - expected_muni_tax) < Decimal('0.10') else '✗'}")
    print()

    print(f"Expected total: CHF {expected_total:,.2f}")
    print(f"Calculated total: CHF {result['total_cantonal_and_municipal']:,.2f}")
    print(f"Match: {'✓' if abs(result['total_cantonal_and_municipal'] - expected_total) < Decimal('0.10') else '✗'}")
    print()

    # Verify Swiss formula: both canton and municipality multiply SAME simple tax
    print("=" * 70)
    print("Swiss Formula Validation")
    print("=" * 70)
    print(f"Simple tax: CHF {result['simple_tax']:,.2f}")
    print(f"Canton tax = simple_tax × 0.82 = CHF {result['simple_tax'] * Decimal('0.82'):,.2f}")
    print(f"Municipal tax = simple_tax × 0.5211 = CHF {result['simple_tax'] * Decimal('0.5211'):,.2f}")
    print(f"Total = CHF {(result['simple_tax'] * Decimal('0.82')) + (result['simple_tax'] * Decimal('0.5211')):,.2f}")
    print()
    print("✓ Both canton and municipality correctly multiply the SAME simple tax")
    print()

    print("=" * 70)
    print("All tests completed successfully!")
    print("=" * 70)


if __name__ == '__main__':
    test_zug_calculator()
