---
name: deploy-cpanel
description: Manual deploy checklist for shipping primordial to Namecheap Stellar Plus (cPanel). Invoke deliberately when deploying; not auto-activated.
disable-model-invocation: true
---

# deploy-cpanel — Stellar Plus deploy checklist

Manual-only. Print this checklist and walk it. Full prose is in
`deploy/DEPLOY.md`; host facts are in `.claude/rules/deploy.md`.

## What ships to `public_html`

Upload these into the **`public_html`** root (everything else stays out — keep
the inode count down, ~300k cap):

- `index.html`
- `src/`  (the whole app — js, shaders/*.glsl, looks/*.json, ui/, …)
- `assets/`  (fonts, lookup textures, icons, favicon, og-image)
- `deploy/.htaccess` → place it **as `.htaccess`** at the `public_html` root

**Do NOT upload:** `node_modules/`, `research/`, `.claude/`, `docs/`,
`task_plan.md` / `findings.md` / `progress.md`, or any `*.local.*` files.

## Deploy options

**A — File Manager (simplest):**
1. cPanel → File Manager → `public_html`.
2. Upload a zip of `index.html` + `src/` + `assets/`, then Extract.
3. Upload `.htaccess` (enable "show hidden files" to see it).

**B — cPanel Git Version Control:**
1. cPanel → Git Version Control → Create / pull the repo.
2. Deploy to `public_html` (use a `.cpanel.yml` to copy only the shippable
   tree; keep `.claude/`, `research/`, `node_modules/` out).

## Post-deploy verification

- [ ] `.htaccess` present at `public_html` root → HTTPS redirect works.
- [ ] Open the **HTTPS** URL on a phone; click Start; grant mic.
- [ ] Confirm the visual reacts to room audio.
- [ ] DevTools → Network: `.glsl` serves as `text/plain`; js/css are cached
      (`Cache-Control` / `Expires` headers present).

## ⚠️ SSL reminder

The free Sectigo PositiveSSL is **NOT auto-renewing**. **Re-issue annually**
(or set up `acme.sh` over SSH). If SSL lapses, the mic stops working — the
whole instrument is dead until HTTPS is restored. Set a reminder ~11 months out.
