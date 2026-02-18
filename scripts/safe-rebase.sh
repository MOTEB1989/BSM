#!/usr/bin/env bash
set -euo pipefail

# Safe update helper: enforces a clean working tree before pull --rebase.
# مساعد تحديث آمن: يضمن نظافة الشجرة قبل تنفيذ rebase.

TARGET_REMOTE="${1:-origin}"
TARGET_BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"

ensure_clean_tree() {
  local status_output
  status_output="$(git status --porcelain)"

  if [[ -n "$status_output" ]]; then
    echo "❌ Working tree is not clean."
    echo "Please create a clear WIP commit before syncing (no anonymous stash)."
    echo
    echo "Suggested command:"
    echo "  git add -A && git commit -m \"chore(wip): checkpoint before rebase\""
    echo
    echo "Current pending changes:"
    printf '%s\n' "$status_output"
    exit 1
  fi
}

ensure_remote_exists() {
  if ! git remote get-url "$TARGET_REMOTE" >/dev/null 2>&1; then
    echo "⚠️ Remote '$TARGET_REMOTE' is not configured. Skipping update/rebase."
    exit 0
  fi
}

sync_branch() {
  echo "➡️ Fetching '$TARGET_REMOTE'..."
  git fetch "$TARGET_REMOTE"

  echo "➡️ Rebasing current branch on '$TARGET_REMOTE/$TARGET_BRANCH'..."
  git pull --rebase "$TARGET_REMOTE" "$TARGET_BRANCH"
}

run_tests_if_available() {
  if [[ -x "./scripts/verify-repo-integrity.sh" ]]; then
    echo "➡️ Running repository integrity checks..."
    ./scripts/verify-repo-integrity.sh
  else
    echo "⚠️ No post-update validation script found at ./scripts/verify-repo-integrity.sh"
  fi
}

main() {
  ensure_clean_tree
  ensure_remote_exists
  sync_branch
  run_tests_if_available

  echo "✅ Update + checks completed. Continue with small, clear commits."
}

main "$@"
