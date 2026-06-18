---
title: WORKSPACE STANDARD — main, config, rules (source of truth)
type: config
permalink: main/status/workspace-standard-main-config-rules-source-of-truth
tags:
- standard
- workspace
- main
- rules
- handoff
- source-of-truth
---

# WORKSPACE STANDARD — single source of truth

This note is the **current** state + the standardized workflow. Older session
notes (SESSION STATE…, ONBOARDING…) are **historical** — read them for context
only; this note governs.

## The standard (how every agent works)
- **One line: `main`.** Work directly on `main`. No feature branches. If a
  session is auto-assigned a `claude/*` branch, fast-forward `main` to the work
  and `git push origin main`. Branch sprawl is what put agents on different pages.
- **One config:** `CLAUDE.md` + `.claude/` are committed on `main` → every clone
  gets identical hooks, skills, permissions, MCP. Extend these; never create
  competing local/global configs.
- **Read order:** `CLAUDE.md` (contract + workspace rules) → `README.md`
  (environment, tooling, pitfalls, end-of-life) → this note (live state).
- **MCP:** basic-memory project = **`main`** (use it; `perchar` only resolves
  after the SessionStart hook rebuilds the gitignored `.bm` config). context7
  loads only after its SessionStart npx warm-up.
- **End of life:** verify → commit → update this note → `git push origin main`.
  The "Unverified signature" git nag is harmless; ignore it.

## Current state (2026-06-18)
- `main` @ `85c9430` is the consolidated single source of truth (all prior
  branches' valuable work merged in). Local repo has only `main`.
- **Done + on main:** build-mode dropdown dedupe; generation grader
  (`test/grade-generation.mjs`) hardened; 3 audit reports in `ai-workspace/audit/`;
  Context7 MCP configured; `ui-ux-pro-max` + `usability-testing` skills restored
  into the project lock; context7 + basic-memory MCP cold-start loading fixed in
  `session-start.sh` / `bm-server.sh`; root `README.md` handoff added; CLAUDE.md
  workspace-rules block added.
- **6 stale REMOTE branches still exist** (spawn-3-teammates, init-9i0np9,
  init-oystyg, phase3-a11y-api, refinement, v2-data-loader) — the git proxy 403s
  branch deletion and there's no MCP delete-branch tool, so the human must delete
  them in the GitHub UI. They are harmless (fully contained in `main`). PR #13 is
  closed.

## Active task (approved, NOT yet built)
4-phase IA regroup of `char-wiz-html` (markup-only; JS is all getElementById so
reorder is safe) + a new post-generation review phase. Confirmed decisions:
Part-2 = full grade+flag+reroll; Opening scene → top of REVIEW. a11y fixes while
reordering: `:focus-visible`, ≥24px touch targets, label 6 controls (loreMode,
lorebookUrl, imMusic, tunCtx, tunWriting, sceneMode). Mirror → wizard-html-panel-21.txt.
Details: README §3 + CLAUDE.md.

## Observations
- [standard] one line = main; one config = committed CLAUDE.md + .claude
- [fact] basic-memory project is "main", not "perchar" (auto-seed pins the tree)
- [fact] context7 + basic-memory need SessionStart warm-ups to load (cold-start race)
- [state] main @ 85c9430; 6 stale remote branches need manual UI deletion
- [task] 4-phase regroup + second-pass review — designed/approved, not built

## Planning workflow (added)
- **`/plan`** is the must-fire planning command (`.claude/commands/plan.md`). It
  chains two skills, both kept ON: `plan-mode` (system-aware analysis) →
  `pi-planning-with-files` (durable `task_plan.md`/`findings.md`/`progress.md`
  that survive `/clear` + cold containers) → approval → tracked execution.
- Run `/plan` before any non-trivial / multi-file task (CLAUDE.md workspace rule 7).
  A slash command is deterministic; auto-trigger descriptions are not.
- [standard] non-trivial work starts with `/plan`; plan/progress files are committed so agents share state
