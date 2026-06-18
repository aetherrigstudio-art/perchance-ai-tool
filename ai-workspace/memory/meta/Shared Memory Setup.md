---
title: Shared Memory Setup
type: note
permalink: perchar/meta/shared-memory-setup
tags:
- infra
- memory
---

# Shared Memory Setup

## Observations
- [where] Shared notes live in ai-workspace/memory/ (git-tracked markdown). #infra
- [server] Served by the basic-memory MCP in .mcp.json -> ai-workspace/bm-server.sh (self-locating wrapper). #infra
- [index] .bm/ holds config.json + memory.db; gitignored + rebuildable. The MCP server's initial sync re-indexes the committed markdown on each fresh container. #infra
- [project] Wrapper registers a DISTINCT-named project "perchar" (not "main"); "main" auto-seeds into config.json but NOT the runtime registry, which breaks writes. #gotcha
- [usage] Read/write with basic-memory tools: write_note, read_note, search_notes, build_context. #usage
