#!/usr/bin/env bash
set -euo pipefail

# sync-pr-branch.sh
# Arabic/English: مزامنة الفرع الحالي مع الفرع الأساسي لتقليل تعارضات الدمج.
# This script keeps your feature branch up to date with the base branch to reduce merge conflicts.

REMOTE="${REMOTE:-origin}"
BASE_BRANCH="${BASE_BRANCH:-}"
SYNC_MODE="${SYNC_MODE:-rebase}" # rebase | merge
CONTINUE_ONLY="false"
CHECK_COMMANDS=()

usage() {
  cat <<USAGE
Usage:
  scripts/sync-pr-branch.sh [--remote origin] [--base main] [--mode rebase|merge] [--check-cmd "npm run lint"]
  scripts/sync-pr-branch.sh --continue [--check-cmd "npm run lint"]

Examples:
  scripts/sync-pr-branch.sh --base main --mode rebase
  scripts/sync-pr-branch.sh --continue
  REMOTE=upstream BASE_BRANCH=main scripts/sync-pr-branch.sh

Environment variables:
  REMOTE       Git remote name (default: origin)
  BASE_BRANCH  Base branch name (auto-detected if empty)
  SYNC_MODE    rebase or merge (default: rebase)
  CHECK_COMMANDS  Optional local checks (repeat --check-cmd to add more)
USAGE
}

has_npm_script() {
  local script_name="$1"
  [[ -f package.json ]] || return 1

  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    process.exit(pkg.scripts && pkg.scripts['${script_name}'] ? 0 : 1);
  " >/dev/null 2>&1
}

run_local_checks() {
  local checks=()

  if [[ ${#CHECK_COMMANDS[@]} -gt 0 ]]; then
    checks=("${CHECK_COMMANDS[@]}")
  elif command -v npm >/dev/null 2>&1 && [[ -f package.json ]]; then
    if has_npm_script "lint"; then
      checks+=("npm run lint")
    fi
    if has_npm_script "test:unit"; then
      checks+=("npm run test:unit")
    elif has_npm_script "test"; then
      checks+=("npm test")
    fi
  fi

  if [[ ${#checks[@]} -eq 0 ]]; then
    echo "⚠️ No local lint/test commands configured. Skipping checks."
    return 0
  fi

  echo "🧪 Running local checks before completion..."
  for cmd in "${checks[@]}"; do
    echo "   ▶ $cmd"
    bash -lc "$cmd"
  done
}

continue_sync_after_conflicts() {
  if [[ -d .git/rebase-merge || -d .git/rebase-apply ]]; then
    echo "🔁 Rebase conflict resolution continue mode"
    run_local_checks
    git rebase --continue
    echo "✅ Rebase continued successfully after passing local checks."
    return 0
  fi

  if [[ -f .git/MERGE_HEAD ]]; then
    echo "🔁 Merge conflict resolution continue mode"
    run_local_checks
    git commit --no-edit
    echo "✅ Merge commit created successfully after passing local checks."
    return 0
  fi

  echo "❌ No active rebase/merge conflict state detected." >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE="$2"; shift 2 ;;
    --base)
      BASE_BRANCH="$2"; shift 2 ;;
    --mode)
      SYNC_MODE="$2"; shift 2 ;;
    --continue)
      CONTINUE_ONLY="true"; shift ;;
    --check-cmd)
      CHECK_COMMANDS+=("$2"); shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ "$CONTINUE_ONLY" == "true" ]]; then
  continue_sync_after_conflicts
  exit 0
fi

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
  if ! git rebase "$base_ref"; then
    cat <<EOF
⚠️ Rebase stopped due to conflicts.
Resolve conflicts manually file-by-file, then run:

  scripts/sync-pr-branch.sh --continue

This continue step runs local lint/tests before 'git rebase --continue'.
EOF
    exit 1
  fi
else
  echo "🔀 Merge in progress..."
  if ! git merge --no-ff "$base_ref"; then
    cat <<EOF
⚠️ Merge stopped due to conflicts.
Resolve conflicts manually file-by-file, then run:

  scripts/sync-pr-branch.sh --continue

This continue step runs local lint/tests before creating merge commit.
EOF
    exit 1
  fi
fi

run_local_checks

behind_count="$(git rev-list --count "$current_branch..$base_ref" || echo 0)"
ahead_count="$(git rev-list --count "$base_ref..$current_branch" || echo 0)"

echo "✅ Sync complete."
echo "   Ahead of base : $ahead_count commit(s)"
echo "   Behind base   : $behind_count commit(s)"

echo "💡 Next: push with: git push --force-with-lease (if rebased)"
