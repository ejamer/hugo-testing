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
| `fenb-news.css` | News cards, article layout, article sidebar, 404 page |
| `fenb-clubs.css` | Programs quick-links, clubs grid/map/CTA |
| `fenb-about.css` | About page, policies page |
| `fenb-schedule.css` | Season schedule page |
| `fenb-responsive.css` | All `@media` breakpoints and print query — loaded last |

The load order is declared in `hugo.toml` under `params.custom_css`.

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

**Badge/pill swap:** light mode uses pale-tint bg + brand-colour text. In dark mode the pale tints are near-black, so invert to full brand-colour bg + `#fff` text (`var(--teal)` bg + white = ~7.5:1 ✓).

**Hardcoded values to watch:** semi-transparent darks (`rgba(0,0,0,0.05)` borders) become invisible on dark surfaces — use `var(--light-gray)` instead. Tachyons utility classes like `bg-near-white` hardcode a hex value that ignores CSS variables; override them explicitly in `[data-theme="dark"]`. Conversely, use `#fff` (not `var(--white)`) for text on coloured backgrounds — `--white` remaps to `#141f1d` in dark mode, so `color: var(--white)` on a teal button silently produces dark text.

**Rule location:** add `[data-theme="dark"]` overrides at the bottom of the same CSS file as the component, not in a separate file.

---

## i18n — UI text

Never hardcode display text in a layout. Add keys to **both** `i18n/en.yaml` and `i18n/fr.yaml`. Use `{{ i18n "key" }}` in templates. For strings with dynamic values: `{{ i18n "key" (dict "Var" value) }}` with `{{ .Var }}` in the YAML value.

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

The `category` front matter field drives the card top stripe, category badge colour, and article divider colour.

| Value | CSS variable | Colour | French equivalent |
|---|---|---|---|
| `Results` | `--teal` | Teal | `Résultats` |
| `Announcement` | `--crimson` | Crimson | `Annonce` |
| `Registration` | `--cat-training` | Green | `Inscription` |
| `Community` | `--cat-national` | Navy | `Communauté` |

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

`category_label` is the visible string on the card. `category` is the CSS hook — must match exactly (lowercase, no spaces). Each non-brand category also has a `--cat-*-pale` variant used for tag backgrounds.

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

## 404 page

Hugo generates one root `404.html` (English). A small inline script detects when the URL starts with `/fr/` and swaps: page text, nav link labels (from Hugo's French menu baked in at build time), nav link hrefs, logo href, and the language-switcher button. If French strings in `i18n/fr.yaml` change, update the hardcoded strings in `layouts/404.html` to match.
