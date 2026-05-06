# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## Clubs page

- [ ] **Register Your Club button** — currently links to `mailto:info@fencingnb.ca` as a placeholder. Swap `href` in `fenb-1/layouts/clubs/list.html` (near the bottom, `.fenb-clubs-cta-action`) to the actual club registration form URL when available.

## Placeholder pages

- [ ] `/programs/` — menu link exists; page not yet built
- [ ] `/about/` — menu link exists; page not yet built
- [ ] `/join/` — menu link exists; page not yet built

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.
