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


# ── main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    # 1. Read and validate env vars
    property_id = os.environ.get("GA4_PROPERTY_ID", "").strip()
    key_json_str = os.environ.get("GA4_SERVICE_ACCOUNT_KEY", "").strip()

    if not property_id or not key_json_str:
        print("⚠ GA4_PROPERTY_ID or GA4_SERVICE_ACCOUNT_KEY not set — skipping.")
        sys.exit(0)

    # AppSec advisory: strip() before match, and require digits-only (no newline tricks)
    if not re.match(r"^\d+$", property_id):
        print(f"✗ GA4_PROPERTY_ID is not a numeric string: '{property_id[:8]}…' — aborting.")
        sys.exit(1)

    # 2. Parse service-account key — in-memory only, never logged
    try:
        key_info = json.loads(key_json_str)
    except json.JSONDecodeError as exc:
        print(f"✗ GA4_SERVICE_ACCOUNT_KEY is not valid JSON: {exc}")
        sys.exit(1)

    # 3. Fetch metrics
    try:
        token = _get_access_token(key_info)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        users_today = _run_report(token, property_id, today_str, today_str)
        users_28d   = _run_report(token, property_id, "28daysAgo", "today")
        synced_at   = datetime.now(timezone.utc).isoformat()
        print(f"✓ GA4 fetched — users today: {users_today} · last 28 d: {users_28d}")
    except Exception as exc:  # noqa: BLE001
        print(f"✗ GA4 API call failed (non-fatal): {type(exc).__name__}: {exc}")
        sys.exit(0)  # do not fail CI; leave stats.json unchanged

    # 4. Merge into existing stats.json
    stats_path = "public/content/stats.json"
    if not os.path.exists(stats_path):
        print(f"✗ {stats_path} not found — run scripts/sync-stats.py first.")
        sys.exit(1)

    with open(stats_path, encoding="utf-8") as f:
        stats = json.load(f)

    stats["audience"] = {
        "users_today": users_today,
        "users_28d":   users_28d,
        "synced_at":   synced_at,
    }

    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
        f.write("\n")

    print(f"✓ {stats_path} updated with audience data.")


if __name__ == "__main__":
    main()
