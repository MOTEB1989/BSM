#!/usr/bin/env python3
"""Suggest lightweight optimizations for *.agent.md files."""

from __future__ import annotations

import argparse
import glob
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def find_targets() -> list[Path]:
    paths = glob.glob("agents/*.agent.md") + glob.glob(".github/agents/*.agent.md")
    return [Path(p).resolve() for p in paths if Path(p).is_file()]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--pr-number", default="")
    args = parser.parse_args()

    optimize_needed = False
    suggestions: list[str] = []

    for path in find_targets():
        text = path.read_text(encoding="utf-8")
        if len(text) > 6000:
            optimize_needed = True
            suggestions.append(f"{path.relative_to(ROOT)} is large (>6KB): consider trimming prompt scope.")
        if "TODO" in text:
            optimize_needed = True
            suggestions.append(f"{path.relative_to(ROOT)} contains TODO markers.")

    if suggestions:
        print("Optimization suggestions:")
        for item in suggestions:
            print(f"- {item}")
    else:
        print("No optimization needed.")

    github_output = os.getenv("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as handle:
            handle.write(f"optimize_needed={'true' if optimize_needed else 'false'}\n")

    if args.dry_run:
        print(f"Dry-run mode enabled for PR #{args.pr_number or 'N/A'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
