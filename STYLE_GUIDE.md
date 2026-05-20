# Style Guide

## Brand

### Colours
- **Primary:** `#006156` (deep teal) — CSS var `--teal` — nav, headings, buttons, section accents
- **Accent:** `#79242f` (crimson) — CSS var `--crimson` — CTA buttons, hero badge, event category badges

### Logos
- `static/images/logo-color.svg` — light backgrounds
- `static/images/logo-white.svg` — dark/teal backgrounds (hero, teal sections)

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
| `fenb-schedule.css` | Season schedule page |
| `fenb-join.css` | Join & Register section (landing page, membership, club registration, volunteer) |
| `fenb-responsive.css` | All `@media` breakpoints and print query — loaded last |

The load order is declared in `hugo.toml` under `params.ananke.custom_css`. Files must live in `fenb-1/assets/ananke/css/` — **not** `fenb-1/static/css/` — so Ananke's pipeline picks them up for concatenation, minification, and (in production) fingerprinting. A file placed in `static/` would be served separately, uncached, and unminified.

- No inline styles for anything reusable — add a class to the appropriate file instead
- Use CSS custom properties defined at `:root` rather than raw hex values: `--teal`, `--crimson`, `--shadow-sm`, `--radius`, category colours (`--cat-training`, `--cat-national`, `--cat-clinic`, `--cat-meeting` and their `--cat-*-pale` variants), brand colour channels for `rgba()` (`--teal-rgb`, `--crimson-rgb`)

### Container width modifiers

`.fenb-container` defaults to `max-width: 1200px`. Use these modifier classes when a section needs a narrower width — add them directly to the `<div class="fenb-container …">` element rather than writing a new descendant selector override.

| Class | Max-width | Used by |
|---|---|---|
| `.fenb-container--narrow` | 1100px | Events calendar, board, about overview, policies |
| `.fenb-container--tight` | 900px | About contact |
| `.fenb-container--sched` | 1000px | Season schedule |

### Hero breakout

Elements wider than `.fenb-hero-content` (max-width ~760px) use a negative-margin breakout to span the full viewport while surrounding text stays at normal width:

```css
width: Xvw;
margin: 0 calc((100% - Xvw) / 2);
```

### Two-column sidebar layout

Several pages use a main-content + right-sidebar layout. Follow this pattern when adding any new list page that needs a filter or legend panel.

| Page | Wrapper | Main column | Sidebar | Sidebar width |
|---|---|---|---|---|
| Events calendar | `.fenb-cal-layout` | `.fenb-cal-main` | `.fenb-cal-legend` | 185px |
| Season schedule | `.fenb-schedule-layout` | `.fenb-schedule-main` | `.fenb-schedule-sidebar` | 200px |

**Sidebar visual style** — apply to any new sidebar to stay consistent:
```css
border: 1px solid var(--teal);
border-radius: var(--radius);
padding: 1rem 1.25rem;
background: var(--off-white);
```

**Responsive:** both layouts collapse to a single column at ≤720px (`flex-direction: column`). If the sidebar contains controls (filters, selectors), move it *above* the main content using `order: -1` on mobile so users see the controls before the list. If the sidebar is passive information (legend, key), leave it in natural order so it falls below.

---

## Dark mode

The toggle sets `data-theme="dark"` on `<html>`; a `[data-theme="dark"]` block in `fenb-base.css` overrides the semantic background, text, shadow, and pale-tint variables. Brand colours (`--teal`, `--crimson`, `--navy`) are unchanged, but two behave differently enough to note:

- **`--teal-light`** resolves to `#4dbfad` in dark mode (~7.7:1 on dark bg). **Use it instead of `var(--teal)` for any teal text or border in a `[data-theme="dark"]` rule** — `var(--teal)` (#006156) is ~2.5:1 and fails contrast.
- **`--teal-pale`** resolves to `#1e3632` — a dark hover background, not a visible tint.
- **`--navy-light`** resolves to `#6aabdf` in dark mode. **Use it instead of `var(--navy)` for any navy text or border in a `[data-theme="dark"]` rule** — `var(--navy)` (#1e3a5f) is near-black on the dark background and fails contrast.

**Badge/pill swap:** light mode uses pale-tint bg + brand-colour text. In dark mode the pale tints are near-black, so invert to full brand-colour bg + `#fff` text (`var(--teal)` bg + white = ~7.5:1 ✓).

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

`Register Now` is suppressed for past events (date < today). `View Results` shows regardless of date when `results_url` is set.

Any layout that renders event links (card partial, schedule list, future widgets) must use these classes — **not** a plain `<a>` with a local colour rule — so that print and dark-mode overrides apply automatically.

---

## i18n — UI text

Never hardcode display text in a layout. Add keys to **both** `i18n/en.yaml` and `i18n/fr.yaml`. Use `{{ i18n "key" }}` in templates. For strings with dynamic values: `{{ i18n "key" (dict "Var" value) }}` with `{{ .Var }}` in the YAML value.

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
- `{title}` — short kebab-case slug; omit the year (the folder provides it)
- `{lang}` — `en` or `fr`, separated by a **dot** — Hugo uses `.en.md` / `.fr.md` to link translations automatically; a dash (`-en.md`) breaks that link

Example:
```
content/news/2026/apr-05-provincial-results.en.md
content/news/2026/apr-05-provincial-results.fr.md
```

When the first article of a new calendar year arrives, create the year subfolder with `_index.md` + `_index.fr.md` (copy from the previous year folder).

---

## News category colours

The `category` front matter field is a **canonical ID** (lowercase, no spaces) — the same convention used by event categories. The badge label is looked up via i18n at render time; never put a display string or translated label in the front matter.

| `category` | Badge EN | Badge FR | CSS variable | Colour |
|---|---|---|---|---|
| `results` | Results | Résultats | `--teal` | Teal |
| `announcement` | Announcement | Annonce | `--crimson` | Crimson |
| `registration` | Registration | Inscription | `--cat-training` | Green |
| `community` | Community | Communauté | `--cat-national` | Navy |

The `results` category also triggers loading of `results-table.js` — the check is `eq .Params.category "results"`, so the ID must match exactly.

---

## Event category colours

Each category drives three visual elements: the date badge on the event card, the tag pill, and the calendar bar on the month grid.

| `category` | Example `category_label` | CSS variable | Colour |
|---|---|---|---|
| `competition` | `"Competition"` | `--teal` | Teal |
| `training` | `"Training Camp"` | `--cat-training` | Dark green |
| `national` | `"National Event"` | `--cat-national` | Navy |
| `provincial` | `"Provincial Championship"` | `--crimson` | Crimson |
| `clinic` | `"Clinic"` | `--cat-clinic` | Olive |
| `meeting` | `"FENB Meeting"` | `--cat-meeting` | Grey |
| `announcement` | `"Announcement"` | `--teal` | Teal |

`category` is the canonical ID and CSS hook — must match exactly (lowercase, no spaces) and must be listed in `data/event_categories.yaml` (which drives the calendar legend and schedule filter buttons). `category_label` is a fallback display string used when the i18n key is missing. Each non-brand category also has a `--cat-*-pale` variant used for tag backgrounds.

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

## 404 page

Hugo generates one root `404.html` (English). A small inline script detects when the URL starts with `/fr/` and swaps: page text, nav link labels (from Hugo's French menu baked in at build time), nav link hrefs, logo href, and the language-switcher button. If French strings in `i18n/fr.yaml` change, update the hardcoded strings in `layouts/404.html` to match.
