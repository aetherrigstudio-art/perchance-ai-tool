# START HERE — next-agent handoff

This repo is the source for **Perchance.org generators** (browser tools for AI
Character Chat). It is **not** a normal app: no build, no server, no package
manager. A "tool" is two plain-text blocks pasted into Perchance's two editors.
Editing the text files *is* development; "running" is pasting into a generator
and clicking generate.

> **`CLAUDE.md` is the source of truth** for repo structure, the two-editor
> model, paste-safety rules, and the ACC import schema. This README is the
> *operational* layer on top of it: environment, tooling, pitfalls, and how to
> wind a session down cleanly. Read both. Then read `char-info` §1 (paste-safety)
> and §11 (checklist) before touching a tool.

---

## 1. Read order at session start

1. **`CLAUDE.md`** — what the repo is + load-bearing conventions.
2. **This file** — environment, pitfalls, end-of-life.
3. **basic-memory** notes — `recent_activity` / `search_notes`. ⚠️ **Use
   `project: "main"`**, not `"perchar"`, if perchar errors (see §4).
   The richest handoff is the note
   *"SESSION STATE 2026-06-18 — UX regroup + second-pass + tooling"* (also a file:
   `ai-workspace/memory/status/`).
4. **`char-info`** (== `perchance-character-creation-3.md`) §1 + §11 before editing.

---

## 2. Current state (update this when it changes)

- **Branch: work directly on `main`.** It is the single source of truth — all
  prior feature branches were consolidated into it. **Do not spawn new feature
  branches**; commit + push to `main`. (If your session was auto-assigned a
  `claude/*` branch, fast-forward `main` to your work and push `main` instead, so
  the next agent isn't on a different page.)
- **Canonical files:** `char-wiz-html` (== `wizard-html-panel-20.txt`) and
  `char-wiz-dat`. Edit the canonical pair, then mirror to a new highest-numbered
  `wizard-html-panel-N.txt`. Don't touch older snapshots.
- **Done + committed this session:** merged PR #13's base (build-mode dedupe,
  grader, audits, Context7 config); restored `ui-ux-pro-max` + `usability-testing`
  skills; fixed context7 + basic-memory MCP cold-start loading.
- **Active task (approved, NOT yet built):** the 17-card wall → 4-phase IA
  regroup + a new post-generation review phase. See §3.

---

## 3. The active task

**Part 1 — 4-phase IA regroup of `char-wiz-html` (markup-only; ALL JS is
`getElementById`, so reordering `<div class="card">` blocks is SAFE).**

```
① START   Build mode · Import (load existing) · Scenario
② BUILD   Main · Persona · Additional · Relationships · Lore · Opening scene
③ POLISH ▸ (one collapsed <details>) Image style · Immersion · Presentation · Tuning
④ REVIEW & EXPORT   Opening scene → top of REVIEW · [Part-2 second pass] · Consistency · Export · Share
```
- Add phase `<h2>` headers (a progress spine); move **Test Drive** to the bottom.
- **Confirmed decisions:** Part-2 scope = **full grade + flag + re-roll**;
  **Opening scene → top of ④ REVIEW**.
- **Fix while reordering** (from `ai-workspace/audit/`): add `:focus-visible`
  styles (none exist); touch targets ≥24px (WCAG 2.5.8); label the 6 unlabeled
  controls (`loreMode`, `lorebookUrl`, `imMusic`, `tunCtx`, `tunWriting`,
  `sceneMode`). Mirror result → `wizard-html-panel-21.txt`.

**Part 2 — new "second pass / review & refine" phase (in ④).** ~70% of the
engine already exists: `genConsistency`→`parseConsistency`→`renderConsistency`→
`applyFix` reviews the cast and one-click-applies fixes via refine-mode regen;
`doReroll`+`replaceSection`+`getSection` regenerate one `=== SECTION ===`.
Generalize that into REVIEW **and** port `test/grade-generation.mjs`'s rubric to
an in-browser `window.gradeCharacter` — grade each character, flag weak sections,
one-click "re-roll this section."

---

## 4. Environment & tooling (what actually works here)

**Ephemeral cold container.** Fresh clone each session; reclaimed after
inactivity. **The only durable output is a commit pushed to the branch.** Global
installs (`~/.claude/skills`, npx/uvx caches) DO NOT survive. Anything you need
next time must be committed to the repo or to a basic-memory note.

**MCP servers** (`.mcp.json`; both fixed this session in `session-start.sh`):
- **github** — live. Use the `mcp__github__*` tools (no `gh` CLI here).
- **basic-memory** — local notes in `ai-workspace/memory/`. basic-memory
  auto-seeds a project called **`main`** for that dir and refuses a second
  project on the same tree, so the documented **`perchar`** only resolves once
  the SessionStart hook rebuilds the (gitignored) `.bm` config. **If `perchar`
  errors ("Project not found" / "cloud routing"), use `project: "main"` — same
  notes.** Never pass cloud creds; this is local-only.
- **context7** (live docs: `resolve-library-id` → `query-docs`) — loads only
  after the SessionStart hook warms its npx package (it otherwise cold-starts
  during the MCP handshake and times out). If it's missing this session, it
  wasn't warmed in time — fall back to `WebSearch`/`WebFetch`; it is not required
  for vanilla HTML/CSS work.

**Skills** (committed in `skills-lock.json` + `.agents/skills/`, symlinked into
`.claude/skills/`): managed via `npx skills add/remove`. Run
`bash .claude/hooks/check-skills.sh` to confirm lock + content + symlinks agree.
For this task: invoke `ui-ux-pro-max` + `usability-testing` (layout/IA),
`thought-based-reasoning` (hard trade-offs). They're parked
`user-invocable-only` in `settings.json` — call them explicitly, they won't
auto-trigger. Keep ≤20 auto-triggering skills (park extras).

**Screenshots WORK** (ignore the run-perchance-ai-tool SKILL.md claim they don't):
```bash
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx -y playwright@1.56.1 install chromium
# temp /tmp/render project: npm i playwright@1.56.1, setContent(char-wiz-html),
# screenshot at 384px (Android) + 820px, send via SendUserFile.
```
Render `char-wiz-html` **directly**, not the loader (loader fetch hits a harmless
sandbox TLS cert error). 0 page errors = the UI built.

**Verification (run after every change):**
```bash
node test/smoke.mjs                 # export/Dexie shape — MUST pass
node test/grade-generation.mjs      # generation-quality grader (for Part 2)
bash .claude/hooks/check-wizard.sh  # wizard <script> syntax lint
```
Plus a headless re-render with 0 page errors + a screenshot as evidence. Don't
declare done without showing command output / a screenshot. If a step fails
twice, stop and report the diagnosis — don't thrash.

---

## 5. Pitfalls (hard-won — read before editing)

1. **Paste-safety (load-bearing).** Perchance templates `[ ] { }` in HTML
   *markup* (everything before the first `<script>`) and errors. Keep brackets
   out of markup entirely; set literal-bracket UI strings from `<script>`.
   HTML-entity escaping (`&#91;`) is NOT reliable. The smoke test guards this.
2. **Edit the canonical pair only** (`char-wiz-html` / `char-wiz-dat`), then
   mirror to a new highest-N snapshot. Diff near-versions before assuming —
   byte-identical snapshots exist and the diffs are the signal.
3. **Don't present unverified ACC fields as fact** (model names, context sizes);
   respect `char-info` §9's verified/unverified boundary. Don't auto-build group
   threads or seeded messages (unverified table shapes).
4. **basic-memory project name** — `main` vs `perchar`, see §4. This bit two
   sessions: queries silently fell through to cloud routing.
5. **MCP cold-start** — context7 / basic-memory only load if the SessionStart
   hook warms their package caches first. `.mcp.json` changes need a *fresh*
   session; `settings.json` hot-reloads mid-session.
6. **The "Unverified / GPG signature N" git nag is HARMLESS** (no signing key in
   this env). Ignore it — do NOT rewrite history / reset-author to chase it.
7. **Operator is on Android.** Deliver anything pasteable as codeblocks or raw
   GitHub links, never huge inline pastes. Don't push/PR frequently — webhook
   noise floods their mobile context. Batch, commit locally, push only when told
   or at a clean stopping point.
8. **Don't add npm/build/lint/test scaffolding** — there's nothing for it to
   operate on. Don't run `/init` (CLAUDE.md already exists; extend, never
   regenerate).

---

## 6. How to properly reach end-of-life (session wind-down)

The container is reclaimed without warning. Before you stop — **especially if the
operator is away** — leave the repo and memory in a clean, resumable state:

1. **Verify** the current state: `node test/smoke.mjs` (+ `grade-generation.mjs`
   if you touched generation), headless re-render with 0 page errors. Never
   commit red.
2. **Commit** finished, verified work locally with a clear message. Don't leave
   uncommitted edits — they die with the container. (Co-author + session
   trailers per the git rules; ignore the Unverified nag.)
3. **Update durable memory** — `write_note` (basic-memory, project `main`) a
   short status: what's done + committed, what's in-flight, decisions made,
   next step. Mirror the one-line state into §2 of this README and, if the task
   shifted, the SESSION STATE note. Chat context does NOT survive; committed
   files + notes do.
4. **Push only at a clean stopping point or when told** — `git push origin main`
   (retry on network error: 2s/4s/8s/16s). Work lives on `main`; no PR needed
   unless you deliberately opened a feature branch for review.
5. **Hand off, don't trail off** — end with a 1-paragraph status: branch, what's
   committed/pushed, the next concrete step. If a step failed, say so with the
   output; if something was skipped, say that. State done-and-verified plainly.
6. **Background work:** don't `sleep`-wait on external events. If watching a PR,
   `subscribe_pr_activity` and end the turn. Stop follow-ups the moment the
   operator says so.

A task is "done" only when it's **verified, committed, and (at a clean point)
pushed with a draft PR** — and the next agent could resume from this README +
the memory note alone.

---

## 7. Quick reference

| Need | Command / path |
|---|---|
| Canonical HTML / data | `char-wiz-html` / `char-wiz-dat` |
| Prompt builder | `window.buildWizardPrompt` (defined in HTML panel) |
| Export shape test | `node test/smoke.mjs` |
| Generation grader | `node test/grade-generation.mjs` |
| Wizard syntax lint | `bash .claude/hooks/check-wizard.sh` |
| Skills drift check | `bash .claude/hooks/check-skills.sh` |
| Render UI (screenshot) | see §4 |
| Second-pass engine | `char-wiz-html` ~`genConsistency`/`applyFix`/`doReroll`/`getSection`/`replaceSection` |
| Audits | `ai-workspace/audit/` |
| Reference doc | `char-info` (== `perchance-character-creation-3.md`) |
