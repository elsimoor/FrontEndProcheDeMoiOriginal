#!/usr/bin/env python3
"""
Utility script to help developers maintain the translation catalogue.

This script scans the frontend codebase for calls to the `t()` translation
function and compares the discovered keys against the defined entries in
`lib/i18n.ts`.  It reports any keys that are used in the code but missing
translations for English or French.  Optionally, it can also print out
where in the code each missing key appears.

Usage:
  python scripts/check_translations.py [--show-usages]

If --show-usages is passed the script will print the file and line number
for each occurrence of a missing key.  Otherwise it will simply list the
keys missing for each locale.

This tool is intended to be run from the root of the repository and does
not require any external dependencies.
"""

import argparse
import os
import re
from typing import Dict, List, Set, Tuple


def load_translation_keys(file_path: str) -> Dict[str, Set[str]]:
    """Parse the i18n.ts file and return a mapping of locale -> set of keys."""
    locales: Dict[str, Set[str]] = {}
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # The translations are declared as:
    # export const translations: Record<Locale, Record<string, string>> = {
    #   en: { ... },
    #   fr: { ... }
    # }
    # We use a simple regular expression to extract the text blocks for each locale.
    locale_pattern = re.compile(
        r"(?P<locale>\w+)\s*:\s*\{(?P<block>[\s\S]*?)\n\s*\},?",
        re.MULTILINE,
    )
    for match in locale_pattern.finditer(content):
        locale = match.group("locale")
        block = match.group("block")
        # Extract all keys up to the colon.  Keys may contain letters, numbers,
        # dots and hyphens.
        key_pattern = re.compile(r"([A-Za-z0-9_.-]+)\s*:")
        keys = set(key_pattern.findall(block))
        locales[locale] = keys
    return locales


def discover_used_keys(root: str) -> Tuple[Set[str], Dict[str, List[Tuple[str, int]]]]:
    """
    Traverse the frontend codebase looking for calls to t("key") or t('key').
    Returns a set of all discovered keys and a mapping of key -> list of
    occurrences (file path, line number).
    """
    used_keys: Set[str] = set()
    usages: Dict[str, List[Tuple[str, int]]] = {}
    # Regular expression to match translation calls.  We ignore dynamic
    # expressions inside the parentheses and only capture literal keys.
    trans_call_pattern = re.compile(
        r"\bt\(\s*[\"\']([^\"\'(){}]+)[\"\']\s*\)", re.MULTILINE
    )
    for dirpath, dirs, files in os.walk(root):
        # Skip node_modules and build outputs
        if "node_modules" in dirpath or ".next" in dirpath or ".git" in dirpath:
            continue
        for filename in files:
            if not filename.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            path = os.path.join(dirpath, filename)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
            except Exception:
                continue
            for line_no, line in enumerate(lines, start=1):
                for match in trans_call_pattern.finditer(line):
                    key = match.group(1)
                    used_keys.add(key)
                    usages.setdefault(key, []).append((path, line_no))
    return used_keys, usages


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Check for missing translation keys in the frontend codebase."
    )
    parser.add_argument(
        "--show-usages",
        action="store_true",
        help="Show where each missing key is used in the code",
    )
    args = parser.parse_args()

    i18n_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lib", "i18n.ts"
    )
    if not os.path.exists(i18n_file):
        print(f"Translation file not found at {i18n_file}.")
        return

    locales = load_translation_keys(i18n_file)
    if not locales:
        print("No locales found in the translation file.")
        return
    used_keys, usages = discover_used_keys(os.path.dirname(i18n_file))

    missing_by_locale: Dict[str, Set[str]] = {}
    for locale, keys in locales.items():
        missing_by_locale[locale] = used_keys - keys

    for locale, missing_keys in missing_by_locale.items():
        if not missing_keys:
            print(f"All keys have translations for locale '{locale}'.")
            continue
        print(f"\nMissing translations for locale '{locale}' (total {len(missing_keys)}):")
        for key in sorted(missing_keys):
            print(f"  {key}")
            if args.show_usages:
                for usage in usages.get(key, []):
                    print(f"    → {usage[0]}:{usage[1]}")

    # Optionally, identify keys defined in translations but never used.
    defined_keys = set().union(*locales.values())
    unused_keys = defined_keys - used_keys
    if unused_keys:
        print(
            f"\nTranslation keys defined but not used in code (total {len(unused_keys)}):"
        )
        for key in sorted(unused_keys):
            print(f"  {key}")


if __name__ == "__main__":
    main()