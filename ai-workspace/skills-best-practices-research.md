# How to Best Utilize Claude Skills — Deep Research

> websearch-deep, 2026-06-18. 5 queries, sources ranked official-first.
> Applied to this repo: 34 committed skills, "better skill calling" goal.

## Executive summary

Three findings dominate, and they're somewhat counterintuitive:

1. **The `description` field IS the trigger** — not a summary. Claude decides whether
   to fire a skill almost entirely from the name + description. Write it as *"Use when
   you need to X"*, include **both what it does AND when to use it**, and make it
   slightly **"pushy"** — Claude's default tendency is to **under**-trigger.
2. **Fewer skills = better triggering.** There's a real, repeated **~20-skill cap**.
   Past it, false-triggers and missed-fires climb and agent behavior gets unpredictable.
   *"Curation is the work; collection is the trap."* We're at **34 → over the cap.**
3. **Skills are the wrong tool for deterministic workflows.** Things that must fire
   every time (recap, audit, reflect) should be **slash commands**, not skills — explicit
   invocation, no "will it fire?" routing uncertainty.

## Findings

### 1. How triggering actually works (progressive disclosure)
- Three-layer load: at startup Claude loads only each skill's **name + description**
  (~a few dozen tokens each); the **SKILL.md body loads only when triggered**;
  reference files load only when the steps reach them. [[Anthropic: Best practices]](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- Implication: a big skill library isn't a token problem at rest (descriptions are tiny)
  — it's a **decision-quality problem** (more descriptions to match against = more
  misfires). [[SwirlAI: Progressive disclosure]](https://www.newsletter.swirlai.com/p/agent-skills-progressive-disclosure)
- Keep SKILL.md as a **pure process definition**; list references but don't embed them.
  Embedding reference material in the process file is the most common authoring mistake.
  [[MindStudio: Context management]](https://www.mindstudio.ai/blog/progressive-disclosure-ai-agents-context-management)

### 2. Writing descriptions that trigger correctly
- Description = trigger, not summary: *"use this skill when you need to X"* not *"this
  skill does X."* All the "when to use" lives **in the description**, not the body.
  [[Anthropic: Agent Skills overview]](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- Be "pushy" to counter under-triggering. [[Anthropic: skill-creator]](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)
- As skill count grows, **description precision becomes critical** — too broad → false
  triggers, too narrow → never fires. [[Claude: Improving skill-creator]](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)

### 3. Skills vs slash commands vs subagents (when to use which)
| Tool | Use when | Invocation |
|---|---|---|
| **Skill** | Large knowledge (>500 tokens), fires **<30% of turns**, bundles files | Auto (description match) |
| **Slash command** | Small (<200 tokens), fires **often**, **must never be skipped** | **Explicit — you type it** |
| **Subagent** | Parallel work, keep main context small/isolated | Dispatched |
[[Varun Bhanot: when to use which]](https://varunbhanot.substack.com/p/skills-slash-commands-mcp-subagents) · [[alexop.dev: customization guide]](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)

### 4. Skills 2.0 — trigger tuning + evals exist now
- The **skill-creator** can auto-optimize a skill's frontmatter for trigger accuracy,
  generate ~20 eval queries (should-fire / should-not-fire), run 60/40 train/test with
  parallel isolated sub-agents, and A/B test versions blind. Anthropic's own tuning
  improved activation on 5/6 of their document skills. [[Pasquale: Skills 2.0 evals]](https://pasqualepillitteri.it/en/news/341/claude-code-skills-2-0-evals-benchmarks-guide) · [[MLflow: evaluating skills]](https://mlflow.org/blog/evaluating-skills-mlflow/)

### 5. Anti-patterns (we're hitting two)
- **Skill sprawl** → "install more (feels powerful) → unpredictable behavior + longer
  tasks." Cap ~20, quarterly retire. [[digitalapplied: anti-patterns]](https://www.digitalapplied.com/blog/claude-code-anti-patterns-team-adoption-failure-modes-2026)
- **Over-triggering hooks** → notification fatigue (team learns to ignore). [[AI Codex: anti-patterns]](https://www.aicodex.to/articles/claude-code-antipatterns)
- **Intended skills don't fire** → almost always a weak/imprecise description. [[Medium: why skills don't fire]](https://medium.com/@taki4416/why-intended-skills-dont-fire-an-anti-pattern-in-claude-code-skill-a8c5230a9a5e)

## Action plan (maps to the 4 things you picked)

1. **Curate to a sharp set** (cap ~20): drop the 34 down to the ~15 we actually use on
   THIS repo. Retire the speculative ones. This *directly* improves auto-triggering —
   fewer descriptions to mis-match.
2. **Custom workflow commands**: convert the recurring, must-fire workflows to **slash
   commands** (not skills) — `recap`, `audit` (the lost-code check), `reflect`,
   `find-skills`. Deterministic, no routing uncertainty. Use the `command-development`
   skill we already have.
3. **Auto-trigger**: rewrite the kept skills' descriptions to the "pushy + when-to-use"
   pattern so they fire when relevant.
4. **Fix mechanics**: the lock-sync hook (done) + adopt the skill-creator eval pattern
   for any skill we author.

## Sources
- [Anthropic: Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Anthropic: Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Anthropic: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Claude Code Docs: Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [Anthropic: skill-creator SKILL.md](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)
- [Claude: Improving skill-creator (test/measure/refine)](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)
- [Skills/commands/MCP/subagents — when to use which](https://varunbhanot.substack.com/p/skills-slash-commands-mcp-subagents)
- [alexop.dev: Claude Code customization guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)
- [SwirlAI: Progressive disclosure as a design pattern](https://www.newsletter.swirlai.com/p/agent-skills-progressive-disclosure)
- [digitalapplied: Claude Code anti-patterns](https://www.digitalapplied.com/blog/claude-code-anti-patterns-team-adoption-failure-modes-2026)
- [Pasquale: Claude Code Skills 2.0 evals/benchmarks](https://pasqualepillitteri.it/en/news/341/claude-code-skills-2-0-evals-benchmarks-guide)
