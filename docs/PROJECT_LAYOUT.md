# Project layout

The repo root holds documentation and scripts; all Hugo source lives under `fenb-1/`. Content is split into EN/FR file pairs throughout, and structured data (events, clubs, board members) lives in `fenb-1/data/` as YAML rather than in content files.

**Scope:** This file is a navigation aid, not a file manifest. Folders are described at a summary level unless knowing the specific filename is necessary to make edits. Individual files are called out only where the file-to-page mapping is non-obvious — primarily `data/` YAML files, CSS files, layout templates, partials, and JS files. Deliberately omitted: individual content articles, static assets (images, PDFs), skill files, and gitignored paths. When updating this file, maintain that abstraction level — don't list files that can be found with a directory listing.

```
hugo-testing/
├── CLAUDE.md              Process instructions for Claude
├── README.md              How to add/update each content type
├── docs/
│   ├── DEVELOPMENT.md     Branch strategy and build commands
│   ├── GOTCHAS.md         Past build/template gotchas and their fixes
│   ├── PROJECT_LAYOUT.md  This file — full directory tree
│   ├── STYLE_GUIDE.md     Brand, CSS, and content conventions
│   └── TODO.md            Outstanding items — keep current
├── .claude/               Project skills and settings (see CLAUDE.md for skill descriptions)
├── plans/                 Detailed plans for multi-session features (referenced from docs/TODO.md)
├── scripts/               Utility scripts for fetching tournament results data
└── fenb-1/                Hugo site root
    ├── hugo.toml           Site config, languages, nav menus (no baseURL — set per environment)
    ├── archetypes/         Front matter templates (default.md, news.md)
    ├── assets/ananke/css/  All site CSS — one file per section:
    │                         fenb-base.css       Variables, reset, shared utilities, buttons, callout, cta-banner, landing-cards
    │                         fenb-nav.css         Nav, search overlay, page header band
    │                         fenb-hero.css        Hero section and animations
    │                         fenb-events.css      Event cards, tags, calendar page
    │                         fenb-news.css        News cards, article layout, 404 page
    │                         fenb-clubs.css       Clubs page, programs quick-links
    │                         fenb-about.css       About page, policies page
    │                         fenb-hof.css         Hall of Fame landing table + inductee profile
    │                         fenb-schedule.css    Season schedule page
    │                         fenb-join.css        Join & Register section
    │                         fenb-programs.css    Programs & Development section
    │                         fenb-responsive.css  All breakpoints and print styles (loaded last)
    ├── config/
    │   ├── development/hugo.toml   baseURL for local dev (ejamer.github.io/hugo-testing)
    │   └── production/hugo.toml    baseURL for production (fenb.ca)
    ├── content/            Bilingual content files: _index.md + _index.fr.md per section,
    │   │                   slug.en.md + slug.fr.md per article/page
    │   ├── _index.md / _index.fr.md    Homepage
    │   ├── about/          About section, policies-and-reports page, policies/ sub-pages,
    │   │                   hall-of-fame/ (inductee bilingual pairs)
    │   ├── clubs/          Clubs list page (content from data/clubs.yaml)
    │   ├── events/         Events section index + schedule.en.md / schedule.fr.md
    │   ├── join/           Join landing page + membership, clubs, volunteer sub-pages
    │   ├── news/           News section index + year subfolders (news/2026/, etc.)
    │   └── programs/       Programs landing + armourer, athlete, canada-games-2027,
    │                         coach, referee, secretariat sub-pages
    ├── data/               YAML files that drive page content — each maps to a specific page or feature:
    │   ├── board_members.yaml      Board of directors grid on /about/
    │   ├── hof_categories.yaml     Canonical Hall of Fame category IDs (drives filter dropdown + CSS badge classes)
    │   ├── clubs.yaml              Member club cards on /clubs/
    │   ├── coach_pathways.yaml     CFF coach certification pathway cards on /programs/coach-training/
    │   ├── event_categories.yaml   Canonical category IDs for calendar legend and schedule filters
    │   ├── events.yaml             Current season event list (homepage + /events/)
    │   ├── events_archive/         Past seasons (picked up automatically by /events/schedule/)
    │   ├── hero_slides.yaml        Homepage hero carousel images
    │   ├── join.yaml               Seasonal portal URLs for the Join section (2MEV, club form)
    │   ├── join_paths.yaml         Path cards on the Join landing page
    │   ├── policies.yaml           Policy and report documents on /about/policies-and-reports/
    │   ├── program_cards.yaml      Path cards on the Programs landing page
    │   └── quick_links.yaml        Quick-link cards on the homepage
    ├── i18n/
    │   ├── en.yaml         English UI strings
    │   └── fr.yaml         French UI strings
    ├── layouts/
    │   ├── 404.html        Custom 404 page
    │   ├── index.html      Homepage (hero, events, news, programs)
    │   ├── _default/
    │   │   └── sitemap.xml Custom sitemap with hreflang alternates
    │   ├── about/          list.html (About), single.html (Policies & Reports),
    │   │                   policies/single.html (individual policy page),
    │   │                   hall-of-fame/list.html (inductee table), hall-of-fame/single.html (profile)
    │   ├── clubs/          list.html (club grid + map)
    │   ├── events/         list.html (JS calendar), schedule.html (filterable list)
    │   ├── join/           list.html, membership.html, clubs.html, volunteer.html
    │   ├── news/           list.html, single.html, rss.xml
    │   ├── programs/       list.html + one layout per sub-page
    │   └── partials/       Shared template components:
    │                         back-link.html        Back-navigation link
    │                         clubs-benefits.html   Three-card benefits grid (clubs + join/clubs)
    │                         event-card.html       Single event card (YAML event object as context)
    │                         event-date.html       Return-value partial — bilingual date display
    │                         head-additions.html   Custom <head> additions (Analytics, etc.)
    │                         icon.html             Inline SVG renderer
    │                         nav.html              Sticky nav, language switcher, search, theme toggle
    │                         news-card.html        Single news card
    │                         page-header.html      Coloured band below the nav (title + subtitle)
    │                         section-header.html   Section label + h2 + "see all" link
    │                         site-announcement.html  Site-wide banner (controlled via hugo.toml)
    │                         site-favicon.html     SVG + PNG favicon link tags
                        site-footer.html      Site footer
    │                         site-header.html      Entry point — delegates to nav.html + page-header.html
    └── static/
        ├── documents/      PDFs served at /documents/ — subfolders: about/agm-minutes/,
        │                   about/governance/, canada-games/, programs/coach-training/ (CFF pathway PDFs)
        ├── images/         Site images — subfolders: canada-games/, clubs/, coach-pathways/ (CFF pathway
        │                   diagram PNGs, EN/FR), hall-of-fame/, hero/, svg/
        ├── js/             Client-side scripts:
        │                     coach-pathways.js    Pathway diagram modal on /programs/coach-training/
        │                     events-calendar.js   JS month grid for the events calendar
        │                     events-schedule.js   Season toggle + category filters for schedule page
        │                     hero-slider.js       Homepage hero carousel
        │                     hof-table.js         Sort + category-filter dropdown for the Hall of Fame table
        │                     results-table.js     Sortable results table in news articles
        ├── sitemap.xsl     XSLT stylesheet for language sitemaps — makes /en/ and /fr/ sitemaps
        │                   render as styled HTML in browsers (referenced via PI in sitemap.xml)
        └── version.json    Build version metadata — managed by /fenb-git-release, do not edit
```
