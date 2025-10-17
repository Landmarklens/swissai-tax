#!/usr/bin/env python3
"""
Script to add category metadata to questions.yaml
Categories: personal_info, income_sources, deductions, property_assets, special_situations
"""

import yaml
from collections import OrderedDict

# Category mapping for all questions
QUESTION_CATEGORIES = {
    # Personal Info (Q00-Q03c)
    'Q00_name': 'personal_info',
    'Q00': 'personal_info',
    'Q01': 'personal_info',
    'Q01a_name': 'personal_info',
    'Q01a': 'personal_info',
    'Q01d': 'personal_info',
    'Q02a': 'personal_info',
    'Q02b': 'personal_info',
    'Q03': 'personal_info',
    'Q03a': 'personal_info',
    'Q03b': 'personal_info',
    'Q03c': 'personal_info',

    # Income Sources (Q04-Q08)
    'Q04': 'income_sources',
    'Q04a': 'income_sources',
    'Q04a_type': 'income_sources',
    'Q04a_self_upload': 'income_sources',
    'Q04a_employer': 'income_sources',
    'Q04b': 'income_sources',
    'Q04b1': 'income_sources',
    'Q04c': 'income_sources',
    'Q04d': 'income_sources',
    'Q04d_details': 'income_sources',
    'Q05': 'income_sources',
    'Q06': 'income_sources',
    'Q07': 'income_sources',
    'Q08': 'income_sources',

    # Property & Assets (Q09-Q10b)
    'Q09': 'property_assets',
    'Q09a': 'property_assets',
    'Q09b': 'property_assets',
    'Q09b_upload': 'property_assets',
    'Q09c': 'property_assets',
    'Q09c_amount': 'property_assets',
    'Q09c_expenses': 'property_assets',
    'Q10': 'property_assets',
    'Q10a': 'property_assets',
    'Q10b': 'property_assets',
    'Q10_bank_accounts': 'property_assets',
    'Q_capital_gains': 'property_assets',

    # Deductions (Q11-Q14)
    'Q11': 'deductions',
    'Q12': 'deductions',
    'Q13': 'deductions',
    'Q13b': 'deductions',
    'Q13b_basic': 'deductions',
    'Q13b_supplementary': 'deductions',
    'Q13b_supplementary_amount': 'deductions',
    'Q14': 'deductions',
    'Q_energy_renovation': 'deductions',
    'Q_pension_buyback': 'deductions',

    # Special Situations (Q15-Q18 and complexity questions)
    'Q15': 'special_situations',
    'Q15_details': 'special_situations',
    'Q15_tax_credits': 'special_situations',
    'Q15_tax_credits_another': 'special_situations',
    'Q16': 'special_situations',
    'Q17': 'special_situations',
    'Q17a': 'special_situations',
    'Q17b': 'special_situations',
    'Q17c': 'special_situations',
    'Q18_bank_statements': 'special_situations',
    'Q_complexity_screen': 'special_situations',
    'Q_trust_foundation': 'special_situations',
    'Q_inheritance': 'special_situations',
    'Q_military_service': 'special_situations',
}

def add_categories_to_yaml(input_file, output_file):
    """Add category field to each question in questions.yaml"""

    # Load YAML preserving order and structure
    with open(input_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)

    # Add category to each question
    questions = data.get('questions', {})
    for question_id, question_data in questions.items():
        if question_id in QUESTION_CATEGORIES:
            # Insert category field near the top (after id, text)
            category = QUESTION_CATEGORIES[question_id]
            question_data['category'] = category
            print(f"Added category '{category}' to {question_id}")
        else:
            print(f"WARNING: No category mapping for {question_id}")

    # Write back to file
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    print(f"\nUpdated questions written to {output_file}")

if __name__ == '__main__':
    import sys
    import os

    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    config_dir = os.path.join(backend_dir, 'config')

    input_file = os.path.join(config_dir, 'questions.yaml')
    output_file = os.path.join(config_dir, 'questions_updated.yaml')

    if not os.path.exists(input_file):
        print(f"ERROR: {input_file} not found")
        sys.exit(1)

    print(f"Reading from: {input_file}")
    print(f"Writing to: {output_file}")
    print()

    add_categories_to_yaml(input_file, output_file)

    print("\nDone! Review questions_updated.yaml, then replace questions.yaml")
