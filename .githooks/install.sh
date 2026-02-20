#!/bin/bash
# تثبيت Git Hooks

HOOKS_DIR=".git/hooks"
SOURCE_DIR=".githooks"

echo "📦 تثبيت Git Hooks..."

# Copy all hooks
for hook in "$SOURCE_DIR"/*; do
  if [ -f "$hook" ] && [ "$(basename "$hook")" != "install.sh" ]; then
    hook_name=$(basename "$hook")
    # Skip backup files
    if [[ "$hook_name" != *"~"* ]] && [[ "$hook_name" != *".bak"* ]]; then
      cp "$hook" "$HOOKS_DIR/$hook_name"
      chmod +x "$HOOKS_DIR/$hook_name"
      echo "✅ $hook_name"
    fi
  fi
done

echo "✅ تم تثبيت Hooks بنجاح"
