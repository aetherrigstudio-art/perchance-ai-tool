#!/usr/bin/env bash
# gen-hash.sh — write the sha256 of char-wiz-html to char-wiz-html.sha256.
#
# The loader (wizard-loader-html.txt) fetches char-wiz-html from GitHub at runtime
# and soft-verifies it against this digest (crypto.subtle.digest over the fetched
# UTF-8 text == sha256sum of the committed file — verified equal). Keep this file
# in lock-step with char-wiz-html: the .githooks/pre-commit hook regenerates it on
# any char-wiz-html change, and CI fails if it drifts.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
sha256sum char-wiz-html | awk '{print $1}' > char-wiz-html.sha256
echo "char-wiz-html.sha256 = $(cat char-wiz-html.sha256)"
