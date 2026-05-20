# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added.

---

## Placeholder pages

- [x] `/programs/` — built: landing + 6 sub-pages (athlete development, coach training, CWG 2027, referee, secretariat, armourer)
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

- [x] `/programs/` — built: landing page (6-card disambiguation grid) + 6 sub-pages with distinct layouts. Each sub-page uses `layout:` front matter to select `layouts/programs/{slug}.html`. CSS in `fenb-1/assets/ananke/css/fenb-programs.css`.

### Programs — follow-up required

- [ ] **Athlete Development — armband document links** — `layouts/programs/athlete-development.html` has 4 `href="#"` placeholders for CFF armband program PDFs (general + épée/foil/sabre appendices). Replace with actual CFF document URLs when available.
- [x] **CWG 2027 — document links** — page renamed to `canada-games-2027`; Team Plan PDFs (EN/FR) served from `static/documents/canada-games/`; rankings spreadsheet linked directly; financial assistance form linked.
- [ ] **Inline style cleanup** — `layouts/programs/athlete-development.html` has a few inline `style=` attributes for spacing/font-size; move to `fenb-programs.css` classes.

### Programs — page-by-page design and content review

All seven pages need a full review pass for both style and content quality before release. For each page: run `make serve`, load the EN and FR versions, and assess layout, spacing, typography, content accuracy, and French translation quality. Revise layout HTML, CSS, i18n strings, and/or content structure as needed.

- [ ] **`/programs/` (landing)** — 6-card grid. Check card heights even out across rows, icons are legible, hover states work, responsive collapse to 2-col then 1-col looks right.
- [ ] **`/programs/athlete-development/`** — LTAD intro, 10-factor 2-column list, armband program section. Check 2-col factor list wraps cleanly on mobile; consider whether the factor list needs more visual weight (e.g. numbered cards vs plain list).
- [ ] **`/programs/coach-training/`** — 3-column streams grid. Assess whether the three columns have readable line lengths; review level descriptions for accuracy; check the teal contact CTA banner at bottom.
- [ ] **`/programs/canada-games-2027/`** — major rebuild complete (logos, sidebar, key dates, financial assistance, rankings with points description). Review logo sizing, responsive two-column layout on mobile, and French translation quality.
- [ ] **`/programs/referee-development/`** — numbered elements list, 2-column club/provincial cards. The provincial card is significantly longer than the club card — assess whether the layout should stack rather than sit side-by-side on desktop.
- [ ] **`/programs/secretariat-development/`** — 7-card duties grid + mission blockquote. Check grid auto-fit behaviour (may produce a single orphan card in the last row); review blockquote styling.
- [ ] **`/programs/armourer-development/`** — 2×2 sections grid. Straightforward but check card body text doesn't overflow on narrow viewports; review content length balance across the four cards.
- [ ] **French versions** — load all seven pages under `/fr/programmes/` and verify translations read naturally (machine-assisted; needs native-speaker or bilingual review).
- [ ] **HONOURS & AWARDS** — the old site's programs page listed "FENB Honours & Awards" as a 7th program area; not yet built here. Add as a sub-page if/when content is ready.

## Policies page

- [ ] **Individual policy PDF downloads** — add a download link for each policy on both the individual policy pages and the policies-and-reports list. Plan: use `md-to-pdf` npm package to generate PDFs from source markdown, store in `static/docs/policies/`. See `plans/policy-pdf-download.md`.

## Project skills

Test each project skill end-to-end at least once to verify it works correctly.

| Skill | Status | Notes |
|---|---|---|
| `/fenb-git-commit` | ✅ Tested | |
| `/fenb-git-release` | ✅ Tested | |
| `/fenb-git-merge` | ✅ Tested | PR number bug found and fixed during first run |
| `/fenb-content-add-news` | ❌ Untested | |
| `/fenb-content-add-page` | ✅ Tested | Used to scaffold the join section (May 2026) |
| `/fenb-content-add-results` | ✅ Tested | Ran against May Nationals 2026 (May 2026); results tables, medal icons, top-16 summary all working |
| `/fenb-data-get-results` | ✅ Tested | Ran against Mississauga Open and Championnat provincial des Jeunes 2026 (May 2026) |
| `/fenb-data-season-rollover` | ❌ Untested | |

### `/fenb-content-add-results` — follow-up items

Bilingual article creation is handled by `/fenb-content-add-results`. Enhancements still outstanding:

- [x] Add `results_url` links to the matching event(s) in `fenb-1/data/events.yaml` so the event card on the site links directly to the FTL results page — field added to schema; event-card, schedule, and calendar JS all render "View Results →" when set; `/fenb-data-get-results` now offers to populate it automatically after a scrape
- [ ] After writing the article files, prompt the user to run `/fenb-git-commit` to stage and push
- [ ] **May Nationals 2026 article** — Cadet Men's Foil (SINGH RANGER Sammy / Damocles) was still in the elimination round at time of writing; Place shows `—` in both `may-18-2026-05-15-may-nationals.en.md` and `.fr.md`. Update once final results are posted on fencingtimelive.com.

## Code quality

See `plans/hugo-code-review.html` for the full Hugo code review report with detailed analysis and rationale for each item below.

### High priority

- [x] **Remove `canonifyURLs = true`** (`hugo.toml:3`) — removed; fixed all templates and data files to use `relURL`/`relLangURL` without leading slashes. One hardcoded bare path remains in article Markdown content (`feb-28-new-club-moncton.fr.md`) which is correct for production.
- [x] **Fix French date formatting** — both issues resolved:
  - `layouts/news/single.html`: article date now uses `cal_month_*` i18n keys with language-conditional order ("May 18, 2026" / "18 mai 2026"); sidebar uses abbreviated `month_*` keys.
  - `data/events.yaml` + `event-card.html` + `events/schedule.html`: single-day events (13) had `display_date` removed; templates compute a bilingual date from `date` field when `display_date` is absent. Multi-day ranges and free-form overrides (22) keep `display_date` unchanged.
- [x] **Replace locale-string category detection** — `category` front matter is now a canonical ID (`results`, `announcement`, `community`, `registration`); display labels come from i18n lookup; templates use `if eq .Params.category "results"` for script loading and `i18n .Params.category` for badge text. All 10 articles updated; `category_id` field removed.

### Medium priority

- [x] **Move `baseURL` to environment config files** — `config/production/hugo.toml` (fencingnb.ca) and `config/development/hugo.toml` (ejamer.github.io) created; `baseURL` removed from root `hugo.toml`; `make build` and `make serve` updated to pass `--environment development` (bare `hugo` defaults to production).
- [x] **Add explicit date sort to news sidebar** — wrapped `where` result with `sort ... "Date" "desc"` before `first 6`.
- [x] **Add `defer` to non-deferred script tags** — added `defer` to `hero-slider.js`, `events-calendar.js`, and `events-schedule.js` (schedule was also missing it).
- [x] **Map `summary` to `<meta name="description">`** — already handled by Ananke's `baseof.html`; `summary` front matter maps to Hugo's `.Summary` which the theme emits as the meta description. No code change needed.
- [x] **Add RSS output for the news section** — `[outputs]` added to `hugo.toml`; feeds at `/news/index.xml` and `/fr/news/index.xml`; RSS icon link added to footer alongside social icons (bilingual aria-label).
- [x] **Add explicit `[markup]` config block** — added to `hugo.toml` with `unsafe = false` (explicit, with comment), and `tableOfContents` start/end levels.

### Low priority

- [x] **Extract event categories to a data file** — `data/event_categories.yaml` created; calendar legend (`events/list.html`) and schedule filter slice (`events/schedule.html`) both now iterate over `hugo.Data.event_categories.event_categories`.
- [x] **Update archetypes** — `default.md` switched to YAML front matter; `archetypes/news.md` created with `category` and `summary` pre-filled. Note: bilingual pair creation still requires `/fenb-content-add-news` — archetypes can't enforce that.
- [x] **Add `errorf` guard in `icon.html`** — missing SVG now fails the build with a clear message rather than silently producing blank output.
- [x] **Make Hugo path configurable in Makefile** — `HUGO ?= /snap/bin/hugo` variable added; all targets use `$(HUGO)`; override with `make serve HUGO=/usr/local/bin/hugo`.
- [x] **Restore Ananke as proper submodule** — `.gitmodules` moved from `fenb-1/` to repo root with corrected path; 606 tracked theme files replaced with gitlink at `dc0a8223`; URL updated to new repo (`gohugo-ananke/ananke`); `.git` file and worktree paths corrected. Ananke is pinned at `dc0a8223` — update deliberately with `git submodule update --remote` when needed.
- [x] **Document CSS pipeline location** — added to STYLE_GUIDE.md: CSS files must live in `assets/ananke/css/` (not `static/`), listed under `params.ananke.custom_css` in `hugo.toml`; explains pipeline concatenation, minification, and fingerprinting.

- [x] **Split `site-header.html` partial** — nav moved to `nav.html`; page header band moved to `page-header.html`; `site-header.html` is now a two-line wrapper (Ananke calls it, so it must stay as the entry point).

## Events data

- [ ] **Season rollover (archive pattern)** — when a new fencing season begins, move the outgoing `fenb-1/data/events.yaml` to `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`) before starting the new season file. No layout changes needed at that point. See `plans/events-data-archive.md` for the full plan including how to build a Past Events page when desired.
