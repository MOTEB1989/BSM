#!/usr/bin/env bash
set -euo pipefail

# git-safe-push.sh
# Arabic/English: تنفيذ push بأمان مع منع --force افتراضيًا، والسماح بـ --force-with-lease فقط مع سبب موثق.
# Execute git push safely: block --force by default, allow --force-with-lease only with a documented reason.

REMOTE="origin"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
REASON=""
USE_FORCE_WITH_LEASE="false"
EXTRA_ARGS=()

usage() {
  cat <<USAGE
Usage:
  scripts/git-safe-push.sh [--remote origin] [--branch my-branch] [--reason "why"] [--force-with-lease] [-- <extra git push args>]

Examples:
  scripts/git-safe-push.sh
  scripts/git-safe-push.sh --remote origin --branch feature/x
  scripts/git-safe-push.sh --remote origin --branch feature/x --force-with-lease --reason "Rebased on origin/main after conflict resolution"

Policy:
  - --force is blocked.
  - --force-with-lease is allowed only when --reason is provided.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE="$2"; shift 2 ;;
    --branch)
      BRANCH="$2"; shift 2 ;;
    --reason)
      REASON="$2"; shift 2 ;;
    --force)
      echo "❌ Policy violation: --force is not allowed." >&2
      echo "   Use --force-with-lease with --reason only when strictly necessary." >&2
      exit 1 ;;
    --force-with-lease)
      USE_FORCE_WITH_LEASE="true"; shift ;;
    --)
      shift
      EXTRA_ARGS+=("$@")
      break ;;
    -h|--help)
      usage
      exit 0 ;;
    *)
      EXTRA_ARGS+=("$1")
      shift ;;
  esac
done

if [[ -z "$BRANCH" || "$BRANCH" == "HEAD" ]]; then
  echo "❌ Invalid branch context. Checkout a local branch first." >&2
  exit 1
fi

if [[ "$USE_FORCE_WITH_LEASE" == "true" && -z "${REASON// }" ]]; then
  echo "❌ Policy violation: --force-with-lease requires --reason for auditability." >&2
  exit 1
fi

if [[ "$USE_FORCE_WITH_LEASE" == "true" ]]; then
  GIT_DIR="$(git rev-parse --git-dir 2>/dev/null || echo ".git")"
  mkdir -p "$GIT_DIR"
  printf '%s\t%s\t%s\t%s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$REMOTE" "$BRANCH" "$REASON" >> "$GIT_DIR/force-with-lease-audit.log"
  echo "⚠️ Exceptional push mode enabled: --force-with-lease"
  echo "📝 Reason documented: $REASON"
  exec git push --force-with-lease "$REMOTE" "$BRANCH" "${EXTRA_ARGS[@]}"
fi

exec git push "$REMOTE" "$BRANCH" "${EXTRA_ARGS[@]}"
