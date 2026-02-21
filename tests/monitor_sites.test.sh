#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="$REPO_ROOT/scripts/monitor_sites.sh"
MOCK_DIR="$(mktemp -d)"
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$MOCK_DIR" "$TEST_TMP"' EXIT

assert_contains() {
  local content="$1"
  local expected="$2"
  if [[ "$content" != *"$expected"* ]]; then
    echo "Assertion failed. Expected output to contain: $expected"
    echo '--- output start ---'
    echo "$content"
    echo '--- output end ---'
    exit 1
  fi
}

create_mock_curl() {
  local body="$1"
  cat > "$MOCK_DIR/curl" <<MOCK
#!/usr/bin/env bash
$body
MOCK
  chmod +x "$MOCK_DIR/curl"
}

run_test_all_healthy() {
  create_mock_curl 'echo 200'

  local output
  output="$(PATH="$MOCK_DIR:$PATH" SITE1_URL='https://one.example' SITE2_URL='https://two.example' "$SCRIPT_PATH")"

  assert_contains "$output" 'All monitored endpoints are healthy.'
}

run_test_restart_success() {
  local marker="$TEST_TMP/count"

  create_mock_curl '
count=0
if [[ -f "'$marker'" ]]; then
  count=$(cat "'$marker'")
fi
count=$((count + 1))
echo "$count" > "'$marker'"

if (( count <= 2 )); then
  echo 500
else
  echo 200
fi
'

  local output
  output="$(PATH="$MOCK_DIR:$PATH" \
    ENABLE_RESTART_ON_FAILURE=true \
    RESTART_COMMAND='echo restarted >/dev/null' \
    RECHECK_DELAY_SECONDS=0 \
    "$SCRIPT_PATH")"

  assert_contains "$output" 'attempting app restart'
  assert_contains "$output" 'Health checks passed after restart.'
}

run_test_missing_restart_command() {
  create_mock_curl 'echo 500'

  set +e
  local output
  output="$(PATH="$MOCK_DIR:$PATH" ENABLE_RESTART_ON_FAILURE=true RESTART_COMMAND='' "$SCRIPT_PATH" 2>&1)"
  local exit_code=$?
  set -e

  if [[ "$exit_code" -eq 0 ]]; then
    echo 'Expected non-zero exit code when RESTART_COMMAND is missing.'
    exit 1
  fi

  assert_contains "$output" 'RESTART_COMMAND is empty'
}

run_test_all_healthy
run_test_restart_success
run_test_missing_restart_command

echo 'monitor_sites tests passed.'
