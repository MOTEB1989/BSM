#!/usr/bin/env bash
set -euo pipefail

# Arabic/English: قابلة للتخصيص عبر متغيرات البيئة بدون أي Secrets داخل الكود.
# Defaults target the two URLs shared by the user.
SITE1_URL="${SITE1_URL:-https://moteb1989.github.io/BSM/}"
SITE2_URL="${SITE2_URL:-https://sr-bsm.onrender.com}"
REQUEST_TIMEOUT_SECONDS="${REQUEST_TIMEOUT_SECONDS:-10}"
ENABLE_RESTART_ON_FAILURE="${ENABLE_RESTART_ON_FAILURE:-false}"
RESTART_COMMAND="${RESTART_COMMAND:-}"
RECHECK_DELAY_SECONDS="${RECHECK_DELAY_SECONDS:-5}"

log_info() {
  printf 'ℹ️  %s\n' "$1"
}

log_success() {
  printf '✅ %s\n' "$1"
}

log_error() {
  printf '❌ %s\n' "$1"
}

check_site() {
  local url="$1"
  local http_code

  if ! http_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$REQUEST_TIMEOUT_SECONDS" "$url"); then
    log_error "$url request failed (network/timeout error)."
    return 1
  fi

  if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    log_success "$url is healthy (HTTP $http_code)."
    return 0
  fi

  log_error "$url returned non-success status (HTTP $http_code)."
  return 1
}

attempt_restart_if_enabled() {
  if [[ "$ENABLE_RESTART_ON_FAILURE" != "true" ]]; then
    return 0
  fi

  if [[ -z "$RESTART_COMMAND" ]]; then
    log_error 'ENABLE_RESTART_ON_FAILURE=true but RESTART_COMMAND is empty.'
    return 1
  fi

  log_info 'Failure detected, attempting app restart...'
  bash -lc "$RESTART_COMMAND"
  sleep "$RECHECK_DELAY_SECONDS"
}

main() {
  log_info 'Starting periodic health check...'

  local has_failure=0

  check_site "$SITE1_URL" || has_failure=1
  check_site "$SITE2_URL" || has_failure=1

  if [[ "$has_failure" -eq 0 ]]; then
    log_success 'All monitored endpoints are healthy.'
    return 0
  fi

  attempt_restart_if_enabled || return 1

  if [[ "$ENABLE_RESTART_ON_FAILURE" == "true" ]]; then
    log_info 'Re-running checks after restart...'
    local post_restart_failure=0
    check_site "$SITE1_URL" || post_restart_failure=1
    check_site "$SITE2_URL" || post_restart_failure=1

    if [[ "$post_restart_failure" -eq 0 ]]; then
      log_success 'Health checks passed after restart.'
      return 0
    fi
  fi

  log_error 'One or more monitored endpoints are unhealthy.'
  return 1
}

main "$@"
