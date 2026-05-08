# FencingNB Site — Design & CSS Review

> Reviewed against `fenb-1/` as of May 2026.  
> All layout and CSS files read in full. Line references are to `fenb.css` unless otherwise noted.

---

## Implementation status — May 2026

All 17 items were addressed. One was deferred by the review itself; one was informational only.

| ID | Sev | Done? | Summary |
|---|---|---|---|
| H1 | High | ✅ | Extracted `event-card.html` partial; used in `index.html` and `events/list.html` noscript block |
| H2 | High | ✅ | Moved subtitles to `description:` front matter; removed inline `<header>` blocks from `events/list.html` and `about/list.html` |
| H3 | Medium | **Deferred** | Nav partial still conflates navigation + page header — splitting into `nav.html` + `page-header.html` left as a future task |
| H4 | Medium | ✅ | Founder photo + affiliations moved to `board.yaml`; `programs.yaml` created; `about/list.html` and `index.html` updated |
| H5 | Low | ✅ | Board role uses `index . (printf "role_%s" …)` instead of hardcoded `if eq "fr"` |
| H6 | Low | ✅ | Hero slider extracted to `static/js/hero-slider.js` |
| H7 | Info | — | Informational only; no code change needed |
| C1 | High | ✅ | Added 8 category colour variables to `:root`; replaced 20+ hardcoded hex literals across all rule groups |
| C2 | High | ✅ | Added `--teal-rgb` and `--crimson-rgb`; replaced 15 `rgba()` literals |
| C3 | Medium | ✅ | Added `.fenb-container--narrow / --tight / --sched` modifier classes; removed 6 descendant `max-width` overrides |
| C4 | Medium | ✅ | All scattered `@media` blocks consolidated into a single responsive section |
| C5 | Medium | ✅ | Removed `!important` from schedule filter buttons (specificity was already sufficient) |
| C6 | Medium | ✅ | Dead `.fenb-schedule-season-label` rule deleted |
| C7 | Low | ✅ | Empty left sidebar removed from `news/single.html`; grid changed from `200px 1fr 280px` → `1fr 280px` |
| C8 | Low | ✅ | Hero slider button transition changed from hardcoded `0.2s` to `var(--transition)` |
| C9 | Low | ✅ | Dead `.bg-fenb-crimson` rule deleted |
| C10 | Info | ✅ | CSS split into 9 scoped files (`fenb-base.css` … `fenb-responsive.css`); `fenb.css` deleted from repo |

Two additional partials were also created outside the original review scope: `news-card.html` and `section-header.html`.

All reference docs (`CLAUDE.md`, `STYLE_GUIDE.md`, `README.md`, `fenb-season-rollover.md`, `fenb-new-page.md`) were updated to reflect the changes.

---

## Part 1 — Hugo Design

### What's working well

| Strength | Notes |
|---|---|
| **Data-driven content** | Events, clubs, board, policies, hero slides all live in `data/` YAML. Templates never hardcode data. |
| **i18n coverage** | 165 keys per language, no gaps between EN and FR. Dynamic i18n keys (`printf "month_%s" ...`) are used correctly. |
| **Translation linking** | Language switcher in `site-header.html` correctly prefers `.Translations` over a generic home fallback. |
| **Policy template reuse** | All 13 policy documents share one `layouts/about/single.html`. No per-document layouts. |
| **No-JS fallback** | `events/list.html` wraps a full event card grid in `<noscript>`. The schedule page uses `data-` attributes + hidden attribute, so print works without JS involvement. |
| **Print styling** | Schedule print media query is thorough: hides nav/sidebar/controls, preserves category colours with `print-color-adjust: exact`, adds `break-inside: avoid`. |
| **Bilingual archive** | `fenb-season-rollover` and the schedule page's season-discovery loop handle arbitrarily many archived seasons without template changes. |

---

### Issues

#### H1 — Event card HTML duplicated across templates (high)

The event card (`fenb-event-card`) is rendered in two separate places:
- `layouts/index.html` lines 59–85
- `layouts/events/list.html` lines 47–66 (noscript fallback)

Both blocks are byte-for-byte equivalent. A partial (`partials/event-card.html`) would eliminate the duplication. When the card layout changes, both files need updating today.

**Fix:** Extract to `layouts/partials/event-card.html` and call `{{ partial "event-card.html" . }}` in both locations.

---

#### H2 — Page header rendered via two separate mechanisms (high)

`site-header.html` contains built-in page header logic (lines 161–174) that renders `.fenb-page-header` for any non-home page without `hide_page_header: true`.

But two layouts bypass this entirely by setting `hide_page_header: true` in their content front matter, then rendering the same HTML inline:

| Layout | Inline header | Content file flag |
|---|---|---|
| `layouts/events/list.html` | lines 6–11 | `_index.md: hide_page_header: true` |
| `layouts/about/list.html` | lines 5–11 | `_index.md: hide_page_header: true` |

This means page header styling exists in three places: the partial, and these two layout files. A design change to the band requires three edits.

The reason these opt out is to inject a custom subtitle (e.g., the i18n `events_page_subtitle` string). The partial already supports this: it reads `$headerDesc` from `.Params.description`. Moving the subtitle into each section's `_index.md` `description:` front matter field would let both layouts remove their inline headers and use the partial path like everything else.

---

#### H3 — `site-header.html` conflates navigation with page header (medium)

The partial handles: logo, nav links, language switcher, hamburger menu, search overlay, **and** the page header band. These are two distinct concerns bundled into one file.

The page header band (lines 161–174) is conditionally rendered for all non-home pages. If a page needs a custom header style (e.g., taller band for a campaign page), there is no override path short of editing the partial itself.

**Fix (future consideration):** Split into `partials/nav.html` and `partials/page-header.html`. Layouts that need custom headers call `partials/page-header.html` with a dict of parameters instead of opting out via a front matter flag.

---

#### H4 — Hard-coded content in templates that belongs in data (medium)

Three items in templates would be better sourced from `data/`:

1. **Affiliation links** (`about/list.html` lines 54–55) — CFF and Sport NB URLs are hardcoded. If the CFF moves their domain, a template edit is required. A `fenb-1/data/affiliations.yaml` (or adding to `board.yaml`) would make this data-driven.

2. **Founder photo** (`about/list.html` line 31) — `src="/images/alfred-knappe.png"` and the `figcaption` text are hardcoded. Suitable for `board.yaml` alongside the contact email.

3. **Program quick-links** (`index.html` lines 126–158) — Four cards with hard-coded URLs (`/clubs/`, `/events/`, `/programs/`, `/join/`). Two of these (`/programs/`, `/join/`) don't exist as content pages, so these links currently produce 404s. A `data/programs.yaml` would at minimum surface the dead links visibly and make them easy to update.

---

#### H5 — Board role language selection bypasses i18n (low)

`about/list.html` line 78:
```html
{{- if eq $.Site.Language.Lang "fr" }}{{ .role_fr }}{{ else }}{{ .role_en }}{{ end -}}
```

This pattern works but is fragile: if a third language is ever added, it silently falls to the English role. The conventional Hugo approach is `index . (printf "role_%s" $.Site.Language.Lang)` or ensuring the data schema is consistent. Not urgent, but worth noting for future-proofing.

---

#### H6 — Hero slider script is inline; other page scripts are external (low)

`index.html` lines 162–192 contain a 30-line inline `<script>` for the hero slider. The events calendar and schedule page both use external JS files (`js/events-calendar.js`, `js/events-schedule.js`). For consistency, this should become `static/js/hero-slider.js`.

---

#### H7 — `safeJS` + `jsonify` pattern documented but still needs care (informational)

`events/list.html` line 92:
```
events: {{ hugo.Data.events.events | jsonify | safeJS }},
```

Per `CLAUDE.md`, this outputs a quoted JSON string. `events-calendar.js` must use `JSON.parse()` on it. This is documented and presumably handled in the JS, but the pattern is non-obvious and easy to break during future edits. The CLAUDE.md note is the right mitigation.

---

## Part 2 — CSS

### What's working well

| Strength | Notes |
|---|---|
| **CSS variables** | Brand colours, shadows, radius, ease, and transition are fully variable-ized in `:root`. |
| **Section comments** | Each major component is clearly delimited with ASCII banner comments. |
| **Responsive design** | Multiple breakpoints (860px, 720px, 680px, 640px, 600px, 1000px) with consistent mobile-first logic. |
| **`var(--transition)`** | The ease + duration variable is used consistently across most interactive elements. |
| **Print query** | Schedule print rules are thorough and production-ready. |

---

### Issues

#### C1 — Category colours hardcoded in six separate rule groups (high)

The four non-brand category colours appear as literal hex values in **six independent rule groups**:

| Category | Colour | Appears in |
|---|---|---|
| training | `#2d6a4f` | date badge (560), tag (626), cal bar (829), news top stripe (886), news badge (922), article divider (1349) |
| national | `#1a3a5c` | date badge (561), tag (627), cal bar (830), news top stripe (887), news badge (924), article divider (1351) |
| clinic | `#5a6a3a` | date badge (563), tag (629), cal bar (831), news badge (922) |
| meeting | `#4a4a4a` | date badge (564), tag (630), cal bar (833) |

Additionally, the *pale* variants for tag backgrounds and news badges (`#e7f2ec`, `#e8eef5`, `#eef2e6`, `#efefef`) are each used in 2–3 places with no variable.

Changing one category colour today requires editing 6+ locations and hunting for both the colour and its paired pale variant.

**Fix:** Add to `:root`:
```css
--cat-training:       #2d6a4f;
--cat-training-pale:  #e7f2ec;
--cat-national:       #1a3a5c;
--cat-national-pale:  #e8eef5;
--cat-clinic:         #5a6a3a;
--cat-clinic-pale:    #eef2e6;
--cat-meeting:        #4a4a4a;
--cat-meeting-pale:   #efefef;
```
Then replace all 20+ hardcoded instances. The brand colours (teal, crimson) already work this way — categories should match.

---

#### C2 — Teal and crimson as `rgba()` literals repeated throughout (high)

`var(--teal)` and `var(--crimson)` cannot be used in `rgba()`, so 15+ instances hardcode the raw RGB values:

| Pattern | Count | Lines (examples) |
|---|---|---|
| `rgba(0,97,86, …)` (teal) | 8 | 845, 846, 1011, 1015, 1207, 1212 |
| `rgba(121,36,47, …)` (crimson) | 7 | 296, 317, 415, 419, 1077, 1079–1083 |

When the brand colour changes, these will be missed by a variable find-replace.

**Fix — channel variables (universally supported):**
```css
--teal-rgb:    0, 97, 86;
--crimson-rgb: 121, 36, 47;
/* usage: rgba(var(--teal-rgb), 0.22) */
```

**Fix — `color-mix()` (modern browsers, no syntax change at use-site):**
```css
--teal-a22:  color-mix(in srgb, var(--teal) 22%, transparent);
/* usage: background: var(--teal-a22); */
```
Either approach ties all opacity tints back to the single brand colour variable.

---

#### C3 — `fenb-container` max-width overridden via 6+ descendant selectors (medium)

`.fenb-container` defines `max-width: 1200px`. Six different sections override it via tight descendant selectors:

| Selector | Max-width | Line |
|---|---|---|
| `.fenb-events-cal-section .fenb-container` | 1100px | 635 |
| `.fenb-page-header .fenb-container` | 1200px (redundant) | 1025 |
| `.fenb-about-overview-section .fenb-container` | 1100px | 1552 |
| `.fenb-board-section .fenb-container` | 1100px | 1698 |
| `.fenb-about-contact-section .fenb-container` | 900px | 1789 |
| `.fenb-policy-section .fenb-container` | 1100px | 1821 |

`.fenb-schedule-container` (line 1935) duplicates the container concept entirely as a standalone class instead of being a modifier.

**Fix:** Add modifier classes to the base container:
```css
.fenb-container          { max-width: 1200px; … }
.fenb-container--narrow  { max-width: 1100px; }
.fenb-container--tight   { max-width: 900px; }
.fenb-container--sched   { max-width: 1000px; }
```
Replace all descendant overrides in templates with the appropriate modifier class. This removes 6 CSS rules and makes the template HTML self-documenting.

---

#### C4 — Responsive media queries scattered across the file (medium)

The file has a labelled `/* ── Responsive ── */` block starting at line 1489, but six additional `@media` blocks appear earlier, mid-section:

| Lines | Breakpoint | Context |
|---|---|---|
| 1302–1307 | 600px | Clubs section |
| **1309–1316** | **720px** | **Calendar + schedule** (out of place — between clubs and news article sections) |
| 1489–1540 | 860px, 600px, 1000px, 680px | Main responsive block |
| 1682–1690 | 640px | About history |
| 1915–1923 | 860px | About + policies |
| 1925–1931 | 600px | About + policies |
| 2138–2172 | print | Schedule |

The 720px block at 1309–1316 is the worst offender: it handles both `.fenb-cal-layout` and `.fenb-schedule-layout` responsiveness but is sandwiched between the clubs and news article sections.

**Fix:** All `@media (max-width: X)` blocks should live in the responsive section at the end of the file, grouped by breakpoint. This is a pure reorganisation with no behaviour change.

---

#### C5 — `!important` in schedule filter buttons works around a JS/CSS mismatch (medium)

Lines 2015–2017:
```css
.fenb-schedule-filter-btn:not(.is-active) {
  background: var(--off-white) !important;
  color: var(--text-muted) !important;
```

The `!important` overrides inline styles set by `events-schedule.js`, which writes category-colour backgrounds via `element.style.background`. This is a JS/CSS contract smell: JS sets inline styles, CSS uses `!important` to win when the button is inactive.

**Fix:** Instead of inline styles, the JS should toggle a `data-active` attribute. CSS then uses `[data-active="true"]` / `[data-active="false"]` selectors, removing the need for `!important`. This also makes the active state introspectable from DevTools.

---

#### C6 — `.fenb-schedule-season-label` is dead CSS (medium)

Lines 2051–2055 define `.fenb-schedule-season-label`, but no element with that class appears in `layouts/events/schedule.html`. The "current season" label concept was either removed or never implemented. This rule can be deleted.

---

#### C7 — Left sidebar column in news article layout is empty (low)

`layouts/news/single.html` uses a 3-column grid (`200px 1fr 280px`) but the left column has no content — it is a reserved placeholder. On every news article page, 200px of grid space is empty at desktop widths.

The CSS at lines 1533–1534 already collapses it at 1000px:
```css
@media (max-width: 1000px) {
  .fenb-article-sidebar--left { display: none; }
}
```

Until the left sidebar has a purpose, the layout should be `1fr 280px` (two columns) and the left sidebar element removed from the template.

---

#### C8 — Minor transition inconsistency (low)

Most interactive elements use `var(--transition)` (0.22s, cubic-bezier). Two elements use hardcoded values:
- `.fenb-hero-slider-btn`: `transition: background 0.2s` (line 371) — no easing curve
- `.fenb-search-overlay`: `transition: opacity 0.18s ease, transform 0.18s ease` (lines 213–214) — different duration, plain `ease`

The search overlay's faster duration is arguably intentional (snappier open/close). `.fenb-hero-slider-btn` should use `var(--transition)` for consistency.

---

#### C9 — `.bg-fenb-crimson` is dead code (low)

Line 1476:
```css
.bg-fenb-crimson { background-color: var(--crimson); }
```

This exists as an Ananke `background_color_class` override. `hugo.toml` sets `background_color_class = "bg-fenb-teal"`, not crimson. No template references `.bg-fenb-crimson`. This rule can be deleted.

`.bg-fenb-teal` is also likely unused since Ananke's nav is fully overridden, but it costs one line so it's low priority.

---

#### C10 — CSS file length limits readability (informational)

At 2173 lines, `fenb.css` is the single largest file in the project. Section comments help orient readers, but the file is long enough that AI-assisted editing sessions can't hold it fully in context, creating drift risk where related rules get added inconsistently.

Hugo's asset pipeline supports `resources.Concat` to combine multiple CSS files at build time. A per-section split would keep each file under ~400 lines and let future edits target exactly the right file:

```
assets/ananke/css/
  fenb.css          ← :root variables only; @import or concatenated by Hugo
  fenb-nav.css
  fenb-hero.css
  fenb-events.css
  fenb-news.css
  fenb-about.css
  fenb-schedule.css
```

This is a refactor with no behaviour change — schedule separately from other fixes.

---

## Summary table

| ID | Area | Severity | Description |
|---|---|---|---|
| H1 | Hugo | High | Event card HTML duplicated in `index.html` and `events/list.html` |
| H2 | Hugo | High | Page header rendered via partial AND inline in two layouts |
| H3 | Hugo | Medium | Nav partial conflates navigation and page header concerns |
| H4 | Hugo | Medium | Affiliate links, founder photo, program cards hardcoded in templates |
| H5 | Hugo | Low | Board role language check bypasses i18n |
| H6 | Hugo | Low | Hero slider script is inline; other page scripts are external |
| H7 | Hugo | Info | `safeJS`/`jsonify` pattern is documented; JS must handle `JSON.parse()` |
| C1 | CSS | High | Category colours hardcoded as hex literals in 6 rule groups |
| C2 | CSS | High | Teal/crimson as `rgba()` literals in 15+ places |
| C3 | CSS | Medium | `fenb-container` max-width overridden 6+ times via descendant selectors |
| C4 | CSS | Medium | Responsive media queries scattered instead of consolidated |
| C5 | CSS | Medium | `!important` in schedule filter buttons works around JS inline style |
| C6 | CSS | Medium | `.fenb-schedule-season-label` is dead CSS |
| C7 | CSS | Low | News article left sidebar column is empty at all desktop widths |
| C8 | CSS | Low | Transition value inconsistent on hero slider button |
| C9 | CSS | Low | `.bg-fenb-crimson` is dead code |
| C10 | CSS | Info | File at 2173 lines; modular split would improve maintainability |
