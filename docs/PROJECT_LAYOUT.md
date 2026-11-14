# Project layout

The repo root holds documentation, tooling and scripts; all Hugo source lives under `fenb-1/`. Content is split into EN/FR file pairs, and structured data (events, clubs, board members) lives in `fenb-1/data/` as YAML.

**How to maintain this file:** the tree shows folders, not files. Name a file in the tree only when it's a one-off whose purpose isn't obvious from its location. Files that come in families (data, layouts, partials, JS, scripts) go in the tables below, one short line each, in alphabetical order. Don't list anything `ls` would show just as well (content articles, images, PDFs, subfolders of `static/`), or anything gitignored. CSS files are listed in [STYLE_GUIDE.md → CSS](STYLE_GUIDE.md#css).

```
hugo-testing/
├── CLAUDE.md, README.md   Claude instructions; how to add/update content
├── Makefile               serve / build / build-prod / clean — run from the repo root
├── package.json           Playwright pin for browser-driven checks (not part of the Hugo build)
├── .github/workflows/     pr-check (PR builds), release-website (deploy), delete-branches (cleanup after merge)
├── .gitmodules            Ananke theme submodule → fenb-1/themes/ananke
├── .claude/               Project skills (commands/fenb-*.md) and shared settings
├── docs/                  Reference docs — see README → Related docs
├── plans/                 Plans for multi-session features, plus TODO.md (outstanding items)
├── scripts/               Helper scripts — see Scripts table
├── design-sources/        Blank templates only (hero/: FENB + Damocles Inkscape SVGs, HTML
│                          announcement); not served. Finished designs go in resources/ (local)
├── resources/             Gitignored, local only: source docs, flyers, finished design files
└── fenb-1/                Hugo site root
    ├── hugo.toml          Site config, languages, nav menus (no baseURL)
    ├── config/            Per-environment baseURL: development/ (/hugo-testing/ subpath), production/ (fenb.ca, deployed)
    ├── archetypes/        Front matter templates
    ├── assets/ananke/css/ Site CSS, one fenb-*.css per concern — see STYLE_GUIDE → CSS
    ├── content/           Bilingual pages: _index.md + _index.fr.md per section,
    │                      slug.en.md + slug.fr.md per page; news/ has a folder per year
    ├── data/              YAML that drives page content — see Data files table
    ├── i18n/              UI strings (en.yaml, fr.yaml)
    ├── layouts/           Templates — see Layouts and Partials tables
    ├── themes/ananke/     Base theme (git submodule — don't edit; override in layouts/)
    └── static/
        ├── documents/     PDFs served at /documents/, organized by section
        ├── images/        Site images, organized by section
        ├── js/            Client-side scripts — see JavaScript table
        ├── sitemap.xsl    Styles the language sitemaps as HTML in browsers
        └── version.json   Build version — managed by /fenb-git-release, don't edit
```

## Data files — `fenb-1/data/`

Schemas and how-tos are in [README → Adding content](../README.md#adding-content).

| File | Drives |
|------|--------|
| `armourer_resources.yaml` | Study resource cards on /programs/armourer-development/ |
| `board_members.yaml` | Board grid on /about/organization/ (`members` = current roster incl. vacant seats; `previous_members` = history, not displayed) |
| `clubs.yaml` | Club cards and map on /clubs/; `host-logo` shortcode lookups |
| `coach_pathways.yaml` | CFF certification pathway cards on /programs/coach-training/ |
| `event_categories.yaml` | Category IDs for the calendar legend and schedule filters |
| `events.yaml` | Current-season events (homepage, /events/, .ics feeds) |
| `events_archive/` | Past seasons, one file each; picked up automatically |
| `hero_slides.yaml` | Homepage hero carousel |
| `hof_categories.yaml` | Hall of Fame category IDs (filter dropdown + badge classes) |
| `join.yaml` | Seasonal portal URLs for the Join section |
| `join_paths.yaml` | Path cards on the Join landing page |
| `organizations.yaml` | Non-club logos (e.g. Fencing Canada) for the `host-logo` shortcode |
| `policies.yaml` | Documents on /about/policies-and-reports/ |
| `program_cards.yaml` | Path cards on the Programs landing page |
| `quick_links.yaml` | Quick-link cards on the homepage |
| `referee_resources.yaml` | Study resource cards on /programs/referee-development/ |

## Layouts — `fenb-1/layouts/`

Sections follow Hugo's usual pattern: `list.html` for the section page, `single.html` or a named layout for its sub-pages (see [STYLE_GUIDE → Per-page layouts](STYLE_GUIDE.md#per-page-layouts-within-a-section)).

| Path | Renders |
|------|---------|
| `_default/baseof.html` | Base page shell; loads `lightbox.js` on every page |
| `_default/sitemap.xml` | Sitemap with hreflang alternates |
| `_default/_markup/render-image.html` | Markdown images: site paths, lazy loading, link to the full-size file |
| `_default/_markup/render-link.html` | Markdown links: external links open in a new tab |
| `_default/_markup/render-table.html` | Markdown tables: full-width note rows when `merge_note_rows: true` |
| `404.html` | Not-found page |
| `index.html` | Homepage |
| `robots.txt` | Overrides Ananke's (avoids a leading-slash `absURL`); blocks crawling outside production |
| `about/` | About landing, Policies & Reports, policy pages, Hall of Fame table + profiles, Mission & Leadership |
| `clubs/list.html` | Club grid + map |
| `contact/list.html` | Contact form |
| `events/list.html` | JS month calendar |
| `events/schedule.html` | Filterable printable season list |
| `events/list.calendar.ics` | Season .ics feed |
| `join/` | Join landing + membership, clubs, volunteer |
| `news/` | News list, article, RSS |
| `programs/` | Programs landing + one layout per program page |
| `shortcodes/host-logo.html` | Club/organization logo floated beside an article section |

## Partials — `fenb-1/layouts/partials/`

Check here before building a new component. Partials marked † have a full write-up in [STYLE_GUIDE → Shared UI components](STYLE_GUIDE.md#shared-ui-components); return-value partials are explained in [STYLE_GUIDE → Template patterns](STYLE_GUIDE.md#template-patterns).

**Page chrome**

| Partial | Purpose |
|---------|---------|
| `head-additions.html` | Applies the saved light/dark theme before first paint |
| `nav.html` | Sticky nav, language switcher, search, Facebook link, theme toggle |
| `page-header.html` | Coloured title band below the nav |
| `site-announcement.html` | Site-wide banner (set in hugo.toml) |
| `site-favicon.html` | Favicon link tags |
| `site-footer.html` | Footer: copyright, privacy icon, RSS |
| `site-header.html` | Entry point; includes nav + page header |

**Shared components**

| Partial | Purpose |
|---------|---------|
| `back-link.html` † | Back-navigation link |
| `clubs-benefits.html` | Three-card benefits grid (clubs + join/clubs) |
| `icon.html` | Inline SVG icon |
| `map-link.html` † | Place text that opens Google Maps |
| `section-header.html` | Section label + h2 + "see all" link |

**Events and news**

| Partial | Purpose |
|---------|---------|
| `calendar-dialog.html` † | Add to Calendar / Subscribe modal, once per page |
| `event-card.html` | One event card |
| `events-viewbar.html` † | Calendar / List toggle + Print / Subscribe bar |
| `ics/` | iCalendar building blocks: escaping, line folding, VEVENT/VCALENDAR, per-event .ics URL and filename, Google Calendar link, Add to Calendar button |
| `news-card.html` | One news card (data attributes for `news-filter.js`) |

**Programs** (officials pages) †

| Partial | Purpose |
|---------|---------|
| `program-contact-cta.html` | Contact banner |
| `program-pay-section.html` | Pay scale section |
| `program-quote.html` | Pull quote |
| `program-resource-cards.html` | Resource cards from `referee_resources` / `armourer_resources` |

**Return-value helpers** (return a value, render nothing)

| Partial | Returns |
|---------|---------|
| `all-events.html` | Current + archived events, sorted by start date |
| `event-date.html` | Bilingual event date |
| `event-details-url.html` | Learn More URL in the current language; blank until the target page is published |
| `localized.html` | A bilingual data field in the current language (`_fr` falls back to `_en`) |
| `map-url.html` | Google Maps search URL; blank for empty/TBA places |
| `news-date.html` | Article date, EN/FR, long or short month |
| `news-season.html` | Fencing-season label (Sept–Aug) for a date |

## JavaScript — `fenb-1/static/js/`

| File | Page | Does |
|------|------|------|
| `calendar-dialog.js` | Events, homepage | Opens and fills the Add to Calendar / Subscribe dialog |
| `coach-pathways.js` | /programs/coach-training/ | Pathway diagram modal |
| `event-dates.js` | Events, homepage | Shared date helpers (`window.FenbEventDates`) |
| `events-calendar.js` | /events/ | Month grid calendar |
| `events-schedule.js` | /events/schedule/ | Season toggle, category filters, `#YYYY-YYYY` deep links |
| `hero-slider.js` | Homepage | Hero carousel; hides slides outside their date window |
| `hof-table.js` | Hall of Fame | Sort + category filter |
| `lightbox.js` | All (via baseof) | Image zoom for elements with `data-lightbox-zone` |
| `news-filter.js` | /news/ | Category + season filter (no pagination — JS shows/hides) |
| `results-table.js` | News articles | Sortable results tables |
| `upcoming-events.js` | Homepage | Trims the event grid to the next 4 using the visitor's clock |

## Scripts — `scripts/`

| File | Does |
|------|------|
| `check-hugo-version.sh` | Compares the CI Hugo pin with local/latest; `--set` updates the pin |
| `check-pagefind-version.sh` | Compares the Pagefind pin (both workflows + Makefile) with npm; `--set` updates all three |
| `compute-next-version.sh` | Latest tag + next version candidates |
| `ftl-read-saved-pages.py` | Reads hand-saved FencingTimeLive pages for /fenb-data-get-results |
| `generate-version-json.sh` | Writes `static/version.json` for a release |
| `season-rollover.sh` | Archives `events.yaml` and starts a fresh season file |
