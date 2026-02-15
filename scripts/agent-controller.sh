#!/usr/bin/env bash
set -euo pipefail

# BSM Agent Remote Controller
# Usage:
#   ./scripts/agent-controller.sh "npm install"
#   ./scripts/agent-controller.sh "git status" "."

COMMAND=${1:-}
WORKING_DIR=${2:-.}
REPO=${GITHUB_REPO:-LexBANK/BSM}
WORKFLOW_FILE=${AGENT_WORKFLOW_FILE:-agent-executor.yml}

if [[ -z "$COMMAND" ]]; then
  echo "❌ Usage: $0 '<command>' [working_directory]"
  exit 1
fi

echo "🚀 Sending command to Agent: $COMMAND"

gh workflow run "$WORKFLOW_FILE" \
  --repo "$REPO" \
  --field command="$COMMAND" \
  --field working_dir="$WORKING_DIR"

echo "✅ Command sent! Check https://github.com/$REPO/actions"
