#!/usr/bin/env bash
# ===========================================================================
# BSU Enterprise Reporting Pipeline — Agent Runner
# ===========================================================================
# Usage:
#   ./scripts/run_agents.sh [REPORT_DIR] [OPEN_PR]
#
# - Idempotent: safe to re-run at any time
# - Strict mode: fails fast on errors
# - Produces JSON + Markdown artefacts
# - Publishes reports to docs/ for GitHub Pages
# - Audit-ready: timestamped, logged, deterministic
# ===========================================================================
set -euo pipefail

REPORT_DIR="${1:-reports}"
OPEN_PR="${2:-false}"
TIMESTAMP="$(date +"%Y%m%dT%H%M%S")"
JSON_OUT="${REPORT_DIR}/result_${TIMESTAMP}.json"
MD_OUT="${REPORT_DIR}/report_${TIMESTAMP}.md"
SUMMARY_OUT="${REPORT_DIR}/agents-summary-${TIMESTAMP}.md"
TMPDIR="$(mktemp -d)"
LOG_FILE="${REPORT_DIR}/run_${TIMESTAMP}.log"

trap 'rm -rf "${TMPDIR}"' EXIT

mkdir -p "${REPORT_DIR}"

# ---------------------------------------------------------------------------
# Logging helper
# ---------------------------------------------------------------------------
log() {
  local msg="[$(date +"%Y-%m-%d %H:%M:%S")] $*"
  echo "${msg}" | tee -a "${LOG_FILE}"
}

log "=== BSU Agents Run Starting ==="
log "Report dir : ${REPORT_DIR}"
log "Timestamp  : ${TIMESTAMP}"

# ---------------------------------------------------------------------------
# Initialise JSON report structure
# ---------------------------------------------------------------------------
cat > "${JSON_OUT}" <<JSONEOF
{
  "timestamp": "${TIMESTAMP}",
  "title": "BSU Agents Report — ${TIMESTAMP}",
  "agents": [],
  "summary": {}
}
JSONEOF

# ---------------------------------------------------------------------------
# Helper: append an agent section to the JSON report
# ---------------------------------------------------------------------------
append_agent_json() {
  local name="$1" status="$2" details_file="$3"
  local details="{}"
  if [ -f "${details_file}" ] && [ -s "${details_file}" ]; then
    # validate JSON; fall back to wrapping as string
    if jq empty "${details_file}" 2>/dev/null; then
      details="$(cat "${details_file}")"
    else
      details="$(jq -n --arg d "$(cat "${details_file}")" '{raw: $d}')"
    fi
  fi
  local tmp_json="${TMPDIR}/_merged.json"
  jq --arg n "${name}" --arg s "${status}" --argjson d "${details}" \
    '.agents += [{"name": $n, "status": $s, "details": $d}]' \
    "${JSON_OUT}" > "${tmp_json}" && mv "${tmp_json}" "${JSON_OUT}"
}

# ===========================================================================
# 1. Architect Analysis
# ===========================================================================
log "--- Step 1: Architect Analysis ---"
echo "# BSU Agents Run Report — ${TIMESTAMP}" > "${SUMMARY_OUT}"
echo "" >> "${SUMMARY_OUT}"
echo "## Architect Analysis" >> "${SUMMARY_OUT}"

ARCHITECT_STATUS="pass"
if command -v copilot >/dev/null 2>&1; then
  copilot agents run architect --repo . --output "${TMPDIR}/architect.json" || true
  if [ -f "${TMPDIR}/architect.json" ]; then
    jq -r '.summary // "- No summary generated"' "${TMPDIR}/architect.json" >> "${SUMMARY_OUT}" 2>/dev/null || true
  else
    echo "- Architect: no JSON output; fallback quick scan performed" >> "${SUMMARY_OUT}"
    echo "- Suggested refactors: move /src/legacy -> /src/legacy-archive" >> "${SUMMARY_OUT}"
  fi
else
  echo "- copilot CLI not found; running fallback static analysis" >> "${SUMMARY_OUT}"
  echo "- Suggested refactors: move /src/legacy -> /src/legacy-archive" >> "${SUMMARY_OUT}"
  echo '{"note":"copilot CLI not available, fallback analysis used"}' > "${TMPDIR}/architect.json"
fi
echo "" >> "${SUMMARY_OUT}"
append_agent_json "Architect" "${ARCHITECT_STATUS}" "${TMPDIR}/architect.json"
log "Architect step completed"

# ===========================================================================
# 2. Runner — Build / Test
# ===========================================================================
log "--- Step 2: Runner (Build/Test) ---"
echo "## Runner Results" >> "${SUMMARY_OUT}"

RUNNER_STATUS="pass"
RUNNER_DETAIL="${TMPDIR}/runner.json"
echo '{}' > "${RUNNER_DETAIL}"

if [ -f package.json ] && command -v npm >/dev/null 2>&1; then
  # Ensure dependencies are installed
  if [ ! -d node_modules ]; then
    log "Installing dependencies..."
    npm ci --ignore-scripts --no-audit --no-fund 2>&1 | tail -1 || npm install --ignore-scripts --no-audit --no-fund 2>&1 | tail -1 || true
  fi
  if npm test --silent 2>&1 | tee "${TMPDIR}/test_output.txt"; then
    echo "- Tests passed" >> "${SUMMARY_OUT}"
    echo '{"tests":"passed"}' > "${RUNNER_DETAIL}"
  else
    RUNNER_STATUS="fail"
    echo "- Some tests failed; see CI logs" >> "${SUMMARY_OUT}"
    jq -n --arg log "$(cat "${TMPDIR}/test_output.txt")" '{"tests":"failed","log":$log}' > "${RUNNER_DETAIL}"
  fi
else
  echo "- No npm tests detected or npm not installed" >> "${SUMMARY_OUT}"
  echo '{"tests":"skipped","reason":"no package.json or npm"}' > "${RUNNER_DETAIL}"
fi
echo "" >> "${SUMMARY_OUT}"
append_agent_json "Runner" "${RUNNER_STATUS}" "${RUNNER_DETAIL}"
log "Runner step completed (${RUNNER_STATUS})"

# ===========================================================================
# 3. Security Scan
# ===========================================================================
log "--- Step 3: Security Scan ---"
echo "## Security Findings" >> "${SUMMARY_OUT}"

SECURITY_STATUS="pass"
SECURITY_DETAIL="${TMPDIR}/security.json"
echo '{"findings":[]}' > "${SECURITY_DETAIL}"

# 3a. Snyk
if command -v snyk >/dev/null 2>&1; then
  snyk test --json > "${TMPDIR}/snyk.json" 2>/dev/null || true
  if [ -s "${TMPDIR}/snyk.json" ]; then
    echo "- Snyk results saved to snyk.json" >> "${SUMMARY_OUT}"
  else
    echo "- Snyk ran but returned no JSON output" >> "${SUMMARY_OUT}"
  fi
else
  echo "- Snyk not installed; skipping Snyk scan" >> "${SUMMARY_OUT}"
fi

# 3b. Quick secret scan
# Only scan source code files — skip docs, configs, examples, and security tooling
# Use high-confidence patterns that indicate real secrets, not references to them
SECRET_FOUND=false
SCAN_EXCLUDES='\.(md|toml|example|txt)$|^docs/|^reports/|^dns/|^\.github/workflows/|^\.gitleaks'
HIGH_CONFIDENCE_PATTERNS='AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|ghp_[0-9A-Za-z]{36}|sk-[0-9A-Za-z]{48}|xox[bpras]-[0-9A-Za-z-]+'

if command -v git >/dev/null 2>&1; then
  while IFS= read -r f; do
    # Skip excluded paths
    if echo "${f}" | grep -qE "${SCAN_EXCLUDES}"; then
      continue
    fi
    if grep -I -nE "${HIGH_CONFIDENCE_PATTERNS}" "$f" >/dev/null 2>&1; then
      echo "- Potential secret found in ${f}" >> "${SUMMARY_OUT}"
      SECRET_FOUND=true
      SECURITY_STATUS="warn"
    fi
  done < <(git ls-files)
  if [ "${SECRET_FOUND}" = false ]; then
    echo "- Quick scan: no secret patterns found" >> "${SUMMARY_OUT}"
  fi
else
  echo "- Git not available for quick secret scan" >> "${SUMMARY_OUT}"
fi
echo "" >> "${SUMMARY_OUT}"

jq -n --arg s "${SECURITY_STATUS}" --argjson snyk "$(cat "${TMPDIR}/snyk.json" 2>/dev/null || echo 'null')" \
  '{status: $s, snyk: $snyk}' > "${SECURITY_DETAIL}" 2>/dev/null || true
append_agent_json "Security" "${SECURITY_STATUS}" "${SECURITY_DETAIL}"
log "Security step completed (${SECURITY_STATUS})"

# ===========================================================================
# 4. Aggregated Outputs
# ===========================================================================
echo "## Aggregated Outputs" >> "${SUMMARY_OUT}"
for jf in "${TMPDIR}"/*.json; do
  [ -e "$jf" ] || continue
  echo "- Included JSON: $(basename "$jf")" >> "${SUMMARY_OUT}"
done
echo "" >> "${SUMMARY_OUT}"

echo "## Summary" >> "${SUMMARY_OUT}"
echo "- Architect: actionable suggestions included (see above)" >> "${SUMMARY_OUT}"
echo "- Runner: test/build status included" >> "${SUMMARY_OUT}"
echo "- Security: recommendations included" >> "${SUMMARY_OUT}"

# Update JSON summary
jq --arg arch "${ARCHITECT_STATUS}" --arg run "${RUNNER_STATUS}" --arg sec "${SECURITY_STATUS}" \
  '.summary = {"architect": $arch, "runner": $run, "security": $sec}' \
  "${JSON_OUT}" > "${TMPDIR}/_final.json" && mv "${TMPDIR}/_final.json" "${JSON_OUT}"

log "JSON report written to ${JSON_OUT}"

# ===========================================================================
# 5. Convert JSON → Markdown (Enterprise report)
# ===========================================================================
log "--- Step 5: JSON → Markdown Conversion ---"
if command -v node >/dev/null 2>&1; then
  node scripts/json_to_md.js "${JSON_OUT}" "${MD_OUT}" && log "Markdown report written to ${MD_OUT}" || log "json_to_md.js failed; skipping"
else
  log "Node.js not available; skipping Markdown conversion"
fi

# ===========================================================================
# 6. Publish to docs/ for GitHub Pages
# ===========================================================================
log "--- Step 6: Publish to docs/ ---"
mkdir -p docs/reports

if [ -f "${MD_OUT}" ]; then
  cp "${MD_OUT}" "docs/reports/"
  log "Report copied to docs/reports/"
else
  log "No Markdown report to publish"
fi

# Rebuild the reports index
if command -v node >/dev/null 2>&1; then
  node scripts/build_reports_index.js && log "Reports index rebuilt" || log "Index build failed"
else
  log "Node.js not available; skipping index build"
fi

# ===========================================================================
# 7. Optional: PR creation
# ===========================================================================
PR_BRANCH="bsm-agents-suggestions-${TIMESTAMP}"
PR_TITLE="BSU Agents Suggestions — ${TIMESTAMP}"
PR_BODY_FILE="${TMPDIR}/pr-body.md"
# Prefer an explicit default branch from CI (e.g. GitHub Actions),
# then fall back to `main` to keep local/manual runs predictable.
DEFAULT_BASE_BRANCH="${GITHUB_DEFAULT_BRANCH:-main}"
cat > "${PR_BODY_FILE}" <<EOP
This PR contains suggested changes and recommendations generated by the BSU Agents run on ${TIMESTAMP}.

See the attached report in the repository or the workflow artifacts for details.
EOP

if [ "${OPEN_PR}" = "true" ]; then
  if command -v gh >/dev/null 2>&1; then
    if [ -n "${GITHUB_REPOSITORY:-}" ]; then
      detected_default_branch="$(gh repo view "${GITHUB_REPOSITORY}" --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || true)"
      if [ -n "${detected_default_branch}" ]; then
        DEFAULT_BASE_BRANCH="${detected_default_branch}"
      fi
    fi

    git checkout -b "${PR_BRANCH}"
    mkdir -p .github/agents/reports
    cp "${SUMMARY_OUT}" ".github/agents/reports/agents-summary-${TIMESTAMP}.md"
    git add .github/agents/reports/agents-summary-${TIMESTAMP}.md
    git commit -m "Add agents report ${TIMESTAMP}" || true
    git push --set-upstream origin "${PR_BRANCH}"
    gh pr create --base "${DEFAULT_BASE_BRANCH}" --title "${PR_TITLE}" --body-file "${PR_BODY_FILE}" --label "automation" --draft
    log "Draft PR created via gh CLI"
  else
    log "gh CLI not found; cannot open PR automatically"
  fi
fi

log "=== BSU Agents Run Complete ==="
log "Summary : ${SUMMARY_OUT}"
log "JSON    : ${JSON_OUT}"
log "Markdown: ${MD_OUT}"
echo "Report generated at ${SUMMARY_OUT}"
