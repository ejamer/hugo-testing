# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## Placeholder pages

- [ ] `/programs/` — menu link exists; page not yet built
- [x] `/about/` — built: overview, mission, history, board of directors, contact, and policies sub-page
- [x] `/join/` — landing page + three sub-pages built (membership, clubs, volunteer); layouts use `layout:` front matter to select `layouts/join/{membership,clubs,volunteer}.html`
  - [ ] **Club registration form URL** — add Google Form URL to `fenb-1/data/join.yaml` → `club_form_url` when available; clubs page currently falls back to email contact
  - [ ] **2MEV URL** — update `membership_url` in `fenb-1/data/join.yaml` at the start of each season (currently `fencing-nb-2025-2026`)

## Join section — review required

All four join pages need a visual review in the dev server before release. Key items:

- [ ] **Landing page (`/join/`)** — verify three-card grid spacing and icons look correct; consider whether the Membership card should use a crimson accent (matching the home page "Join & Register" program card) to reinforce it as the primary action
- [ ] **Membership page (`/join/membership/`)** — review teal CTA banner (text, button size, layout on narrow viewports); verify 2MEV intro text is accurate and friendly; check steps content against the current 2MEV flow
- [ ] **Club registration page (`/join/clubs/`)** — add "How to Start a Club" content or link to the FENB PDF (`https://www.fencingnb.ca/wp-content/uploads/2014/06/FENB_Steps_to_Start_New_Program_140630.pdf`) — currently missing from the page; add Google Form URL to `data/join.yaml` when available
- [ ] **Volunteer page (`/join/volunteer/`)** — verify role lists are still current with FENB's actual needs; review apply CTA wording
- [ ] **French versions** — load `/fr/adherer/`, `/fr/adherer/adhesion-individuelle/` etc. and verify all strings translated correctly and layout holds
- [ ] **Inline style cleanup** — `layouts/join/clubs.html` and `layouts/join/volunteer.html` use inline `style=` for spacing/colour; move to `fenb-join.css` classes

## Clubs page

- [x] **Register Your Club button** — updated to `/join/clubs/` (was `mailto:fencingnb@gmail.com`).

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
| `/fenb-new-page` | ✅ Tested | Used to scaffold the join section (May 2026) |
| `/fenb-season-rollover` | ❌ Untested | |
| `/fenb-merge-features` | ✅ Tested | PR number bug found and fixed during first run |

## Code quality

- [ ] **Split `site-header.html` partial** — currently conflates navigation and page header band into one file. Split into `partials/nav.html` (sticky nav, search overlay, language switcher, hamburger) and `partials/page-header.html` (the coloured band below the nav). Deferred from the May 2026 design review (H3). See `plans/archive/design-review.md` for the original finding.

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.
