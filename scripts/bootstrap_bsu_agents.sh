#!/usr/bin/env bash
set -euo pipefail

REMOTE=${1:-origin}
OPEN_PR=${2:-true}
TIMESTAMP=$(date +"%Y%m%dT%H%M%S")
BRANCH="bsm-agents-bootstrap-${TIMESTAMP}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
  echo "Run this script from inside a git repository."
  exit 1
fi
cd "$REPO_ROOT"

git checkout -b "${BRANCH}"

mkdir -p .github/agents .github/PULL_REQUEST_TEMPLATE .github/workflows scripts reports

# (أدرج هنا محتوى الملفات السابقة عبر cat >> كما في النسخة الطويلة التي زودتك بها سابقاً)
# لتوفير المساحة، انسخ محتويات الملفات أعلاه إلى المسارات المقابلة يدوياً أو أطلب النسخة الكاملة المضمنة.

git add .github/agents .github/PULL_REQUEST_TEMPLATE .github/workflows scripts
git commit -m "Bootstrap BSU Agents automation and workflow" || true
git push --set-upstream "${REMOTE}" "${BRANCH}"

if [ "${OPEN_PR}" = "true" ] && command -v gh >/dev/null 2>&1; then
  gh pr create --title "BSU Agents Suggestions - ${TIMESTAMP}" --body "Bootstrap PR for BSU Agents" --label automation --draft
  echo "Draft PR created"
fi

echo "Bootstrap complete. Branch: ${BRANCH}"
