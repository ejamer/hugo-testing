# Outstanding TODOs

Items that need follow-up — kept current as pages are built and content is added. Resolved items are **deleted**, not ticked; if a resolved item holds context a pending item still needs, fold that context into the pending item.

---

## Events data — 2026–2027 season review (2026-09-15)

`data/events.yaml` was populated for the full 2026–2027 season from the FENB tentative calendar (`~/Downloads/fenb_events/fenb 2026-2027 Calendar.pdf`), cross-referenced against the OFA and Quebec (FEQ) provisional calendars for out-of-province dates/locations. Needs a full review pass before publishing — in particular:

- [ ] **Tentative status** — several FENB-listed events were marked "(Tentative)" or "(? - TBD)" in the source PDF. Masquerade (now "Mask-erade: Lights Out!", Oct 31) was confirmed 2026-10-27 from unbfencing.com. Confirm which entries are locked in before publishing.
- [ ] **"UNB?" placeholders not added** — the FENB source calendar had three unconfirmed "UNB? - TBD" rows (Dec 5–6, 2026; Mar 13–14, 2027; Mar 20–21, 2027) with no title/category — these were intentionally left out of `events.yaml` rather than guessed. Add once the event name/details are confirmed.
- [ ] **TBA/TBD locations** — Challenge Desjarlais, Coupe du Printemps, Quebec Youth Provincials, and Quebec Senior Provincials all have `location: "TBA, QC"` (Quebec's own provisional calendar also had these as "à définir") — update once venues are confirmed.
- [ ] **OFA Youth Circuit #2 — missing from OFA's own calendar** — Fencing Ontario's published calendar (as scraped, covering Aug 28, 2026 – Apr 24, 2027) jumps straight from "Ontario Youth Cadet Circuit #1" (Oct 17–18, 2026) to "Ontario Youth Circuit #3" (Jan 23–24, 2027) — no "#2" appears anywhere in that window. Not added to `events.yaml`. (`events.yaml` numbers the Jan 23–24 and Mar 20–21, 2027 circuits "#3" and "#4" to match OFA's calendar; the FENB and Quebec source calendars had called them "#2" and "#3".) Need confirmation: was there a Circuit #2 (maybe outside this window, cancelled, or a different age category not published to the public calendar) that NB fencers should know about?
- [ ] **`details_url`/`registration_url` blank for most new entries** — the source PDFs didn't include per-event links (only a general OFA calendar page and FEQ contact emails), so these fields are empty for all newly added out-of-province events. Fill in as links become available.

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

The pages below need a full review pass for both style and content quality before release. For each page: assess layout, spacing, typography, content accuracy, and French translation quality. Revise layout HTML, CSS, i18n strings, and/or content structure as needed.

- [ ] **`/programs/` (landing)** 
- [ ] **`/programs/athlete-development/`** 
- [ ] **`/programs/coach-training/`** — content is done (5 CFF pathway cards with "Learn more" modals and PDF downloads, plus the full-guide PDF link); only a layout/styling polish pass remains.
- [ ] **`/programs/referee-development/`** 
- [ ] **`/programs/secretariat-development/`** 

## Dark mode

- [ ] **Dark-mode crimson text contrast** — Register Now links (event cards + list view, `fenb-events.css` / `fenb-schedule.css`) use `--crimson-light` (`#943040`) on `#141f1d` in dark mode — ~2.2:1, fails WCAG AA (4.5:1). Same colour is used as dark-mode text for the "See all" hover (`fenb-base.css`) and the crimson news sidebar heading + link hovers (`fenb-news.css`). **Rejected so far (2026-10-15):** a pink `--crimson-text` token (`#ef8593`, too light/pink) and crimson pills with white text. **Still open:** a softer rose (e.g. `#e06b7a`, 5.3:1), light text with a crimson accent (underline/arrow), or teal in dark mode. Don't lighten `--crimson-light` itself — the About and Hall of Fame gradients use it as a background.

---

## Policies

- [ ] **Concussion Protocol — broken embedded image** — `content/about/policies/concussion-protocol.en.md` line ~242 has `![][image1]` with `[image1]` defined as a base64 `data:image/png` URI (Google Docs export leftover). Hugo's URL sanitiser blocks `data:` URIs, so the live page renders `<img src="#ZgotmplZ">` — a broken image. The FR file has no image at all. Fix: decode the PNG into `static/images/policies/`, reference it by path (no leading slash) in both EN and FR, and confirm what the image shows (likely a return-to-sport chart) so the FR page gets an equivalent. Found 2026-10-15 while building R9.

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

- [ ] **Skill automation and non-AI tooling** — `plans/skill-assessment.md` proposes shell scripts to reduce AI dependency and make common updates executable without Claude. Remaining: `create-news-stub.sh` (file creation + year-folder logic shared by `/fenb-content-add-news` and `/fenb-content-add-results`), then optionally `page-audit.sh`. **Don't build** the plan's `git-preflight.sh` or `list-feature-branches.sh` — `/fenb-git-commit` was simplified and `/fenb-git-merge` removed (2026-09-27), so they're obsolete. Per CLAUDE.md, scripts never run git commit/push. Ties into the **Editor tooling** item under Non-technical content maintenance.

Skills still needing an end-to-end test run — remove a row once its skill passes a real run.

| Skill | Status | Notes |
|---|---|---|
| `/fenb-content-add-page` | Never run | |
| `/fenb-git-commit` | Partly tested | Restructured 2026-09-27 to a single confirmation popup (shows drafted message); absorbed the removed `/fenb-git-merge` as "Commit, push & merge into dev" on feature branches. "Commit & push" on `dev` passed a real run (2026-09-27, `9d5e0c8`); still untested: "Commit to new branch…" and "Commit, push & merge into dev" |
| `/fenb-git-release` | Partly tested | Restructured 2026-09-27 (single two-question popup). Full "Merge now" + tag path passed a real run 2026-10-28 (v0.6.4, PR #118). Still untested: Step 3 Hugo update (added 2026-10-28), "Leave open", "No tag", and the stash path |

## Events data

- [ ] **Interscholastic finals article — photo gallery** — 4 action photos at `static/images/news/2026/interscholastic-finals-2026-action-{1-4}.jpg`; add `photos:` front matter to `jun-16-interscholastic-finals-2026.{en,fr}.md` (photo gallery system now available — see README.md)
- [ ] **Fencing Canada logo — replace with vector** — `static/images/organizations/fencing-canada.png` is a temporary raster (downloaded from 2mev.com, resized to 626×800). Replace with an official vector (SVG) version and update `logo:` for `CFF` in `data/organizations.yaml` — every article using `{{< host-logo id="CFF" >}}` picks it up automatically.

---

## Social share images

- [ ] **Per-category default share images** — every page currently shares the single site default `images/og-default.png` (`hugo.toml` → `params.images`), with `images: [...]` front matter as a manual per-article override. Consider a distinct default per article type (e.g. news vs. results vs. training/events — could key off `category`). Needs design thought first: which categories get their own image, who makes the 1200×630 artwork (EN/FR text or text-free?), and how to wire it without re-overriding Hugo's internal `_funcs/get-page-images` partial (an earlier first-photo override was dropped — see README "Social share image" for why `image`/`photos` aren't used).

---

## Judo NB comparison — recommendations (2026-10-15)

From the site comparison against judonb.org — read `docs/JUDO_NB_COMPARISON.html` first, especially its **Implementation notes** section (owner constraints: no platform change, no paid services, low maintenance; pre-flight checks per item). IDs match the report's roadmap. Not yet approved — confirm with the site owner which items to build. Items marked ⏸ are blocked on a human decision.

### Quick wins
- [ ] **R6 Partner / funder logo strip** — homepage or footer partial. Affiliations already appear on `/about/organization/` (sidebar, from `board_members.yaml` → `affiliations`). Move that list to a new `data/partners.yaml` (partners aren't board data), add a `logo` field, and repoint `layouts/about/organization/list.html` so the strip and the sidebar share one source. Also update README.md (~line 230), which documents `affiliations` under `board_members.yaml`. Any partner change must also update the Organization page.
- [ ] **R7 Auto-counted "by the numbers" on About** — computed from data files, no manual figures
- [ ] **R8 Task-led titles and descriptions** — section `_index` descriptions + homepage title, EN/FR

### Next up
- [ ] **R10 "Get directions" links** — Google Maps search URL from `location` on event cards and clubs
- [ ] **R11 JSON-LD** — `SportsOrganization` on home, `SportsEvent` per upcoming event
- [ ] **R12 "Where do I start?" coaching tool** — small JS form on coach-training mapped to `coach_pathways.yaml`
- [ ] **R13 Officials pathway ladder** — `data/referee_levels.yaml` → stepped visual; reuse for armourer/secretariat
- [ ] ⏸ **R14 Team NB roster** — `data/team_nb.yaml` on the Canada Games page; **blocked:** needs agreed consent rule for minors
- [ ] **R15 Task-first homepage CTAs** — "Find a club" / "See upcoming events" buttons under the hero slider
- [ ] **R16 Richer club cards** — optional `weapons`, `ages`, `beginners` in `clubs.yaml`; hide when empty

### Later / consider
- [ ] **R17 "Learn fencing" hub** — bilingual glossary (`data/glossary.yaml`), weapons, first-class FAQ, rules links
- [ ] ⏸ **R18 Email updates** — promote RSS → Google Form digest → free RSS-to-email; **blocked:** free-tier limits unverified
- [ ] ⏸ **R19 "Support FENB" page** — Sport NB Gold Rush; **blocked:** confirm FENB eligibility with Sport NB
- [ ] **R20 Per-event pages for NB-hosted events** — content adapter (`_content.gotmpl`) over the events data
- [ ] ⏸ **R21 Role-based contacts on board page** — `role_email` in `board_members.yaml`; **blocked:** does FENB control fenb.ca mail forwarding?
