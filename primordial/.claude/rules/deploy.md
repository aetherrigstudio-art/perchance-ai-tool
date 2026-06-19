# Deploy rules — Namecheap Stellar Plus

Facts about the host. The deploy walkthrough is in `deploy/DEPLOY.md`; the
manual checklist is the `deploy-cpanel` skill.

## Host profile

- **cPanel / LiteSpeed / CloudLinux LVE.** Static delivery is the ideal fit —
  HTTP/2, `.htaccess` caching/MIME. The app is 100% client-side, so LVE limits
  barely apply.
- **SSH (jailed), cPanel Git Version Control, and cron** are included → a
  git-based deploy is viable alongside File-Manager upload.

## Static upload

- Upload `index.html`, `src/`, and `assets/` into **`public_html`** (File
  Manager, or cPanel **Git Version Control**).
- Place `deploy/.htaccess` at the `public_html` root.

## HTTPS / SSL — annual re-issue

- **Free 1-yr Sectigo PositiveSSL** is auto-installed day one and satisfies
  `getUserMedia` (mic).
- It is **NOT** auto-renewing Let's Encrypt / cPanel AutoSSL. **Re-issue
  annually**, or set up **`acme.sh` over SSH** for hands-off renewal. Put a
  calendar reminder ~11 months out.

## `.htaccess` responsibilities

- Force-HTTPS redirect (mic depends on it).
- `Cache-Control` / `ExpiresByType` for `js` / `css` / `glsl` / `png`.
- Correct MIME: `AddType text/plain .glsl` (so shader text serves cleanly) and
  `AddType application/wasm .wasm` if WASM is ever used.

## Watch the inode cap

- The plan caps at **~300k inodes** (files + folders), not the "unmetered" disk
  label. Don't commit/upload `node_modules` or the full research corpus; keep
  the deployed tree lean.

## Backend — PHP 8 only

- If a contact/upload endpoint is ever needed, write a single **PHP 8.x** file
  (native LSAPI). **Never** Node/Python — they run only via Phusion Passenger
  and fight the EP=30 / 2 GB RAM cap.
