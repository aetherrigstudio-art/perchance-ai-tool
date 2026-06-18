---
title: AUDIT security+content 2026-06-18
type: report
permalink: perchar/memory/audit-security-content-2026-06-18
tags:
- audit
- security
- xss
- prompt-injection
- content-quality
---

# AUDIT security+content 2026-06-18

Read-only audit of char-wiz-html (wizard-html-panel-19.txt), wizard-loader-html.txt, fixer-html-panel-1.txt, image-style-builder-html-panel-8.txt, test/grade-generation.mjs. Full report at ai-workspace/audit/audit-security-content.md.

## Severity counts

| Category | High | Medium | Low |
|----------|------|--------|-----|
| DOM-XSS | 2 | 0 | 1 |
| Prompt-injection | 0 | 2 | 2 |
| Paste-safety | 0 | 0 | 0 |
| Content-quality | 0 | 0 | 3 |

## Top findings

### HIGH-1: Loader supply-chain — wizard-loader-html.txt:43,66,71
Remote fetch of char-wiz-html from GitHub main, injected via `root.innerHTML = htmlText` with scripts re-executed. No SRI, no content hash, no integrity check. Security boundary = GitHub account security. Practical mitigation: branch protection on main, 2FA, and a content-length sanity check in the loader. Hash-pinning via Web Crypto API is feasible but requires re-paste on each hash change.

### HIGH-2: `javascript:` URL scheme not blocked — char-wiz-html:1558,1581,1632,1646
Image src attributes set via `innerHTML = "<img src='" + escAttr(u) + "'"`. OWASP confirms escAttr alone is insufficient — `jav&#x09;ascript:` and similar bypass attribute encoding. Fix: add `safeUrl()` helper using `new URL(u)` to validate protocol is `http:`, `https:`, or `blob:` before escAttr.

### MEDIUM-3: Raw user notes in prompts — char-wiz-html:551,570,700,723,729; fixer:44; style-builder:125,131
All user input concatenated raw with no sanitization, no length cap, no `=== HEADER ===` stripping. A user can inject fake section headers into their own notes. Empirical research: direct `=== OVERRIDE ===` injection achieves 86.3% success on weaker models. Fix: `prepUserInput()` that strips `=== ... ===` headers, known directive patterns, caps at 1500 chars.

### MEDIUM-4: Instruction placement — char-wiz-html:593 (sectionTail), 551
User text appears before BINDING RULES in the prompt. The sectionTail re-anchor at the end is good but a long injection can drown the rules. Fix: wrap user text in `---BEGIN USER INPUT--- / ---END USER INPUT---` container immediately followed by binding rules.

### LOW-5: Error innerHTML unescaped — char-wiz-html:2425
`resultsEl.innerHTML = "<p>ERROR: " + e.message + "</p>"` — use textContent or escHtml().

## Paste-safety: ALL CLEAN
char-wiz-html (markup before line 372), fixer-html-panel-1.txt, image-style-builder-html-panel-8.txt, wizard-loader-html.txt — zero raw or entity-escaped brackets in markup regions. Style blocks all appear after first script tag. Smoke test guard is consistent with actual files.

## Grader rubric gaps (test/grade-generation.mjs)

- Missing section checks: TAGLINE, REMINDER, WRITING INSTRUCTION
- Missing {{char}}/{{user}} macro presence check in ROLE INSTRUCTION
- Leaked-prompt patterns missing: BINDING RULES, STORY SO FAR:, USER'S IDEA:, CONTENT RULES:, you are a character designer, HARD RULE:
- No FIRST MESSAGE word cap (>400w is too long for ACC context)
- IMAGE TRIGGERS format check: only verifies name token present, not `Name: tag, tag, tag` format

## Relations
- related to: ONBOARDING - current state 2026-06-18 (v2 + generation grader)
