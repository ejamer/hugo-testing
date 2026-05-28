# Project layout

The repo root holds documentation and scripts; all Hugo source lives under `fenb-1/`. Content is split into EN/FR file pairs throughout, and structured data (events, clubs, board members) lives in `fenb-1/data/` as YAML rather than in content files.

```
hugo-testing/
├── CLAUDE.md              Process instructions for Claude
├── DEVELOPMENT.md         Branch strategy and build commands
├── STYLE_GUIDE.md         Brand, CSS, and content conventions
├── TODO.md                Outstanding items — keep current
├── plans/                 Design decisions and deferred plans
├── README.md              This file
├── scripts/               Utility scripts (see Scripts section below)
│   ├── fencingtimelive-results.py   Fetch tournament results and find NB fencers
│   ├── output/            Generated JSON output — gitignored, not committed
│   └── .browser-profile/  Saved Chrome session for fencingtimelive.com login — gitignored
└── fenb-1/                Hugo site root
    ├── hugo.toml           Site config, languages, nav menus (no baseURL — set per environment)
    ├── config/
    │   ├── development/hugo.toml   baseURL for local dev (ejamer.github.io/hugo-testing)
    │   └── production/hugo.toml    baseURL for production (fenb.ca)
    ├── assets/
    │   └── ananke/css/
    │       ├── fenb-base.css       Variables, reset, shared utilities, buttons, back-link, callout, cta-banner, landing-cards
    │       ├── fenb-nav.css        Nav, search overlay, page header band
    │       ├── fenb-hero.css       Hero section and animations
    │       ├── fenb-events.css     Event cards, tags, calendar page
    │       ├── fenb-news.css       News cards, article layout, 404 page
    │       ├── fenb-clubs.css      Programs quick-links, clubs page
    │       ├── fenb-about.css      About page, policies page
    │       ├── fenb-schedule.css   Season schedule page
    │       ├── fenb-join.css       Join & Register section (landing, membership, clubs, volunteer)
    │       ├── fenb-programs.css   Programs & Development section (landing, 6 sub-pages)
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
    │   ├── join/
    │   │   ├── _index.md           Join landing page (EN)
    │   │   ├── _index.fr.md        Join landing page (FR)
    │   │   ├── membership.en.md    Individual membership (EN) — layout: membership
    │   │   ├── membership.fr.md    Individual membership (FR) — layout: membership
    │   │   ├── clubs.en.md         Club registration (EN) — layout: clubs
    │   │   ├── clubs.fr.md         Club registration (FR) — layout: clubs
    │   │   ├── volunteer.en.md     Volunteer (EN) — layout: volunteer
    │   │   └── volunteer.fr.md     Volunteer (FR) — layout: volunteer
    │   ├── programs/
    │   │   ├── _index.md                      Programs landing page (EN)
    │   │   ├── _index.fr.md                   Programs landing page (FR)
    │   │   ├── athlete-development.en.md       Athlete Development / LTAD (EN) — layout: athlete-development
    │   │   ├── athlete-development.fr.md       Athlete Development / LTAD (FR) — layout: athlete-development
    │   │   ├── coach-training.en.md            Coach Training & Certification (EN) — layout: coach-training
    │   │   ├── coach-training.fr.md            Coach Training & Certification (FR) — layout: coach-training
    │   │   ├── canada-winter-games.en.md       Canada Winter Games 2027 (EN) — layout: canada-winter-games
    │   │   ├── canada-winter-games.fr.md       Canada Winter Games 2027 (FR) — layout: canada-winter-games
    │   │   ├── referee-development.en.md       Referee Development (EN) — layout: referee-development
    │   │   ├── referee-development.fr.md       Referee Development (FR) — layout: referee-development
    │   │   ├── secretariat-development.en.md   Secretariat Development (EN) — layout: secretariat-development
    │   │   ├── secretariat-development.fr.md   Secretariat Development (FR) — layout: secretariat-development
    │   │   ├── armourer-development.en.md      Armourer Development (EN) — layout: armourer-development
    │   │   └── armourer-development.fr.md      Armourer Development (FR) — layout: armourer-development
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
    │   ├── events.yaml             Current season's event calendar (drives homepage + /events/)
    │   ├── events_archive/         Past seasons — moved here at season rollover (see plans/)
    │   ├── event_categories.yaml   Canonical category IDs — drives calendar legend and schedule filters
    │   ├── clubs.yaml              Member club data (drives /clubs/ page)
    │   ├── board_members.yaml      Board of directors and affiliations (drives /about/)
    │   ├── program_cards.yaml      Programs landing page cards
    │   ├── quick_links.yaml        Homepage quick-link cards
    │   ├── join_paths.yaml         Join landing page cards
    │   ├── join.yaml               Join section seasonal URLs (2MEV portal, club form)
    │   ├── policies.yaml           Policy documents, strategic plan, annual reports (drives /about/policies-and-reports/)
    │   └── hero_slides.yaml        Hero carousel image list (drives homepage slider)
    ├── archetypes/
    │   ├── default.md      Default front matter template (YAML; title auto-generated from filename)
    │   └── news.md         News article template (adds category and summary fields)
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
    │   ├── join/
    │   │   ├── list.html        Join landing page (three path cards)
    │   │   ├── membership.html  Individual membership (2MEV CTA, type cards, steps)
    │   │   ├── clubs.html       Club registration (requirements, benefits, form CTA)
    │   │   └── volunteer.html   Volunteer opportunities (role groups, apply CTA)
    │   ├── programs/
    │   │   ├── list.html                    Programs landing page (six path cards)
    │   │   ├── athlete-development.html     LTAD overview, ten key factors, armband program
    │   │   ├── coach-training.html          Three coaching streams (community, instructional, competition)
    │   │   ├── canada-winter-games.html     CWG 2027 selection program, documents, rankings, funding
    │   │   ├── referee-development.html     Club and provincial referee certification levels
    │   │   ├── secretariat-development.html Secretariat roles and responsibilities
    │   │   └── armourer-development.html    Armourer responsibilities (pre-comp, during, safety, club)
    │   ├── events/
    │   │   ├── list.html     Events calendar (JS month grid + category legend sidebar)
    │   │   └── schedule.html Season schedule (server-rendered list + filter sidebar)
    │   ├── _default/
    │   │   └── sitemap.xml Pretty-printed per-language sitemap (urlset + xhtml hreflang alternates); overrides Hugo built-in to add newlines so browsers render it correctly
    │   ├── news/
    │   │   ├── list.html   News index (card grid, paginates recursively across year folders)
    │   │   └── single.html News article (2-col: article | recent-news sidebar)
    │   └── partials/
    │       ├── site-announcement.html  Site-wide announcement banner — controlled via [params.announcement] in hugo.toml
    │       ├── site-header.html  Entry point called by Ananke — delegates to nav.html and page-header.html
    │       ├── nav.html          Sticky nav, search overlay, language switcher, hamburger, theme toggle
    │       ├── page-header.html  Coloured band below the nav (title + optional subtitle; absent on homepage)
    │       ├── back-link.html    Shared back-navigation link — call with (dict "url" "section/" "key" "i18n_key")
    │       ├── clubs-benefits.html  Three-card club benefits grid (shared between clubs/list and join/clubs)
    │       ├── event-card.html   Single event card — accepts a YAML event object as context
    │       ├── icon.html         Inline SVG renderer — call with (dict "name" "file.svg" "w" 24 "h" 24 "class" "…")
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
        │   ├── hero/             Hero carousel images (hero1.jpg … heroN.jpg)
        │   └── svg/              Decorative icon SVGs — viewBox only, aria-hidden, rendered via icon.html partial
        └── js/
            ├── hero-slider.js       Homepage hero carousel (auto-advance + prev/next)
            ├── events-calendar.js   Events calendar page (JS month grid)
            ├── events-schedule.js   Season schedule page (season toggle + category filters)
            └── results-table.js     Results news articles — sortable columns, hidden Place column, "Show placements" toggle
```
