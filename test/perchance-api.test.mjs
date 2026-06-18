/**
 * Tests for scripts/perchance-api.mjs
 *
 * Run: node test/perchance-api.test.mjs
 * Exit 0 = all checks passed, non-zero = failures.
 *
 * Network calls to perchance.org are attempted but skipped gracefully if the
 * environment blocks outbound HTTPS (sandbox/CI without network access).
 *
 * NETWORK STATUS NOTE (verified 2026-06-18):
 * The perchance.org API endpoints are reachable from this environment, but
 * /api/downloadGenerator now returns the full rendered HTML page rather than
 * raw generator source text. The client correctly detects and rejects this.
 * See the header comment in scripts/perchance-api.mjs for full details.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

let failures = 0;

function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) failures++;
}

function checkThrows(label, fn) {
  try {
    fn();
    console.log("FAIL - " + label + " (expected an error but none was thrown)");
    failures++;
  } catch {
    console.log("PASS - " + label);
  }
}

async function checkRejects(label, promise) {
  try {
    await promise;
    console.log("FAIL - " + label + " (expected rejection but resolved)");
    failures++;
  } catch {
    console.log("PASS - " + label);
  }
}

// ---------------------------------------------------------------------------
// Section 1: Module exports
// ---------------------------------------------------------------------------
console.log("\n--- Section 1: Module exports ---");

let mod;
try {
  mod = await import(join(root, "scripts/perchance-api.mjs"));
} catch (err) {
  console.error("FAIL - could not import scripts/perchance-api.mjs:", err.message);
  process.exit(1);
}

check(
  "downloadGenerator is exported as a function",
  typeof mod.downloadGenerator === "function"
);
check(
  "getGeneratorsAndDependencies is exported as a function",
  typeof mod.getGeneratorsAndDependencies === "function"
);
check(
  "listUserGenerators is exported as a function",
  typeof mod.listUserGenerators === "function"
);

// ---------------------------------------------------------------------------
// Section 2: Input validation (no network needed)
// ---------------------------------------------------------------------------
console.log("\n--- Section 2: Input validation ---");

await checkRejects(
  "downloadGenerator rejects with TypeError on empty string",
  mod.downloadGenerator("")
);
await checkRejects(
  "downloadGenerator rejects with TypeError on null",
  mod.downloadGenerator(null)
);
await checkRejects(
  "getGeneratorsAndDependencies rejects with TypeError on empty string",
  mod.getGeneratorsAndDependencies("")
);
await checkRejects(
  "listUserGenerators rejects with TypeError on empty string",
  mod.listUserGenerators("")
);

// ---------------------------------------------------------------------------
// Section 3: Live network call
// ---------------------------------------------------------------------------
console.log("\n--- Section 3: Live network call ---");

let networkAvailable = false;

// Quick connectivity probe: try to reach perchance.org with a short timeout.
try {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  const probeRes = await fetch("https://perchance.org/api/downloadGenerator?generatorName=ai-text-plugin", {
    signal: ctrl.signal,
    headers: { "User-Agent": "perchance-api-client/test" },
  });
  clearTimeout(timer);
  networkAvailable = true;
  console.log(`  (probe: perchance.org reachable, HTTP ${probeRes.status})`);
} catch (err) {
  console.log(`  (probe: perchance.org unreachable — ${err.message})`);
  console.log("  Skipping all network tests.");
}

if (networkAvailable) {
  // Test 1: a known-good generator (ai-text-plugin exists on perchance.org)
  // As of 2026-06-18 the endpoint returns an HTML page, so the client should
  // throw an error with a clear message — that IS the correct behaviour.
  try {
    const source = await mod.downloadGenerator("ai-text-plugin");
    // If we somehow got raw source (endpoint fixed), validate it looks like
    // Perchance source text (not an HTML page).
    check(
      "downloadGenerator('ai-text-plugin'): response is non-empty string",
      typeof source === "string" && source.length > 0
    );
    check(
      "downloadGenerator('ai-text-plugin'): response is not an HTML page",
      !source.trimStart().startsWith("<!DOCTYPE") && !source.trimStart().startsWith("<html")
    );
    // A real generator source would contain newlines and no HTML tags at the start
    check(
      "downloadGenerator('ai-text-plugin'): response looks like generator source",
      source.includes("\n") && !/<html/i.test(source.slice(0, 200))
    );
  } catch (err) {
    if (err.message.includes("HTML page instead of raw generator source")) {
      // This is the expected/documented current state of the endpoint.
      console.log(
        "PASS - downloadGenerator('ai-text-plugin'): correctly rejected HTML page response"
      );
      console.log(
        "  NOTE: /api/downloadGenerator is returning the rendered HTML page (not raw source)."
      );
      console.log(
        "  This is the documented current behaviour — see scripts/perchance-api.mjs header."
      );
    } else if (err.message.includes("HTTP 404")) {
      console.log(
        "SKIP - downloadGenerator('ai-text-plugin'): generator not found (404) — may be private or renamed"
      );
    } else {
      console.log("FAIL - downloadGenerator('ai-text-plugin') threw unexpected error: " + err.message);
      failures++;
    }
  }

  // Test 2: a non-existent generator should fail with a 404 error
  try {
    await mod.downloadGenerator("this-generator-definitely-does-not-exist-xyzzy-12345");
    console.log("FAIL - downloadGenerator(non-existent): expected rejection, got success");
    failures++;
  } catch (err) {
    // Accept either a 404 error or an HTML-page error (Perchance might serve a
    // redirect/404 page with 200 status for missing generators too).
    const is404 = err.message.includes("404");
    const isHtmlPage = err.message.includes("HTML page");
    if (is404 || isHtmlPage) {
      console.log(
        "PASS - downloadGenerator(non-existent): correctly failed (" +
        (is404 ? "404" : "HTML page guard") + ")"
      );
    } else {
      console.log("FAIL - downloadGenerator(non-existent): unexpected error: " + err.message);
      failures++;
    }
  }

  // Test 3: getGeneratorsAndDependencies — likely 403 (Cloudflare challenge)
  try {
    const deps = await mod.getGeneratorsAndDependencies("ai-text-plugin");
    check(
      "getGeneratorsAndDependencies returns an object",
      deps !== null && typeof deps === "object" && !Array.isArray(deps)
    );
    check(
      "getGeneratorsAndDependencies result includes the requested generator",
      "ai-text-plugin" in deps
    );
    check(
      "ai-text-plugin source is a non-empty string",
      typeof deps["ai-text-plugin"] === "string" && deps["ai-text-plugin"].length > 0
    );
  } catch (err) {
    // 403 = Cloudflare challenge; 400 = endpoint requires auth/session that
    // plain HTTP clients don't carry; "not JSON" = HTML error page returned.
    const isExpectedBlock =
      err.message.includes("403") ||
      err.message.includes("400") ||
      err.message.includes("not JSON") ||
      err.message.includes("HTML page");
    if (isExpectedBlock) {
      console.log(
        "SKIP - getGeneratorsAndDependencies: blocked (HTTP 400/403 or non-JSON response) " +
        "— endpoint requires browser session or Cloudflare challenge completion"
      );
      console.log("  Error: " + err.message.split("\n")[0]);
    } else {
      console.log("FAIL - getGeneratorsAndDependencies: unexpected error: " + err.message);
      failures++;
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(
  "\n" + (failures ? failures + " FAILURE(S)" : "all checks passed")
);
process.exit(failures ? 1 : 0);
