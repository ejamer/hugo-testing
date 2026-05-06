# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## Search bar not loading correctly

- [x] **Search box missing / Console 404 errors** — two root causes fixed:
  1. CI workflow never ran `npx pagefind`, so the index was never deployed. Added a "Build search index" step to `.github/workflows/hugo.yml`.
  2. Pagefind asset paths in `site-header.html` used `/pagefind/pagefind-ui.js` (a JS string literal not processed by `canonifyURLs`). Hugo's `absURL` with a leading `/` treats the path as domain-root-relative and ignores the base path (`/hugo-testing/`). Fixed to `"pagefind/pagefind-ui.js" | absURL` (no leading slash), which correctly outputs `https://ejamer.github.io/hugo-testing/pagefind/pagefind-ui.js`.

## Clubs page

- [ ] **Register Your Club button** — currently links to `mailto:info@fencingnb.ca` as a placeholder. Swap `href` in `fenb-1/layouts/clubs/list.html` (near the bottom, `.fenb-clubs-cta-action`) to the actual club registration form URL when available.

## Placeholder pages

- [ ] `/programs/` — menu link exists; page not yet built
- [ ] `/about/` — menu link exists; page not yet built
- [ ] `/join/` — menu link exists; page not yet built

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.

## Deprecation Issues

- [x] **Google maps** - fixed `allowfullscreen` → `allow="fullscreen"` on the clubs map iframe. Remaining console warnings (third-party cookies, google.maps.Marker) originate inside Google's own embed code and cannot be fixed from our side.
- [x] **hugo build warnings** - fixed: `languageName` → `label` in hugo.toml, `_target` → `target` in news cascade, `.Site.Sites` → `hugo.Sites` in 404.html
