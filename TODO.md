# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## Placeholder pages

- [ ] `/programs/` — menu link exists; page not yet built
- [x] `/about/` — built: overview, mission, history, board of directors, contact, and policies sub-page
- [ ] `/join/` — menu link exists; page not yet built

## Clubs page

- [ ] **Register Your Club button** — currently links to `mailto:fencingnb@gmail.com` as a placeholder. Swap `href` in `fenb-1/layouts/clubs/list.html` (near the bottom, `.fenb-clubs-cta-action`) to the actual club registration form URL when available.

## About page

- [ ] **Policy document PDFs** — all 16 policies plus strategic plan and annual reports in `fenb-1/data/policies.yaml` have `url: "#"` placeholders. Replace with actual PDF URLs when documents are uploaded.
- [x] **Alfred Knappe photo** — added `static/images/alfred-knappe.png`; placeholder removed from layout.
- [ ] **Board member roles** — only Celine Fournet's role (President) was confirmed from source data. Other members are listed as "Director" — verify actual officer roles (Secretary, Treasurer, etc.) and update `fenb-1/data/board.yaml`.
- [x] **General inquiries email** — updated to `fencingnb@gmail.com` in both the About contact section and the Clubs register button.

## Programs page

- [ ] `/programs/` — menu link exists; page not yet built. Will need sub-pages for Athlete, Coach, and Official development (similar structure to About + Policies).

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.
