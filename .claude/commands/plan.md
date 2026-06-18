---
description: Plan a non-trivial task — system-aware analysis (plan-mode) persisted as durable task files (planning-with-files), approved before any code changes
---

Deterministic planning workflow. Run this BEFORE implementing any non-trivial
task (new feature, multi-file change, unclear requirements, multiple valid
approaches, or anything needing 5+ tool calls). It chains two skills so planning
is both rigorous AND durable across cold containers — fulfilling the "plan with
tasks" workflow.

## Step 1 — Think (plan-mode skill)
Invoke the **plan-mode** skill (Skill tool, `skill: "plan-mode"`). Do holistic,
system-aware analysis: restate the goal, map the files/areas affected, surface
unknowns and risks, weigh the viable approaches, and pick one. Do NOT write code
yet. For Perchance work, fold in `char-info` §1 (paste-safety) and §11 (checklist).

## Step 2 — Persist as task files (planning-with-files skill)
Invoke the **pi-planning-with-files** skill (Skill tool,
`skill: "pi-planning-with-files"`). Capture the chosen approach as bite-sized,
verifiable tasks in `task_plan.md` (plus `findings.md` / `progress.md`). These
files are the shared, crash-proof source of truth: they survive `/clear` and cold
containers and keep every agent on the same page.
**If these files already exist, READ them first and resume — do not start over.**

## Step 3 — Approve before building
Present the plan and get explicit approval (ExitPlanMode) before editing any code.

## Step 4 — Execute + track
Work the tasks in order. After each: verify (smoke / grader / headless render as
applicable — see README §4), then tick it off in `progress.md`. Commit at clean
points and `git push origin main` (workspace rule §1). On a fresh session, the
Step 2 files let you recover mid-task — read them first.

---
Argument (optional): `$ARGUMENTS` = the task to plan. If empty, ask for the goal
before Step 1.
