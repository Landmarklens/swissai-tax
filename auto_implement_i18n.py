#!/usr/bin/env python3
"""
Comprehensive Automated i18n Implementation
Processes ALL React components and adds translation support
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple
import hashlib

PROJECT_ROOT = Path("/home/cn/Desktop/HomeAiCode/swissai-tax")
SRC_DIR = PROJECT_ROOT / "src"
LOCALES_DIR = SRC_DIR / "locales"

# Comprehensive translation keys storage
all_translation_keys = {}

# Statistics
stats = {
    'files_processed': 0,
    'files_modified': 0,
    'keys_created': 0,
    'strings_replaced': 0
}


def generate_key_from_text(text: str, context: str = "common") -> str:
    """Generate a consistent translation key from English text"""
    # Clean text
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
    clean = re.sub(r'\s+', '_', clean.strip())

    # Truncate if too long
    if len(clean) > 40:
        # Use hash for long strings
        hash_suffix = hashlib.md5(text.encode()).hexdigest()[:6]
        clean = clean[:34] + '_' + hash_suffix

    # Add context prefix
    key = f"{context}.{clean}"

    # Store the mapping
    all_translation_keys[key] = text

    return key


def detect_context_from_filepath(filepath: Path) -> str:
    """Detect appropriate context/namespace from file path"""
    path_str = str(filepath).lower()

    if 'interview' in path_str:
        return 'interview'
    elif 'document' in path_str:
        return 'document'
    elif 'filing' in path_str or 'tax' in path_str:
        return 'filing'
    elif 'payment' in path_str:
        return 'payment'
    elif 'modal' in path_str:
        return 'modal'
    elif 'form' in path_str:
        return 'form'
    elif 'button' in path_str or 'btn' in path_str:
        return 'button'
    elif 'error' in path_str:
        return 'error'
    else:
        return 'common'


def has_i18n_import(content: str) -> bool:
    """Check if file has i18n import"""
    return bool(re.search(r"from\s+['\"]react-i18next['\"]", content))


def add_i18n_to_file(filepath: Path) -> Tuple[str, int]:
    """Add i18n support to a single file"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modifications = 0
    context = detect_context_from_filepath(filepath)

    # Skip if already has extensive i18n usage
    if content.count('t(') > 10:
        return content, 0

    # Add import if missing
    if not has_i18n_import(content):
        # Find last import
        import_matches = list(re.finditer(r"import\s+.+?;", content, re.MULTILINE))
        if import_matches:
            last_import = import_matches[-1]
            insert_pos = last_import.end()
            content = (
                content[:insert_pos] +
                "\nimport { useTranslation } from 'react-i18next';" +
                content[insert_pos:]
            )
            modifications += 1

    # Add useTranslation hook (find component function)
    if 'useTranslation' not in content or 'const { t }' not in content:
        # Pattern for function components
        patterns = [
            (r"(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)", "arrow"),
            (r"(function\s+\w+\s*\([^)]*\)\s*\{)", "function"),
            (r"(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)", "export_function"),
        ]

        for pattern, ptype in patterns:
            match = re.search(pattern, content)
            if match:
                insert_pos = match.end()
                content = (
                    content[:insert_pos] +
                    "\n  const { t } = useTranslation();" +
                    content[insert_pos:]
                )
                modifications += 1
                break

    # Replace hardcoded strings in JSX
    # Pattern 1: JSX text content <tag>Text</tag>
    def replace_jsx_text(match):
        nonlocal modifications
        text = match.group(1).strip()
        if len(text) > 2 and not text.isdigit() and not text.startswith('{'):
            key = generate_key_from_text(text, context)
            modifications += 1
            stats['strings_replaced'] += 1
            return f"{{t('{key}')}}"
        return text

    content = re.sub(r'>([A-Z][^<>{{}}]+?)<', lambda m: '>' + replace_jsx_text(m) + '<', content)

    # Pattern 2: String attributes (label, placeholder, title, alt)
    def replace_attr(match):
        nonlocal modifications
        attr_name = match.group(1)
        text = match.group(2)
        if len(text) > 2 and not text.isdigit():
            key = generate_key_from_text(text, context)
            modifications += 1
            stats['strings_replaced'] += 1
            return f'{attr_name}={{t("{key}")}}'
        return match.group(0)

    content = re.sub(
        r'(label|placeholder|title|alt|aria-label)\s*=\s*["\']([^"\']+)["\']',
        replace_attr,
        content
    )

    # Pattern 3: Button text
    def replace_button(match):
        nonlocal modifications
        text = match.group(1).strip()
        if text and not text.startswith('{'):
            key = generate_key_from_text(text, 'button')
            modifications += 1
            stats['strings_replaced'] += 1
            return f'{{t("{key}")}}'
        return text

    content = re.sub(
        r'<Button[^>]*>([A-Z][^<>{{}}]+?)</Button>',
        lambda m: m.group(0).replace(m.group(1), replace_button(m)),
        content
    )

    return content, modifications


def process_all_files():
    """Process all React component files"""
    print("=" * 80)
    print("COMPREHENSIVE AUTOMATED I18N IMPLEMENTATION")
    print("=" * 80)

    # Find all React files
    react_files = []
    for ext in ['*.jsx', '*.js', '*.tsx', '*.ts']:
        react_files.extend(SRC_DIR.rglob(ext))

    # Filter out node_modules, test files, etc.
    react_files = [
        f for f in react_files
        if 'node_modules' not in str(f)
        and 'test' not in str(f).lower()
        and '.test.' not in str(f)
        and '.spec.' not in str(f)
    ]

    print(f"\n📁 Found {len(react_files)} React component files")
    print(f"🚀 Starting automated translation implementation...\n")

    for filepath in react_files:
        try:
            stats['files_processed'] += 1

            new_content, mods = add_i18n_to_file(filepath)

            if mods > 0:
                # Write modified content
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

                stats['files_modified'] += 1
                rel_path = filepath.relative_to(PROJECT_ROOT)
                print(f"✅ {rel_path} ({mods} changes)")

        except Exception as e:
            print(f"❌ Error processing {filepath.name}: {str(e)}")

    print(f"\n{'=' * 80}")
    print(f"PROCESSING COMPLETE")
    print(f"{'=' * 80}")
    print(f"\n📊 Statistics:")
    print(f"   Files processed: {stats['files_processed']}")
    print(f"   Files modified: {stats['files_modified']}")
    print(f"   Strings replaced: {stats['strings_replaced']}")
    print(f"   Translation keys created: {len(all_translation_keys)}")


def update_translation_files():
    """Add all new translation keys to translation files"""
    print(f"\n{'=' * 80}")
    print(f"UPDATING TRANSLATION FILES")
    print(f"{'=' * 80}\n")

    # Update English file
    en_file = LOCALES_DIR / 'en' / 'translation.json'
    with open(en_file, 'r', encoding='utf-8') as f:
        en_trans = json.load(f)

    added = 0
    for key, value in all_translation_keys.items():
        if key not in en_trans:
            en_trans[key] = value
            added += 1

    with open(en_file, 'w', encoding='utf-8') as f:
        json.dump(en_trans, f, ensure_ascii=False, indent=2)

    print(f"✅ Added {added} keys to en/translation.json")

    # Update other languages with TODO markers
    for lang in ['de', 'fr', 'it']:
        lang_file = LOCALES_DIR / lang / 'translation.json'
        with open(lang_file, 'r', encoding='utf-8') as f:
            lang_trans = json.load(f)

        added_lang = 0
        for key, value in all_translation_keys.items():
            if key not in lang_trans:
                lang_trans[key] = f"[TODO] {value}"
                added_lang += 1

        with open(lang_file, 'w', encoding='utf-8') as f:
            json.dump(lang_trans, f, ensure_ascii=False, indent=2)

        print(f"✅ Added {added_lang} keys to {lang}/translation.json")

    stats['keys_created'] = len(all_translation_keys)


def generate_report():
    """Generate implementation report"""
    report = {
        'summary': stats,
        'translation_keys': all_translation_keys
    }

    report_file = PROJECT_ROOT / 'i18n_implementation_report.json'
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n📄 Detailed report saved to: {report_file.name}")


def main():
    """Main execution"""
    process_all_files()
    update_translation_files()
    generate_report()

    print(f"\n{'=' * 80}")
    print(f"✅ IMPLEMENTATION COMPLETE!")
    print(f"{'=' * 80}")
    print(f"\n⚠️  Next steps:")
    print(f"   1. Review the changes in your Git diff")
    print(f"   2. Have native speakers translate [TODO] entries in DE/FR/IT files")
    print(f"   3. Run: npm test (to check for any broken tests)")
    print(f"   4. Test language switching in the app")
    print(f"   5. Commit the changes")


if __name__ == "__main__":
    main()
