#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write).
# Reads the tool-use JSON on stdin, extracts the edited file path, and if it is
# a .js file runs `node --check` on it. Anything else is a no-op.
# Robust by design: never block an edit because the hook tooling is missing.

set -u

# Read all of stdin (the PostToolUse JSON payload).
payload="$(cat 2>/dev/null || true)"

# Extract the file path. tool_input.file_path covers Edit and Write.
file=""
if command -v jq >/dev/null 2>&1; then
  file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
fi

# No path resolved → nothing to do.
[ -n "$file" ] || exit 0

# Only syntax-check JavaScript modules.
case "$file" in
  *.js|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

# File must actually exist on disk.
[ -f "$file" ] || exit 0

# node may not be installed in every environment — degrade gracefully.
command -v node >/dev/null 2>&1 || exit 0

if ! node --check "$file" 2>/tmp/check-syntax.err; then
  echo "check-syntax: syntax error in $file" >&2
  cat /tmp/check-syntax.err >&2 2>/dev/null || true
  rm -f /tmp/check-syntax.err 2>/dev/null || true
  exit 2
fi

rm -f /tmp/check-syntax.err 2>/dev/null || true
exit 0
