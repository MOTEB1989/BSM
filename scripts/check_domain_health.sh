#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-corehub.nexus}"
URL="https://${DOMAIN}"

printf '== Domain health check: %s ==\n' "$DOMAIN"

A_RECORDS=$(dig +short "$DOMAIN" A || true)
AAAA_RECORDS=$(dig +short "$DOMAIN" AAAA || true)

printf '\n[DNS] A records:\n%s\n' "${A_RECORDS:-<none>}"
printf '\n[DNS] AAAA records:\n%s\n' "${AAAA_RECORDS:-<none>}"

if [[ -z "${A_RECORDS}${AAAA_RECORDS}" ]]; then
  echo "\n[RESULT] DNS not resolving."
  exit 2
fi

RESPONSE_HEADERS=$(curl -sS -I -L --max-time 20 "$URL" || true)
STATUS_LINE=$(printf '%s\n' "$RESPONSE_HEADERS" | awk 'BEGIN{code=""} /^HTTP\//{code=$0} END{print code}')
CF_MITIGATED=$(printf '%s\n' "$RESPONSE_HEADERS" | awk -F': ' 'tolower($1)=="cf-mitigated"{print tolower($2)}' | tr -d '\r')

printf '\n[HTTP] Final status:\n%s\n' "${STATUS_LINE:-<none>}"

if [[ "$CF_MITIGATED" == "challenge" ]]; then
  cat <<'MSG'

[RESULT] Cloudflare challenge is blocking the request.
- Check Cloudflare Security/WAF rules for this hostname.
- Verify "I'm Under Attack" mode and Bot Fight settings are not forcing universal challenges.
- Add an allow/bypass rule for normal browser traffic on the root path if needed.
MSG
  exit 3
fi

if printf '%s' "$STATUS_LINE" | grep -q ' 2[0-9][0-9] '; then
  echo "\n[RESULT] Domain is reachable over HTTPS."
  exit 0
fi

cat <<'MSG'

[RESULT] Domain resolved, but HTTPS response is not successful.
- Check origin host status (GitHub Pages/Render/Worker).
- Confirm TLS certificate and custom-domain binding.
MSG
exit 1
