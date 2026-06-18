/**
 * Perchance.org API client — Node.js ES module
 *
 * ENDPOINT STATUS (verified 2026-06-18):
 *
 * /api/downloadGenerator?generatorName=<name>
 *   - Documented as stable/backwards-compatible in perchance.org/api-tutorial
 *   - Live test result: returns HTTP 200 but serves the full rendered HTML page
 *     of the generator (not raw source text). The endpoint appears to have
 *     changed from returning raw source to redirecting to the rendered view.
 *   - The client detects this and throws an error if a rendered HTML page is
 *     returned instead of source text.
 *   - Generators not found return HTTP 404.
 *
 * /api/getGeneratorsAndDependencies?generatorName=<name>
 *   - Returns HTTP 400 Bad Request from plain HTTP clients (verified 2026-06-18).
 *   - Likely requires a browser session cookie or Cloudflare challenge completion.
 *   - Not usable from Node.js without a browser automation layer or session token.
 *
 * /api/getUserGeneratorList?username=<user>
 *   - Not verified — response shape is inferred from community research.
 *   - May also be behind Cloudflare challenge protection.
 *
 * PRACTICAL NOTE: The research in ai-workspace/perchance-api-research.md
 * documented these as "publicly accessible without browser", based on community
 * tools (eeemoon/perchance, aein00/perchance-image-generator). Those tools likely
 * use session cookies obtained from a prior browser login, or the API surface has
 * changed since the research was conducted.
 *
 * Usage (CLI):
 *   node scripts/perchance-api.mjs download <generator-name> [output-file]
 *   node scripts/perchance-api.mjs deps     <generator-name>
 *   node scripts/perchance-api.mjs list     <username>
 *
 * Examples from this repo:
 *   node scripts/perchance-api.mjs download char-wiz-dat
 *   node scripts/perchance-api.mjs download char-wiz-html
 *   node scripts/perchance-api.mjs deps     char-wiz-dat
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = "https://perchance.org";

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

/**
 * Perform a GET request to a Perchance API endpoint.
 * Returns the raw Response object so callers can choose how to decode it.
 *
 * @param {string} path  - Absolute path beginning with /
 * @param {Record<string,string>} [params] - Query parameters
 * @returns {Promise<Response>}
 */
async function apiGet(path, params = {}) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: {
      // Identify the client without impersonating a browser; Perchance's
      // API layer doesn't require a browser UA.
      "User-Agent": "perchance-api-client/1.0 (node.js)",
      Accept: "text/plain, application/json, */*",
    },
  });
  return res;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Download the raw source (data/list panel text) of a public generator.
 *
 * Endpoint: GET /api/downloadGenerator?generatorName=<name>
 * Stability: backwards-compatibility guaranteed (per perchance.org/api-tutorial)
 * Auth: none — public generators only
 *
 * @param {string} name  Generator name, e.g. "char-wiz-dat"
 * @returns {Promise<string>} The generator's raw source text
 */
export async function downloadGenerator(name) {
  if (!name || typeof name !== "string") {
    throw new TypeError("downloadGenerator: name must be a non-empty string");
  }
  const res = await apiGet("/api/downloadGenerator", { generatorName: name });
  if (!res.ok) {
    throw new Error(
      `downloadGenerator("${name}"): HTTP ${res.status} ${res.statusText}`
    );
  }
  const text = await res.text();
  // Guard: as of 2026-06-18 this endpoint returns the rendered HTML page
  // (Content-Type: text/html) instead of raw generator source. Detect and
  // surface this rather than silently returning 800KB of HTML to the caller.
  if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
    throw new Error(
      `downloadGenerator("${name}"): endpoint returned an HTML page instead of ` +
      `raw generator source. The /api/downloadGenerator endpoint may have changed ` +
      `its behaviour, or this generator requires authentication.`
    );
  }
  return text;
}

/**
 * Fetch a generator and all its transitive plugin dependencies in one call.
 *
 * Endpoint: GET /api/getGeneratorsAndDependencies?generatorName=<name>
 * Returns: JSON object whose keys are generator names and values are their
 *          raw source text. The top-level generator's source is at key <name>.
 *
 * Useful for verifying that {import:ai-text-plugin} and
 * {import:text-to-image-plugin} resolve without error.
 *
 * Auth: none — public generators only
 *
 * @param {string} name  Generator name, e.g. "char-wiz-dat"
 * @returns {Promise<Record<string,string>>} Map of name → source
 */
export async function getGeneratorsAndDependencies(name) {
  if (!name || typeof name !== "string") {
    throw new TypeError(
      "getGeneratorsAndDependencies: name must be a non-empty string"
    );
  }
  const res = await apiGet("/api/getGeneratorsAndDependencies", {
    generatorName: name,
  });
  if (!res.ok) {
    throw new Error(
      `getGeneratorsAndDependencies("${name}"): HTTP ${res.status} ${res.statusText}`
    );
  }
  // The endpoint returns JSON: { "char-wiz-dat": "...", "ai-text-plugin": "..." }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Some older versions of this endpoint may return plain text; surface it.
    throw new Error(
      `getGeneratorsAndDependencies("${name}"): response was not JSON:\n${text.slice(0, 200)}`
    );
  }
}

/**
 * List all public generators owned by a Perchance username.
 *
 * Endpoint: GET /api/getUserGeneratorList?username=<user>
 * Returns: JSON array of generator name strings, or an object with a list key.
 *
 * NOTE: This endpoint was documented in community research but its exact
 * response shape is unverified against a live response. The implementation
 * handles the two most likely shapes (array or { list: [...] }).
 *
 * Auth: none — public generators only
 *
 * @param {string} username  Perchance username
 * @returns {Promise<string[]>} Array of generator names
 */
export async function listUserGenerators(username) {
  if (!username || typeof username !== "string") {
    throw new TypeError(
      "listUserGenerators: username must be a non-empty string"
    );
  }
  const res = await apiGet("/api/getUserGeneratorList", { username });
  if (!res.ok) {
    throw new Error(
      `listUserGenerators("${username}"): HTTP ${res.status} ${res.statusText}`
    );
  }
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `listUserGenerators("${username}"): response was not JSON:\n${text.slice(0, 200)}`
    );
  }
  // Normalise: accept bare array or { list: [...] } wrapper
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.list)) return parsed.list;
  // Unknown shape — return whatever we got so callers can inspect it
  return parsed;
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, arg1, arg2] = process.argv;

  const usage = `
Usage: node scripts/perchance-api.mjs <command> [args]

Commands:
  download <generator-name> [output-file]
      Fetch the raw source of a public Perchance generator.
      If output-file is given, write to that path; otherwise print to stdout.

  deps <generator-name>
      Fetch the generator and all its plugin dependencies.
      Prints the names and sizes of every resolved generator.

  list <username>
      List all public generators owned by a Perchance user.

Examples (generators used by this repo):
  node scripts/perchance-api.mjs download char-wiz-dat
  node scripts/perchance-api.mjs download char-wiz-html
  node scripts/perchance-api.mjs download char-wiz-dat /tmp/char-wiz-dat.txt
  node scripts/perchance-api.mjs deps char-wiz-dat
  node scripts/perchance-api.mjs list someuser
`.trim();

  async function main() {
    switch (cmd) {
      case "download": {
        if (!arg1) {
          console.error("download: missing generator-name\n\n" + usage);
          process.exit(1);
        }
        let source;
        try {
          source = await downloadGenerator(arg1);
        } catch (err) {
          console.error(`ERROR: ${err.message}`);
          process.exit(1);
        }
        if (arg2) {
          writeFileSync(arg2, source, "utf8");
          console.log(`Written ${source.length} chars to ${arg2}`);
        } else {
          process.stdout.write(source);
        }
        break;
      }

      case "deps": {
        if (!arg1) {
          console.error("deps: missing generator-name\n\n" + usage);
          process.exit(1);
        }
        let deps;
        try {
          deps = await getGeneratorsAndDependencies(arg1);
        } catch (err) {
          console.error(`ERROR: ${err.message}`);
          process.exit(1);
        }
        console.log(`Resolved generators for "${arg1}":`);
        for (const [name, src] of Object.entries(deps)) {
          const marker = name === arg1 ? " (requested)" : " (dependency)";
          console.log(`  ${name}${marker} — ${src.length} chars`);
        }
        break;
      }

      case "list": {
        if (!arg1) {
          console.error("list: missing username\n\n" + usage);
          process.exit(1);
        }
        let generators;
        try {
          generators = await listUserGenerators(arg1);
        } catch (err) {
          console.error(`ERROR: ${err.message}`);
          process.exit(1);
        }
        if (Array.isArray(generators)) {
          console.log(`Generators for "${arg1}" (${generators.length}):`);
          for (const g of generators) console.log(`  ${g}`);
        } else {
          // Unknown response shape — dump raw
          console.log(JSON.stringify(generators, null, 2));
        }
        break;
      }

      default: {
        console.error(
          cmd ? `Unknown command: "${cmd}"\n\n${usage}` : usage
        );
        process.exit(cmd ? 1 : 0);
      }
    }
  }

  main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
}
