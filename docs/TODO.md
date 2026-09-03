# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## News & Results page

---

## Photo gallery

- [ ] **Build photo gallery** — new `/gallery/` page with tag/date filtering, backed by a separate GitHub repo (submodule) for image storage served via jsDelivr, with tagging metadata in `fenb-1/data/gallery/`. Requires a new `/fenb-content-add-gallery-photos` skill for uploads. See `plans/image-gallery.md` for the full plan, including an open question about that skill's git commit/push scope that needs resolving before it's built.

---

## Non-technical content maintenance

- [ ] **Editor tooling** — build shell scripts, editor guide, staging preview, and optionally Decap CMS to allow a non-technical administrator to maintain events, board members, news, and join URLs without developer involvement. See `plans/non-technical-maintenance.md` for the full plan and implementation order.

---

## Google Analytics

- [ ] **Analytics access management** — review who has access to the GA4 property and ensure an organizational account (e.g. a shared FENB admin email) is added as Administrator so access isn't tied solely to a personal Google account. See the Access Management section in `docs/DEVELOPMENT.md` for instructions.

---

## Join section — data maintenance

- [ ] **Club registration form URL** — add Google Form URL to `fenb-1/data/join.yaml` → `club_form_url` when available; clubs page currently falls back to email contact
- [x] **2MEV URL** — updated `membership_url` in `fenb-1/data/join.yaml` to `fencing-nb-2026-2027` for the new season

## Join section — review required

All four join pages need a visual review in the dev server before release. Key items:

- [ ] **Club registration page (`/join/clubs/`)** — add "How to Start a Club" content or link to the FENB PDF (`https://www.fencingnb.ca/wp-content/uploads/2014/06/FENB_Steps_to_Start_New_Program_140630.pdf`) — currently missing from the page; add Google Form URL to `data/join.yaml` when available
- [ ] **Volunteer page (`/join/volunteer/`)** — verify role lists are still current with FENB's actual needs; review apply CTA wording

## About page

- [ ] **Board member roles** — only Celine Fournet (President) and the Executive Director role were confirmed from source data. The remaining 6 members are listed as "Director" — verify actual officer roles (Secretary, Treasurer, etc.) and update `fenb-1/data/board_members.yaml`.
- [ ] **Board member start dates** — `start_date` was added to every entry in `fenb-1/data/board_members.yaml` (2026-08-17) but left blank for all current members since the actual month/year each joined isn't recorded anywhere; fill in when known. Doesn't block anything — `start_date` is historical record only, doesn't affect display.
- [ ] **Board history page** — `fenb-1/data/board_members.yaml` now has a `previous_members` list (added 2026-08-17) for past board members — populated when someone leaves the current `members` roster (see the file's header comment for the exact workflow) but not displayed anywhere yet. Build a "Board History" view when wanted.

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

## Search / Pagefind

- [ ] **Pagefind language detection** — a `make build-prod` test run (2026-07-28) had Pagefind report 3 languages (`fr-ca`, `en-ca`, `en`) instead of the expected 2 (`en-ca`, `fr-ca`). Likely benign — probably an `en` fallback picked up alongside `en-ca` — but verify the search overlay still filters/ranks results correctly per language before relying on it further.

## Release workflow

- [ ] **GitHub Releases** — consider adding a `gh release create --generate-notes` step to `/fenb-git-release` after the tag push. Low effort; auto-generates notes from PR/commit titles. Revisit when the project has stakeholders who want a changelog on GitHub.

## Project skills

- [ ] **Skill automation and non-AI tooling** — review `plans/skill-assessment.md` and implement the proposed shell scripts to reduce AI dependency, eliminate duplicated logic, and make common updates (news stubs, season rollover, version bumps) executable without Claude. Priority order: `generate-version-json.sh` → ~~`season-rollover.sh`~~ (done, see below) → `check-ftl-deps.sh` → `create-news-stub.sh` → `compute-next-version.sh`. Once scripts exist, slim the corresponding skills to use them. Ties into the **Editor tooling** item under Non-technical content maintenance — the same scripts that simplify AI skills form the foundation for non-AI workflows.

Test each project skill end-to-end at least once to verify it works correctly.

| Skill | Status | Notes |
|---|---|---|
| `/fenb-content-add-news` | ✅ Tested | |
| `/fenb-content-add-page` | ❌ Untested | |
| `/fenb-content-add-results` | ✅ Tested | NB Provincials 2026 — hosted format (full podium, medalists only) |
| `/fenb-data-get-results` | ✅ Tested | NB Provincials 2026 — direct URL, hosted mode, full podium fetch |
| `/fenb-docs-update` | ✅ Tested | |

## Events data

- [ ] **Interscholastic finals article — photo gallery** — 4 action photos at `static/images/news/2026/interscholastic-finals-2026-action-{1-4}.jpg`; add `photos:` front matter to `jun-16-interscholastic-finals-2026.{en,fr}.md` (photo gallery system now available — see README.md)
- [ ] **Fundy Open — re-add to events.yaml once dates confirmed** — event is delayed; removed from `fenb-1/data/events.yaml` on 2026-09-03 to avoid displaying a stale Sept 13 date. Expected to be either Sept 19-20 or Oct 3-4, 2026 in Saint John, NB. Original entry (Cadet, Senior Div 1/2) still in `fenb-1/data/events_archive/2025-2026.yaml` for reference on fields.