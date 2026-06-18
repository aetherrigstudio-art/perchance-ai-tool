#!/usr/bin/env bash
# PostToolUse(Write|Edit) skill-router.
# Surfaces the right downloaded skill for the file just edited, as a one-line
# nudge injected into the model's context. Silent for unmapped files. This is
# deterministic skill routing — it complements (doesn't replace) auto-trigger,
# and works even for name-only skills (the model can act on the nudge or /name).
# Robust by design: any parse failure exits 0 (no nudge), never errors the turn.

input=$(cat 2>/dev/null)
f=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
[ -z "${f:-}" ] && exit 0

msg=""
case "$f" in
  *char-wiz-html|*wizard-html-panel-*.txt)
    msg="Wizard panel edited → markup: apply aria-live-regions + accessibility-engineer + mobile-responsiveness (keep [ ] { } OUT of markup, set bracket strings from <script>); <script> logic: code-security-audit / code-review-quality (URL allowlist, prompt-injection, XSS sinks); then verify via run-perchance-ai-tool (smoke + headless render + screenshot)." ;;
  *char-wiz-dat)
    msg="Data panel edited → it is a frozen minimal v2 stub; only {import:...} plugin lines, settings, \$meta belong here (logic lives in char-wiz-html). Verify with node test/smoke.mjs." ;;
  */.claude/commands/*)
    msg="Slash command edited → see command-development (frontmatter + body conventions)." ;;
  */.claude/hooks/*)
    msg="Hook edited → see hook-development; validate JSON shape + pipe-test the command before relying on it." ;;
  */.claude/settings.json)
    msg="settings.json edited → see plugin-settings / hook-development; CONFIRM it still parses (a malformed settings.json silently disables ALL settings)." ;;
  *ROADMAP.md)
    msg="Roadmap edited → see roadmap-planning; respect char-info §9 verified/unverified boundary (do not populate unverified ACC fields)." ;;
  *)
    exit 0 ;;
esac

[ -z "$msg" ] && exit 0
printf '%s' "$msg" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
