#!/usr/bin/env python3
"""Regenerate public/content/stats.json from actual content counts.

Usage: python3 scripts/sync-stats.py

Runs automatically after any content-agent write to keep home page stats
accurate. Also executed by agents-validate.yml on every push to main.
"""
import json
import os
import glob
import re
from datetime import date


def count_blog_posts() -> int:
    """Non-draft posts in blog/index.json."""
    path = "public/content/blog/index.json"
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return sum(1 for p in data.get("posts", []) if not p.get("draft", False))


def count_questions() -> int:
    """Sum of exam.questions across all exams in exams/index.json."""
    path = "public/content/exams/index.json"
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return sum(e.get("questions", 0) for e in data.get("exams", []))


def count_exams() -> int:
    """Count available exams."""
    path = "public/content/exams/index.json"
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return sum(1 for e in data.get("exams", []) if e.get("available", False))


def count_notes() -> int:
    return len(glob.glob("public/content/notes/*.md"))


def count_scenarios() -> int:
    return len(glob.glob("public/content/scenarios/*.json"))


def count_agents() -> int:
    path = "public/content/agents/registry.json"
    if not os.path.exists(path):
        return len(glob.glob(".github/agents/*.agent.md"))
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return len(data.get("agents", []))


def count_tools() -> int:
    """Count /tools/* sub-route entries in App.tsx."""
    path = "src/App.tsx"
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as f:
        content = f.read()
    return len(re.findall(r'path="/tools/[^"]+"', content))


if __name__ == "__main__":
    stats = {
        "schema": "1.0",
        "generated": str(date.today()),
        "note": "Auto-updated by scripts/sync-stats.py. Run after any content agent write.",
        "platform": {
            "blog_posts": count_blog_posts(),
            "questions":  count_questions(),
            "exams":      count_exams(),
            "notes":      count_notes(),
            "scenarios":  count_scenarios(),
            "agents":     count_agents(),
            "tools":      count_tools(),
        },
    }
    os.makedirs("public/content", exist_ok=True)
    out = "public/content/stats.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    p = stats["platform"]
    print(
        f"Stats written: {p['blog_posts']} posts · {p['questions']} questions · "
        f"{p['exams']} exams · {p['notes']} notes · {p['scenarios']} scenarios · "
        f"{p['agents']} agents · {p['tools']} tools"
    )
