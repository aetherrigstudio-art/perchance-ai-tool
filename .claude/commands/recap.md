---
description: Summarize recent sessions for this repo, grouped by date
argument-hint: "[today | this week | last N]"
---

Produce a session recap. Time window from $ARGUMENTS (default: last 10).

Parse window:
- `today` = current local date
- `this week` = last 7 days
- `last <N>` or bare number = most recent N sessions
- empty = last 10

Steps:
1. Query basic-memory: `mcp__basic-memory__recent_activity` then `mcp__basic-memory__search_notes` with query "session" to find session records.
2. Filter to this project (`perchance-ai-tool` / cwd).
3. Group by local date (YYYY-MM-DD), sort descending.
4. Per session: short id, title or first prompt, key observations.
5. End with "N sessions across M days."

Output only what the tools returned. If window is empty, say so — do not invent activity.
