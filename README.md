# Fencing-Escrime NB — Website

**[► View live site](https://ejamer.github.io/hugo-testing/)**

Replacement for [fencingnb.ca](https://fencingnb.ca). Static site built with Hugo.
Bilingual (English / French). Brand colours: `#006156` (teal) · `#79242f` (crimson).

---

## Stack

| Layer | Choice |
|-------|--------|
| Static site generator | [Hugo](https://gohugo.io) v0.161+ (extended) |
| Theme | [Ananke](https://github.com/theNewDynamic/gohugo-theme-ananke) (submodule) |
| CSS | Custom (`fenb-1/assets/ananke/css/fenb.css`) bundled into Ananke's pipeline |
| i18n | Hugo built-in — English (`en-CA`) · French (`fr-CA`) |
| Content | Markdown in `fenb-1/content/` |
| Structured data | YAML in `fenb-1/data/` (events, clubs) |

---

## Project layout

```
hugo-testing/
├── CLAUDE.md              Process instructions for Claude
├── TODO.md                Outstanding items — keep current
├── README.md              This file — reference for content and conventions
└── fenb-1/                Hugo site root
    ├── hugo.toml           Site config, languages, nav menus
    ├── assets/
    │   └── ananke/css/
    │       └── fenb.css    All custom styles (bundled by Ananke)
    ├── content/            Markdown pages (*.md = EN, *.fr.md = FR)
    │   ├── _index.md       Homepage (EN)
    │   ├── _index.fr.md    Homepage (FR)
    │   ├── clubs/
    │   │   ├── _index.md   Clubs list page (EN)
    │   │   └── _index.fr.md  Clubs list page (FR)
    │   └── news/           News posts (EN only so far)
    ├── data/
    │   ├── events.yaml     2025–2026 event calendar (drives homepage cards)
    │   ├── clubs.yaml      Member club data (drives /clubs/ page)
    │   └── hero_slides.yaml  Hero carousel image list (drives homepage slider)
    ├── i18n/
    │   ├── en.yaml         English UI strings
    │   └── fr.yaml         French UI strings
    ├── layouts/
    │   ├── index.html      Custom homepage (hero, events, news, programs)
    │   ├── 404.html        Custom 404 (JS detects /fr/ and switches language)
    │   ├── clubs/
    │   │   └── list.html   Custom clubs page (grid + map + registration CTA)
    │   ├── news/
    │   │   ├── list.html   News index (FencingNB-styled card grid)
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

## Hosting, branches & local dev

See **[DEVELOPMENT.md](DEVELOPMENT.md)** for the full workflow: branch strategy, local build commands, and GitHub Pages deployment.

---

## Pages — status

| URL | Status | Notes |
|-----|--------|-------|
| `/` | ✅ Built | Hero, upcoming events, latest news, quick-links section |
| `/clubs/` | ✅ Built | Club grid, Google map, registration CTA |
| `/news/` | ✅ Built | List + single-post layout. Articles have 3-col layout with Recent News sidebar, inline title, category-coloured divider. |
| `/events/` | ✅ Built | Calendar grid with month navigation, event list below. Data from `data/events.yaml`. |
| `/programs/` | 🔲 Placeholder | Menu link exists; page not yet built |
| `/about/` | 🔲 Placeholder | Menu link exists; page not yet built |
| `/join/` | 🔲 Placeholder | Menu link exists; page not yet built |

French versions mirror English at `/fr/...`. The language switcher links directly to
the translated page when one exists, otherwise falls back to the French home page.

---

## Conventions

### Bilingual rule — every page needs both language files

Any section with a custom layout needs `_index.md` (EN) **and** `_index.fr.md` (FR)
in its content directory. Without the French file, the language switcher falls back
to the French home page instead of the translated page.

Both files need `hide_page_header: true` in front matter if the layout provides its
own page header (prevents the generic header in `site-header.html` from doubling up).

### i18n — all UI text goes through translation strings

Never hardcode display text in a layout. Add keys to **both** `i18n/en.yaml` and
`i18n/fr.yaml`. Use `{{ i18n "key" }}` in templates. For strings with dynamic values
use `{{ i18n "key" (dict "Var" value) }}` and `{{ .Var }}` in the YAML string.

### Data-driven content

Structured content (events, clubs) lives in `data/` as YAML. Layouts read it via
`hugo.Data`. This lets content editors update data without touching layout files.

**clubs.yaml** fields per club: `id`, `name`, `logo`, `email`, `website` (optional),
`city`.

**events.yaml** fields per event:

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

Categories with CSS and i18n support: `competition`, `training`, `national`, `provincial`, `clinic`, `meeting`, `announcement`.

### CSS

All styles in `fenb-1/assets/ananke/css/fenb.css`. CSS custom properties
(`--teal`, `--crimson`, `--shadow-sm`, `--radius`, etc.) are defined at `:root` —
use them rather than raw hex values. No inline styles for anything reusable.

### 404 — bilingual via JavaScript

Hugo generates one root `404.html` (English). A small inline script detects when
the URL starts with `/fr/` and swaps: page text, nav link labels (from Hugo's French
menu baked in at build time), nav link hrefs (prefixed with `/fr`), logo href, and
the language-switcher button. If the French strings in `i18n/fr.yaml` change, update
the hardcoded strings in `layouts/404.html` to match.

---

## Brand

- **Primary:** `#006156` (deep teal) — nav, headings, buttons, section accents
- **Accent:** `#79242f` (crimson) — CTA buttons, hero badge, event category badges
- **Logos:** `static/images/logo-color.svg` on light backgrounds;
  `logo-white.svg` on dark/teal backgrounds (hero, teal-bg sections)
- **Font stack:** Avenir, Nunito Sans, system-ui

---

## Adding content

### New news post

Create `content/news/my-post.md`:

```yaml
---
title: "Post title"
date: 2026-06-01
category: "Results"   # badge label — drives card accent colour AND article divider colour
summary: "One-sentence summary shown on the homepage card."
---

Full post body here (Markdown).
```

Supported `category` values and their colours:

| Value | Colour |
|---|---|
| `Results` | Teal |
| `Announcement` | Crimson |
| `Registration` | Green |
| `Community` | Navy |

French equivalents (`Résultats`, `Annonce`, `Inscription`, `Communauté`) map to the same colours via paired CSS selectors.

The article page header band shows "News & Results" (the section title) rather than the article title — controlled by `page_header_uses_section: true` in the news `_index.md` cascade. The article title appears in the scrolling body below the band.

Add `content/news/my-post.fr.md` for a French translation.

### New event

Add an entry to `data/events.yaml`:

```yaml
- title: "Event Name"
  date: "2026-06-01"              # ISO — sort/filter only; use first-of-month for uncertain dates
  display_date: "June 1, 2026"    # free-form; use "TBA" or "June 2026" if date is uncertain
  category: competition           # see categories above
  category_label: "Competition"
  venue: "Venue Name"
  location: "City, NB"
  description: "Optional details not shown on homepage."
  details_url: ""                 # URL for a Learn More badge; leave blank or omit if none
  registration_url: ""            # URL for a Register Now badge; leave blank or omit if none
```

The homepage always shows 4 event cards: the next 4 upcoming events (date ≥ today), falling back to the most recent past events if fewer than 4 are upcoming. When the season ends, add an off-season placeholder entry (category `announcement`) so the section stays populated through the summer gap.

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

### Hero carousel images

Drop replacement images into `static/images/hero/` and update `data/hero_slides.yaml`:

```yaml
slides:
  - src: /images/hero/hero1.jpg
    alt: "Alt text for accessibility"
  - src: /images/hero/hero2.jpg
    alt: ""
```

Images should be 2.5:1 aspect ratio (e.g. 1250×500 px). The carousel auto-advances
every 5 seconds; prev/next arrows allow manual control.

### New section page

1. Create `layouts/{section}/list.html` defining the `main` block
2. Create `content/{section}/_index.md` and `content/{section}/_index.fr.md`
3. Set `hide_page_header: true` in both front matter files if the layout provides its own page header inside `main` (prevents doubling up with `site-header.html`)
4. Add i18n keys for any new UI strings to both `en.yaml` and `fr.yaml`
5. Add the URL to the Pages table above

If the section has single-page posts and you want the page header band to always show the **section title** (rather than each page's own title), add to the section `_index.md`:

```yaml
cascade:
  - _target:
      kind: page
    page_header_uses_section: true
```

Then create `layouts/{section}/single.html` defining only `title` and `main` — the band is rendered by `site-header.html` automatically.
