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

# Idempotent bootstrap — ensures the shared project is registered & indexed on
# this (possibly fresh) container before the server starts. Errors (already
# exists) are non-fatal.
uvx basic-memory project add perchar "$BASIC_MEMORY_HOME" >/dev/null 2>&1 || true
uvx basic-memory project default perchar      >/dev/null 2>&1 || true

exec uvx basic-memory mcp
