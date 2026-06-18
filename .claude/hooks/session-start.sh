#!/bin/bash
# SessionStart hook for Claude Code on the web.
#
# This repo has NO package manager and no dependencies to install (it holds
# Perchance generator source — see CLAUDE.md). Its checks instead rely on two
# tools that the web container must have:
#   - node : runs the syntax check and test/smoke.mjs
#   - jq   : used by the PostToolUse wizard syntax-check hook
# This hook ensures both exist (installing jq if missing). Idempotent and
# non-interactive. Synchronous: the session waits for it to finish.
set -euo pipefail

# Only do work in the remote/web container; local sessions already have tooling.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  echo "[session-start] local session — no setup needed."
  exit 0
fi

echo "[session-start] Perchance generator repo: no package manager; ensuring node + jq."

if ! command -v node >/dev/null 2>&1; then
  echo "[session-start] WARNING: 'node' not found — the syntax check and test/smoke.mjs require it." >&2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "[session-start] installing jq (needed by the syntax-check hook)..."
  if command -v apt-get >/dev/null 2>&1; then
    { apt-get update -qq && apt-get install -y -qq jq; } \
      || { command -v sudo >/dev/null 2>&1 && sudo apt-get update -qq && sudo apt-get install -y -qq jq; } \
      || echo "[session-start] WARNING: could not install jq automatically." >&2
  else
    echo "[session-start] WARNING: no apt-get available to install jq." >&2
  fi
fi

echo "[session-start] node: $(command -v node || echo MISSING) ($(node --version 2>/dev/null || echo '?'))"
echo "[session-start] jq:   $(command -v jq || echo MISSING) ($(jq --version 2>/dev/null || echo '?'))"

# Skills are committed to the repo (not reinstalled per session). Report drift
# between skills-lock.json, .agents/skills/, and the discovery symlinks.
# Informational only — never blocks the session.
if command -v node >/dev/null 2>&1 && [ -f skills-lock.json ]; then
  bash .claude/hooks/check-skills.sh 2>&1 | sed 's/^/[session-start] /' || true
fi

# Basic Memory MCP warm-up. The MCP server (declared in .mcp.json -> bm-server.sh)
# would otherwise cold-start `uvx` (downloads ~163 pkgs) DURING the MCP handshake
# and time out, leaving the tools stuck "connecting". Doing it here — before
# Claude Code launches the server — warms the uvx cache AND registers the shared
# project, so the wrapper can exec the server immediately. Backgrounded + guarded
# so it never blocks or fails the session.
if command -v uvx >/dev/null 2>&1 && [ -d ai-workspace/memory ]; then
  ( export BASIC_MEMORY_HOME="$PWD/ai-workspace/memory"
    export BASIC_MEMORY_CONFIG_DIR="$PWD/ai-workspace/memory/.bm"
    uvx basic-memory project add perchar "$BASIC_MEMORY_HOME" >/dev/null 2>&1 || true
    uvx basic-memory project default perchar >/dev/null 2>&1 || true
  ) && echo "[session-start] basic-memory: uvx warmed + project registered" || true
fi

echo "[session-start] ready. Lint: bash .claude/hooks/check-wizard.sh  |  Test: node test/smoke.mjs  |  Skills: bash .claude/hooks/check-skills.sh"
