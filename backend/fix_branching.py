#!/usr/bin/env python3
"""
Script to fix branching that still points to deleted _upload questions
"""

import yaml

def fix_branching(yaml_file):
    """Fix branching references to removed upload questions"""

    with open(yaml_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)

    questions = data['questions']
    fixes_made = 0

    for q_id, q_data in questions.items():
        if 'branching' in q_data and 'inline_document_upload' in q_data:
            # This question has inline upload, so branching shouldn't point to _upload question
            upload_config = q_data['inline_document_upload']
            expected_upload_id = f"{q_id}_upload"

            # Check if branching still points to the upload question
            for key in ['yes', True, 'true', 'no', False, 'false']:
                if q_data['branching'].get(key) == expected_upload_id:
                    # Find the next question after the upload would have been
                    # For yes_no with inline upload, both branches should go to the same next question
                    # Let's check what 'no' branch points to and use that
                    no_branch = q_data['branching'].get('no') or q_data['branching'].get(False)
                    if no_branch:
                        q_data['branching'][key] = no_branch
                        fixes_made += 1
                        print(f"  ✓ Fixed {q_id} branching[{key}]: {expected_upload_id} → {no_branch}")

    # Save updated YAML
    with open(yaml_file, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    print(f"\n✅ Branching fixes complete!")
    print(f"   Fixed: {fixes_made} branches")

    return fixes_made

if __name__ == '__main__':
    yaml_file = '/home/cn/Desktop/HomeAiCode/swissai-tax/backend/config/questions.yaml'
    fix_branching(yaml_file)
