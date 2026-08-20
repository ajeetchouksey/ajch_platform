#!/usr/bin/env python3
"""Regenerate public/content/stats.json from actual content counts.

Usage: python3 scripts/sync-stats.py

Runs automatically after any content-agent write to keep home page stats
accurate.
"""
import json
import os
import glob
import re
import urllib.error
import urllib.request
from datetime import date


def _load_blog_manifest() -> dict:
    """Load blog/index.json — from the CDN-promoted vertical repo if
    content-manifest.json has a `blog` entry (repo+sha), else the local
    public/content/blog/index.json (pre-migration fallback). Mirrors
    src/lib/content-manifest.ts's resolution rule."""
    manifest_path = "content-manifest.json"
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
        blog = manifest.get("blog", {})
        repo, sha = blog.get("repo"), blog.get("sha")
        if repo and sha:
            base_url = blog.get("baseUrl", "https://cdn.jsdelivr.net/gh").rstrip("/")
            url = f"{base_url}/{repo}@{sha}/content/blog/index.json"
            try:
                with urllib.request.urlopen(url, timeout=15) as resp:
                    return json.loads(resp.read())
            except (urllib.error.URLError, urllib.error.HTTPError) as exc:
                print(f"⚠ Failed to fetch {url}: {exc} — falling back to local.")

    local_path = "public/content/blog/index.json"
    if not os.path.exists(local_path):
        return {}
    with open(local_path, encoding="utf-8") as f:
        return json.load(f)


def count_blog_posts() -> int:
    """Non-draft posts in blog/index.json."""
    data = _load_blog_manifest()
    return sum(1 for p in data.get("posts", []) if not p.get("draft", False))


def _load_skillup_catalog() -> dict:
    """Load skillup/catalog.json — from the CDN-promoted vertical repo if
    content-manifest.json has a `skillup` entry (repo+sha), else the local
    public/content/skillup/catalog.json (pre-migration fallback). Mirrors
    src/lib/content-manifest.ts's resolution rule (same pattern as
    _load_blog_manifest() above)."""
    manifest_path = "content-manifest.json"
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
        skillup = manifest.get("skillup", {})
        repo, sha = skillup.get("repo"), skillup.get("sha")
        if repo and sha:
            base_url = skillup.get("baseUrl", "https://cdn.jsdelivr.net/gh").rstrip("/")
            url = f"{base_url}/{repo}@{sha}/content/skillup/catalog.json"
            try:
                with urllib.request.urlopen(url, timeout=15) as resp:
                    return json.loads(resp.read())
            except (urllib.error.URLError, urllib.error.HTTPError) as exc:
                print(f"⚠ Failed to fetch {url}: {exc} — falling back to local.")

    catalog = "public/content/skillup/catalog.json"
    if os.path.exists(catalog):
        with open(catalog, encoding="utf-8") as f:
            return json.load(f)
    return {}


def count_questions() -> int:
    """Sum of skill.questions across all skills in skillup/catalog.json.
    Falls back to legacy exams/index.json if catalog not yet generated."""
    data = _load_skillup_catalog()
    if data.get("exams"):
        return sum(e.get("questions", 0) for e in data["exams"])
    # legacy fallback
    path = "public/content/exams/index.json"
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return sum(e.get("questions", 0) for e in data.get("exams", []))


def count_exams() -> int:
    """Count available skills in skillup/catalog.json."""
    data = _load_skillup_catalog()
    if data.get("exams"):
        return sum(1 for e in data["exams"] if e.get("available", False))
    # legacy fallback
    path = "public/content/exams/index.json"
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return sum(1 for e in data.get("exams", []) if e.get("available", False))


def count_notes() -> int:
    """Count notes across all skills, from catalog.json's per-domain notesFile
    entries (works whether skillup is local or CDN-promoted). Falls back to a
    local glob, then a flat notes/ dir, if the catalog has no exams yet."""
    data = _load_skillup_catalog()
    if data.get("exams"):
        return sum(
            1 for e in data["exams"] for d in e.get("domains", []) if d.get("notesFile")
        )
    skillup_notes = glob.glob("public/content/skillup/*/notes/*.md")
    if skillup_notes:
        return len(skillup_notes)
    return len(glob.glob("public/content/notes/*.md"))


def count_scenarios() -> int:
    """Count scenarios across all skills, from catalog.json's scenarioFiles
    arrays (works whether skillup is local or CDN-promoted). Falls back to a
    local glob, then a flat scenarios/ dir, if the catalog has no exams yet."""
    data = _load_skillup_catalog()
    if data.get("exams"):
        return sum(len(e.get("scenarioFiles", [])) for e in data["exams"])
    skillup_scenarios = glob.glob("public/content/skillup/*/scenarios/*.json")
    if skillup_scenarios:
        return len(skillup_scenarios)
    return len(glob.glob("public/content/scenarios/*.json"))


def count_questions_in_files(question_files: list) -> int:
    """Count actual question objects across a list of question JSON paths."""
    total = 0
    for rel_path in question_files:
        abs_path = os.path.join("public", rel_path)
        if not os.path.exists(abs_path):
            # Try without "public/" prefix (some paths already include it)
            abs_path = rel_path
        if os.path.exists(abs_path):
            try:
                with open(abs_path, encoding="utf-8") as f:
                    total += len(json.load(f))
            except Exception:
                pass
    return total


def generate_catalog() -> None:
    """Auto-discover skillup/*/index.json, recount questions from actual files,
    update each index.json in place, then write skillup/catalog.json.
    This is the single source of truth — never hand-edit catalog.json.

    Once skillup is CDN-promoted (a `skillup` entry exists in
    content-manifest.json), this repo no longer holds the raw per-exam content
    this function operates on — recounting/regenerating moves to the vertical
    repo itself. Skip local regeneration entirely in that case rather than
    running against a directory that may no longer exist."""
    manifest_path = "content-manifest.json"
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
        skillup = manifest.get("skillup", {})
        if skillup.get("repo") and skillup.get("sha"):
            print("⚠ skillup is CDN-promoted — skipping local catalog regeneration.")
            return

    skill_files = sorted(glob.glob("public/content/skillup/*/index.json"))
    skills = []
    for path in skill_files:
        with open(path, encoding="utf-8") as f:
            skill = json.load(f)

        # Auto-recount questions from actual question JSON files
        q_files = skill.get("questionFiles", [])
        if q_files:
            actual_count = count_questions_in_files(q_files)
            if actual_count > 0 and skill.get("questions") != actual_count:
                print(f"  [{skill['id']}] questions: {skill.get('questions', '?')} → {actual_count}")
                skill["questions"] = actual_count
                # Write corrected count back to the source index.json
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(skill, f, indent=2)

        skills.append(skill)

    if not skills:
        return
    catalog = {
        "schemaVersion": "1.0",
        "generated": str(date.today()),
        "note": "Auto-generated by scripts/sync-stats.py from skillup/*/index.json. Do not edit manually.",
        "exams": skills,
    }
    os.makedirs("public/content/skillup", exist_ok=True)
    out = "public/content/skillup/catalog.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
    print(f"Catalog written: {len(skills)} skills → {out}")


def count_agents() -> int:
    """Count Claude Code subagent definitions. The old GitHub Copilot-format
    registry (public/content/agents/registry.json, sourced from
    .github/agents/*.agent.md) was retired when the platform consolidated
    onto Claude Code natively — see docs/agent-framework.md."""
    return len(glob.glob(".claude/agents/*.md"))


def count_tools() -> int:
    """Count /tools/* sub-route entries in App.tsx."""
    path = "src/App.tsx"
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as f:
        content = f.read()
    return len(re.findall(r'path="/tools/[^"]+"', content))


if __name__ == "__main__":
    # RC-4: regenerate skillup/catalog.json from per-skill index.json files first
    generate_catalog()
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
