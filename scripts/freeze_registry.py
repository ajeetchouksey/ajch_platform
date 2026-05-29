#!/usr/bin/env python3
"""
Regenerate public/content/agents/registry.json from .github/agents/*.agent.md.
Usage: python3 scripts/freeze_registry.py <date> <platform_version>
Used by .github/workflows/release.yml step 9 and agents-validate.yml.
"""
import json
import os
import re
import sys


def extract(content: str, field: str) -> str:
    match = re.search(rf"^{field}:\s*(.+)", content, re.MULTILINE)
    return match.group(1).strip().strip('"') if match else ""


def build_registry(date: str, platform_version: str) -> dict:
    agents = []
    for fname in sorted(os.listdir(".github/agents")):
        if not fname.endswith(".agent.md"):
            continue
        with open(f".github/agents/{fname}", encoding="utf-8") as fh:
            content = fh.read()
        agents.append(
            {
                "file": fname,
                "name": extract(content, "name"),
                "version": extract(content, "version"),
                "last_modified": extract(content, "last_modified"),
            }
        )
    return {
        "schema": "1.0",
        "platform_version": platform_version,
        "generated": date,
        "note": (
            "Auto-updated by agents-validate.yml on push to main. "
            "Frozen into each GitHub Release by release.yml."
        ),
        "agents": agents,
    }


if __name__ == "__main__":
    date, platform_version = sys.argv[1], sys.argv[2]
    registry = build_registry(date, platform_version)
    os.makedirs("public/content/agents", exist_ok=True)
    with open("public/content/agents/registry.json", "w") as fh:
        json.dump(registry, fh, indent=2)
        fh.write("\n")
    print(f"Registry written: {len(registry['agents'])} agents, platform v{platform_version}")
