#!/bin/bash
# SessionStart hook for perchance-ai-tool.
#
# This repo has no dependency manifest, build, or test runner — it is plain-text
# Perchance generator source (data-editor + HTML-editor pairs). So there is
# nothing to "npm install". Instead this hook (a) confirms the optional toolchain
# is present and (b) injects the project's non-negotiable conventions as context,
# since char-info insists its spec be loaded before any generator is edited.
#
# Runs synchronously. Idempotent and non-interactive.
set -euo pipefail

node_ok="missing"; python_ok="missing"
# `if` (not `&&`) so a nonzero `--version` can't trip `set -e` and abort before
# the context JSON is emitted; `|| echo present` keeps the value non-empty.
if command -v node    >/dev/null 2>&1; then node_ok="$(node --version 2>/dev/null || echo present)"; fi
if command -v python3 >/dev/null 2>&1; then python_ok="$(python3 --version 2>/dev/null || echo present)"; fi

read -r -d '' CONTEXT <<EOF || true
[perchance-ai-tool] No build/test/lint toolchain — this repo is Perchance generator
source. Verification happens by pasting the data + HTML blocks into perchance.org and
importing the export into AI Character Chat. Toolchain present: node=${node_ok}, python3=${python_ok}.

Before editing any generator, the spec to follow is char-info (= perchance-character-creation-3.md).
Hard invariants: (1) data editor and HTML editor are two SEPARATE blocks — never merge them;
(2) build prompts in JS via window.build*Prompt() so no Perchance bracket-escaping is needed;
(3) the ACC export must declare all 9 Dexie tables; (4) there is no maxTokens setting;
(5) do not auto-build group threads or seeded messages. See CLAUDE.md and ai-workspace/MEMORY.md.
EOF

# Emit as SessionStart additionalContext (valid JSON; safely escaped via python3/node, or raw fallback).
if command -v python3 >/dev/null 2>&1; then
  CONTEXT="$CONTEXT" python3 -c '
import json, os
print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart",
                  "additionalContext": os.environ["CONTEXT"]}}))'
else
  # Fallback: plain stdout is also injected as context for SessionStart.
  printf '%s\n' "$CONTEXT"
fi
