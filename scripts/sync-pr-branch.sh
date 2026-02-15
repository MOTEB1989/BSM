#!/usr/bin/env bash
set -euo pipefail

# sync-pr-branch.sh
# Arabic/English: مزامنة الفرع الحالي مع الفرع الأساسي لتقليل تعارضات الدمج.
# This script keeps your feature branch up to date with the base branch to reduce merge conflicts.

REMOTE="${REMOTE:-origin}"
BASE_BRANCH="${BASE_BRANCH:-}"
SYNC_MODE="${SYNC_MODE:-rebase}" # rebase | merge

usage() {
  cat <<USAGE
Usage:
  scripts/sync-pr-branch.sh [--remote origin] [--base main] [--mode rebase|merge]

Examples:
  scripts/sync-pr-branch.sh --base main --mode rebase
  REMOTE=upstream BASE_BRANCH=main scripts/sync-pr-branch.sh

Environment variables:
  REMOTE       Git remote name (default: origin)
  BASE_BRANCH  Base branch name (auto-detected if empty)
  SYNC_MODE    rebase or merge (default: rebase)
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE="$2"; shift 2 ;;
    --base)
      BASE_BRANCH="$2"; shift 2 ;;
    --mode)
      SYNC_MODE="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not inside a git repository." >&2
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" == "HEAD" ]]; then
  echo "❌ Detached HEAD is not supported. Checkout a branch first." >&2
  exit 1
fi

if [[ -z "$BASE_BRANCH" ]]; then
  # Try remote default branch first, then fallback.
  BASE_BRANCH="$(git remote show "$REMOTE" 2>/dev/null | sed -n '/HEAD branch/s/.*: //p' || true)"
  BASE_BRANCH="${BASE_BRANCH:-main}"
fi

if [[ "$SYNC_MODE" != "rebase" && "$SYNC_MODE" != "merge" ]]; then
  echo "❌ Invalid mode: $SYNC_MODE (allowed: rebase|merge)" >&2
  exit 1
fi

echo "🔄 Fetching $REMOTE..."
git fetch "$REMOTE" --prune

base_ref="$REMOTE/$BASE_BRANCH"
if ! git show-ref --verify --quiet "refs/remotes/$base_ref"; then
  echo "❌ Base ref '$base_ref' not found. Check remote/branch name." >&2
  exit 1
fi

if [[ "$current_branch" == "$BASE_BRANCH" ]]; then
  echo "ℹ️ You are on base branch '$BASE_BRANCH'. Nothing to sync."
  exit 0
fi

echo "📌 Current branch : $current_branch"
echo "📌 Base branch    : $base_ref"

if [[ "$SYNC_MODE" == "rebase" ]]; then
  echo "🚚 Rebase in progress..."
  git rebase "$base_ref"
else
  echo "🔀 Merge in progress..."
  git merge --no-ff "$base_ref"
fi

behind_count="$(git rev-list --count "$current_branch..$base_ref" || echo 0)"
ahead_count="$(git rev-list --count "$base_ref..$current_branch" || echo 0)"

echo "✅ Sync complete."
echo "   Ahead of base : $ahead_count commit(s)"
echo "   Behind base   : $behind_count commit(s)"

echo "💡 Next: run tests, then push with: git push --force-with-lease (if rebased)"
