# Cold Plunge Timer roadmap
- Stack: static HTML/CSS/vanilla JavaScript; no package dependencies.
- Build: Node.js script emits `dist/`; deploy: GitHub Actions publishes `dist/` to Cloudflare Pages.
- Functions: none; timer, breathing guide, and history run in the browser.
- Canonical and sitemap: build reads `SITE_URL` (default `https://coldplungetimer.pages.dev`); sitemap lastmod follows Git file changes.

## 2026-09-26 release preparation
- Removed the temperature-based duration feature and its claims across the tool, manifest, About, and Terms. The timer starts at 2 minutes as a user-adjustable setting, not safety guidance.
- Added a prominent medical caution, disclaimer, and three concise guides for breathing, safety, and tool usage. Kept Pages canonical URLs.
- Build with `node build.mjs`; it generates all HTML, `robots.txt`, and `sitemap.xml` in `dist/`. Set `SITE_URL` for a different deployment origin; GitHub Actions now deploys `dist/`.
- New URLs are in `docs/seo/new-urls-2026-09-26.txt`. Sitemap lastmod uses each page's Git commit date, or the build date for changed/untracked pages.
