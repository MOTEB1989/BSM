#!/usr/bin/env bash
# Bulk close PRs that cannot be merged due to conflicts.
# الغرض: إغلاق PRs المتعارضة بسرعة لتقليل الضوضاء في لوحات المتابعة.

set -euo pipefail

REPO="${REPO:-LexBANK/BSM}"
COMMENT="${COMMENT:-🔒 تم الإغلاق: PR يحتوي على تعارضات ولا يمكن دمجه}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <pr_number> [pr_number ...]"
  echo "Example: $0 282 274 251"
  exit 1
fi

for pr in "$@"; do
  echo "Closing PR #$pr in $REPO ..."
  gh pr close "$pr" --repo "$REPO" --comment "$COMMENT"
done

echo "Done: processed $# PR(s)."
