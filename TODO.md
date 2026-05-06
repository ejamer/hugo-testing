# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## Search bar not loading correctly

- [ ] **Search box missing** -  nothing loads where `<div id="fenb-search"></div>` is supposed to be.
- [ ] **Console errors** - when the search button is clicked, the following errors appear:

```
hugo-testing/:4 
 GET https://ejamer.github.io/pagefind/pagefind-ui.css net::ERR_ABORTED 404 (Not Found)
l	@	hugo-testing/:4
(anonymous)	@	hugo-testing/:4
hugo-testing/:4 
 GET https://ejamer.github.io/pagefind/pagefind-ui.js net::ERR_ABORTED 404 (Not Found)
l	@	hugo-testing/:4
(anonymous)	@	hugo-testing/:4
```

Claude assessment was:

> This is the known pagefind/dev-server issue. You're running hugo server alone — pagefind files either haven't been generated yet, or the server isn't reading them from disk.
> 
> Run the full search-enabled dev command from fenb-1/:
> 
> `/snap/bin/hugo && npx pagefind --site public && /snap/bin/hugo server --renderStaticToDisk`
> 
> The three steps matter in order: build the site, generate the pagefind index into public/pagefind/, then serve with --renderStaticToDisk so Hugo reads those files from disk rather than memory. Plain hugo server skips the index and serves public/ in-memory, which is why pagefind assets 404 or get the wrong MIME type.

However, that didn't seem to fix the problem.

## Clubs page

- [ ] **Register Your Club button** — currently links to `mailto:info@fencingnb.ca` as a placeholder. Swap `href` in `fenb-1/layouts/clubs/list.html` (near the bottom, `.fenb-clubs-cta-action`) to the actual club registration form URL when available.

## Placeholder pages

- [ ] `/programs/` — menu link exists; page not yet built
- [ ] `/about/` — menu link exists; page not yet built
- [ ] `/join/` — menu link exists; page not yet built

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.

## Deprecation Issues

- [ ] **Google maps** - check console when loading clubs page; multiple deprecation warnings that should be fixed
- [ ] **hugo build warnings** - multiple deprecation warnings during hugo build process that should be fixed
