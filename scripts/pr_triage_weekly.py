#!/usr/bin/env python3
"""Generate PR triage priorities and weekly summary from GitHub API."""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


P0_KEYWORDS = {
    "security", "cve", "vuln", "vulnerability", "hotfix", "outage", "incident",
    "production down", "auth bypass", "rce", "secret leak", "critical",
}
P1_KEYWORDS = {
    "release", "launch", "milestone", "go-live", "feature", "shipping", "beta",
    "roadmap", "docs", "documentation", "ci", "workflow",
}
CLOSE_REASON_KEYWORDS = {"wip", "draft", "experiment", "spike", "duplicate"}


def gh_get(url: str) -> Any:
    req = Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "wejdan-agent"})
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_pulls(repo: str, state: str, per_page: int = 100, limit: int | None = None) -> list[dict[str, Any]]:
    pulls: list[dict[str, Any]] = []
    page = 1
    while True:
        data = gh_get(f"https://api.github.com/repos/{repo}/pulls?state={state}&per_page={per_page}&page={page}")
        if not data:
            break
        pulls.extend(data)
        if limit and len(pulls) >= limit:
            return pulls[:limit]
        if len(data) < per_page:
            break
        page += 1
    return pulls


def classify(pr: dict[str, Any]) -> str:
    title = (pr.get("title") or "").lower()
    if any(k in title for k in P0_KEYWORDS):
        return "P0"
    labels = {lbl["name"].lower() for lbl in pr.get("labels", [])}
    if {"security", "sev0", "blocker"} & labels:
        return "P0"
    if any(k in title for k in P1_KEYWORDS) or {"release", "feature", "p1"} & labels:
        return "P1"
    return "P2"


def decision(pr: dict[str, Any], priority: str, now: dt.datetime) -> tuple[str, str]:
    title = (pr.get("title") or "").lower()
    age_days = (now - dt.datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))).days
    if pr.get("draft"):
        return "request changes", "PR مسودة (Draft) ويحتاج استكمال قبل الدمج"
    if priority == "P0":
        return "merge", "تصنيف P0 ولا تظهر مؤشرات تمنع الدمج السريع"
    if priority == "P1":
        if age_days > 30:
            return "request changes", "مرتبط بإطلاق لكن عمره مرتفع ويحتاج تحديث قبل الدمج"
        return "merge", "ميزة مرتبطة بالإطلاق وقابلة للدمج بعد مراجعة سريعة"
    if any(k in title for k in CLOSE_REASON_KEYWORDS) or age_days > 60:
        return "close", "PR غير حرج/قديم أو تجريبي؛ الإغلاق أفضل لتقليل الضوضاء"
    return "request changes", "تحسين غير حرج ويحتاج تنقيح قبل القرار النهائي"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="LexBANK/BSM")
    parser.add_argument("--open-limit", type=int, default=9)
    parser.add_argument("--output", default="reports/WEEKLY-PR-TRIAGE.md")
    args = parser.parse_args()

    now = dt.datetime.now(dt.timezone.utc)
    open_prs = fetch_pulls(args.repo, "open", limit=args.open_limit)
    open_prs.sort(key=lambda p: p["created_at"])

    triage_rows = []
    for pr in open_prs:
        prio = classify(pr)
        action, reason = decision(pr, prio, now)
        triage_rows.append({"number": pr["number"], "title": pr["title"], "priority": prio, "decision": action, "reason": reason})

    triage_rows.sort(key=lambda r: (r["priority"], r["number"]))

    closed_week = fetch_pulls(args.repo, "closed")
    week_ago = now - dt.timedelta(days=7)
    closed_count = 0
    merged_count = 0
    for pr in closed_week:
        closed_at = dt.datetime.fromisoformat(pr["closed_at"].replace("Z", "+00:00"))
        if closed_at >= week_ago:
            if pr.get("merged_at"):
                merged_count += 1
            else:
                closed_count += 1

    ages = []
    for pr in open_prs:
        created = dt.datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
        ages.append((now - created).days)
    avg_age = (sum(ages) / len(ages)) if ages else 0.0

    lines = [
        "# تقرير الفرز الأسبوعي للـ PRs",
        "",
        f"- المستودع: `{args.repo}`",
        f"- وقت التوليد (UTC): {now.isoformat()}",
        f"- عدد PRs المفتوحة (ضمن نطاق العمل): {len(open_prs)}",
        "",
        "## ترتيب التنفيذ (P0 ثم P1 ثم P2)",
        "",
        "| PR | الأولوية | قرار خلال 72 ساعة | السبب |",
        "|---|---|---|---|",
    ]

    for row in triage_rows:
        lines.append(
            f"| #{row['number']} - {row['title']} | {row['priority']} | **{row['decision']}** | {row['reason']} |"
        )

    lines.extend(
        [
            "",
            "## ملخص أسبوعي",
            "",
            f"- المفتوحة: **{len(open_prs)}**",
            f"- المغلقة (بدون دمج) خلال آخر 7 أيام: **{closed_count}**",
            f"- المدمجة خلال آخر 7 أيام: **{merged_count}**",
            f"- متوسط عمر PR المفتوح: **{avg_age:.1f} يوم**",
        ]
    )

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
