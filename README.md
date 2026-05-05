# Fencing-Escrime NB — Website

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
    │   └── clubs.yaml      Member club data (drives /clubs/ page)
    ├── i18n/
    │   ├── en.yaml         English UI strings
    │   └── fr.yaml         French UI strings
    ├── layouts/
    │   ├── index.html      Custom homepage (hero, events, news, programs)
    │   ├── 404.html        Custom 404 (JS detects /fr/ and switches language)
    │   ├── clubs/
    │   │   └── list.html   Custom clubs page (grid + map + registration CTA)
    │   └── partials/
    │       └── site-header.html  Sticky nav, search overlay, language switcher (all pages)
    └── static/
        └── images/
            ├── logo-color.svg    Used on light backgrounds
            ├── logo-white.svg    Used on dark/teal backgrounds (hero, etc.)
            └── clubs/            Member club logos (club-logo-{ID}.{ext})
```

---

## Build & develop

```bash
cd fenb-1

# Dev server with live reload (search won't work — see note below)
/snap/bin/hugo server

# Dev server with search working (writes public/ to disk)
/snap/bin/hugo && npx pagefind --site public && /snap/bin/hugo server --renderStaticToDisk

# Production build (output → fenb-1/public/)
/snap/bin/hugo --environment production && npx pagefind --site public
```

Hugo is installed via snap (`/snap/bin/hugo`). The site builds in ~100 ms.

**Search index:** Pagefind runs as a post-build step (`npx pagefind --site public`) and writes its index to `public/pagefind/`. This directory is not tracked in git — regenerate it after every build. The search overlay lazy-loads Pagefind's JS/CSS on first use, so `/pagefind/` must exist before the site is served.

---

## Pages — status

| URL | Status | Notes |
|-----|--------|-------|
| `/` | ✅ Built | Hero, upcoming events, latest news, quick-links section |
| `/clubs/` | ✅ Built | Club grid, Google map, registration CTA |
| `/news/` | ✅ Built | 4 sample posts (results, announcement, registration, community) |
| `/events/` | 🔲 Placeholder | Menu link exists; page not yet built |
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

**events.yaml** fields per event: `title`, `date`, `display_date`, `category`,
`category_label`, `venue`, `location`. Categories with CSS/i18n support:
`competition`, `training`, `national`, `provincial`, `clinic`, `meeting`.

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
category: "Results"   # badge label; drives card accent colour
summary: "One-sentence summary shown on the homepage card."
---

Full post body here (Markdown).
```

Add `content/news/my-post.fr.md` for a French translation.

### New event

Add an entry to `data/events.yaml`:

```yaml
- title: "Event Name"
  date: "2026-06-01"          # ISO — used for sorting/filtering
  display_date: "June 1, 2026"
  category: competition        # see categories above
  category_label: "Competition"
  venue: "Venue Name"
  location: "City, NB"
```

The homepage automatically shows the next 4 events on or after today's date.

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

### New section page

1. Create `layouts/{section}/list.html` defining the `main` block
2. Create `content/{section}/_index.md` and `content/{section}/_index.fr.md`
3. Set `hide_page_header: true` in both front matter files if the layout has its own header
4. Add i18n keys for any new UI strings to both `en.yaml` and `fr.yaml`
5. Add the URL to the Pages table above
