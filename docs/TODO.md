# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## News & Results page

- [ ] **News index filters** — add client-side category toggle buttons and year dropdown to the `/news/` index page. Requires removing pagination (render all cards at once), adding `data-category`/`data-year` attributes to news cards, and wiring up `news-filter.js`. See `plans/news-filter.md` for the full implementation plan.

---

## Non-technical content maintenance

- [ ] **Editor tooling** — build shell scripts, editor guide, staging preview, and optionally Decap CMS to allow a non-technical administrator to maintain events, board members, news, and join URLs without developer involvement. See `plans/non-technical-maintenance.md` for the full plan and implementation order.

---

## Google Analytics

- [ ] **Analytics access management** — review who has access to the GA4 property and ensure an organizational account (e.g. a shared FENB admin email) is added as Administrator so access isn't tied solely to a personal Google account. See the Access Management section in `docs/DEVELOPMENT.md` for instructions.

---

## Join section — data maintenance

- [ ] **Club registration form URL** — add Google Form URL to `fenb-1/data/join.yaml` → `club_form_url` when available; clubs page currently falls back to email contact
- [ ] **2MEV URL** — update `membership_url` in `fenb-1/data/join.yaml` at the start of each season (currently `fencing-nb-2025-2026`)

## Join section — review required

All four join pages need a visual review in the dev server before release. Key items:

- [ ] **Club registration page (`/join/clubs/`)** — add "How to Start a Club" content or link to the FENB PDF (`https://www.fencingnb.ca/wp-content/uploads/2014/06/FENB_Steps_to_Start_New_Program_140630.pdf`) — currently missing from the page; add Google Form URL to `data/join.yaml` when available
- [ ] **Volunteer page (`/join/volunteer/`)** — verify role lists are still current with FENB's actual needs; review apply CTA wording

## About page

- [ ] **Board member roles** — only Celine Fournet (President) and the Executive Director role were confirmed from source data. The remaining 6 members are listed as "Director" — verify actual officer roles (Secretary, Treasurer, etc.) and update `fenb-1/data/board_members.yaml`.

## Programs page

### Programs — page-by-page design and content review

All seven pages need a full review pass for both style and content quality before release. For each page: assess layout, spacing, typography, content accuracy, and French translation quality. Revise layout HTML, CSS, i18n strings, and/or content structure as needed.

- [ ] **`/programs/` (landing)** 
- [ ] **`/programs/athlete-development/`** 
- [x] **`/programs/coach-training/`** — content replaced with 5 CFF pathway cards (overview, community, instructor-beginner, competition-introduction, competition-development), each with a "Learn more" PNG modal and "Save this pathway" PDF download, plus a standalone full-guide PDF link and a note on upcoming Instructor-Intermediate/HP Coach pathways. A layout/styling polish pass may still be wanted.
- [ ] **`/programs/canada-games-2027/`** 
- [ ] **`/programs/referee-development/`** 
- [ ] **`/programs/secretariat-development/`** 
- [x] **HONOURS & AWARDS** — built as `/about/hall-of-fame/` with 5 inductees (2025 + 2026 cohorts).

## Hall of Fame

- [ ] **Marc-André LeBlanc bio** — `content/about/hall-of-fame/marc-andre-leblanc.{en,fr}.md` currently have no body content; update both files when his biography is published on the original site.
- [ ] **Marc-André LeBlanc category** — his category is currently set to `"Athlete"` as a placeholder; confirm and correct in both language files.
- [ ] **French bio review** — the French bios for Alfred Knappe, Rick Gosselin, and Kara Grant were machine-translated; have a French speaker review and correct `*.fr.md` files in `content/about/hall-of-fame/`.
- [ ] **Inductee photos** — add individual photos to `static/images/hall-of-fame/` when available; set the `photo` front matter field in the corresponding `.en.md` and `.fr.md` files (the `"Builder"` class renders an initials avatar as a placeholder).

## Release workflow

- [ ] **GitHub Releases** — consider adding a `gh release create --generate-notes` step to `/fenb-git-release` after the tag push. Low effort; auto-generates notes from PR/commit titles. Revisit when the project has stakeholders who want a changelog on GitHub.

## Project skills

- [ ] **Skill automation and non-AI tooling** — review `plans/skill-assessment.md` and implement the proposed shell scripts to reduce AI dependency, eliminate duplicated logic, and make common updates (news stubs, season rollover, version bumps) executable without Claude. Priority order: `generate-version-json.sh` → `season-rollover.sh` → `check-ftl-deps.sh` → `create-news-stub.sh` → `compute-next-version.sh`. Once scripts exist, slim the corresponding skills to use them. Ties into the **Editor tooling** item under Non-technical content maintenance — the same scripts that simplify AI skills form the foundation for non-AI workflows.

Test each project skill end-to-end at least once to verify it works correctly.

| Skill | Status | Notes |
|---|---|---|
| `/fenb-content-add-news` | ✅ Tested | |
| `/fenb-content-add-page` | ❌ Untested | |
| `/fenb-content-add-results` | ✅ Tested | NB Provincials 2026 — hosted format (full podium, medalists only) |
| `/fenb-data-get-results` | ✅ Tested | NB Provincials 2026 — direct URL, hosted mode, full podium fetch |
| `/fenb-data-season-rollover` | ❌ Untested | |
| `/fenb-docs-update` | ✅ Tested | |

## Events data

- [ ] **Damocles Foil & Leadership Camp registration URL** — `registration_url_en` in `fenb-1/data/events.yaml` for the Aug 24–28 camp entry is blank; add the registration link when Damocles publishes one (contact: Joe Kinley, Kinley.jf@gmail.com)
- [ ] **Damocles camp news articles — review before commit** — `jun-13-damocles-epee-camp-2026.{en,fr}.md` and `jun-13-damocles-foil-camp-2026.{en,fr}.md` were machine-drafted from the resource flyers; user should verify French translations and camp details before publishing
- [ ] **Interscholastic finals article — photo gallery** — 4 action photos at `static/images/news/2026/interscholastic-finals-2026-action-{1-4}.jpg`; add `photos:` front matter to `jun-16-interscholastic-finals-2026.{en,fr}.md` (photo gallery system now available — see README.md)
- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.
