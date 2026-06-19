# Task Plan — Absurdly-thorough 30-pass improvement review (catalog only)

**Plan ID:** 2026-06-18-improvement-review-30-pass
**Status:** AWAITING APPROVAL of planning files → then `/plan-attest` → orchestrate
**Source plan:** `/root/.claude/plans/ethereal-sparking-wolf.md` (user-approved)

## Goal
Systematically sweep the three tools for **non-defect IMPROVEMENTS** ("works, but could be
better") across 30 distinct lenses, and produce a **prioritized improvement catalog**.
Catalog only — **apply nothing**. Each future code change re-plans per workspace rule 7.

## Scope
- **In:** `char-wiz-html`, `char-wiz-dat`, `fixer-html-panel-1.txt`, `fixer-data-panel-1.txt`,
  `image-style-builder-html-panel-8.txt`, `image-style-builder-data-panel-8.txt`.
- **Out:** `wizard-loader-html.txt`, `test/*`, `scripts/*`, docs.
- **Improvements only** — true defects get a one-line note + route to existing trackers; no bug-hunting.

## Hard constraints (apply to every phase)
1. **Catalog only** — no edits to any tool file. Only writes: catalog doc + `ISSUES.md` (+ planning files).
2. **Extend, don't duplicate** — cross-check `ISSUES.md`, root `findings.md`, and
   `ai-workspace/audit/{a11y-mobile,correctness,security-content}.md`. Tag each finding
   `NEW` / `CONFIRMS-EXISTING (ref)` / `FINER-GRAIN (ref)`.
3. **Platform rules** — `char-info` §9 verified/unverified; paste-safety (`[ ] { }` out of HTML markup); no npm/build.
4. **Don't gold-plate** — every finding carries value + effort; flag low-value items as such.

## Per-finding schema (every finding uses this)
`pass# · tool · lens · title · observation (file:line) · suggested improvement ·
value(High/Med/Low) · effort(XS/S/M/L) · status(NEW/CONFIRMS/FINER + ref) · risk/constraint notes`

## Phases

| Phase | Passes | Owner agent | Skills | Status |
|---|---|---|---|---|
| 1 | 1–4 maintainability/structure (wizard) | review-agent-1 | code-review-quality, vanilla-web, token-efficiency | pending |
| 2 | 5–8 naming/dead-code/comments/cross-tool consistency (all) | review-agent-2 | code-review-quality | pending |
| 3 | 9–13 UX flow / IA / microcopy / states (all) | review-agent-3 | ui-ux-pro-max, usability-testing | pending |
| 4 | 14–19 UX discoverability + a11y labels/live/focus (sister tools) | review-agent-4 | ui-ux-pro-max, accessibility-engineer, aria-live-regions | pending |
| 5 | 20–23 touch/responsive/contrast/semantics (all) | review-agent-5 | mobile-responsiveness, accessibility-engineer | pending |
| 6 | 24–30 prose & prompt/generation quality (wizard + image-style) | review-agent-6 | thought-based-reasoning, research-synthesis (+char-info, petra refs) | pending |
| 7 | Synthesis — dedupe across agents + vs prior audits, prioritize, top-20 shortlist | (me) | parallel-agents | pending |
| 8 | Write outputs — catalog doc + ISSUES.md section; run verification | (me) | — | pending |

The 30 pass definitions live in the approved plan file (Section "The 30 passes"); each agent
gets its slice verbatim in its prompt.

## Orchestration
agent-orchestrator-task drives; each worker built per subagent-task-execution; parallel-agents
governs batching + file handoff. All 6 agents are **read-only on tool files** and only **append
findings to `findings.md`** in this plan dir. Launch all 6 in parallel, await, then Phase 7–8.

## Outputs
1. `ai-workspace/improvement-review-2026-06-18.md` — full catalog by pass + exec summary + top-20 shortlist.
2. `ISSUES.md` — new section "Improvement review (catalog 2026-06-18)", one-liners for NEW value≥Med items, linking the catalog.

## Decisions
- Parallel pi-planning mode so the prior (completed) optimization session's root files aren't clobbered.
- 6 agent batches (not 30 separate agents): coherent prompts, limited fan-out, matches the 4 lenses.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |
