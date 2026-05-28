# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## Non-technical content maintenance

- [ ] **Editor tooling** — build shell scripts, editor guide, staging preview, and optionally Decap CMS to allow a non-technical administrator to maintain events, board members, news, and join URLs without developer involvement. See `plans/non-technical-maintenance.md` for the full plan and implementation order.

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
- [ ] **`/programs/coach-training/`** 
- [ ] **`/programs/canada-games-2027/`** 
- [ ] **`/programs/referee-development/`** 
- [ ] **`/programs/secretariat-development/`** 
- [ ] **HONOURS & AWARDS** — the old site's programs page listed "FENB Honours & Awards" as a 7th program area; not yet built here. Add as a sub-page if/when content is ready.

## Release workflow

- [ ] **GitHub Releases** — consider adding a `gh release create --generate-notes` step to `/fenb-git-release` after the tag push. Low effort; auto-generates notes from PR/commit titles. Revisit when the project has stakeholders who want a changelog on GitHub.

## Project skills

Test each project skill end-to-end at least once to verify it works correctly.

| Skill | Status | Notes |
|---|---|---|
| `/fenb-content-add-news` | ❌ Untested | |
| `/fenb-data-season-rollover` | ❌ Untested | |

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.
