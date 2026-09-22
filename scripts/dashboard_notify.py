"""Decide which new feed items are worth a push.

The dashboard strip shows at most five cards for the current month
(Asia/Kolkata), newest date first, skipping academic-content rows.
A new link that does not land in that strip is stored in the feed
and does not send a notification.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

DASHBOARD_MAX_ITEMS = 5
APP_TZ = ZoneInfo("Asia/Kolkata")
ACADEMIC_CATEGORY = "Academic Content Update"


def previous_month_key(key: str) -> str:
    year = int(key[0:4])
    month = int(key[5:7]) - 1
    if month == 0:
        year -= 1
        month = 12
    return f"{year:04d}-{month:02d}"


def dashboard_visible_items(months, *, now=None, max_items=DASHBOARD_MAX_ITEMS):
    """Match pickDashboardUpdates in src/services/updatesService.js."""
    now = now or datetime.now(APP_TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=APP_TZ)
    else:
        now = now.astimezone(APP_TZ)
    current_key = now.strftime("%Y-%m")
    prev_key = previous_month_key(current_key)
    months = months if isinstance(months, dict) else {}

    def usable(items):
        kept = []
        for item in items or []:
            if not isinstance(item, dict):
                continue
            if item.get("category") == ACADEMIC_CATEGORY:
                continue
            kept.append(item)
        return kept

    current = usable(months.get(current_key))
    if current:
        chosen = current
    else:
        previous = usable(months.get(prev_key))
        if previous:
            chosen = previous
        else:
            chosen = []
            for items in months.values():
                if isinstance(items, list):
                    chosen.extend(usable(items))

    chosen.sort(key=lambda item: str(item.get("date") or ""), reverse=True)
    return chosen[:max_items]


def links_worth_notifying(months, candidates, *, now=None):
    visible_links = {
        item.get("link")
        for item in dashboard_visible_items(months, now=now)
        if item.get("link")
    }
    kept = []
    for item in candidates or []:
        link = item.get("link") if isinstance(item, dict) else None
        if link and link in visible_links:
            kept.append(item)
    return kept


def _self_check():
    now = datetime(2026, 9, 22, 15, 0, tzinfo=APP_TZ)
    months = {
        "2026-09": [
            {"date": "2026-09-21", "link": "formulary"},
            {"date": "2026-09-18", "link": "ncd"},
            {"date": "2026-09-17", "link": "cctv"},
            {"date": "2026-09-17", "link": "stem"},
            {"date": "2026-09-17", "link": "pv"},
            {"date": "2026-09-17", "link": "handbook"},
            {
                "date": "2026-09-22",
                "link": "academic",
                "category": ACADEMIC_CATEGORY,
            },
        ]
    }
    visible = [item["link"] for item in dashboard_visible_items(months, now=now)]
    assert visible == ["formulary", "ncd", "cctv", "stem", "pv"], visible
    assert links_worth_notifying(
        months, [{"link": "handbook"}], now=now
    ) == []
    newest = links_worth_notifying(
        months, [{"link": "formulary"}], now=now
    )
    assert newest[0]["link"] == "formulary"
    print("dashboard_notify self-check ok")


if __name__ == "__main__":
    _self_check()
