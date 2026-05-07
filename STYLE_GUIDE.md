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

All styles live in `fenb-1/assets/ananke/css/fenb.css`, bundled by Ananke's asset pipeline.

- No inline styles for anything reusable — add a class to `fenb.css` instead
- Use CSS custom properties defined at `:root` (`--teal`, `--crimson`, `--shadow-sm`, `--radius`, etc.) rather than raw hex values

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

## i18n — UI text

Never hardcode display text in a layout. Add keys to **both** `i18n/en.yaml` and `i18n/fr.yaml`. Use `{{ i18n "key" }}` in templates. For strings with dynamic values: `{{ i18n "key" (dict "Var" value) }}` with `{{ .Var }}` in the YAML value.

---

## Bilingual content

Every content page needs both an English and French file so the language switcher links directly to the translated page rather than falling back to the home page.

- Section index files: `_index.md` (EN) + `_index.fr.md` (FR)
- Article files: `{name}.en.md` (EN) + `{name}.fr.md` (FR)

Both files need `hide_page_header: true` in front matter if the layout provides its own page header inside `main` (prevents the generic band in `site-header.html` from doubling up).

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

The `category` front matter field drives the card accent colour and article divider colour.

| Value | Colour | French equivalent |
|---|---|---|
| `Results` | Teal | `Résultats` |
| `Announcement` | Crimson | `Annonce` |
| `Registration` | Green | `Inscription` |
| `Community` | Navy | `Communauté` |

---

## Event category colours

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

---

## Page header band

`site-header.html` renders a coloured `.fenb-page-header` band below the nav for all non-home pages. By default it shows the page's own `.Title`.

**Show the section title on single pages** — useful when every article in a section should show the section name (e.g. "News & Results") rather than its own title. Add this cascade to the section's `_index.md` and `_index.fr.md`:

```yaml
cascade:
  - _target:
      kind: page
    page_header_uses_section: true
```

`site-header.html` checks `.Params.page_header_uses_section` and substitutes `.CurrentSection.Title` / `.CurrentSection.Params.description`. The `_target: kind: page` scoping leaves the section list page unaffected.

**Suppress the band** — if a layout provides its own page header inside `main`, set `hide_page_header: true` in the section's `_index.md` front matter to prevent `site-header.html` from rendering a duplicate.

---

## 404 page

Hugo generates one root `404.html` (English). A small inline script detects when the URL starts with `/fr/` and swaps: page text, nav link labels (from Hugo's French menu baked in at build time), nav link hrefs, logo href, and the language-switcher button. If French strings in `i18n/fr.yaml` change, update the hardcoded strings in `layouts/404.html` to match.
