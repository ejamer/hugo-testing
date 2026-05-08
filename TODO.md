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

- [x] **Policy document PDFs** — PDFs stored in `fenb-1/static/docs/`; 13 individual policies served as Hugo pages under `fenb-1/content/about/policies/`; AGM minutes (2012–2024, no 2023 gap), strategic plan, policy manual, and bylaws all linked. No 2025–2026 AGM minutes yet.
- [x] **Alfred Knappe photo** — added `static/images/alfred-knappe.png`; placeholder removed from layout.
- [ ] **Board member roles** — only Celine Fournet's role (President) was confirmed from source data. Other members are listed as "Director" — verify actual officer roles (Secretary, Treasurer, etc.) and update `fenb-1/data/board.yaml`.
- [x] **General inquiries email** — updated to `fencingnb@gmail.com` in both the About contact section and the Clubs register button.

## Programs page

- [ ] `/programs/` — menu link exists; page not yet built. Will need sub-pages for Athlete, Coach, and Official development (similar structure to About + Policies).

## Policies page

- [ ] **Individual policy PDF downloads** — add a download link for each policy on both the individual policy pages and the policies-and-reports list. Plan: use `md-to-pdf` npm package to generate PDFs from source markdown, store in `static/docs/policies/`. See `plans/policy-pdf-download.md`.

## Project skills

Test each project skill end-to-end at least once to verify it works correctly.

| Skill | Status | Notes |
|---|---|---|
| `/fenb-commit` | ✅ Tested | |
| `/fenb-release` | ✅ Tested | |
| `/fenb-new-news` | ❌ Untested | |
| `/fenb-new-page` | ❌ Untested | |
| `/fenb-season-rollover` | ❌ Untested | |
| `/fenb-merge-features` | ❌ Untested | |

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.
