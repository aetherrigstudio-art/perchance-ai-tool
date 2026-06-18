#!/usr/bin/env python3
"""
Perchance.org API client.

## Status
Tested 2026-06-18. Results:
- download: WORKS. Fetches generator source via /api/downloadGenerator endpoint,
  parses the embedded JSON from the #preloaded-generator-data script element.
  Returns data-panel text (modelText) and HTML-panel text (outputTemplate).
  Tested with generator "welcome" — returns correct source.
- list: NOT IMPLEMENTED — Perchance has no public API for listing a user's
  generators. This subcommand is stubbed and exits with a message.
- text generation (TextGenerator): BLOCKED in this environment. The `perchance`
  package (v0.1.0) uses Playwright under the hood, and the Anthropic egress
  gateway replaces TLS certs, causing ERR_CERT_AUTHORITY_INVALID. Usable outside
  this environment; the package is documented as a fallback.

## Implementation notes
- Tried `perchance` pip package first (eeemoon/perchance). It wraps Playwright
  (headless Chromium) to bypass Cloudflare — not suitable for just fetching
  source text, and cert errors block it here anyway.
- Fell back to `requests` (available) / `urllib` (stdlib fallback) for the
  download use-case, which works correctly.
- /api/downloadGenerator returns the full rendered generator HTML page. The
  raw source data is embedded as URL-encoded JSON in a <script
  id="preloaded-generator-data"> element with keys: name, modelText,
  outputTemplate, imports, isPrivate.
  modelText     = data/generator panel source (the list-based data editor)
  outputTemplate = HTML panel source

Usage:
  python3 scripts/perchance_api.py download <generator-name>
  python3 scripts/perchance_api.py download <generator-name> output-file.txt
  python3 scripts/perchance_api.py download <generator-name> --html
  python3 scripts/perchance_api.py download <generator-name> --both output-dir/
  python3 scripts/perchance_api.py list <username>
"""

from __future__ import annotations

import json
import sys
import urllib.parse
from typing import Optional

# Try requests first, fall back to urllib
try:
    import requests as _requests
    _USE_REQUESTS = True
except ImportError:
    _USE_REQUESTS = False


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class GeneratorNotFoundError(Exception):
    """Raised when the requested Perchance generator does not exist."""


class PerchanceAPIError(Exception):
    """Raised for unexpected API failures (changed page structure, parse errors, etc.)."""


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _get(url: str, timeout: int = 30) -> str:
    """Fetch URL and return response text. Uses requests if available, else urllib."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; perchance-api-client/1.0; "
            "+https://github.com/aetherrigstudio-art/perchance-ai-tool)"
        )
    }
    if _USE_REQUESTS:
        resp = _requests.get(url, headers=headers, timeout=timeout)
        if resp.status_code == 404:
            raise GeneratorNotFoundError(
                f"Generator not found (HTTP 404): {url}"
            )
        resp.raise_for_status()
        return resp.text
    else:
        import urllib.request
        import urllib.error
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                raise GeneratorNotFoundError(
                    f"Generator not found (HTTP 404): {url}"
                ) from exc
            raise


# ---------------------------------------------------------------------------
# Core API
# ---------------------------------------------------------------------------

def _parse_generator_html(html: str, generator_name: str) -> dict:
    """
    Extract the preloaded generator data from a downloaded generator HTML page.

    Perchance embeds generator source as URL-encoded JSON in a script element:
      <script id="preloaded-generator-data">%7B%22name%22:...</script>

    Returns a dict with keys: name, modelText, outputTemplate, imports, isPrivate.
    modelText      = data/generator panel source (the list-based data editor)
    outputTemplate = HTML panel source
    """
    idx = html.find("preloaded-generator-data")
    if idx == -1:
        # If we get a "Not found." response, the generator doesn't exist
        stripped = html.strip()
        if "Not found" in stripped or len(stripped) < 100:
            raise GeneratorNotFoundError(
                f"Generator '{generator_name}' not found on Perchance."
            )
        raise PerchanceAPIError(
            "Could not find '#preloaded-generator-data' in response. "
            "The Perchance page structure may have changed."
        )

    # Find the content between > and </script>
    content_start = html.find(">", idx) + 1
    content_end = html.find("</script>", content_start)
    if content_end == -1:
        raise PerchanceAPIError(
            "Malformed HTML: closing </script> tag not found after preloaded-generator-data."
        )

    raw = html[content_start:content_end].strip()
    if not raw:
        raise PerchanceAPIError("preloaded-generator-data element is empty.")

    # URL-decode and parse JSON
    try:
        decoded = urllib.parse.unquote(raw)
        data = json.loads(decoded)
    except (json.JSONDecodeError, ValueError) as exc:
        raise PerchanceAPIError(f"Failed to parse generator data JSON: {exc}") from exc

    return data


def download_generator(name: str) -> dict:
    """
    Fetch raw source of a Perchance generator by name.

    Returns a dict with:
      name          : str  — generator slug
      modelText     : str  — data/generator panel source text
      outputTemplate: str  — HTML panel source text
      imports       : list — list of imported generator names
      isPrivate     : bool — whether the generator is private

    Raises:
      GeneratorNotFoundError if the generator doesn't exist.
      PerchanceAPIError for other API failures.
    """
    url = (
        "https://perchance.org/api/downloadGenerator"
        f"?generatorName={urllib.parse.quote(name)}"
    )
    html = _get(url)
    return _parse_generator_html(html, name)


def get_data_panel(name: str) -> str:
    """
    Fetch the data/generator panel source text for a generator.

    This is the content that goes into Perchance's data editor (the list-based,
    indentation-based plain text with {import:...} directives and generate() function).
    """
    data = download_generator(name)
    return data.get("modelText", "")


def get_html_panel(name: str) -> str:
    """
    Fetch the HTML panel source text for a generator.

    This is the content that goes into Perchance's HTML editor (the UI, JavaScript,
    and <style> definitions).
    """
    data = download_generator(name)
    return data.get("outputTemplate", "")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _usage_and_exit():
    print(__doc__)
    sys.exit(1)


def cmd_download(args: list) -> None:
    """
    download <generator-name> [output-file] [--html] [--both [output-dir]]

    --html  : fetch HTML panel instead of data panel (default: data panel)
    --both  : fetch both panels, write to <output-dir>/<name>-data.txt and
              <output-dir>/<name>-html.txt  (output-dir defaults to .)
    """
    if not args:
        print("Error: 'download' requires a generator name.", file=sys.stderr)
        print(
            "Usage: perchance_api.py download <generator-name> "
            "[output-file] [--html] [--both [dir]]"
        )
        sys.exit(1)

    name = args[0]
    remaining = args[1:]

    fetch_html = "--html" in remaining
    fetch_both = "--both" in remaining

    # Remove flags from remaining to get positional args
    output_args = [a for a in remaining if not a.startswith("--")]
    output_file = output_args[0] if output_args else None

    print(f"Fetching generator '{name}' from Perchance...", file=sys.stderr)

    try:
        data = download_generator(name)
    except GeneratorNotFoundError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(2)
    except PerchanceAPIError as exc:
        print(f"API Error: {exc}", file=sys.stderr)
        sys.exit(3)
    except Exception as exc:
        print(f"Network/unexpected error: {exc}", file=sys.stderr)
        sys.exit(4)

    generator_name = data.get("name", name)
    model_text = data.get("modelText", "")
    html_text = data.get("outputTemplate", "")
    imports = data.get("imports", [])
    is_private = data.get("isPrivate", False)

    print(f"  Name     : {generator_name}", file=sys.stderr)
    print(f"  Private  : {is_private}", file=sys.stderr)
    print(f"  Imports  : {imports}", file=sys.stderr)
    print(f"  Data len : {len(model_text)} chars", file=sys.stderr)
    print(f"  HTML len : {len(html_text)} chars", file=sys.stderr)

    if fetch_both:
        import os
        out_dir = output_file or "."
        os.makedirs(out_dir, exist_ok=True)
        data_path = os.path.join(out_dir, f"{generator_name}-data.txt")
        html_path = os.path.join(out_dir, f"{generator_name}-html.txt")
        with open(data_path, "w", encoding="utf-8") as f:
            f.write(model_text)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_text)
        print(f"Wrote data panel -> {data_path}", file=sys.stderr)
        print(f"Wrote HTML panel -> {html_path}", file=sys.stderr)
        return

    content = html_text if fetch_html else model_text
    panel_label = "HTML panel" if fetch_html else "data panel"

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(
            f"Wrote {panel_label} ({len(content)} chars) -> {output_file}",
            file=sys.stderr,
        )
    else:
        # Print to stdout
        print(content)


def cmd_list(args: list) -> None:
    """
    list <username>

    Note: Perchance has no public API for listing a user's generators.
    This subcommand cannot be implemented without authentication/scraping.
    """
    username = args[0] if args else "<username>"
    print(
        f"Error: Perchance has no public API for listing generators by user.\n"
        f"To see {username}'s public generators, visit:\n"
        f"  https://perchance.org/user/{username}",
        file=sys.stderr,
    )
    sys.exit(5)


def main(argv: list) -> None:
    if len(argv) < 2:
        _usage_and_exit()

    subcommand = argv[1].lower()
    rest = argv[2:]

    if subcommand == "download":
        cmd_download(rest)
    elif subcommand == "list":
        cmd_list(rest)
    elif subcommand in ("--help", "-h", "help"):
        print(__doc__)
    else:
        print(f"Unknown subcommand: '{subcommand}'", file=sys.stderr)
        print("Available subcommands: download, list", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv)
