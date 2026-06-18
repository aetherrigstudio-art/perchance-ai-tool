#!/usr/bin/env bash
# deploy.sh — sync local generator files to Perchance
#
# ARCHITECTURE NOTE: There is no upload API for Perchance.
# The deploy path for this repo is:
#
#   1. HTML panel (char-wiz-html): git push → loader fetches from GitHub raw at runtime.
#      The loader (wizard-loader-html.txt) was pasted once into Perchance's HTML editor
#      and never needs updating unless the branch/filename changes.
#      Editing char-wiz-html and pushing to the branch IS the deploy.
#
#   2. Data panel (char-wiz-dat): must be manually pasted into Perchance's data/generator
#      editor if it changes. It rarely changes.
#
# This script:
#   - Checks whether char-wiz-html has been pushed to the remote branch (GitHub raw)
#   - Checks whether char-wiz-dat has changed since the last known-good copy
#   - Prints actionable instructions for anything that still needs a manual step
#
# Usage: ./scripts/deploy.sh [--check-dat]
#   --check-dat   Also check data panel drift vs. live Perchance (requires curl)
#
# Exit codes: 0 = all in sync, 1 = action required, 2 = prereq missing

set -euo pipefail

OWNER="aetherrigstudio-art"
REPO="perchance-ai-tool"
BRANCH="main"
HTML_FILE="char-wiz-html"
DAT_FILE="char-wiz-dat"
PERCHANCE_GENERATOR="q83iy9tti5"

# GitHub raw URL (served immediately on push, no CDN delay in API mode)
GITHUB_RAW="https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${HTML_FILE}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HTML_LOCAL="${REPO_ROOT}/${HTML_FILE}"
DAT_LOCAL="${REPO_ROOT}/${DAT_FILE}"

# ── prereq checks ─────────────────────────────────────────────────────────────
if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required but not found" >&2
  exit 2
fi
if ! command -v diff >/dev/null 2>&1; then
  echo "ERROR: diff is required but not found" >&2
  exit 2
fi

# ── git status check ──────────────────────────────────────────────────────────
echo "=== Deploy status for ${REPO} (branch: ${BRANCH}) ==="
echo ""

NEEDS_ACTION=0

# Check if local HTML file has uncommitted changes or is ahead of remote
cd "${REPO_ROOT}"
if ! git diff --quiet HEAD -- "${HTML_FILE}" 2>/dev/null; then
  echo "WARNING: ${HTML_FILE} has uncommitted local changes."
  echo "  Run: git add ${HTML_FILE} && git commit && git push origin ${BRANCH}"
  NEEDS_ACTION=1
elif git rev-parse "origin/${BRANCH}" >/dev/null 2>&1; then
  if ! git diff --quiet HEAD "origin/${BRANCH}" -- "${HTML_FILE}" 2>/dev/null; then
    echo "WARNING: ${HTML_FILE} is committed but not yet pushed."
    echo "  Run: git push origin ${BRANCH}"
    NEEDS_ACTION=1
  fi
fi

# ── HTML panel: verify GitHub raw matches local ───────────────────────────────
echo "Checking ${HTML_FILE} vs GitHub raw (branch: ${BRANCH})..."
REMOTE_HTML=$(curl -sf "${GITHUB_RAW}?t=$(date +%s)" 2>/dev/null) || {
  echo "  WARNING: Could not reach GitHub raw URL — check network or repo visibility."
  echo "    URL: ${GITHUB_RAW}"
  NEEDS_ACTION=1
  REMOTE_HTML=""
}

if [ -n "${REMOTE_HTML}" ]; then
  LOCAL_HTML=$(cat "${HTML_LOCAL}")
  if [ "${LOCAL_HTML}" = "${REMOTE_HTML}" ]; then
    echo "  OK  ${HTML_FILE} is live on GitHub (loader serves this on next page load)"
  else
    echo "  DRIFT  ${HTML_FILE} differs from GitHub remote."
    echo "         Commit and push to deploy:"
    echo "           git add ${HTML_FILE} && git commit -m 'update wizard HTML' && git push origin ${BRANCH}"
    diff <(echo "${REMOTE_HTML}") <(echo "${LOCAL_HTML}") | head -30 || true
    NEEDS_ACTION=1
  fi
fi

echo ""

# ── Data panel: check if manual paste is needed ───────────────────────────────
CHECK_DAT="${1:-}"
if [ "${CHECK_DAT}" = "--check-dat" ]; then
  echo "Checking ${DAT_FILE} vs live Perchance data panel..."
  # /api/downloadGenerator returns the data panel source for a named generator.
  # Note: perchance.org may return 403 from CI/cloud environments; test locally.
  LIVE_DAT=$(curl -sf "https://perchance.org/api/downloadGenerator?generatorName=${PERCHANCE_GENERATOR}" 2>/dev/null) || {
    echo "  WARNING: Could not reach Perchance API."
    echo "    This endpoint is accessible from a browser/desktop but may be blocked in CI."
    echo "    Endpoint: https://perchance.org/api/downloadGenerator?generatorName=${PERCHANCE_GENERATOR}"
    echo "    Try locally: curl 'https://perchance.org/api/downloadGenerator?generatorName=${PERCHANCE_GENERATOR}'"
    NEEDS_ACTION=1
    LIVE_DAT=""
  }

  if [ -n "${LIVE_DAT}" ]; then
    LOCAL_DAT=$(cat "${DAT_LOCAL}")
    if diff <(echo "${LIVE_DAT}") <(echo "${LOCAL_DAT}") >/dev/null 2>&1; then
      echo "  OK  ${DAT_FILE} matches live Perchance data panel"
    else
      echo "  DRIFT  ${DAT_FILE} differs from live Perchance data panel."
      echo "  MANUAL STEP REQUIRED: Paste ${DAT_FILE} into the Perchance data/generator editor."
      echo ""
      echo "  How to paste the data panel:"
      echo "    1. Open https://perchance.org/${PERCHANCE_GENERATOR}#edit"
      echo "    2. Click the DATA/GENERATOR tab (left panel)"
      echo "    3. Select all, delete, paste the contents of ${DAT_FILE}"
      echo "    4. Click Save"
      diff <(echo "${LIVE_DAT}") <(echo "${LOCAL_DAT}") | head -30 || true
      NEEDS_ACTION=1
    fi
  fi
else
  echo "Data panel (${DAT_FILE}) check skipped (pass --check-dat to enable)."
  echo ""
  echo "Manual paste required if ${DAT_FILE} has changed:"
  echo "  1. Open https://perchance.org/${PERCHANCE_GENERATOR}#edit"
  echo "  2. DATA/GENERATOR tab -> select all -> paste ${DAT_FILE} contents -> Save"
fi

echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
if [ "${NEEDS_ACTION}" -eq 0 ]; then
  echo "All checks passed. ${HTML_FILE} is live. Reload the generator to pick up changes:"
  echo "  https://perchance.org/${PERCHANCE_GENERATOR}"
else
  echo "Action required — see warnings above."
  exit 1
fi
