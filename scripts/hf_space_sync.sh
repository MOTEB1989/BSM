#!/usr/bin/env bash
set -euo pipefail

# Secure Hugging Face Space sync helper.
# مساعد آمن لمزامنة Hugging Face Space بدون تخزين الأسرار داخل الكود.

usage() {
  cat <<'USAGE'
Usage:
  hf_space_sync.sh --repo <owner/space> --source <local_path> [--target <repo_path>] [--restart]

Required:
  --repo      Hugging Face repository in format owner/space
  --source    Local file or directory to upload

Optional:
  --target    Target path inside repository (default: .)
  --restart   Restart space after upload
  --dry-run   Validate only, do not upload/restart

Environment:
  HF_TOKEN must be injected at runtime from a Key Management Layer.
USAGE
}

REPO=""
SOURCE_PATH=""
TARGET_PATH="."
RESTART_SPACE="false"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --source)
      SOURCE_PATH="${2:-}"
      shift 2
      ;;
    --target)
      TARGET_PATH="${2:-}"
      shift 2
      ;;
    --restart)
      RESTART_SPACE="true"
      shift
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$REPO" || -z "$SOURCE_PATH" ]]; then
  echo "Error: --repo and --source are required." >&2
  usage
  exit 1
fi

if [[ ! "$REPO" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]]; then
  echo "Error: --repo must match owner/space format." >&2
  exit 1
fi

if [[ ! -e "$SOURCE_PATH" ]]; then
  echo "Error: source path does not exist: $SOURCE_PATH" >&2
  exit 1
fi

if ! command -v hf >/dev/null 2>&1; then
  echo "Error: hf CLI is not installed or not in PATH." >&2
  exit 1
fi

# Never hardcode secrets. Require runtime injection from external key management.
if [[ -z "${HF_TOKEN:-}" ]]; then
  echo "Error: HF_TOKEN is not set." >&2
  echo "Inject HF_TOKEN at runtime from your Key Management Layer (Vault/Secrets Manager/CI secret store)." >&2
  exit 1
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run successful. Validation passed for repo=$REPO source=$SOURCE_PATH target=$TARGET_PATH restart=$RESTART_SPACE"
  exit 0
fi

# Use token from environment without printing it.
hf auth login --token "$HF_TOKEN" >/dev/null
hf upload "$REPO" "$SOURCE_PATH" "$TARGET_PATH" --repo-type=space

if [[ "$RESTART_SPACE" == "true" ]]; then
  hf repo restart "$REPO" --type=space
fi

echo "Sync completed successfully for $REPO"
