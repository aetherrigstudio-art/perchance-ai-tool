---
description: Post-task consolidation — write learnings to memory, close issues, verify phase gate
---

Phase gate: do not declare task complete until Step 7 passes.

## Step 0 — Timestamp
```bash
date +%s > "${CLAUDE_PROJECT_DIR}/ai-workspace/.last-reflect-ts"
```

## Step 1 — Review work
```bash
git log --oneline -10
```
Build an explicit inventory of candidate learnings from git history + session events.

## Step 2 — Classify
| Signal | Destination |
|---|---|
| Repo-specific (files, paths, conventions) | basic-memory only |
| Cross-project pattern | basic-memory only |
| Both | basic-memory — cross-reference |

## Step 3 — Write to basic-memory
`mcp__basic-memory__search_notes` first to avoid duplicates, then `mcp__basic-memory__write_note`.
Tag every note with `perchance-ai-tool`. Use `[[wiki-links]]` for connections.

## Step 4 — Issue housekeeping
Scan commit messages for `closes/fixes/resolves #N`. Warn if any referenced issue is still open.
Check scratchpad `ai-workspace/scratchpad.md` for unchecked `- [ ]` items → create issues.

## Step 5 — ADR check
If a significant architectural decision emerged, prompt the user before creating an ADR in `ai-workspace/decisions/`.

## Step 6 — Finalize plan
If an active plan exists in `ai-workspace/plans/`, rename to `.done.md` after filling Outcomes & Learnings.

## Step 7 — Phase gate
Verify basic-memory was updated. If not, warn and do not declare done.
