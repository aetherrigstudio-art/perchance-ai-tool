#!/usr/bin/env bash
# Self-locating launcher for the shared Basic Memory MCP server.
#
# Points Basic Memory at the repo-tracked note store so every agent / session /
# branch reads & writes the SAME knowledge through git. Resolves the repo root
# from this script's own location, so it works regardless of container path or
# the cwd the MCP host launches it from.
#
# Why the bootstrap below: the .bm/ index + config are gitignored (per-container,
# rebuildable), so a fresh clone has no registered project. Basic Memory's
# auto-seeded "main" lands in config.json but NOT its runtime registry, so notes
# fail with "Project not found: main". Registering a DISTINCT-named project
# ("perchar") populates both and is idempotent (re-runs are harmless).
set -euo pipefail
root="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"

# Notes: git-tracked markdown (committed). Index: local + rebuildable (gitignored).
export BASIC_MEMORY_HOME="$root/ai-workspace/memory"
export BASIC_MEMORY_CONFIG_DIR="$root/ai-workspace/memory/.bm"

# Project registration + uvx warm-up is done by .claude/hooks/session-start.sh
# BEFORE Claude Code launches this server, so the MCP handshake isn't blocked by
# uvx cold-start (which caused the "connecting" timeout). Fallback bootstrap here
# (idempotent, backgrounded) covers the case where the hook didn't run — without
# delaying the exec below.
( cfg="$BASIC_MEMORY_CONFIG_DIR/config.json"
  # `project add perchar` only succeeds from an empty config — once basic-memory
  # auto-seeds "main" for this tree it refuses ("cannot share directory trees").
  # So reset the rebuildable config and add perchar only when it's missing.
  have=$(node -e 'try{var c=require(process.argv[1]);process.stdout.write(c.projects&&c.projects.perchar?"y":"n")}catch(e){process.stdout.write("n")}' "$cfg" 2>/dev/null || echo n)
  if [ "$have" != "y" ]; then
    mkdir -p "$BASIC_MEMORY_CONFIG_DIR"
    echo '{"projects":{},"default_project":null}' > "$cfg"
    uvx basic-memory project add perchar "$BASIC_MEMORY_HOME" >/dev/null 2>&1 || true
  fi
  uvx basic-memory project default perchar >/dev/null 2>&1 || true ) &

exec uvx basic-memory mcp
