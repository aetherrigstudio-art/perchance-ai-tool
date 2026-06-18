#!/usr/bin/env python3
"""PostToolUse validator for perchance-ai-tool generator files.

Catches two documented, high-confidence breakages right after an edit — kept
deliberately narrow to avoid false positives on the JS-heavy HTML panels:

  1. Merged blocks: a data-editor file must never contain HTML markup. The data
     and HTML editors are two separate blocks (char-info section 1).
  2. Incomplete Dexie export: any file that defines a buildDexie exporter must
     declare all 9 ACC tables, or the import throws (char-info section 3).

Reads the PostToolUse hook payload on stdin; on a violation it exits 2 with a
message on stderr so the finding is surfaced to Claude. Anything it cannot
classify is left alone (exit 0).
"""
import json
import os
import sys

REQUIRED_TABLES = [
    "characters", "threads", "messages", "misc", "summaries",
    "memories", "lore", "textEmbeddingCache", "textCompressionCache",
]
# Markup that should never appear in a Perchance data editor.
HTML_MARKERS = ["<script", "<style", "<div", "<button", "<textarea", "<!doctype", "<html"]


def is_data_editor(path: str, text: str) -> bool:
    base = os.path.basename(path)
    if base in ("char-wiz-dat",) or "data-panel" in base:
        return True
    # Heuristic: a Perchance data editor opens with plugin imports / settings.
    head = text.lstrip()[:200]
    return head.startswith("ai = {import:") or head.startswith("settings")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0  # Not our concern if we can't parse the event.

    path = (payload.get("tool_input") or {}).get("file_path", "")
    if not path or not os.path.isfile(path):
        return 0

    base = os.path.basename(path)
    # Only inspect generator source; skip docs and the validator itself.
    if base.endswith(".md") or base in ("CLAUDE.md",) or base.startswith("validate-generator"):
        return 0
    # Skip test harnesses: they drive the real exporter in char-wiz-html (so they
    # reference buildDexie) but are not generator source and never redeclare the
    # 9 tables themselves. Inspecting them is a guaranteed false positive.
    norm = path.replace("\\", "/")
    if "/test/" in norm or norm.endswith(".mjs") or norm.endswith(".test.js"):
        return 0

    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            text = fh.read()
    except Exception:
        return 0

    problems = []

    if is_data_editor(path, text):
        found = [m for m in HTML_MARKERS if m in text.lower()]
        if found:
            problems.append(
                f"{base} looks like a data-editor file but contains HTML markup "
                f"({', '.join(found)}). The data and HTML editors must stay as two "
                f"separate blocks (char-info section 1) — do not merge them."
            )

    if "buildDexie" in text:
        # Match either quote style — single-quoted table names are valid JS too.
        missing = [t for t in REQUIRED_TABLES if f'"{t}"' not in text and f"'{t}'" not in text]
        if missing:
            problems.append(
                f"{base} defines a buildDexie exporter but is missing Dexie table(s): "
                f"{', '.join(missing)}. All 9 tables must be declared or ACC import "
                f"throws (char-info section 3)."
            )

    if problems:
        sys.stderr.write("Generator validation failed:\n- " + "\n- ".join(problems) + "\n")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
