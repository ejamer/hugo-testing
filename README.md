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
| CSS | Custom (`fenb-1/assets/ananke/css/fenb.css`) bundled into Ananke's pipeline |
| i18n | Hugo built-in — English (`en-CA`) · French (`fr-CA`) |
| Content | Markdown in `fenb-1/content/` |
| Structured data | YAML in `fenb-1/data/` (events, clubs, board, policies) |

---

## Related docs

| File | Covers |
|------|--------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Branch strategy, local build commands, GitHub Pages deployment |
| [STYLE_GUIDE.md](STYLE_GUIDE.md) | Brand, CSS, i18n, bilingual rules, naming conventions, category colours |
| [CLAUDE.md](CLAUDE.md) | Instructions and conventions for Claude Code |
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
    │       └── fenb.css    All custom styles (bundled by Ananke)
    ├── content/            Section indexes: _index.md (EN) + _index.fr.md (FR)
    │   │                   Article files: {name}.en.md (EN) + {name}.fr.md (FR)
    │   ├── _index.md       Homepage (EN)
    │   ├── _index.fr.md    Homepage (FR)
    │   ├── clubs/
    │   │   ├── _index.md      Clubs list page (EN)
    │   │   └── _index.fr.md   Clubs list page (FR)
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
    │   ├── board.yaml         Board of directors and executive (drives /about/ page)
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
    │   │   └── single.html Policies & Reports page (sidebar TOC + policy/report lists)
    │   ├── clubs/
    │   │   └── list.html   Custom clubs page (grid + map + registration CTA)
    │   ├── news/
    │   │   ├── list.html   News index (card grid, paginates recursively across year folders)
    │   │   └── single.html News article (3-col: empty left | article | recent-news sidebar)
    │   └── partials/
    │       └── site-header.html  Sticky nav, search overlay, language switcher, page header band
    └── static/
        └── images/
            ├── logo-color.svg    Used on light backgrounds
            ├── logo-white.svg    Used on dark/teal backgrounds (hero, etc.)
            ├── clubs/            Member club logos (club-logo-{ID}.{ext})
            └── hero/             Hero carousel images (hero1.jpg … heroN.jpg)
```

---

## Adding content

### New news post

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

---

### Board of Directors

Edit `data/board.yaml`. Each member entry:

```yaml
- name: "Full Name"
  role_en: "President"       # displayed in English
  role_fr: "Présidente"      # displayed in French
```

- The `season` field at the top of the file (e.g. `"2025–2026"`) appears as a subtitle in the sidebar card on the About page — update it at the start of each season.
- `contact` is the board inquiry email shown on the About page.
- Members are displayed in the order they appear in the file.
- The Executive Director entry uses `role_en: "Executive Director"` — this triggers crimson card styling in the layout; do not rename the role without also updating `layouts/about/list.html`.

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

1. Create `layouts/{section}/list.html` defining the `main` block
2. Create `content/{section}/_index.md` and `content/{section}/_index.fr.md`
3. Set `hide_page_header: true` in both front matter files if the layout provides its own page header inside `main` (prevents doubling up with `site-header.html`)
4. Add i18n keys for any new UI strings to both `en.yaml` and `fr.yaml`

If the section has single-page posts and you want the page header band to show the **section title** rather than each page's own title, add to the section `_index.md`:

```yaml
cascade:
  - _target:
      kind: page
    page_header_uses_section: true
```

Then create `layouts/{section}/single.html` defining only `title` and `main` — the band is rendered by `site-header.html` automatically.
