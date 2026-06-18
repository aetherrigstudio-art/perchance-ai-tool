#!/usr/bin/env bash
# ci-verify.sh — verify that the live GitHub source matches local files
#
# ARCHITECTURE: The deploy path for this repo is push-to-GitHub, NOT upload-to-Perchance.
# The HTML panel (char-wiz-html) is served from GitHub raw by wizard-loader-html.txt,
# which was pasted once into the Perchance HTML editor. So "is it deployed?" means
# "does GitHub raw match local?", not "does Perchance match local?".
#
# The data panel (char-wiz-dat) IS stored directly in Perchance (pasted manually).
# /api/downloadGenerator can fetch it for comparison, but perchance.org may return
# Cloudflare 403 in CI/cloud environments — that path exits 2 (unreachable).
#
# Usage:
#   ./scripts/ci-verify.sh [html|dat|both]
#     html  (default) compare char-wiz-html vs GitHub raw
#     dat              compare char-wiz-dat vs live Perchance data panel
#     both             run both checks
#
# Exit codes:
#   0 = in sync
#   1 = drift detected (files differ)
#   2 = API/network unreachable (cannot determine sync status)

set -euo pipefail

OWNER="aetherrigstudio-art"
REPO="perchance-ai-tool"
BRANCH="claude/init-9i0np9"
HTML_FILE="char-wiz-html"
DAT_FILE="char-wiz-dat"
PERCHANCE_GENERATOR="q83iy9tti5"

GITHUB_RAW="https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${HTML_FILE}"
PERCHANCE_API="https://perchance.org/api/downloadGenerator?generatorName=${PERCHANCE_GENERATOR}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HTML_LOCAL="${REPO_ROOT}/${HTML_FILE}"
DAT_LOCAL="${REPO_ROOT}/${DAT_FILE}"

DIFF_TMP="$(mktemp /tmp/deploy-diff.XXXXXX)"
trap 'rm -f "${DIFF_TMP}"' EXIT

MODE="${1:-html}"

# ── HTML panel check: local vs GitHub raw ─────────────────────────────────────
check_html() {
  echo "Checking ${HTML_FILE} vs GitHub raw (${GITHUB_RAW})..."

  LIVE=$(curl -sf "${GITHUB_RAW}?t=$(date +%s)" 2>/dev/null) || {
    echo "API unreachable: could not fetch ${GITHUB_RAW}" >&2
    echo "  Possible causes: network policy, repo is private, or branch name changed." >&2
    echo "  Branch expected: ${BRANCH}" >&2
    exit 2
  }

  if diff <(printf '%s' "${LIVE}") <(cat "${HTML_LOCAL}") > "${DIFF_TMP}" 2>&1; then
    echo "OK  ${HTML_FILE} is in sync with GitHub (loader will serve this on next reload)"
    return 0
  else
    echo "DRIFT  ${HTML_FILE} differs from GitHub remote."
    echo "  The local file has not been pushed, or GitHub is serving a cached older version."
    echo "  To deploy: git add ${HTML_FILE} && git commit && git push origin ${BRANCH}"
    echo ""
    echo "  Diff (first 50 lines, remote vs local):"
    head -50 "${DIFF_TMP}" || true
    return 1
  fi
}

# ── Data panel check: local vs live Perchance ─────────────────────────────────
check_dat() {
  echo "Checking ${DAT_FILE} vs live Perchance data panel..."
  echo "  Endpoint: ${PERCHANCE_API}"
  echo "  NOTE: perchance.org may return 403 in CI/cloud environments (Cloudflare protected)."
  echo "        This check is reliable from a desktop/local machine."

  LIVE=$(curl -sf "${PERCHANCE_API}" 2>/dev/null) || {
    echo "API unreachable: perchance.org blocked this request (exit 2)." >&2
    echo "  This is expected in GitHub Actions / cloud CI — perchance.org uses Cloudflare." >&2
    echo "  Run this check locally: bash scripts/ci-verify.sh dat" >&2
    exit 2
  }

  if diff <(printf '%s' "${LIVE}") <(cat "${DAT_LOCAL}") > "${DIFF_TMP}" 2>&1; then
    echo "OK  ${DAT_FILE} matches live Perchance data panel"
    return 0
  else
    echo "DRIFT  ${DAT_FILE} differs from live Perchance data panel."
    echo "  MANUAL STEP REQUIRED: paste ${DAT_FILE} into the Perchance data/generator editor."
    echo "    1. Open https://perchance.org/${PERCHANCE_GENERATOR}#edit"
    echo "    2. DATA/GENERATOR tab -> select all -> paste ${DAT_FILE} -> Save"
    echo ""
    echo "  Diff (first 50 lines, live vs local):"
    head -50 "${DIFF_TMP}" || true
    return 1
  fi
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
case "${MODE}" in
  html)
    check_html
    ;;
  dat)
    check_dat
    ;;
  both)
    HTML_STATUS=0
    DAT_STATUS=0
    check_html || HTML_STATUS=$?
    echo ""
    check_dat  || DAT_STATUS=$?

    # Propagate the most severe exit code
    # Exit 2 (unreachable) takes priority over exit 1 (drift)
    if [ "${HTML_STATUS}" -eq 2 ] || [ "${DAT_STATUS}" -eq 2 ]; then
      exit 2
    elif [ "${HTML_STATUS}" -ne 0 ] || [ "${DAT_STATUS}" -ne 0 ]; then
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 [html|dat|both]" >&2
    exit 2
    ;;
esac
