---
description: Discover and propose skills from the open agent skills ecosystem
argument-hint: "[query]"
---

The user wants to find a skill. Query from $ARGUMENTS.

## Process

1. **Understand need** — identify domain + specific task from the query.

2. **Check currently installed skills** in `.claude/skills/` and `skills-lock.json` — if one already covers the need, say so.

3. **Search** (if not found locally):
   ```bash
   npx skills find "$ARGUMENTS" 2>/dev/null | head -30
   ```
   If `npx` unavailable, report that and suggest checking https://skills.sh/ manually.

4. **Verify quality** before recommending — prefer skills with 1K+ installs from reputable sources (`vercel-labs`, `anthropics`, `composiohq`).

5. **Present** name + what it does + install count + install command.

6. **Offer to install** if user confirms:
   ```bash
   npx skills add <owner/repo@skill> -g -y
   ```

If no skill found: offer to help directly with general capabilities, or suggest `npx skills init` to create a custom one.
