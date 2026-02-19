#!/usr/bin/env bash
set -euo pipefail

# Arabic/English: يمنع استخدام git push --force داخل سكربتات التشغيل.
# Blocks git push --force usage in operational scripts.

if ! command -v rg >/dev/null 2>&1; then
  echo "❌ Required tool 'rg' (ripgrep) is not installed; cannot run force push policy check."
  echo "   Please install ripgrep (rg) and re-run this check. See installation options at: https://github.com/BurntSushi/ripgrep#installation"
  exit 1
fi
matches="$(rg -n -P '^\s*(?!#)(?:sudo\s+)?git\s+push\b[^\n]*--force(?!-with-lease)' scripts -g '*.sh' || true)"

if [[ -n "$matches" ]]; then
  echo "❌ Force push policy violation detected in scripts/:"
  echo "$matches"
  exit 1
fi

echo "✅ Force push policy check passed (no git push --force found in scripts/)."
