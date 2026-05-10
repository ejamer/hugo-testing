# Fencing-Escrime NB — Website

This repo is testing a replacement tech stack for [fencingnb.ca](https://fencingnb.ca), generating a static site built with Hugo.

**[► View live site](https://ejamer.github.io/hugo-testing/)**

## Testing locally

1. From the repo root folder, type: `make serve`
2. Then open `http://localhost:1313/hugo-testing/` in your browser.

> [!TIP]
> `make serve` runs three steps in order: builds the site, generates the search index with Pagefind, then starts the dev server. Using just `hugo server` inside the `fenb-1` folder skips the Pagefind step, so the search overlay will silently fail to load — always use `make serve` when you need a full-featured test.

---

## Stack

| Layer | Choice |
|-------|--------|
| Static site generator | [Hugo](https://gohugo.io) v0.161+ (extended) |
| Theme | [Ananke](https://github.com/theNewDynamic/gohugo-theme-ananke) (submodule) |
| CSS | Nine scoped files in `fenb-1/assets/ananke/css/fenb-*.css`, merged by Ananke's `resources.Concat` pipeline |
| i18n | Hugo built-in — English (`en-CA`) · French (`fr-CA`) |
| Content | Markdown in `fenb-1/content/` |
| Structured data | YAML in `fenb-1/data/` (events, clubs, board, programs, policies, hero slides) |

---

## Related docs

| File | Covers |
|------|--------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Branch strategy, local build commands, GitHub Pages deployment |
| [STYLE_GUIDE.md](STYLE_GUIDE.md) | Brand, CSS, i18n, bilingual rules, naming conventions, category colours |
| [CLAUDE.md](CLAUDE.md) | Instructions and conventions for Claude Code; lists available `/fenb-*` skills |
| [TODO.md](TODO.md) | Outstanding items |

---

## Project layout

```
hugo-testing/
├── CLAUDE.md              Process instructions for Claude
├── DEVELOPMENT.md         Branch strategy and build commands
├── STYLE_GUIDE.md         Brand, CSS, and content conventions
├── TODO.md                Outstanding items — keep current
├── plans/                 Design decisions and deferred plans
├── README.md              This file
└── fenb-1/                Hugo site root
    ├── hugo.toml           Site config, languages, nav menus
    ├── assets/
    │   └── ananke/css/
    │       ├── fenb-base.css       Variables, reset, shared utilities, buttons
    │       ├── fenb-nav.css        Nav, search overlay, page header band
    │       ├── fenb-hero.css       Hero section and animations
    │       ├── fenb-events.css     Event cards, tags, calendar page
    │       ├── fenb-news.css       News cards, article layout, 404 page
    │       ├── fenb-clubs.css      Programs quick-links, clubs page
    │       ├── fenb-about.css      About page, policies page
    │       ├── fenb-schedule.css   Season schedule page
    │       └── fenb-responsive.css All breakpoints and print query (loaded last)
    ├── content/            Section indexes: _index.md (EN) + _index.fr.md (FR)
    │   │                   Article files: {name}.en.md (EN) + {name}.fr.md (FR)
    │   ├── _index.md       Homepage (EN)
    │   ├── _index.fr.md    Homepage (FR)
    │   ├── about/
    │   │   ├── _index.md               About section (EN)
    │   │   ├── _index.fr.md            About section (FR)
    │   │   ├── policies-and-reports.en.md
    │   │   ├── policies-and-reports.fr.md
    │   │   └── policies/               Individual policy pages (EN + FR pairs)
    │   │       ├── safe-sport.en.md
    │   │       ├── safe-sport.fr.md
    │   │       └── … (one slug.en.md + slug.fr.md per policy)
    │   ├── clubs/
    │   │   ├── _index.md      Clubs list page (EN)
    │   │   └── _index.fr.md   Clubs list page (FR)
    │   ├── events/
    │   │   ├── _index.md         Events section (EN)
    │   │   ├── _index.fr.md      Events section (FR)
    │   │   ├── schedule.en.md    Season schedule page (EN)
    │   │   └── schedule.fr.md    Season schedule page (FR)
    │   └── news/
    │       ├── _index.md      News section (EN)
    │       ├── _index.fr.md   News section (FR)
    │       └── 2026/          One subfolder per calendar year
    │           ├── _index.md
    │           ├── _index.fr.md
    │           ├── apr-05-nb-athletes-nationals.en.md
    │           └── apr-05-nb-athletes-nationals.fr.md
    ├── data/
    │   ├── events.yaml        Current season's event calendar (drives homepage + /events/)
    │   ├── events_archive/    Past seasons — moved here at season rollover (see plans/)
    │   ├── clubs.yaml         Member club data (drives /clubs/ page)
    │   ├── board.yaml         Board of directors; also holds founder photo info and affiliations (drives /about/)
    │   ├── programs.yaml      Homepage quick-link cards (URLs + accent flag for the join card)
    │   ├── policies.yaml      Policy documents, strategic plan, annual reports (drives /about/policies-and-reports/)
    │   └── hero_slides.yaml   Hero carousel image list (drives homepage slider)
    ├── i18n/
    │   ├── en.yaml         English UI strings
    │   └── fr.yaml         French UI strings
    ├── layouts/
    │   ├── index.html      Custom homepage (hero, events, news, programs)
    │   ├── 404.html        Custom 404 (JS detects /fr/ and switches language)
    │   ├── about/
    │   │   ├── list.html   About page (overview, history, mission, board grid, contact)
    │   │   ├── single.html Policies & Reports page (sidebar TOC + policy/report lists)
    │   │   └── policies/
    │   │       └── single.html  Individual policy page (sidebar back-link + language switcher)
    │   ├── clubs/
    │   │   └── list.html   Custom clubs page (grid + map + registration CTA)
    │   ├── events/
    │   │   ├── list.html     Events calendar (JS month grid + category legend sidebar)
    │   │   └── schedule.html Season schedule (server-rendered list + filter sidebar)
    │   ├── news/
    │   │   ├── list.html   News index (card grid, paginates recursively across year folders)
    │   │   └── single.html News article (2-col: article | recent-news sidebar)
    │   └── partials/
    │       ├── site-header.html  Sticky nav, search overlay, language switcher, page header band
    │       ├── event-card.html   Single event card — accepts a YAML event object as context
    │       ├── news-card.html    Single news card — call with (dict "page" . "heading" "h2" "truncate" 160)
    │       └── section-header.html  Section label + h2 + optional "see all" link — call with (dict "label" … "title" … "linkURL" … "linkText" …)
    └── static/
        ├── docs/
        │   ├── policy-manual-en.pdf / policy-manual-fr.pdf
        │   ├── bylaws-en.pdf / bylaws-fr.pdf
        │   ├── strategic-plan-en.pdf / strategic-plan-fr.pdf
        │   ├── agm-minutes/    2012.pdf … YYYY.pdf (one per season start year)
        │   └── archived/       Previous combined policy manual — stored, not linked
        ├── images/
        │   ├── logo-color.svg    Used on light backgrounds
        │   ├── logo-white.svg    Used on dark/teal backgrounds (hero, etc.) and in dark mode nav
        │   ├── clubs/            Member club logos (club-logo-{ID}.{ext})
        │   └── hero/             Hero carousel images (hero1.jpg … heroN.jpg)
        └── js/
            ├── hero-slider.js       Homepage hero carousel (auto-advance + prev/next)
            ├── events-calendar.js   Events calendar page (JS month grid)
            └── events-schedule.js   Season schedule page (season toggle + category filters)
```

---

## Adding content

### New news post

> **Skill available:** run `/fenb-new-news` in Claude Code — it prompts for date, slug, titles, category, and summaries, then creates both language files with correct front matter and filenames.

**File naming:** `{mon}-{dd}-{title}.{lang}.md` inside the year subfolder — see [STYLE_GUIDE.md](STYLE_GUIDE.md) for the full naming convention.

Example: `content/news/2026/jun-01-provincial-team-announced.en.md` + `.fr.md`

**Front matter:**

```yaml
---
title: "Post title"
date: 2026-06-01
category: "Results"   # badge label — drives card accent colour AND article divider colour
summary: "One-sentence summary shown on the homepage card."
---

Full post body here (Markdown).
```

**Category colours:**

| Value | Colour | French equivalent |
|---|---|---|
| `Results` | Teal | `Résultats` |
| `Announcement` | Crimson | `Annonce` |
| `Registration` | Green | `Inscription` |
| `Community` | Navy | `Communauté` |

The article page header band shows "News & Results" (the section title) rather than the article title — controlled by `page_header_uses_section: true` in the news `_index.md` cascade. The article title appears in the scrolling body below the band.

**New year folder:** when the first article of a new calendar year is created, add a year subfolder with `_index.md` and `_index.fr.md` (copy from the previous year folder).

---

### New event

Add an entry to `data/events.yaml`.

**Fields:**

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | |
| `date` | ✅ | ISO `YYYY-MM-DD` — used for sort/filter only |
| `display_date` | ✅ | Free-form string shown on the card. Use `"TBA"` or `"July 2026"` for uncertain dates |
| `end_date` | — | Optional. ISO `YYYY-MM-DD`. If set and greater than `date`, the calendar draws bars across the full range (inclusive). Leave blank or omit for single-day events. |
| `category` | ✅ | See categories below |
| `category_label` | ✅ | Fallback label if i18n key missing |
| `venue` | ✅ | Short venue name shown on card |
| `location` | ✅ | City / province |
| `description` | — | Optional. Not shown on homepage cards |
| `details_url` | — | If set, a teal **Learn More →** badge appears on the card (opens in new tab) |
| `registration_url` | — | If set, a crimson **Register Now →** badge appears on the card (opens in new tab) |

**Example:**

```yaml
- title: "Event Name"
  date: "2026-06-01"              # ISO — sort/filter only; use first-of-month for uncertain dates
  display_date: "June 1, 2026"    # free-form; use "TBA" or "June 2026" if date is uncertain
  category: competition           # see categories below
  category_label: "Competition"
  venue: "Venue Name"
  location: "City, NB"
  description: "Optional details not shown on homepage."
  details_url: ""                 # URL for a Learn More badge; leave blank or omit if none
  registration_url: ""            # URL for a Register Now badge; leave blank or omit if none
```

**Category colours:**

Each category drives three visual elements: the date badge on the event card, the tag pill, and the calendar bar on the month grid.

| `category` | Example `category_label` | Colour |
|---|---|---|
| `competition` | `"Competition"` | Teal |
| `training` | `"Training Camp"` | Dark green |
| `national` | `"National Event"` | Navy |
| `provincial` | `"Provincial Championship"` | Crimson |
| `clinic` | `"Clinic"` | Olive |
| `meeting` | `"FENB Meeting"` | Grey |
| `announcement` | `"Announcement"` | Teal |

`category_label` is the visible string on the card. `category` is the CSS hook — must match exactly (lowercase, no spaces).

The homepage always shows 4 event cards: the next 4 upcoming events (date ≥ today), falling back to the most recent past events if fewer than 4 are upcoming. When the season ends, add an off-season placeholder entry (category `announcement`) so the section stays populated through the summer gap.

#### Season rollover

> **Skill available:** run `/fenb-season-rollover` in Claude Code — it verifies the outgoing season label, archives `events.yaml`, creates a fresh one, and updates the events calendar page subtitles.

At the end of each season (typically late August):

1. Move `data/events.yaml` to `data/events_archive/YYYY-YYYY.yaml` — use a regular hyphen in the filename (e.g. `2025-2026.yaml`).
2. Create a fresh `data/events.yaml` for the incoming season with `season: "YYYY–YYYY"` (en-dash in the label) and an empty `events:` list.

The season schedule page at `/events/schedule/` automatically adds a dropdown entry for the archived season on the next build — no layout or template changes needed.

The **`season` field** at the top of `events.yaml` (e.g. `season: "2025–2026"`) is required — it drives the schedule page season dropdown label.

Also update the events calendar page subtitle in `content/events/_index.md` and `content/events/_index.fr.md` at rollover time:
```yaml
# _index.md
description: "2026–2027 season schedule"

# _index.fr.md
description: "Calendrier de la saison 2026–2027"
```

---

### Board of Directors

Edit `data/board.yaml`. Top-level keys:

- `season` — display label (e.g. `"2025–2026"`); update at the start of each season
- `contact` — board inquiry email shown on the About contact section
- `founder` — founder photo and bilingual caption shown in the history section:
  ```yaml
  founder:
    name: "Alfred Knappe"
    photo: "/images/alfred-knappe.png"
    caption_en: "Alfred Knappe — founding president, 1969"
    caption_fr: "Alfred Knappe — président fondateur, 1969"
  ```
- `affiliations` — provincial/national affiliations shown in the About sidebar:
  ```yaml
  affiliations:
    - name_en: "Canadian Fencing Federation"
      name_fr: "Fédération canadienne d'escrime"
      url: "https://fencing.ca/"
  ```
- `members` — board member list. Each entry:
  ```yaml
  - name: "Full Name"
    role_en: "President"       # displayed in English
    role_fr: "Présidente"      # displayed in French
  ```
  Members are displayed in the order they appear in the file. Add `card_color: teal` or `card_color: crimson` to any member whose avatar and role label should use a non-default colour (omit for standard directors, which use navy).

---

### Policies & Reports documents

#### Add or update an individual policy

1. Create `content/about/policies/{slug}.en.md` and `{slug}.fr.md`:

   ```yaml
   ---
   title: "Policy Name"
   translationKey: "{slug}"
   ---

   Policy body in Markdown…
   ```

2. Add (or update) the entry in `data/policies.yaml` under `documents`:

   ```yaml
   - name_en: "Policy Name"
     name_fr: "Nom de la politique"
     url_en: "/about/policies/{slug}/"
     url_fr: "/fr/about/policies/{slug}/"
   ```

#### Add a new AGM minutes year

1. Drop the PDF in `static/docs/agm-minutes/YYYY.pdf` where `YYYY` is the **season start year** (e.g. `2025.pdf` = the 2025–2026 season).
2. Add an entry at the top of `annual_reports` in `data/policies.yaml`:

   ```yaml
   - year: 2025
     url: "/docs/agm-minutes/2025.pdf"
   ```

The season label ("2025–2026 Season AGM Minutes") is computed automatically from `year` in the layout.

---

### New club

Add an entry to `data/clubs.yaml` and drop the logo in `static/images/clubs/`:

```yaml
- id: XYZ
  name: "Club Name"
  logo: "/images/clubs/club-logo-XYZ.png"
  email: "club@example.com"
  website: "https://example.com"   # omit if none
  city: "City, NB"
```

---

### Hero carousel images

Drop replacement images into `static/images/hero/` and update `data/hero_slides.yaml`:

```yaml
slides:
  - src: /images/hero/hero1.jpg
    alt: "Alt text for accessibility"
  - src: /images/hero/hero2.jpg
    alt: ""
```

Images should be 2.5:1 aspect ratio (e.g. 1250×500 px). The carousel auto-advances every 5 seconds; prev/next arrows allow manual control.

---

### New section page

> **Skill available:** run `/fenb-new-page` in Claude Code — it prompts for section, slug, titles, and an optional subtitle, then creates both language files with correct front matter.

1. Create `layouts/{section}/list.html` defining the `main` block
2. Create `content/{section}/_index.md` and `content/{section}/_index.fr.md`
   - Set `description:` in both files for a subtitle in the page header band (the partial renders it automatically)
   - Only add `hide_page_header: true` if the layout needs to render a **dynamic** subtitle itself (e.g. one computed from live data)
3. Add i18n keys for any new UI strings to both `en.yaml` and `fr.yaml`

If the section has single-page posts and you want the page header band to show the **section title** rather than each page's own title, add to the section `_index.md`:

```yaml
cascade:
  - target:
      kind: page
    page_header_uses_section: true
```

Then create `layouts/{section}/single.html` defining only `title` and `main` — the band is rendered by `site-header.html` automatically.
