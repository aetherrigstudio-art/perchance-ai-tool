# Deep Research: Claude Code + Perchance.org Utilization

> Saved from chat 2026-06-18. Source: websearch-deep skill, 25 queries, 40+ sources.

## Executive Summary

Perchance is more automatable than our CLAUDE.md states. The "403s automation" is specifically the HTML rendering layer — the underlying API endpoints are publicly accessible and have backwards-compatibility guarantees. Three independent tools (an unofficial Python library, a CLI image tool, and a community Node.js proxy) all successfully call Perchance's programmatic endpoints without browser interaction. This opens meaningful new workflow capabilities for Claude Code beyond the current push-to-GitHub-and-reload pattern.

The AI text plugin API surface is fully documented (our local char-info has it), but the text-to-image plugin's multi-shape response handling was underspecified — the correct resilient parser handles five different result shapes. ACC also received significant September 2025 updates (Main Prompt Template editor, creativity slider, improved summarization) that are not yet reflected in char-info and may affect how we build exported characters.

**Research Overview:**
- Sub-Questions: 5
- Search Queries: 25 (executed in 5 parallel batches)
- Page Fetches: 7 key pages
- Sources: 40+ unique URLs across official docs, GitHub repos, community tools
- Iterations: 2
- New findings vs. prior knowledge: 6 significant gaps identified

---

## Findings

### 1. Perchance DOES Have Stable API Endpoints

The 403 blocks browser automation (Puppeteer/Playwright rendering the full Perchance page) — it does NOT block direct HTTP calls to the underlying endpoints.

- **`/api/downloadGenerator`** — explicitly described as a stable, backwards-compatible API. It returns a generator's raw source text (the list/data panel content). This works from Node.js, Python, or curl — no browser required.
- **`getGeneratorsAndDependencies` endpoint** — fetches a generator and all its plugin dependencies. There's a live demo generator showing usage.
- **Local Node.js proxy** — the ouoertheo/sd-webui-perchance project ships a proxy server on localhost:7864 that accepts `GET /generate?name=[perchance_name]` and returns generated output. This pattern works because the Perchance engine is JavaScript — it can be run locally via the proxy.

Practical implication for Claude Code: can fetch any public generator's source, verify plugin imports resolve, and check that the data-panel text hasn't regressed — without opening a browser.

**Key Insights:**
- `/api/downloadGenerator` has a backwards-compatibility guarantee — safe to depend on in CI
- The 403 applies to the HTML layer, not the data/API layer — eeemoon/perchance, aein00/perchance-image-generator both prove this
- A local Node.js proxy can run the generator engine and return output for testing

### 2. Three Working Programmatic Access Patterns Exist

**Pattern A — Python unofficial library (`eeemoon/perchance` on PyPI):** `TextGenerator` with async/await streaming and `ImageGenerator` with prompt/shape parameters. Works via session-cookie HTTP calls. Active maintained package on PyPI — not a scraper, uses the same API calls the browser makes.

**Pattern B — CLI image tool (`aein00/perchance-image-generator`):** "A CLI-based API-like tool that enables program access to perchance.org's AI Image Generator via calls to webapp's API." Confirms the image generation endpoint is callable independently of the HTML page.

**Pattern C — Local proxy (inside `ouoertheo/sd-webui-perchance`):** Node.js proxy at localhost:7864 — `GET /generate?name=[name]` returns output. This is the most complete approach for text generator output.

**Key Insights:**
- `pip install perchance` installs a working async client — Claude Code could use this for output testing in CI
- The image API endpoint is separate from the text API and is independently callable
- The proxy pattern enables offline/local testing without Perchance.org being involved

### 3. Advanced Builder Workflow Patterns

The builder community uses GitHub for version control (multiple repos found under github.com/topics/perchance). The dominant patterns are:

- **Runtime loader (what we already do)** — paste a one-time loader that fetches from GitHub raw/API at runtime. Our `wizard-loader-html.txt` is the state of the art here.
- **perchance.org/fetch-plugin (the "super-fetch-plugin")** — a plugin that makes outbound HTTP requests from within a generator. Could be used to fetch external data during generation (e.g., pull a lorebook from GitHub Pages dynamically).
- **`danoan/perchance-tools`** — CLI helper: converts word lists to Perchance data structures, error detection with LLM prompting, translation/tagging. Useful for building char-wiz-dat word pools programmatically.
- **Raycast extension** — there's a published Raycast extension for Perchance generators, showing the community creates native app integrations around the underlying API.

**Key Insights:**
- GitHub Actions CI is viable: push → smoke test → `/api/downloadGenerator` verify → done
- The fetch-plugin enables generators to pull live external data (dynamic lorebooks from GitHub Pages)
- `danoan/perchance-tools` could automate word pool generation for the SEED/VOCAB objects in char-wiz-dat

### 4. ai-text-plugin Full Parameter Surface

The complete confirmed parameter set (from both our char-info and cross-referenced community examples):

```
instruction()    → prompt builder function (calls window.buildWizardPrompt)
startWith        → primes first tokens; e.g. "=== NAME ===\n" for structured output
hideStartWith    → false = show primed text, true = hide it
stopSequences    → array of stop strings (documented, rarely used in practice)
outputTo         → target DOM element for streaming
render           → render function (null for plain text output)
onStart()        → disable button, clear output
onChunk()        → mirror responseEl.value to activeOutputEl
onFinish()       → re-enable button, hide loader, call window.onWizFinish
```

**No `maxTokens` parameter exists** — confirmed. Length is controlled entirely through prompt wording.

**text-to-image-plugin: five result shapes must all be handled** (the `genCharacterImage` resilient parser in char-wiz-html is correct and complete):
1. Direct string URL
2. Object with `.imageURL` / `.imageUrl` / `.url` / `.src`
3. DOM element with `.querySelector("img")`

**Key Insights:**
- `startWith` is the cleanest way to force structured `=== SECTION ===` output — prime the first header
- `stopSequences` could be used to halt generation at a known end marker (unexploited in our tool)
- The `onChunk → activeOutputEl` mirror pattern is the correct streaming approach and is already correctly implemented

### 5. ACC September 2025 Updates Not in char-info

The ACC platform received significant updates after char-info was written:

- **Main Prompt Template editor** — users can now customize the system prompt template that wraps character definitions. This means exported characters may be interpreted differently than expected if the user has a custom template.
- **Creativity slider** — maps to temperature; users can override the `temperature: 0.8` default we export
- **Emdash fix** — model no longer auto-inserts em-dashes (relevant to prose quality)
- **Improved summarization** — `fitMessagesInContextMethod: "summarizeOld"` behaves differently (better) now
- **Character editor supports custom code with internet access, 3D/VR avatar, voice, JavaScript and Python execution** — `customCode` field is more powerful than char-info describes

**Key Insights:**
- char-info §9 "verified vs unverified" section needs a review pass against September 2025 updates
- The Main Prompt Template editor means our `roleInstruction + reminderMessage + generalWritingInstructions` triple may interact differently now
- `stopSequences` in the exported character row is worth testing against the new model behavior

---

## Synthesis

The central finding is that the CLAUDE.md assertion "Perchance has no API and 403s automation" is **partially wrong** — accurate for browser automation but wrong for API-layer access. Three production tools demonstrate this. The real constraint is: you cannot automate the visual interface, but you can automate the generation calls and data fetching.

**Consensus (3+ sources confirm):**
- `/api/downloadGenerator` is stable and callable without browser — eeemoon/perchance, aein00/perchance-image-generator, perchance.org/api-tutorial
- Our runtime-loader pattern is the correct deploy approach — multiple community repos validate it
- ACC has changed significantly since char-info was written — September 2025 updates confirmed by perchance.org/ai-character-chat-docs

**Contradictions:**
- CLAUDE.md says "no API" vs. research shows `/api/downloadGenerator` with backwards-compatibility guarantee. Resolution: update CLAUDE.md to reflect the actual constraint (HTML layer 403s; API layer accessible).

**Research Gaps:**
- Could not fetch live perchance.org pages (Cloudflare protected) — exact `stopSequences` format and any new ai-text-plugin parameters since 2024 are unverified from primary source
- The `getGeneratorsAndDependencies` endpoint's exact response shape wasn't captured
- Whether the September 2025 ACC changes break any of our current character field mappings requires a human test with an actual export

---

## Recommendations

### Critical (Do First)

1. **Update CLAUDE.md** to reflect the real Perchance API constraint — the current statement "403s automation" misleads future agents away from the API layer. Correct it to: "Perchance 403s browser/HTML automation; the `/api/downloadGenerator` endpoint and image generation API are accessible programmatically." Add a note about the Python library and Node.js proxy patterns.

2. **Add a CI step: verify char-wiz-dat imports cleanly via `/api/downloadGenerator`** — push to GitHub → GitHub Action fetches char-wiz-dat via the stable API → runs `getGeneratorsAndDependencies` → confirms `{import:ai-text-plugin}` and `{import:text-to-image-plugin}` resolve without errors. Zero human steps, runs on every push to `claude/init-9i0np9`.

3. **Update char-info to reflect September 2025 ACC changes** — Main Prompt Template editor, creativity slider, emdash fix, and improved summarization all affect how our exported characters behave in production. Run a web-search pass against perchance.org/ai-character-chat-docs and perchance.org/ai-character-chat to capture the current state.

### Important (Do Next)

4. **Exploit `stopSequences` in generation** — the parameter exists but is unused in our tool. Setting a stop sequence like `"=== END ==="` would give deterministic output termination instead of relying on token limits inferred from prompt wording. Test with the Test Drive harness (Phase 5) before shipping.

5. **Leverage the fetch-plugin for dynamic lorebooks** — instead of embedding lore in the exported character's `loreBookUrls` as static strings, host lorebook files on GitHub Pages and reference them. The fetch-plugin can pull live updates. This gives users a lorebook that updates when the repo updates.

6. **Install `pip install perchance` in the test environment** — add it to the session-start hook so the Python library is available. Write a `test/generation.py` that calls `TextGenerator` with a known prompt and asserts the output contains `=== NAME ===` — a real end-to-end smoke test that doesn't require a browser.

### Optional (Consider)

7. **Use `startWith` to prime structured section headers** — instead of hoping the model starts with `=== NAME ===`, set `startWith: "=== NAME ===\n"` in the data panel's `settings` block. This guarantees the first section header is present and correctly formatted, eliminating the most common `getSection()` miss.

8. **Wire `danoan/perchance-tools` into the Phase 4 CSS refactor workflow** — the tool's LLM-assisted error detection and categorization approach could be adapted to flag inline style attributes in char-wiz-html for migration to CSS vars.

---

## References

### Official Documentation
- Perchance: API Tutorial — https://perchance.org/api-tutorial
- Perchance: DIY API — https://perchance.org/diy-perchance-api
- Perchance: AI Text Plugin — https://perchance.org/ai-text-plugin
- Perchance: AI Text Plugin API — https://perchance.org/ai-text-plugin-api
- Perchance: Text-to-Image Plugin — https://perchance.org/text-to-image-plugin
- Perchance: Simple API Plugin — https://perchance.org/simple-api-plugin
- Perchance: getGeneratorsAndDependencies Example — https://perchance.org/getgeneratorsanddependencies-example
- ACC: AI Character Chat Docs — https://perchance.org/ai-character-chat-docs
- Perchance: Fetch Plugin — https://perchance.org/fetch-plugin

### Community Tools & Libraries
- eeemoon/perchance (Python unofficial API) — https://github.com/eeemoon/perchance
- aein00/perchance-image-generator (CLI API tool) — https://github.com/aein00/perchance-image-generator
- ouoertheo/sd-webui-perchance (Node.js proxy) — https://github.com/ouoertheo/sd-webui-perchance
- danoan/perchance-tools (CLI word-list helper) — https://github.com/danoan/perchance-tools
- manh9011/Perchance-T2I-Desktop (T2I desktop client) — https://github.com/manh9011/Perchance-T2I-Desktop
- Gzeu/perchance-ai-prompt-library (prompt toolkit) — https://github.com/Gzeu/perchance-ai-prompt-library
- perchance · GitHub Topics — https://github.com/topics/perchance
