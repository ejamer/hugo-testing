# Fencing-Escrime NB — Website

Replacement for [fencingnb.ca](https://fencingnb.ca). Static site built with Hugo.

## Stack

| Layer | Choice |
|-------|--------|
| Static site generator | [Hugo](https://gohugo.io) v0.161+ (extended) |
| Theme | [Ananke](https://github.com/theNewDynamic/gohugo-theme-ananke) (submodule) |
| CSS | Custom (`fenb-1/assets/ananke/css/fenb.css`) bundled into Ananke's pipeline |
| i18n | Hugo built-in — English (`en-CA`) and French (`fr-CA`) |
| Content | Markdown in `fenb-1/content/` |
| Event data | YAML in `fenb-1/data/events.yaml` |

## Project layout

```
hugo-testing/
└── fenb-1/               Hugo site root
    ├── hugo.toml          Site config, languages, nav menus
    ├── assets/
    │   └── ananke/css/
    │       └── fenb.css   All custom styles (bundled by Ananke)
    ├── content/           Markdown pages (*.md = EN, *.fr.md = FR)
    │   └── news/          News posts and results
    ├── data/
    │   └── events.yaml    2025–2026 event calendar (drives homepage cards)
    ├── i18n/
    │   ├── en.yaml        English UI strings
    │   └── fr.yaml        French UI strings
    ├── layouts/
    │   ├── index.html     Custom homepage (hero, events, news, programs)
    │   ├── 404.html       Custom 404 page
    │   └── partials/
    │       └── site-header.html  Nav bar + language switcher (all pages)
    └── static/
        └── images/        Logo variants (logo-color.svg, logo-white.svg)
```

## Build & develop

```bash
cd fenb-1

# Start dev server with live reload
/snap/bin/hugo server

# Production build (output → fenb-1/public/)
/snap/bin/hugo
```

Hugo is installed via snap (`/snap/bin/hugo`). The site builds in ~100 ms.

## Adding content

**New news post** — create `content/news/my-post.md` (English) and optionally
`content/news/my-post.fr.md` (French translation). Required front matter:

```yaml
---
title: "Post title"
date: 2026-06-01
category: "Results"   # shown as a badge; also drives the card accent colour
summary: "One-sentence summary shown on the homepage card."
---
```

**New event** — add an entry to `data/events.yaml`. The homepage automatically
shows the next 4 events on or after today's date. Categories with CSS/i18n
support: `competition`, `training`, `national`, `provincial`, `clinic`, `meeting`.

## Bilingual (EN / FR)

- English pages are served at `/`, French at `/fr/`.
- All UI strings live in `i18n/en.yaml` and `i18n/fr.yaml`.
- Content translations use filename suffixes: `page.md` (EN) → `page.fr.md` (FR).
- The nav language switcher links to the translated page if one exists, otherwise
  falls back to the other language's home page.

## Brand

- **Primary:** `#006156` (deep teal)
- **Accent:** `#79242f` (crimson)
- Logos in `static/images/`. Use `logo-color.svg` on light backgrounds,
  `logo-white.svg` on dark/teal backgrounds (e.g. the hero section).
