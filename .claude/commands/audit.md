---
description: Scan for uncommitted, stashed, or dangling work across all branches and worktrees
---

Loop-until-dry audit of all local work that might not be committed or pushed.

## Step 1 — Worktrees
```bash
git worktree list
```
For each worktree: `git -C <path> status --short` + `git -C <path> log --oneline origin/HEAD..HEAD 2>/dev/null`.
Report any dirty state or unpushed commits.

## Step 2 — Stash
```bash
git stash list
```
For each entry: `git stash show -p stash@{N} --stat`. Report what's stashed.

## Step 3 — All branches
```bash
git branch -a --format='%(refname:short) %(upstream:track)'
```
Flag any local branch with commits ahead of its upstream (or no upstream).

## Step 4 — Dangling objects
```bash
git fsck --unreachable --no-reflogs 2>&1 | grep "dangling commit" | head -20
```
For each dangling commit: `git show --stat <hash>`. Report if non-trivial.

## Step 5 — Write findings
```bash
mkdir -p ai-workspace/memory/status
```
Write `ai-workspace/memory/status/audit-$(date +%Y-%m-%d).md` with a structured report.
Also call `mcp__basic-memory__write_note` with title `Audit $(date +%Y-%m-%d)` and the findings.

## Output
Table: location | type | description | action needed.
End with: "N items found — M need action."
