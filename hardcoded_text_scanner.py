#!/usr/bin/env python3
"""
Comprehensive Hardcoded Text Scanner for SwissAI Tax Frontend
Identifies all hardcoded text strings that should be translated using react-i18next
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Patterns to identify hardcoded text
PATTERNS = {
    'jsx_text': r'>([^<>{}\n]+?)<',  # Text between JSX tags
    'placeholder': r'placeholder=["\']([^"\']+?)["\']',  # placeholder attributes
    'alt_text': r'alt=["\']([^"\']+?)["\']',  # alt attributes
    'title': r'title=["\']([^"\']+?)["\']',  # title attributes
    'aria_label': r'aria-label=["\']([^"\']+?)["\']',  # aria-label attributes
    'button_text': r'<[Bb]utton[^>]*>([^<]+?)</[Bb]utton>',  # Button text
    'string_literal': r'["\']([A-Z][^"\']{5,})["\']',  # String literals starting with capital
    'toast_message': r'toast\.(success|error|info|warning)\(["\']([^"\']+)["\']',  # Toast messages
}

# Strings to exclude (not user-facing)
EXCLUSIONS = [
    'className', 'onClick', 'onChange', 'onSubmit', 'useState', 'useEffect',
    'margin', 'padding', 'display', 'flex', 'grid', 'absolute', 'relative',
    'primary', 'secondary', 'transparent', 'inherit', 'none', 'auto',
    'text-', 'bg-', 'border-', 'rounded-', 'shadow-', 'hover:', 'focus:',
    'http', 'https', 'www', '.com', '.ch', 'api/', '/api', 'Bearer',
    'Content-Type', 'application/json', 'Authorization',
    'React', 'Component', 'Fragment', 'useState', 'useEffect',
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
    'width', 'height', 'left', 'right', 'top', 'bottom', 'center',
    'Arial', 'Helvetica', 'sans-serif', 'serif', 'monospace',
]

# File extensions to scan
EXTENSIONS = ('.jsx', '.js', '.tsx', '.ts')

# Paths to exclude
EXCLUDE_PATHS = [
    'node_modules', 'build', 'dist', '.git', 'coverage',
    'locales', 'test', '__tests__', '__mocks__', '.test.', '.spec.'
]

def should_exclude_file(filepath):
    """Check if file should be excluded from scanning"""
    path_str = str(filepath)
    return any(excl in path_str for excl in EXCLUDE_PATHS)

def should_exclude_text(text):
    """Check if text should be excluded (not user-facing)"""
    if not text or len(text.strip()) < 3:
        return True

    # Check against exclusion list
    for excl in EXCLUSIONS:
        if excl.lower() in text.lower():
            return True

    # Exclude if mostly symbols/numbers
    if re.match(r'^[^a-zA-Z]*$', text):
        return True

    # Exclude if it's a variable name or CSS class
    if re.match(r'^[a-z][a-zA-Z0-9_-]*$', text):
        return True

    # Exclude URLs
    if 'http' in text or '.com' in text or '.ch' in text:
        return True

    return False

def has_i18n_import(content):
    """Check if file imports i18n functionality"""
    i18n_patterns = [
        r'useTranslation',
        r'import.*Trans.*from.*react-i18next',
        r'import.*i18n',
        r'from\s+["\']react-i18next["\']',
        r'\.t\(',
    ]
    return any(re.search(pattern, content) for pattern in i18n_patterns)

def extract_hardcoded_text(filepath):
    """Extract all hardcoded text from a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, f"Error reading file: {e}"

    findings = []
    lines = content.split('\n')

    has_i18n = has_i18n_import(content)

    # Scan for each pattern
    for pattern_name, pattern in PATTERNS.items():
        for match in re.finditer(pattern, content):
            # Get the text group (usually last group)
            text = match.group(len(match.groups()))

            if should_exclude_text(text):
                continue

            # Find line number
            line_num = content[:match.start()].count('\n') + 1

            findings.append({
                'line': line_num,
                'text': text.strip(),
                'pattern': pattern_name,
                'context': lines[line_num - 1].strip()[:100]
            })

    return {
        'has_i18n': has_i18n,
        'findings': findings
    }, None

def scan_directory(root_path):
    """Scan entire directory for hardcoded text"""
    results = defaultdict(dict)
    stats = {
        'total_files': 0,
        'files_with_hardcoded': 0,
        'files_without_i18n': 0,
        'total_hardcoded_strings': 0
    }

    root = Path(root_path)

    for filepath in root.rglob('*'):
        if not filepath.is_file():
            continue

        if filepath.suffix not in EXTENSIONS:
            continue

        if should_exclude_file(filepath):
            continue

        stats['total_files'] += 1

        result, error = extract_hardcoded_text(filepath)

        if error:
            print(f"Error scanning {filepath}: {error}")
            continue

        if result['findings']:
            rel_path = filepath.relative_to(root)
            results[str(rel_path)] = result
            stats['files_with_hardcoded'] += 1
            stats['total_hardcoded_strings'] += len(result['findings'])

            if not result['has_i18n']:
                stats['files_without_i18n'] += 1

    return results, stats

def categorize_findings(results):
    """Categorize findings by type"""
    categories = defaultdict(list)

    for filepath, data in results.items():
        for finding in data['findings']:
            categories[finding['pattern']].append({
                'file': filepath,
                'line': finding['line'],
                'text': finding['text']
            })

    return categories

def generate_report(results, stats, output_file):
    """Generate detailed markdown report"""

    # Categorize findings
    categories = categorize_findings(results)

    # Sort files by number of findings
    sorted_files = sorted(
        results.items(),
        key=lambda x: len(x[1]['findings']),
        reverse=True
    )[:30]  # Top 30 files

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Comprehensive Hardcoded Text Analysis - SwissAI Tax Frontend\n\n")
        f.write("## Executive Summary\n\n")
        f.write(f"- **Total Files Scanned**: {stats['total_files']}\n")
        f.write(f"- **Files with Hardcoded Text**: {stats['files_with_hardcoded']}\n")
        f.write(f"- **Files WITHOUT i18n Import**: {stats['files_without_i18n']}\n")
        f.write(f"- **Total Hardcoded Strings Found**: {stats['total_hardcoded_strings']}\n\n")

        # Percentage
        if stats['total_files'] > 0:
            pct = (stats['files_with_hardcoded'] / stats['total_files']) * 100
            f.write(f"- **Percentage of Files with Hardcoded Text**: {pct:.1f}%\n\n")

        f.write("---\n\n")

        # Top files with most hardcoded text
        f.write("## Top 30 Files with Most Hardcoded Text\n\n")
        f.write("| Rank | File | Count | Has i18n | Priority |\n")
        f.write("|------|------|-------|----------|----------|\n")

        for idx, (filepath, data) in enumerate(sorted_files, 1):
            count = len(data['findings'])
            has_i18n = "✅" if data['has_i18n'] else "❌"
            priority = "🔴 HIGH" if not data['has_i18n'] else "🟡 MEDIUM"
            f.write(f"| {idx} | `{filepath}` | {count} | {has_i18n} | {priority} |\n")

        f.write("\n---\n\n")

        # Category breakdown
        f.write("## Findings by Category\n\n")
        for pattern, items in sorted(categories.items(), key=lambda x: len(x[1]), reverse=True):
            f.write(f"### {pattern.replace('_', ' ').title()} ({len(items)} occurrences)\n\n")

            # Show first 20 examples
            for item in items[:20]:
                f.write(f"- **{item['file']}:{item['line']}** - `{item['text']}`\n")

            if len(items) > 20:
                f.write(f"\n_... and {len(items) - 20} more_\n")

            f.write("\n")

        f.write("---\n\n")

        # Detailed file-by-file breakdown
        f.write("## Detailed File-by-File Analysis\n\n")

        for filepath, data in sorted_files:
            f.write(f"### `{filepath}`\n\n")
            f.write(f"- **Total Hardcoded Strings**: {len(data['findings'])}\n")
            f.write(f"- **Has i18n Import**: {'Yes ✅' if data['has_i18n'] else 'No ❌'}\n\n")

            if not data['has_i18n']:
                f.write("**⚠️ ACTION REQUIRED**: This file needs to import `useTranslation` from `react-i18next`\n\n")

            f.write("#### Hardcoded Text Found:\n\n")
            f.write("| Line | Pattern | Text | Suggested Key |\n")
            f.write("|------|---------|------|---------------|\n")

            for finding in data['findings'][:50]:  # Limit to 50 per file
                # Generate suggested translation key
                text = finding['text']
                key_suggestion = generate_translation_key(text)

                f.write(f"| {finding['line']} | {finding['pattern']} | `{text[:50]}...` | `{key_suggestion}` |\n")

            f.write("\n")

        f.write("\n---\n\n")
        f.write("## Recommendations\n\n")
        f.write("1. **Priority 1 (High)**: Files without i18n imports - {}\n".format(stats['files_without_i18n']))
        f.write("2. **Priority 2 (Medium)**: Files with i18n imports but hardcoded text - {}\n".format(
            stats['files_with_hardcoded'] - stats['files_without_i18n']))
        f.write("\n")
        f.write("### Implementation Steps:\n\n")
        f.write("1. Add `useTranslation` hook to files without i18n\n")
        f.write("2. Replace hardcoded text with `t('translation.key')`\n")
        f.write("3. Add missing translations to `/src/locales/{en,de,fr,it}/translation.json`\n")
        f.write("4. Test all languages to ensure translations work\n")

def generate_translation_key(text):
    """Generate a suggested translation key from text"""
    # Take first few words
    words = re.findall(r'\b\w+\b', text.lower())[:4]
    key = '_'.join(words)

    # Clean up
    key = re.sub(r'[^a-z0-9_]', '', key)

    return key[:50]

def main():
    src_path = '/home/cn/Desktop/HomeAiCode/swissai-tax/src'
    output_file = '/home/cn/Desktop/HomeAiCode/swissai-tax/HARDCODED_TEXT_ANALYSIS.md'

    print("🔍 Scanning SwissAI Tax frontend for hardcoded text...")
    print(f"📁 Source path: {src_path}")

    results, stats = scan_directory(src_path)

    print(f"\n✅ Scan complete!")
    print(f"   - Total files scanned: {stats['total_files']}")
    print(f"   - Files with hardcoded text: {stats['files_with_hardcoded']}")
    print(f"   - Total hardcoded strings: {stats['total_hardcoded_strings']}")

    print(f"\n📝 Generating report...")
    generate_report(results, stats, output_file)

    print(f"✅ Report saved to: {output_file}")

    # Also save raw JSON
    json_file = output_file.replace('.md', '.json')
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({
            'stats': stats,
            'results': results
        }, f, indent=2, ensure_ascii=False)

    print(f"✅ Raw data saved to: {json_file}")

if __name__ == '__main__':
    main()
