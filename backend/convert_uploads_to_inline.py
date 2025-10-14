#!/usr/bin/env python3
"""
Script to convert all separate document_upload questions to inline uploads
"""

import yaml
import re

def convert_to_inline_uploads(yaml_file):
    """Convert all _upload questions to inline uploads in their parent yes/no questions"""

    with open(yaml_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)

    questions = data['questions']
    upload_questions = {}
    parent_questions = {}

    # Step 1: Find all document_upload questions and their parents
    for q_id, q_data in questions.items():
        if q_data.get('type') == 'document_upload':
            upload_questions[q_id] = q_data
            # Find parent question (usually the _upload suffix removed)
            parent_id = q_id.replace('_upload', '')
            if parent_id in questions and questions[parent_id].get('type') == 'yes_no':
                parent_questions[q_id] = parent_id

    print(f"Found {len(upload_questions)} document upload questions")
    print(f"Found {len(parent_questions)} parent yes/no questions")

    # Step 2: Convert each upload question to inline config
    converted_count = 0
    for upload_id, parent_id in parent_questions.items():
        upload_q = upload_questions[upload_id]
        parent_q = questions[parent_id]

        # Skip if already has inline_document_upload
        if 'inline_document_upload' in parent_q:
            print(f"  Skipping {parent_id} - already has inline upload")
            continue

        # Create inline upload config
        inline_config = {
            'document_type': upload_q.get('document_type', 'unknown'),
            'accepted_formats': upload_q.get('accepted_formats', ['pdf', 'jpg', 'jpeg', 'png']),
            'max_size_mb': upload_q.get('max_size_mb', 10),
            'bring_later': upload_q.get('bring_later', True),
            'upload_text': upload_q.get('text', {}),
            'help_text': upload_q.get('help_text', {})
        }

        # Add inline config to parent
        parent_q['inline_document_upload'] = inline_config

        # Update parent branching to skip upload question
        if 'branching' in parent_q:
            # Change yes/true: upload_id to yes/true: next_question
            for key in ['yes', True, 'true']:
                if parent_q['branching'].get(key) == upload_id:
                    next_q = upload_q.get('next')
                    parent_q['branching'][key] = next_q
                    break

        # Update parent next if it points to upload
        if parent_q.get('next') == upload_id:
            parent_q['next'] = upload_q.get('next')

        converted_count += 1
        print(f"  ✓ Converted {parent_id} to use inline upload")

    # Step 3: Remove standalone upload questions
    removed_count = 0
    for upload_id in parent_questions.keys():
        if upload_id in questions:
            del questions[upload_id]
            removed_count += 1
            print(f"  ✓ Removed standalone question {upload_id}")

    # Step 4: Save updated YAML
    with open(yaml_file, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    print(f"\n✅ Conversion complete!")
    print(f"   Converted: {converted_count} questions")
    print(f"   Removed: {removed_count} upload questions")

    return converted_count, removed_count

if __name__ == '__main__':
    yaml_file = '/home/cn/Desktop/HomeAiCode/swissai-tax/backend/config/questions.yaml'
    convert_to_inline_uploads(yaml_file)
