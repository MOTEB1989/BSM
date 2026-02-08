#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_paths=(
  "src/agents/CodeReviewAgent.js"
  "src/agents/PRMergeAgent.js"
  "src/agents/IntegrityAgent.js"
  "src/config/modelRouter.js"
  ".github/workflows/cf-deploy.yml"
  "docker-compose.hybrid.yml"
  "wrangler.toml"
)

missing=0

check_any() {
  local label="$1"
  shift
  for candidate in "$@"; do
    if [[ -e "$candidate" ]]; then
      echo "[OK] $label -> $candidate"
      return 0
    fi
  done
  echo "[MISSING] $label -> none of: $*"
  missing=$((missing + 1))
  return 1
}

echo "== BSM Repo Integrity Check =="
for path in "${required_paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "[OK] $path"
  else
    echo "[MISSING] $path"
    missing=$((missing + 1))
  fi
done

check_any "Security agent implementation" "src/agents/SecurityAgent.js" "src/agents/securityScanner.js"
check_any "Worker implementation" "src/workers" "src/agents/orbit"

if [[ -f "package.json" ]]; then
  package_size=$(wc -c < package.json | tr -d ' ')
  echo "package.json size: ${package_size} bytes"

  if [[ "$package_size" -lt 900 ]]; then
    echo "[WARN] package.json appears unusually small; verify dependencies are complete."
  else
    echo "[OK] package.json size is within expected range."
  fi
else
  echo "[MISSING] package.json"
  missing=$((missing + 1))
fi

if [[ "$missing" -gt 0 ]]; then
  echo "Result: FAILED (${missing} required checks missing)"
  exit 1
fi

echo "Result: PASSED"
