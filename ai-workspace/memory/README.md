# Shared agent memory

Persistent, cross-agent knowledge for this repo. Both Claude agents (and any
future session or branch) read and write the **same** notes here through git.

## How it works

- **Notes** = the git-tracked markdown in this folder (`status/`, `meta/`, …).
  This is the shared knowledge. Committing it is what makes it shared.
- **Server** = the `basic-memory` MCP, declared in `/.mcp.json`, launched via
  the self-locating wrapper `../bm-server.sh` (resolves the repo root from its
  own path, so it works in any container).
- **Index** = `.bm/` (config.json + `memory.db`). Local, per-container, and
  **gitignored** — never commit it. The MCP server's initial sync rebuilds it
  from the markdown on each fresh clone.

## Using it

Read/write with the basic-memory MCP tools: `write_note`, `read_note`,
`search_notes`, `build_context`, `recent_activity`. From the CLI:
`uvx basic-memory tool write-note --title … --folder … --project perchar`.

## Gotcha (baked into the wrapper, documented so nobody re-hits it)

Basic Memory auto-seeds a project named **`main`** into `config.json` but does
**not** register it in the runtime registry — so writes fail with
"Project not found: main". The wrapper sidesteps this by registering a
**distinct-named** project, `perchar`, pointed at this folder (idempotent).

## Reset / rebuild the index

```bash
rm -rf ai-workspace/memory/.bm      # drop the local index
# next launch of the MCP server (or `bm-server.sh`) re-registers + re-indexes
```
The markdown is the source of truth; the index is disposable.
