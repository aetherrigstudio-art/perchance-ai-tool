# Workflows, Automated Skill Workflows & Tool Calling — Deep Research

> deep-research, 2026-06-18. Applied to this repo (Perchance generator, "better
> skill calling" goal). Note: this session already has `workflows` +
> `workflowKeywordTriggerEnabled` ON in /config.

## Executive summary

- **Workflows move the plan into code.** The workflow *script* holds the loop,
  branching, and intermediate results; Claude's context holds only the final answer.
  This is the antidote to "20 ambiguous decisions at 80% each ≈ 1% all-correct."
- **Skills compose, but can't call each other.** Claude Code is the orchestrator —
  it calls skill A, passes its output into skill B. The #1 failure is **unclear
  handoffs**; fix = explicit **file-path** hand-offs + a defined output format per step.
- **Parallel tool calls are free performance** — but only if results are formatted
  right (all tool results in one message keeps parallelism; splitting them trains
  Claude to go sequential).

## Findings

### 1. The five workflow patterns
| Pattern | Shape | Use for |
|---|---|---|
| **Sequential** | A→B→C pipeline, each output feeds next | recap→audit→reflect; scenario→main→persona→lore→opening |
| **Operator** | One "brain" agent plans + directs others | a lead coordinating fixes |
| **Split-and-merge** | Independent subtasks in parallel, then combine | the 3 quick-fix agents (no shared deps) |
| **Agent teams** | Built-in multi-agent orchestrator, shared task list | larger parallel builds |
| **Headless** | Scripted, non-interactive | CI / routines |
[[Claude Code Docs: dynamic workflows]](https://code.claude.com/docs/en/workflows) · [[MindStudio: 5 workflow patterns]](https://www.mindstudio.ai/blog/claude-code-5-workflow-patterns-explained)

### 2. Automated skill workflows (chaining)
- Skills **can't reference other skills**; Claude composes them automatically when
  descriptions are precise, or you give **explicit sequencing** for determinism.
  [[Anthropic: Agent Skills]](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- Orchestrator passes A's output as B's input. The full SDLC can be a chain
  (brainstorm → worktree → plan → execute → review). [[MindStudio: skill collaboration]](https://www.mindstudio.ai/blog/claude-code-skill-collaboration-chaining-workflows)
- **Handoff rule**: use explicit **file paths** for inter-step communication, not
  in-context memory; define the expected output format in the command file. [[alexop.dev: deterministic orchestration]](https://alexop.dev/posts/claude-code-workflows-deterministic-orchestration/)

### 3. Tool calling
- Tool calls in one turn are **unordered**; run them concurrently. **Batch independent
  calls into a single message** — splitting tool results across messages kills
  parallelism. [[Anthropic: parallel tool use]](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use)
- **Programmatic Tool Calling**: Claude writes code that calls multiple tools, processes
  outputs, and controls what enters its context — fewer round-trips, less context bloat.
  [[Anthropic: advanced tool use]](https://www.anthropic.com/engineering/advanced-tool-use)
- **Subagent caveat**: a subagent gets a **fresh, isolated context** — the *only*
  channel in is the delegation prompt. Put everything it needs in that string.
  [[hidekazu-konishi: subagents/orchestration]](https://hidekazu-konishi.com/entry/claude_code_subagents_and_orchestration_guide.html)

### 4. Orchestration options in 2026
- **Agent Teams** — built-in; a team-lead session coordinates teammates via a shared
  task list, each in its own context. [[Claude Code Docs: agent teams]](https://code.claude.com/docs/en/agent-teams)
- **Dynamic Workflows** (research preview, **enabled in this session**) — Claude
  generates an orchestration script, splits work, runs in parallel, validates, then
  returns the final answer. [[InfoQ: dynamic workflows]](https://www.infoq.com/news/2026/06/dynamic-workflows-claude-code/)
- **Routines** — saved cloud configs (prompt + repos + trigger) that run on schedule
  unattended. [[claudefa.st: routines]](https://claudefa.st/blog/guide/development/routines-guide)

### 5. Quality patterns worth stealing
Adversarial verify (N skeptics must fail to refute a finding), diverse lenses, judge
panels, loop-until-dry. The lost-code audit earlier was effectively "loop-until-dry."
[[MindStudio: agentic workflow patterns]](https://www.mindstudio.ai/blog/claude-code-agentic-workflow-patterns)

## Action plan for this repo

1. **Build the workflow commands as sequential pipelines with file-path handoffs.**
   e.g. `/audit` = lost-code search → write findings to a file → update docs, each
   step's output a real path, not memory.
2. **Lean on parallel tool calls** (already doing it — the search batches above were
   one message) and prefer one-message tool-result batching.
3. **For parallel multi-file work**, use split-and-merge subagents with **complete
   delegation prompts** (the quick-fix agents failed partly on a container restart, not
   design — but their prompts were correct: self-contained).
4. **Dynamic Workflows is on** — for genuinely multi-step asks I can let Claude generate
   the orchestration script rather than hand-coding the loop.

## Sources
- [Claude Code Docs: Dynamic workflows](https://code.claude.com/docs/en/workflows)
- [Claude Code Docs: Agent teams](https://code.claude.com/docs/en/agent-teams)
- [Anthropic: Parallel tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use)
- [Anthropic: Advanced tool use (programmatic tool calling)](https://www.anthropic.com/engineering/advanced-tool-use)
- [Anthropic: Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [alexop.dev: Deterministic multi-agent orchestration](https://alexop.dev/posts/claude-code-workflows-deterministic-orchestration/)
- [MindStudio: 5 workflow patterns](https://www.mindstudio.ai/blog/claude-code-5-workflow-patterns-explained)
- [MindStudio: Skill collaboration / chaining](https://www.mindstudio.ai/blog/claude-code-skill-collaboration-chaining-workflows)
- [InfoQ: Dynamic Workflows for parallel agent coordination](https://www.infoq.com/news/2026/06/dynamic-workflows-claude-code/)
- [hidekazu-konishi: Subagents & orchestration guide](https://hidekazu-konishi.com/entry/claude_code_subagents_and_orchestration_guide.html)
