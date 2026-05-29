#!/usr/bin/env python3
"""
Extract a version section from CHANGELOG.md for release notes.
Usage: python3 scripts/extract_changelog.py <version> <path/to/CHANGELOG.md>
Used by .github/workflows/release.yml step 6.
"""
import re
import sys


def extract(version: str, path: str) -> str:
    with open(path, "r") as fh:
        content = fh.read()

    # Try exact version section first
    pattern = rf"## \[{re.escape(version)}\][^\n]*\n(.*?)(?=\n## \[|\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Fall back to Unreleased section
    pattern = r"## \[Unreleased\][^\n]*\n(.*?)(?=\n## \[|\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1).strip()

    return "See .github/CHANGELOG.md for full details."


if __name__ == "__main__":
    print(extract(sys.argv[1], sys.argv[2]))
