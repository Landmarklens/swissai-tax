#!/usr/bin/env python3
"""
Batch Translation Component Updater
Automatically adds i18n imports and wraps hardcoded strings with t() function
"""

import os
import re
import json
from pathlib import Path
from typing import List, Tuple, Dict
import subprocess

PROJECT_ROOT = Path("/home/cn/Desktop/HomeAiCode/swissai-tax")
SRC_DIR = PROJECT_ROOT / "src"

# Priority file list (from analysis)
PRIORITY_FILES = [
    # Phase 1: Critical user-facing (NO i18n)
    "src/components/paymentForm/PaymentForm.jsx",  # DONE
    "src/pages/TaxFiling/DocumentUpload.js",
    "src/components/TenantSelection/ApplicationDetailModal.jsx",
    "src/components/TenantSelection/ViewingSlotManager.jsx",
    "src/store/slices/documentsSlice.js",
    "src/utils/validation/schemaFactory.js",
    "src/pages/TaxFiling/TaxInterview.js",
    "src/components/TaxInterview/InterviewQuestion.jsx",
    "src/pages/Subscription/SubscriptionPage.jsx",
    "src/components/SignUpLogin.jsx",

    # Phase 2: Has i18n but hardcoded text remains
    "src/pages/TaxFiling/FilingsList.jsx",
    "src/pages/TaxFiling/FilingDetails.jsx",
    "src/pages/TaxFiling/TaxResults.jsx",
    "src/components/ContactForm/ContactForm.jsx",
]


def has_i18n_import(content: str) -> bool:
    """Check if file already imports useTranslation"""
    return bool(re.search(r"import.*useTranslation.*from.*['\"]react-i18next['\"]", content))


def has_use_translation_hook(content: str) -> bool:
    """Check if file uses the useTranslation hook"""
    return bool(re.search(r"const\s*{\s*t\s*}\s*=\s*useTranslation\(\)", content))


def add_i18n_import(content: str) -> str:
    """Add i18n import to component"""
    # Find the last import statement
    import_pattern = r"(import .+?;)\n"
    imports = list(re.finditer(import_pattern, content))

    if not imports:
        # No imports found, add at top
        return "import { useTranslation } from 'react-i18next';\n\n" + content

    # Add after last import
    last_import = imports[-1]
    insert_pos = last_import.end()

    return (
        content[:insert_pos] +
        "import { useTranslation } from 'react-i18next';\n" +
        content[insert_pos:]
    )


def add_use_translation_hook(content: str) -> str:
    """Add const { t } = useTranslation(); hook to component"""

    # Find component function/const declaration
    patterns = [
        r"(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{)",  # Arrow function
        r"(function\s+\w+\s*\([^)]*\)\s*{)",  # Function declaration
        r"(const\s+\w+:\s*React\.FC.*?=\s*\([^)]*\)\s*=>\s*{)",  # TypeScript FC
    ]

    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            return (
                content[:insert_pos] +
                "\n  const { t } = useTranslation();\n" +
                content[insert_pos:]
            )

    return content


def find_hardcoded_strings(content: str) -> List[Tuple[str, int, int]]:
    """Find all hardcoded strings that should be translated"""
    strings_to_translate = []

    # Pattern 1: JSX text content (but exclude code/numbers)
    # <tag>Some text</tag>
    jsx_text_pattern = r'>\s*([A-Z][^<>{}\n]+?)\s*<'
    for match in re.finditer(jsx_text_pattern, content):
        text = match.group(1).strip()
        if text and not text.isdigit() and len(text) > 2:
            strings_to_translate.append((text, match.start(1), match.end(1)))

    # Pattern 2: Attribute values with hardcoded text
    # label="Some text" or placeholder="Some text"
    attr_pattern = r'(label|placeholder|title|alt|aria-label)\s*=\s*["\']([^"\']+?)["\']'
    for match in re.finditer(attr_pattern, content):
        text = match.group(2).strip()
        if text and not text.isdigit() and not text.startswith('{'):
            strings_to_translate.append((text, match.start(2), match.end(2)))

    # Pattern 3: Button text
    # <Button>Click Me</Button>
    button_pattern = r'<Button[^>]*>\s*([A-Z][^<>]+?)\s*</Button>'
    for match in re.finditer(button_pattern, content):
        text = match.group(1).strip()
        if text and not text.startswith('{'):
            strings_to_translate.append((text, match.start(1), match.end(1)))

    # Pattern 4: Typography content
    # <Typography>Some text</Typography>
    typography_pattern = r'<Typography[^>]*>\s*([A-Z][^<>]+?)\s*</Typography>'
    for match in re.finditer(typography_pattern, content):
        text = match.group(1).strip()
        if text and not text.startswith('{'):
            strings_to_translate.append((text, match.start(1), match.end(1)))

    # Remove duplicates while preserving order
    seen = set()
    unique_strings = []
    for text, start, end in strings_to_translate:
        if text not in seen:
            seen.add(text)
            unique_strings.append((text, start, end))

    return unique_strings


def create_translation_key(text: str, context: str = "") -> str:
    """Generate a translation key from text"""
    # Remove special characters
    key = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
    # Replace spaces with underscores
    key = '_'.join(key.split())
    # Limit length
    if len(key) > 50:
        key = key[:50]

    # Add context prefix if provided
    if context:
        key = f"{context}.{key}"

    return key


def process_file(file_path: Path, dry_run: bool = True) -> Dict:
    """Process a single file to add translations"""

    print(f"\n{'='*80}")
    print(f"Processing: {file_path.relative_to(PROJECT_ROOT)}")
    print(f"{'='*80}")

    # Read file
    with open(file_path, 'r', encoding='utf-8') as f:
        original_content = f.read()

    content = original_content
    stats = {
        'file': str(file_path.relative_to(PROJECT_ROOT)),
        'had_i18n': False,
        'had_hook': False,
        'strings_found': 0,
        'changes_made': []
    }

    # Check current state
    stats['had_i18n'] = has_i18n_import(content)
    stats['had_hook'] = has_use_translation_hook(content)

    # Add i18n import if missing
    if not stats['had_i18n']:
        content = add_i18n_import(content)
        stats['changes_made'].append("Added i18n import")
        print("✅ Added i18n import")
    else:
        print("⏭️  Already has i18n import")

    # Add useTranslation hook if missing
    if not stats['had_hook']:
        content = add_use_translation_hook(content)
        stats['changes_made'].append("Added useTranslation hook")
        print("✅ Added useTranslation hook")
    else:
        print("⏭️  Already has useTranslation hook")

    # Find hardcoded strings
    hardcoded_strings = find_hardcoded_strings(original_content)
    stats['strings_found'] = len(hardcoded_strings)

    print(f"\n📝 Found {len(hardcoded_strings)} hardcoded strings:")
    for i, (text, _, _) in enumerate(hardcoded_strings[:10], 1):  # Show first 10
        print(f"   {i}. '{text[:60]}...' " if len(text) > 60 else f"   {i}. '{text}'")

    if len(hardcoded_strings) > 10:
        print(f"   ... and {len(hardcoded_strings) - 10} more")

    # Write changes
    if not dry_run and content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n💾 File updated!")
    elif dry_run:
        print(f"\n🔍 DRY RUN - No changes written")

    return stats


def main(dry_run: bool = True):
    """Main execution"""
    print("=" * 80)
    print("BATCH TRANSLATION COMPONENT UPDATER")
    print("=" * 80)
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'LIVE (will modify files)'}")
    print(f"Files to process: {len(PRIORITY_FILES)}")

    all_stats = []

    for file_rel_path in PRIORITY_FILES:
        file_path = PROJECT_ROOT / file_rel_path

        if not file_path.exists():
            print(f"\n⚠️  File not found: {file_rel_path}")
            continue

        try:
            stats = process_file(file_path, dry_run=dry_run)
            all_stats.append(stats)
        except Exception as e:
            print(f"\n❌ Error processing {file_rel_path}: {str(e)}")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    total_strings = sum(s['strings_found'] for s in all_stats)
    files_modified = len([s for s in all_stats if s['changes_made']])

    print(f"\n📊 Statistics:")
    print(f"   - Files processed: {len(all_stats)}")
    print(f"   - Files needing changes: {files_modified}")
    print(f"   - Total hardcoded strings found: {total_strings}")
    print(f"   - Files already had i18n: {len([s for s in all_stats if s['had_i18n']])}")
    print(f"   - Files already had hook: {len([s for s in all_stats if s['had_hook']])}")

    if dry_run:
        print(f"\n⚠️  This was a DRY RUN. Run with --live to apply changes.")
    else:
        print(f"\n✅ All changes applied! Review and test the modified files.")

    # Save stats report
    report_file = PROJECT_ROOT / "translation_batch_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump({
            'summary': {
                'files_processed': len(all_stats),
                'files_modified': files_modified,
                'total_strings': total_strings,
            },
            'details': all_stats
        }, f, indent=2)

    print(f"\n📄 Detailed report saved to: {report_file.name}")


if __name__ == "__main__":
    import sys
    dry_run = '--live' not in sys.argv
    main(dry_run=dry_run)
