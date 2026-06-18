#!/usr/bin/env bash
# PostToolUse hook: after editing the wizard HTML panel, extract the largest
# <script> block and run `node --check` on it. Informational only (never blocks
# the edit). Reads the hook's stdin JSON to find the edited file path.
f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
case "$f" in
  *char-wiz-html|*wizard-html-panel-*.txt)
    node -e 'const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8");const m=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).sort((a,b)=>b.length-a.length)[0]||"";fs.writeFileSync("/tmp/_wizcheck.js",m);' "$f" 2>/dev/null \
      && node --check /tmp/_wizcheck.js 2>/tmp/_wizerr \
      && echo '{"systemMessage":"wizard <script>: syntax OK"}' \
      || echo "{\"systemMessage\":\"wizard <script>: SYNTAX ERROR — $(head -1 /tmp/_wizerr 2>/dev/null)\"}"
    ;;
esac
exit 0
