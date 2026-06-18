// Render the AI Character Set Builder's HTML panel and screenshot the builder UI.
//
// The wizard (char-wiz-html) is a Perchance HTML-editor panel: HTML + JS + CSS,
// no <html> wrapper. Its load() builds the full builder UI on its own; the only
// things it can't do off-Perchance are the AI/image plugin calls (genCharacterImage
// / generate), which fire only on button clicks. So loading the panel alone renders
// the static builder UI faithfully.
//
// REQUIRES a Chromium for Playwright:
//     npx playwright@1.56.1 install chromium
// NOTE: the default Claude-Code-on-the-web container BLOCKS this download
// (network policy), and perchance.org returns 403 to automated fetch — so this
// path runs only where the Chromium CDN is reachable. The verified, always-works
// driver in this repo is `node test/smoke.mjs` (see SKILL.md).
//
// Run:  NODE_PATH=$(npm root -g) node .claude/skills/run-perchance-ai-tool/render.mjs [out.png]

import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const html = readFileSync(join(repoRoot, "char-wiz-html"), "utf8");
const out = process.argv[2] || "/tmp/wizard-ui.png";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 820, height: 1400 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(600); // let load() build the cards
  // Sanity: the builder renders an <h1> and the Scenario card.
  const h1 = await page.textContent("h1").catch(() => null);
  const hasScenario = await page.locator("text=Scenario").count();
  await page.screenshot({ path: out, fullPage: true });
  console.log("screenshot ->", out);
  console.log("h1:", h1, "| scenario cards:", hasScenario, "| page errors:", errors.length);
  if (errors.length) console.log(errors.join("\n"));
} finally {
  await browser.close();
}
