#!/usr/bin/env python3
"""Fetch GA4 user metrics and merge into public/content/stats.json.

Requires environment variables:
  GA4_PROPERTY_ID          — numeric GA4 property ID (e.g. "123456789")
  GA4_SERVICE_ACCOUNT_KEY  — JSON string of a service account credentials file

When either variable is absent the script exits cleanly with a warning;
stats.json is left unchanged so local dev and non-secrets CI runs are safe.

Invoked by .github/workflows/analytics-sync.yml every 2 hours.
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone


# AppSec: allowlist for GA4-sourced path keys written to stats.json
PATH_PATTERN = re.compile(r"^\/[a-zA-Z0-9\-._~/]*$")

# ── helpers ────────────────────────────────────────────────────────────────────

def _get_access_token(key_info: dict) -> str:
    """Exchange a service-account key for a short-lived OAuth2 bearer token."""
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as GoogleRequest

    creds = service_account.Credentials.from_service_account_info(
        key_info,
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    creds.refresh(GoogleRequest())
    return creds.token  # type: ignore[return-value]


def _run_report(token: str, property_id: str, start_date: str, end_date: str) -> int:
    """Call GA4 Data API runReport; return activeUsers count."""
    url = (
        f"https://analyticsdata.googleapis.com/v1beta/"
        f"properties/{property_id}:runReport"
    )
    payload = json.dumps(
        {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "metrics": [{"name": "activeUsers"}],
        }
    ).encode()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=payload, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
    rows = data.get("rows", [])
    return int(rows[0]["metricValues"][0]["value"]) if rows else 0


def _run_page_views_report(
    token: str,
    property_id: str,
    start_date: str,
    end_date: str,
    max_pages: int = 50,
) -> dict:
    """Fetch per-page screenPageViews + weighted avg engagement duration.

    Returns {"total": int, "avgEngagementDurationSecs": int, "byPath": {...}}.
    AppSec: path keys are allowlist-filtered via PATH_PATTERN before write.
    """
    url = (
        f"https://analyticsdata.googleapis.com/v1beta/"
        f"properties/{property_id}:runReport"
    )
    payload = json.dumps(
        {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "dimensions": [{"name": "pagePath"}],
            "metrics": [
                {"name": "screenPageViews"},
                {"name": "averageSessionDuration"},
            ],
            "limit": max_pages,
            "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
        }
    ).encode()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=payload, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
    rows = data.get("rows", [])
    by_path: dict[str, int] = {}
    total_views = 0
    weighted_duration = 0.0
    for row in rows:
        path = row["dimensionValues"][0]["value"]
        views = int(row["metricValues"][0]["value"])
        duration = float(row["metricValues"][1]["value"])
        # AppSec: skip path keys that don't match the safe allowlist
        if not PATH_PATTERN.match(path):
            continue
        by_path[path] = views
        total_views += views
        weighted_duration += duration * views
    avg_secs = int(weighted_duration / total_views) if total_views > 0 else 0
    return {"total": total_views, "avgEngagementDurationSecs": avg_secs, "byPath": by_path}


# ── main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    # 1. Read env vars
    property_id  = os.environ.get("GA4_PROPERTY_ID", "").strip()
    key_json_str = os.environ.get("GA4_SERVICE_ACCOUNT_KEY", "").strip()

    if not property_id and not key_json_str:
        print("⚠ No analytics secrets configured — skipping.")
        sys.exit(0)

    # 2. Load existing stats.json first (needed for fallback values)
    stats_path = "public/content/stats.json"
    if not os.path.exists(stats_path):
        print(f"✗ {stats_path} not found — run scripts/sync-stats.py first.")
        sys.exit(1)

    with open(stats_path, encoding="utf-8") as f:
        stats = json.load(f)

    existing_audience = stats.get("audience", {})
    synced_at = datetime.now(timezone.utc).isoformat()

    # ── GA4 section ──────────────────────
    ga4_ok = False
    users_today: int | None = None
    users_28d:   int | None = None
    page_views:  dict | None = None

    if property_id and key_json_str:
        if not re.match(r"^\d+$", property_id):
            print(f"✗ GA4_PROPERTY_ID is not numeric: '{property_id[:8]}…' — skipping GA4.")
        else:
            try:
                key_info = json.loads(key_json_str)
            except json.JSONDecodeError as exc:
                print(f"✗ GA4_SERVICE_ACCOUNT_KEY invalid JSON: {exc} — skipping GA4.")
                key_info = None
            if key_info:
                try:
                    token = _get_access_token(key_info)
                    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                    users_today = _run_report(token, property_id, today_str, today_str)
                    users_28d   = _run_report(token, property_id, "28daysAgo", "today")
                    page_views  = _run_page_views_report(token, property_id, "2026-05-01", today_str)
                    ga4_ok = True
                    print(
                        f"✓ GA4 — users today: {users_today} · 28d: {users_28d}"
                        f" · page views: {page_views['total']}"
                    )
                except Exception as exc:  # noqa: BLE001
                    print(f"✗ GA4 API call failed (non-fatal): {type(exc).__name__}")
    else:
        print("⚠ GA4 env vars absent — skipping GA4.")

    # ── Write to public stats gist ────────────────────────────────────────
    gist_token = os.environ.get("GIST_TOKEN", "").strip()
    gist_id    = os.environ.get("PUBLIC_STATS_GIST_ID", "").strip()

    if not gist_token or not gist_id:
        print("⚠ GIST_TOKEN or PUBLIC_STATS_GIST_ID not set — falling back to stats.json write.")
        # Fallback: write to stats.json (local dev)
        stats["audience"] = {
            "users_today": users_today if ga4_ok else existing_audience.get("users_today"),
            "users_28d":   users_28d   if ga4_ok else existing_audience.get("users_28d"),
            "synced_at":   synced_at,
        }
        if ga4_ok and page_views:
            stats["pageViews"] = {
                "dateFrom":                  "2026-05-01",
                "total":                     page_views["total"],
                "avgEngagementDurationSecs": page_views["avgEngagementDurationSecs"],
                "byPath":                    page_views["byPath"],
                "synced_at":                 synced_at,
            }
        with open(stats_path, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2)
            f.write("\n")
        print(f"✓ {stats_path} updated (local fallback).")
        return

    # Read existing gist to preserve subscriber counts
    gist_url = f"https://api.github.com/gists/{gist_id}"
    gist_headers = {
        "Authorization": f"Bearer {gist_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "aarya-analytics-sync/1.0",
    }
    try:
        req = urllib.request.Request(gist_url, headers=gist_headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            gist_data = json.loads(resp.read())
        existing_content = json.loads(
            gist_data["files"]["aarya-stats.json"]["content"]
        )
    except Exception as exc:  # noqa: BLE001
        print(f"✗ Failed to read gist: {type(exc).__name__} — aborting.")
        sys.exit(1)

    # Merge GA4 data into gist content (preserve email_count, gh_count)
    existing_content["users_today"] = users_today if ga4_ok else existing_content.get("users_today")
    existing_content["users_28d"]   = users_28d   if ga4_ok else existing_content.get("users_28d")
    if ga4_ok and page_views:
        existing_content["page_views"] = {
            "date_from":            "2026-05-01",
            "total":                page_views["total"],
            "avg_engagement_secs": page_views["avgEngagementDurationSecs"],
            "by_path":              page_views["byPath"],
        }
    existing_content["synced_at"] = synced_at

    # Write back to gist
    patch_payload = json.dumps({
        "files": {
            "aarya-stats.json": {
                "content": json.dumps(existing_content, indent=2)
            }
        }
    }).encode()
    patch_req = urllib.request.Request(
        gist_url, data=patch_payload, headers={**gist_headers, "Content-Type": "application/json"},
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(patch_req, timeout=15) as resp:
            if resp.status == 200:
                print(f"✓ Gist {gist_id} updated with GA4 stats.")
            else:
                print(f"✗ Gist update returned HTTP {resp.status}")
                sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print(f"✗ Failed to write gist: {type(exc).__name__}")
        sys.exit(1)


if __name__ == "__main__":
    main()
