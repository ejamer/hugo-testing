# Style Guide

## Brand

### Colours
- **Primary:** `#006156` (deep teal) — CSS var `--teal` — nav, headings, buttons, section accents
- **Accent:** `#79242f` (crimson) — CSS var `--crimson` — CTA buttons, hero badge, event category badges

### Logos
- `static/images/fenb-logo` — folder contains the FENB-Logo-Standards.html guidelines, and subfolders with different official logo files
- `FENB-Logo-Landscape-FullColour` — full landscape logo for light backgrounds; used in desktop nav (`fenb-nav-logo--color`)
- `FENB-Logo-Landscape-White` — full landscape logo for dark/teal backgrounds; used in desktop dark-mode nav (`fenb-nav-logo--white`)
- `FENB-Logo-Small-FullColor` — compact mark for light backgrounds; used in mobile nav at ≤860px (`fenb-nav-logo--small-color`)
- `FENB-Logo-Small-White` — compact mark for dark mode; used in mobile dark-mode nav at ≤860px (`fenb-nav-logo--small-white`)
 

### Fonts
Avenir, Nunito Sans, system-ui

---

## CSS

Styles are split across nine files in `fenb-1/assets/ananke/css/`, each scoped to one concern. Ananke's `resources.Concat` pipeline merges and minifies them into a single output at build time — no extra HTTP requests.

| File | Scope |
|---|---|
| `fenb-base.css` | `:root` variables, reset, shared section/container utilities, buttons, Ananke override |
| `fenb-nav.css` | Nav, search overlay, language switcher, page header band |
| `fenb-hero.css` | Homepage hero, slider, scroll arrow, animations |
| `fenb-events.css` | Event cards, tags, calendar page |
| `fenb-news.css` | News cards, article layout, article sidebar, results tables, 404 page |
| `fenb-clubs.css` | Programs quick-links, clubs grid/map/CTA |
| `fenb-about.css` | About page, policies page |
| `fenb-hof.css` | Hall of Fame landing table and inductee profile pages |
| `fenb-schedule.css` | Season schedule page |
| `fenb-join.css` | Join & Register section (landing page, membership, club registration, volunteer) |
| `fenb-responsive.css` | All `@media` breakpoints and print query — loaded last |

The load order is declared in `hugo.toml` under `params.ananke.custom_css`. Files must live in `fenb-1/assets/ananke/css/` — **not** `fenb-1/static/css/` — so Ananke's pipeline picks them up for concatenation, minification, and (in production) fingerprinting. A file placed in `static/` would be served separately, uncached, and unminified.

- No inline styles for anything reusable — add a class to the appropriate file instead
- Use CSS custom properties defined at `:root` rather than raw hex values: `--teal`, `--crimson`, `--shadow-sm`, `--radius`, category colours (`--cat-announcement`, `--cat-training`, `--cat-national`, `--cat-meeting` and their `--cat-*-pale` variants), brand colour channels for `rgba()` (`--teal-rgb`, `--crimson-rgb`)

### Container width modifiers

`.fenb-container` defaults to `max-width: 1200px`. Use these modifier classes when a section needs a narrower width — add them directly to the `<div class="fenb-container …">` element rather than writing a new descendant selector override.

| Class | Max-width | Used by |
|---|---|---|
| `.fenb-container--narrow` | 1100px | Events calendar, board, about overview, policies |
| `.fenb-container--tight` | 900px | Contact page |
| `.fenb-container--sched` | 1000px | Season schedule |

### Hero breakout

Elements wider than `.fenb-hero-content` (max-width ~760px) use a negative-margin breakout to span the full viewport while surrounding text stays at normal width:

```css
width: Xvw;
margin: 0 calc((100% - Xvw) / 2);
```

### Two-column sidebar layout

Several pages use a main-content + right-sidebar layout. **The sidebar always goes on the right** — HTML order should be main content first, then `<aside>`, and the CSS grid column order should be `1fr <sidebar-width>`.

#### Functional sidebars (controls/filters)

Used on Events calendar and Season schedule. These contain active UI controls and use a teal-bordered style.

| Page | Wrapper | Main column | Sidebar | Sidebar width |
|---|---|---|---|---|
| Events calendar | `.fenb-cal-layout` | `.fenb-cal-main` | `.fenb-cal-legend` | 185px |
| Season schedule | `.fenb-schedule-layout` | `.fenb-schedule-main` | `.fenb-schedule-sidebar` | 200px |

```css
border: 1px solid var(--teal);
border-radius: var(--radius);
padding: 1rem 1.25rem;
background: var(--off-white);
```

**Responsive:** controls sidebars (schedule, calendar) hide (`display: none`) at ≤720px when the layout collapses to a single column. Informational sidebars also hide at their page's single-column breakpoint. Neither type stacks below the main content on narrow screens.

#### Informational sidebars (links/metadata)

Used on About, Policies & Reports, individual policy pages, Canada Winter Games, and news articles. These display supplementary links or metadata.

Reference style — `fenb-about-sidebar-card` (defined in `fenb-about.css`):
```css
background: var(--off-white);
border: 1px solid var(--light-gray);
border-radius: var(--radius-sm);
padding: 1.5rem;
```
Heading (`h3`): `font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--teal); margin: 0 0 0.75rem`.

Use `.fenb-about-sidebar-card` directly when possible. When the sidebar needs its own layout wrapper (sticky positioning, specific column width), define page-specific layout CSS but style the card to match this reference. Dark mode: heading and links use `var(--teal-light)`.

**Responsive:** sidebar hides (`display: none`) at the page's single-column breakpoint — it does not stack below the main content.

---

## Nav dropdown menus

A top-level nav item can show a hover dropdown listing its sub-pages. The template (`layouts/partials/nav.html`) already handles any item whose Hugo menu entry has children — no template changes are needed to add a new dropdown.

**To add a dropdown to a top-level nav item:**

1. Add `identifier = "slug"` to the parent entry in `hugo.toml` (both EN and FR blocks).
2. Add child entries with `parent = "slug"` pointing to the sub-page URLs. Use `weight` to control order.

```toml
[[languages.en.menus.main]]
  name   = "Programs"
  url    = "programs/"
  weight = 3
  identifier = "programs"

[[languages.en.menus.main]]
  name   = "Athlete Development (LTAD)"
  url    = "programs/athlete-development/"
  weight = 1
  parent = "programs"
```

The template renders the chevron, dropdown panel, and hover/focus behaviour automatically via the `fenb-nav-has-dropdown` / `fenb-nav-dropdown` CSS classes in `fenb-nav.css`.

**CSS rules to keep in mind:**
- `.fenb-nav-links > ul` and `.fenb-nav-links > ul > li:last-child` use direct-child selectors deliberately — this prevents the crimson Join pill and the flex layout from bleeding into nested dropdown `<ul>` elements. Any new nav list rules must also use `> ul` rather than the bare descendant selector `ul`.
- The dropdown `min-width` is currently `260px` — increase it if you add items with long translated labels.
- On mobile (≤ 860px), dropdown items are always visible as indented sub-items inside the open hamburger menu.

---

## Shared UI components

Before adding any new visual element, check whether one of these existing shared components already fits. Creating one-off versions fragments the visual language. If the component almost fits, add a CSS modifier class rather than a new component.

### `fenb-cta-banner` — call-to-action banner

A teal background banner with text on the left and a button on the right. Defined in `fenb-base.css`.

**Required structure — all four parts must be present:**
```html
<div class="fenb-cta-banner">
  <div class="fenb-cta-banner-body">
    <p class="fenb-section-label">{{ i18n "section_label_key" }}</p>
    <h3 class="fenb-cta-banner-heading">{{ i18n "heading_key" }}</h3>
    <p>{{ i18n "body_text_key" }}</p>
  </div>
  <div class="fenb-cta-banner-action">
    <a href="…" class="fenb-btn fenb-btn-white">{{ i18n "button_label_key" }}</a>
    <!-- optional: <p class="fenb-cta-banner-note">…</p> -->
  </div>
</div>
```

The `fenb-cta-banner-heading` class sets `font-size: 1.25rem` — do not use `fenb-section-title` inside a banner (it's too large at `clamp(1.6rem, 3.5vw, 2.1rem)`). The button is always `fenb-btn fenb-btn-white` on the teal background. Omitting the label, heading, or action wrapper produces visual inconsistency.

### `fenb-callout` — note block

A left-border block for supplementary notes, caveats, or explanatory asides. Defined in `fenb-base.css`.

```html
<div class="fenb-callout">Supplementary note text.</div>
```

Modifier `--quote` for pull-quotes and mission statements:
```html
<blockquote class="fenb-callout fenb-callout--quote">…</blockquote>
```

**Use for:** rules, caveats, important asides — content the reader needs but that sits outside the main flow.

**Do not use for:** navigation sentences (inline text + link is correct), promotional links, or anything that is just a styled box for visual interest.

### `fenb-landing-card` — nav/path card grid

A grid of clickable cards linking to sub-pages. Defined in `fenb-base.css`. Used on the About, Join, and Programs landing pages.

```html
<div class="fenb-landing-cards">
  <a href="…" class="fenb-landing-card">
    <div class="fenb-landing-card-icon">…</div>  <!-- or --pill variant for logo badges -->
    <h2>Card title</h2>
    <p>Card description</p>
    <span class="fenb-landing-card-cta">Label →</span>
  </a>
</div>
```

### Button variants (`fenb-btn-*`)

All buttons share `fenb-btn` as the base class. Always pair with a variant modifier.

| Modifier | Appearance | Use on |
|---|---|---|
| `fenb-btn-teal` | Teal bg, white text | Light/white backgrounds |
| `fenb-btn-crimson` | Crimson bg, white text | High-emphasis CTAs |
| `fenb-btn-white` | White bg, teal text | Teal/coloured backgrounds (e.g. inside `fenb-cta-banner`) |
| `fenb-btn-outline` | Transparent bg, white border | Hero section or dark backgrounds |

### `back-link.html` partial — back-navigation link

Use this partial for all back-navigation links. Never add a new page-specific back-link style.

```html
{{ partial "back-link.html" (dict "url" "section/" "key" "i18n_back_key") }}
```

Place it at the top of the page, above all content, outside any grid or two-column layout wrapper.

### `fenb-article-event-logo` — event logo in a news article

Use this class on the Hugo `figure` shortcode to display a centred event logo at the top of a news article body. It caps the image at 220 px wide, centres it, adds rounded corners, and applies a drop shadow in dark mode so white-background logos don't look jarring.

```markdown
{{</* figure src="/images/event-logos/ecg.png" alt="East Coast Games 2026" class="fenb-article-event-logo" */>}}
```

The `class` attribute applies to the `<figure>` element; CSS targets `figure.fenb-article-event-logo img`.

### Article image lightbox — zoom-in viewer for news article images

All `<img>` elements inside `.fenb-article-body` and `.fenb-article-event-logo` get an automatic zoom-in lightbox on click. No markup changes are needed in the article. Behaviour: click the image → full-screen dark overlay showing the image at up to 90vw/90vh. Close via `×`, click outside the image, or Escape.

CSS lives in `fenb-news.css` (`.fenb-lightbox`, `.fenb-lightbox--open`, `.fenb-lightbox-img`, `.fenb-lightbox-close`). JS lives in `static/js/lightbox.js`, loaded via the `{{ block "scripts" }}` slot in `baseof.html`.

Currently enabled only on `layouts/news/single.html`:

```go
{{ define "scripts" }}
<script src="{{ "js/lightbox.js" | absURL }}" defer></script>
{{ end }}
```

To enable on another layout, add the same `{{ define "scripts" }}` block — do not copy the CSS, it is already in the compiled stylesheet.

### Pathway diagram modal — `/programs/coach-training/` only

A centred modal dialog showing a full-size CFF pathway diagram with a title and close button, opened by a trigger button on the page. Defined in `fenb-programs.css` and `static/js/coach-pathways.js`, scoped exclusively to `/programs/coach-training/`. **This is not the general image lightbox** — for zooming article images use the article image lightbox above.

**Trigger button** — anywhere on the page:
```html
<button type="button" class="fenb-btn fenb-btn-teal"
  data-pathway-modal-open
  data-image="{{ $image | relURL }}"
  data-title="{{ $title }}"
  data-alt="{{ i18n "..._diagram_alt" (dict "Title" $title) }}">
  {{ i18n "..._learn_more" }}
</button>
```

**Modal markup** — once per page, after the closing `</section>`:
```html
<div class="fenb-pathway-modal" id="fenb-pathway-modal" hidden>
  <div class="fenb-pathway-modal-backdrop" data-pathway-modal-close></div>
  <div class="fenb-pathway-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="fenb-pathway-modal-title">
    <button type="button" class="fenb-pathway-modal-close" data-pathway-modal-close aria-label="{{ i18n "..._modal_close" }}">
      {{ partial "icon.html" (dict "name" "close.svg" "w" 16 "h" 16) }}
    </button>
    <h2 id="fenb-pathway-modal-title" class="fenb-pathway-modal-title"></h2>
    <img class="fenb-pathway-modal-image" src="" alt="">
  </div>
</div>
<script src="{{ "js/coach-pathways.js" | absURL }}" defer></script>
```

The script reads `data-image` / `data-title` / `data-alt` from the clicked trigger into the modal, and closes on close-button click, backdrop click, or `Escape` — restoring focus to the trigger element on close.

---

## Dark mode

The toggle sets `data-theme="dark"` on `<html>`; a `[data-theme="dark"]` block in `fenb-base.css` overrides the semantic background, text, shadow, and pale-tint variables. Brand colours (`--teal`, `--crimson`, `--navy`) are unchanged, but two behave differently enough to note:

- **`--teal-light`** resolves to `#4dbfad` in dark mode (~7.7:1 on dark bg). **Use it instead of `var(--teal)` for any teal text or border in a `[data-theme="dark"]` rule** — `var(--teal)` (#006156) is ~2.5:1 and fails contrast.
- **`--teal-pale`** resolves to `#1e3632` — a dark hover background, not a visible tint.
- **`--navy-light`** resolves to `#6aabdf` in dark mode. **Use it instead of `var(--navy)` for any navy text or border in a `[data-theme="dark"]` rule** — `var(--navy)` (#1e3a5f) is near-black on the dark background and fails contrast.

**Badge/pill swap:** light mode uses pale-tint bg + brand-colour text. In dark mode the pale tints are near-black, so invert to full brand-colour bg + `#fff` text (`var(--teal)` bg + white = ~7.5:1 ✓). **Exception — count/indicator badges** (e.g. `fenb-hof-filter-badge`) where `var(--teal)` itself is the light-mode background: `var(--teal)` (#006156) is too dark on a dark surface for white text to pass contrast. Use hardcoded hex values instead of CSS variables in the dark-mode rule — `--teal-pale` and similar variables are themselves remapped in dark mode and cannot be relied on to stay light. Confirmed values: `background: #e6f2f0; color: #004840`.

**Hardcoded values to watch:** semi-transparent darks (`rgba(0,0,0,0.05)` borders) become invisible on dark surfaces — use `var(--light-gray)` instead. Tachyons utility classes like `bg-near-white` hardcode a hex value that ignores CSS variables; override them explicitly in `[data-theme="dark"]`. Conversely, use `#fff` (not `var(--white)`) for text on coloured backgrounds — `--white` remaps to `#141f1d` in dark mode, so `color: var(--white)` on a teal button silently produces dark text.

**Rule location:** add `[data-theme="dark"]` overrides at the bottom of the same CSS file as the component, not in a separate file.

---

## Event link types

Three link types appear on event cards and schedule rows. Each has a specific CSS class — always use it so colours stay consistent across card, schedule, and print contexts:

| Link | Class | Screen colour | Dark mode |
|---|---|---|---|
| Learn More → | `fenb-event-details-link` | `--teal` | `--teal-light` |
| Register Now → | `fenb-event-register-link` | `--crimson` | `--text-body` |
| View Results → | `fenb-event-results-link` | `--navy` | `--navy-light` |

`Register Now` is suppressed for past events (date < today). `View Results` shows regardless of date when `results_url_en` is set.

Any layout that renders event links (card partial, schedule list, future widgets) must use these classes — **not** a plain `<a>` with a local colour rule — so that print and dark-mode overrides apply automatically.

---

## i18n — UI text

Never hardcode display text in a layout. Add keys to **both** `i18n/en.yaml` and `i18n/fr.yaml`. Use `{{ i18n "key" }}` in templates. For strings with dynamic values: `{{ i18n "key" (dict "Var" value) }}` with `{{ .Var }}` in the YAML value.

### Language-switcher labels

When rendering an "also available in [language]" link, the label text must be in the **target language** (the one you're switching *to*), not the current page's language. Achieve this by storing the label in the *opposite* language's i18n file:

```yaml
# en.yaml — shown on EN pages, so write it in French
policies_also_in: "Aussi disponible en"

# fr.yaml — shown on FR pages, so write it in English
policies_also_in: "Also available in"
```

The language name itself (`.Language.Label`) comes from the translation page and is already correct — only the surrounding label text needs this treatment.

---

## Per-page layouts within a section

When pages in a section share a section index (`_index.md`) but need **different HTML structures** from each other — not just different content — use the `layout:` front matter field rather than a shared `single.html`:

```yaml
# content/join/membership.en.md
layout: membership
```

Hugo resolves this to `layouts/{section}/{layout}.html` (e.g. `layouts/join/membership.html`). The join section uses this pattern because each sub-page (membership registration, club registration, volunteer) has a structurally distinct layout.

Use a shared `single.html` when pages differ only in data. Use `layout:` when the HTML structure itself differs enough that a shared template would need complex conditionals.

---

## Bilingual content

Every content page needs both an English and French file so the language switcher links directly to the translated page rather than falling back to the home page.

- Section index files: `_index.md` (EN) + `_index.fr.md` (FR)
- Article files: `{name}.en.md` (EN) + `{name}.fr.md` (FR)

To show a subtitle in the page header band, set `description:` in the front matter — the partial reads it automatically. Use `hide_page_header: true` only when the layout renders its own header with dynamic content (e.g. the clubs page, which computes a live club count).

---

## News article naming

Files go inside a year subfolder: `content/news/{year}/{mon}-{dd}-{title}.{lang}.md`

- `{mon}` — 3-letter lowercase month (`jan`–`dec`)
- `{dd}` — zero-padded day
- `{title}` — short kebab-case slug; omit the year (the folder provides it) — **exception:** for recurring annual events, include the year to prevent cross-season collisions (e.g. `east-coast-games-2026-registration`)
- `{lang}` — `en` or `fr`, separated by a **dot** — Hugo uses `.en.md` / `.fr.md` to link translations automatically; a dash (`-en.md`) breaks that link

Example:
```
content/news/2026/apr-05-provincial-results.en.md
content/news/2026/apr-05-provincial-results.fr.md
```

When the first article of a new calendar year arrives, create the year subfolder with `_index.md` + `_index.fr.md` (copy from the previous year folder).

---

## News category colours

News articles use the same category IDs as events. The badge label is looked up via i18n; never put a display string in the front matter.

| `category` | Badge EN | Badge FR | CSS variable | Colour |
|---|---|---|---|---|
| `competition` | Competition | Compétition | `--teal` | Teal |
| `national` | National Event | Événement national | `--crimson` | Crimson |
| `provincial` | NB Provincial | Provincial NB | `--crimson` | Crimson |
| `training` | Training Camp | Camp d'entraînement | `--cat-training` | Yellow |
| `announcement` | Announcement | Annonce | `--cat-announcement` | Blue |
| `meeting` | FENB Meeting | Réunion FENB | `--cat-meeting` | Grey |

**Typical mappings when writing news articles:**
- Results from a national championship → `national`
- Results from the NB Provincial Championship → `provincial`
- Results from a non-NB / open competition → `competition`
- Registration or announcement for a competition → `competition`
- Registration or announcement for a training camp / summer camp / clinic → `training`
- General announcements → `announcement`

**Results table JS:** Add `results_table: true` to the front matter to load `results-table.js`, which adds sortable columns to markdown tables in the article body. This is decoupled from category so it can be used with any category. Add `results_hide_placements: true` to also hide the last column (placement) behind a toggle — omit it when placements should always be visible.

---

## Event category colours

Each category drives three visual elements: the date badge on the event card, the tag pill, and the calendar bar on the month grid.

| `category` | CSS variable | Colour |
|---|---|---|
| `competition` | `--teal` | Teal |
| `training` | `--cat-training` | Yellow |
| `national` | `--crimson` | Crimson |
| `provincial` | `--crimson` | Crimson |
| `meeting` | `--cat-meeting` | Grey |
| `announcement` | `--cat-announcement` | Blue |

`category` is the canonical ID and CSS hook — must match exactly (lowercase, no spaces) and must be listed in `data/event_categories.yaml` (which drives the calendar legend and schedule filter buttons). Display labels are looked up from `i18n/en.yaml` and `i18n/fr.yaml` automatically; the raw category key is shown as a fallback. Each non-brand category also has a `--cat-*-pale` variant used for tag backgrounds.

To add a new category: add the ID to `data/event_categories.yaml`, add i18n keys to `en.yaml` and `fr.yaml`, and add CSS colour rules for `fenb-cal-bar--{id}`, `fenb-tag--{id}`, and their dark-mode and pale variants in `fenb-events.css`.

---

## Results tables (news articles)

Results news articles (`category: results`) use an enhanced table pattern driven by `static/js/results-table.js`, which is loaded automatically by `layouts/news/single.html` when `category` equals `results`.

**Column order:** always `Name | Club | Place` — Place must be the last column so the JS can target it by index.

**Medal emoji:** add 🥇 🥈 🥉 before the fencer name in the Name cell for places 1–3 (e.g. `🥇 YANO Wendy`). Use the plain name for all other places.

**In-progress rows:** use `—` in the Place cell when results are not yet posted.

**JS behaviour (automatic — no extra markup needed):**
- Hides the Place column by default and inserts a "Show placements" / "Afficher les positions" toggle button above each table.
- Default sort is ascending by Place (best results first) so the table is meaningful without placements visible.
- All visible column headers are clickable to re-sort; `aria-sort` is updated for accessibility.
- Button labels are bilingual, detected from `html[lang]`.

**CSS classes** (applied by JS, not the markdown author):
- `.fenb-results-table` — table-level: `border-collapse`, padding, hover row
- `.fenb-sortable-th` — header: pointer cursor, `↕ / ↑ / ↓` indicator
- `.fenb-results-toggle` — toggle button: right-aligned above the table

---

## Page header band

`site-header.html` renders a coloured `.fenb-page-header` band below the nav for all non-home pages. By default it shows the page's own `.Title`.

**Show the section title on single pages** — useful when every article in a section should show the section name (e.g. "News & Results") rather than its own title. Add this cascade to the section's `_index.md` and `_index.fr.md`:

```yaml
cascade:
  - target:
      kind: page
    page_header_uses_section: true
```

`site-header.html` checks `.Params.page_header_uses_section` and substitutes `.CurrentSection.Title` / `.CurrentSection.Params.description`. The `target: kind: page` scoping leaves the section list page unaffected.

**Add a subtitle** — set `description:` in the section's `_index.md` / `_index.fr.md` front matter. The partial renders it automatically as the subtitle below the title.

**Suppress the band** — only needed when a layout renders its own header with dynamic content. Set `hide_page_header: true` in the section's `_index.md` front matter and add an explicit `<header class="fenb-page-header">` block in the layout. Do not use this just to add a static subtitle — use `description:` instead.

---

## Icon system

All decorative SVG icons live in `fenb-1/static/images/svg/` as individual files. Icons use `viewBox` only — no `width` or `height` attributes — and include `aria-hidden="true"`. Size is always set at the callsite.

### Rendering icons in templates

Use the `icon.html` partial when you need to control size or inject a CSS class:

```html
{{ partial "icon.html" (dict "name" "map-pin.svg" "w" 13 "h" 13) }}
{{ partial "icon.html" (dict "name" "sun.svg" "w" 21 "h" 21 "class" "fenb-theme-icon fenb-theme-icon--sun") }}
```

For data-file-driven loops where the icon filename comes from YAML, pass the size in the template (the template knows its own layout context):

```html
{{ range hugo.Data.club_benefits.club_benefits }}
  {{ partial "icon.html" (dict "name" .icon "w" 28 "h" 28) }}
{{ end }}
```

For simple one-off uses where no size or class override is needed, `readFile` is fine:

```html
{{ readFile (printf "static/images/svg/%s" .icon) | safeHTML }}
```

### Adding a new icon

1. Drop the `.svg` file in `fenb-1/static/images/svg/`.
2. Strip any `width`/`height` attributes — keep `viewBox` only.
3. Add `aria-hidden="true"` to the `<svg>` tag.
4. Reference it by filename via the partial or `readFile`.

### Data files that reference icons

| Data file | Used by | Icon field |
|---|---|---|
| `data/quicklinks.yaml` | `layouts/index.html` | `icon` |
| `data/joinpaths.yaml` | `layouts/join/list.html` | `icon` |
| `data/programcards.yaml` | `layouts/programs/list.html` | `icon` (SVG) or `img` (raster) |

---

## Layout-driven section pages

If a section's `_index.md` body is never rendered (the layout uses i18n strings or `hugo.Data` exclusively and never calls `.Content`), add an HTML comment naming the actual content source:

```markdown
---
title: "..."
---

<!-- Page content is not read from this file. Edit in data/clubs.yaml. -->
```

HTML comments in the body are never output — they exist only for editors who open the file expecting editable content.

---

## Template patterns

### Return-value partials for computed display strings

When display text must be computed from data (e.g. a bilingual date from `start_date` + `end_date`), extract the logic into a return-value partial:

```go
{{- return $computedString -}}
```

Called as: `{{ partial "event-date.html" . }}`

This keeps the logic in one file regardless of how many templates render the same thing. `layouts/partials/event-date.html` is the established example.

### Filterable list pages — SSR + JS visibility pattern

For filterable lists (e.g. `/events/schedule/`), prefer SSR + JS visibility toggling over JS-only rendering: Hugo renders every item with `data-*` HTML attributes; JS shows/hides them in response to filter controls. This gives a no-JS fallback and print support for free. `static/js/events-schedule.js` is the established example.

---

## 404 page

Hugo generates one root `404.html` (English). A small inline script detects when the URL starts with `/fr/` and swaps: page text, nav link labels (from Hugo's French menu baked in at build time), nav link hrefs, logo href, and the language-switcher button. If French strings in `i18n/fr.yaml` change, update the hardcoded strings in `layouts/404.html` to match.
