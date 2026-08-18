# Plan: News & Results Page — Category and Year Filters

## Goal

Add filtering to the `/news/` index page so visitors can narrow articles by **category** (results, announcement, registration, community) and **year**. Keep it lightweight — no external library, no page reload.

---

## Key findings from existing code

| Finding | Implication |
|---|---|
| `news-card.html` renders `fenb-news-card-top--{category}` CSS class but no `data-*` attributes | Any DOM-based approach needs `data-category` and `data-year` added to `<article>` |
| `<time datetime="2026-01-02">` is already rendered on each card | Year is available without extra front matter |
| `news/list.html` uses `$.Paginate(...)` — default Hugo page size is 10 | **Pagination breaks client-side filtering** — JS only sees cards in the current page's DOM, not all articles |
| `events-schedule.js` already implements toggle+dropdown pattern | Reusable as a model for whichever approach is chosen |
| Category i18n strings already exist | No new category translation strings needed |
| `schedule_filter_all` / `schedule_filter_none` / `schedule_filter_label` already exist | Reusable for the filter UI |
| Expected volume: ~40 articles/season, multi-season | After 3 seasons: ~120 articles; after 5 seasons: ~200 articles |

---

## The pagination problem

Hugo's paginator renders only N articles per HTML page (default 10). Each paginated page is a separate URL: `/news/`, `/news/page/2/`, `/news/page/3/`, etc. The browser only downloads the HTML it navigated to.

**Consequence for client-side filtering:** JS running on `/news/` can only hide/show the 10 cards that are in the DOM. Articles on page 2 and beyond are invisible to it. A visitor filtering for "Results" might see zero cards — not because no results exist, but because all results articles happen to be on page 2.

This is why the approach chosen here matters.

---

## Approach options

### Option A — Remove pagination, render all cards, JS filter (simplest)

Drop `$.Paginate`, render every article into the DOM on a single page, and use JS to toggle `hidden` on cards based on `data-category` and `data-year`.

**Pros:**
- Simplest implementation — 40 lines of JS, mirrors events-schedule exactly
- Filter works across all articles regardless of volume
- No fetch, no async, instant response

**Cons:**
- HTML payload grows with article count (~1–2 KB per card compressed). At 200 articles that is ~300–400 KB of HTML — still modest by modern standards, but not zero
- All article summaries are sent to every visitor regardless of what they filter to

**Volume estimate:** 200 articles × ~1.5 KB = ~300 KB HTML uncompressed. With gzip this compresses very well (repetitive structure). Acceptable for the foreseeable lifetime of the site.

**Verdict:** Recommended for now. Revisit only if article count exceeds ~300.

---

### Option B — Hugo JSON index + client-side fetch and render

Hugo generates a `/news/index.json` output format at build time containing all articles (title, date, category, URL, summary). The news list page initially renders no cards. On load, JS fetches the JSON, applies filters, and injects matching cards into the DOM.

**Pros:**
- HTML page is tiny regardless of article count
- Full article set always available for filtering, no pagination issue
- Extends naturally to a search box

**Cons:**
- More complex: requires a Hugo output format, a JSON template, and JS that both filters and renders HTML
- Cards rendered by JS rather than Hugo templates — duplicates the card HTML structure in JS
- Async: brief flash before cards appear (needs a loading state)
- Bilingual: JSON index must be language-aware (one per language, or a `lang` field)

**When to prefer:** If article volume grows past ~300, or if a search box is wanted alongside the filters.

---

### Option C — Hugo taxonomy pages (no JS)

Register `categories` as a Hugo taxonomy. Each category gets a generated index page (`/news/categories/results/`, etc.). The year filter becomes navigation to `/news/2025/`, `/news/2026/` section pages.

**Pros:**
- Zero JS — filtering is just navigation between static pages
- Works with pagination within each category/year page
- Good for SEO (each category has its own URL)

**Cons:**
- No combined filtering (can't simultaneously filter by year AND category without a page per combination)
- Requires taxonomy config in `hugo.toml`, content type adjustments, and new layout templates
- Feels like navigation, not filtering — different UX than the events schedule

**When to prefer:** If SEO for category pages is a priority, or if JS is to be avoided entirely.

---

### Option D — Year-section pages + JS category filter within each year

Hugo naturally creates section pages for the year subfolders (`/news/2026/`, `/news/2025/`). Each year page renders only that year's articles — a much smaller set than the full archive. JS category filter within the year page only needs to handle ~40 cards.

**Pros:**
- Year filter = navigation (no JS needed for it, no DOM scaling issue)
- Category filter JS only touches one year's cards at a time — trivially small set
- Clean URL structure that already exists from the subfolder layout

**Cons:**
- Year selection is navigation (page reload), not instant toggle
- Needs year-section list layouts (currently the year subfolder renders as the parent news list)
- Visitor starts on "all years" and must navigate to a year — or the default `/news/` shows the most recent year only

**When to prefer:** If the UX should group articles by season/year prominently, and a page-reload year switch is acceptable.

---

## Recommendation

**Start with Option A** (remove pagination, render all, JS filter). It is the direct equivalent of what events-schedule does, takes the least code, and handles the expected article volumes (40/season × 5 seasons = 200 articles) comfortably. The file changes are minimal and self-contained.

Revisit **Option B** (JSON index + fetch) if the site grows past ~300 articles or if a text search box is ever wanted.

---

## Files to change (Option A)

| File | Change |
|---|---|
| `layouts/partials/news-card.html` | Add `data-category` and `data-year` to `<article>` |
| `layouts/news/list.html` | Remove `$.Paginate`, add filter bar HTML, link `news-filter.js` |
| `static/js/news-filter.js` | New — filter logic (toggle buttons + year dropdown) |
| `assets/ananke/css/fenb-news.css` | New filter bar styles + `.fenb-news-no-results` |
| `i18n/en.yaml` | Add `news_filter_year`, `news_filter_all_years`, `news_no_results` |
| `i18n/fr.yaml` | Same strings in French |

---

## Step-by-step implementation (Option A)

### Step 1 — Add `data-*` to news-card.html

Change the opening `<article>` tag from:

```html
<article class="fenb-news-card">
```

to:

```html
<article class="fenb-news-card"
  data-category="{{ $page.Params.category }}"
  data-year="{{ $page.Date.Format "2006" }}">
```

### Step 2 — Update news/list.html

Replace the paginated loop with a full-render loop. Add:

1. A filter bar above `.fenb-news-grid` with:
   - Category toggle buttons (All / None meta + individual buttons per category, matching schedule pattern)
   - Year `<select>` — options populated server-side by collecting unique years from `.RegularPagesRecursive`
2. A hidden "no results" message div
3. A `<script>` tag loading `news-filter.js`

Year collection in the Hugo template:
```
{{- $years := slice -}}
{{- range (sort .RegularPagesRecursive "Date" "desc") -}}
  {{- $y := .Date.Format "2006" -}}
  {{- if not (in $years $y) -}}{{- $years = $years | append $y -}}{{- end -}}
{{- end -}}
```

Categories list — hardcoded ordered list matching the CSS:
```
{{- $cats := slice "results" "announcement" "registration" "community" -}}
```

Filter bar layout (horizontal, above the grid):
```html
<div class="fenb-news-filter-bar">
  <div class="fenb-news-filter-group">
    <span class="fenb-news-filter-label">{{ i18n "schedule_filter_label" }}</span>
    <div class="fenb-news-filter-meta-row">
      <button class="fenb-news-filter-meta" data-action="all">{{ i18n "schedule_filter_all" }}</button>
      <button class="fenb-news-filter-meta" data-action="none">{{ i18n "schedule_filter_none" }}</button>
    </div>
    <div class="fenb-news-filter-btns">
      {{- range $cats -}}
      <button class="fenb-news-filter-btn fenb-news-filter-btn--{{ . }} is-active" data-category="{{ . }}">
        {{ i18n . }}
      </button>
      {{- end -}}
    </div>
  </div>
  <div class="fenb-news-filter-group">
    <label class="fenb-news-filter-label" for="news-year-select">{{ i18n "news_filter_year" }}</label>
    <select id="news-year-select" class="fenb-cal-select fenb-news-year-select">
      <option value="all">{{ i18n "news_filter_all_years" }}</option>
      {{- range $years -}}
      <option value="{{ . }}">{{ . }}</option>
      {{- end -}}
    </select>
  </div>
</div>
<p class="fenb-news-no-results" hidden>{{ i18n "news_no_results" }}</p>
```

### Step 3 — Write static/js/news-filter.js

```js
(function () {
  var yearSelect  = document.getElementById('news-year-select');
  var filterBtns  = document.querySelectorAll('.fenb-news-filter-btn');
  var metaBtns    = document.querySelectorAll('.fenb-news-filter-meta');
  var noResults   = document.querySelector('.fenb-news-no-results');

  if (!yearSelect) return;

  function activeCategories() {
    var out = [];
    filterBtns.forEach(function (b) {
      if (b.classList.contains('is-active')) out.push(b.dataset.category);
    });
    return out;
  }

  function applyFilters() {
    var year   = yearSelect.value;
    var active = activeCategories();
    var visible = 0;

    document.querySelectorAll('.fenb-news-card').forEach(function (card) {
      var catMatch  = active.indexOf(card.dataset.category) !== -1;
      var yearMatch = year === 'all' || card.dataset.year === year;
      var show = catMatch && yearMatch;
      card.hidden = !show;
      if (show) visible++;
    });

    if (noResults) noResults.hidden = visible > 0;
  }

  yearSelect.addEventListener('change', applyFilters);

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.classList.toggle('is-active');
      applyFilters();
    });
  });

  metaBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var all = btn.dataset.action === 'all';
      filterBtns.forEach(function (b) { b.classList.toggle('is-active', all); });
      applyFilters();
    });
  });
})();
```

### Step 4 — Add CSS to fenb-news.css

```css
/* ── News filter bar ──────────────────────────── */
.fenb-news-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 2rem;
  align-items: flex-end;
  margin-bottom: 1.75rem;
  padding: 1.25rem 1.5rem;
  background: var(--white);
  border: 1px solid var(--light-gray);
  border-radius: var(--radius-sm);
}

.fenb-news-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fenb-news-filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.fenb-news-filter-meta-row {
  display: flex;
  gap: 0.4rem;
}

.fenb-news-filter-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.fenb-news-filter-meta,
.fenb-news-filter-btn {
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  font-family: inherit;
  font-weight: 600;
  border: 1px solid var(--light-gray);
  border-radius: 4px;
  background: var(--off-white);
  color: var(--text-muted);
  cursor: pointer;
  transition: background var(--transition), color var(--transition), border-color var(--transition);
}

.fenb-news-filter-btn.is-active               { background: var(--teal-pale);          color: var(--teal);         border-color: var(--teal); }
.fenb-news-filter-btn--announcement.is-active { background: var(--crimson-pale);        color: var(--crimson);      border-color: var(--crimson); }
.fenb-news-filter-btn--registration.is-active { background: var(--cat-training-pale);   color: var(--cat-training); border-color: var(--cat-training); }
.fenb-news-filter-btn--community.is-active    { background: var(--cat-national-pale);   color: var(--cat-national); border-color: var(--cat-national); }

.fenb-news-filter-meta:hover { background: var(--off-white); color: var(--text-dark); border-color: var(--text-muted); }

.fenb-news-year-select { min-width: 120px; }

.fenb-news-no-results {
  text-align: center;
  color: var(--text-muted);
  padding: 3rem 0;
  font-size: 0.95rem;
}
```

### Step 5 — Add i18n strings

**en.yaml:**
```yaml
news_filter_year:      "Year"
news_filter_all_years: "All years"
news_no_results:       "No articles match the selected filters."
```

**fr.yaml:**
```yaml
news_filter_year:      "Année"
news_filter_all_years: "Toutes les années"
news_no_results:       "Aucun article ne correspond aux filtres sélectionnés."
```

---

## Dark mode

The filter buttons use CSS variables already defined for dark mode. After implementation, verify `is-active` button states are readable — add `[data-theme="dark"]` overrides to `fenb-news.css` if contrast is insufficient.

---

## Testing checklist

- [ ] All categories visible by default on load
- [ ] Toggling a category off hides matching cards, toggling back shows them
- [ ] All/None meta buttons work correctly
- [ ] Season dropdown filters correctly; "All seasons" shows everything
- [ ] Season + category filters combine correctly (AND logic)
- [ ] "No articles" message appears when filters eliminate all cards
- [ ] Both EN and FR pages work
- [ ] Dark mode filter bar is readable
- [ ] Mobile layout: filter bar wraps cleanly at narrow widths

---

## Revision (2026-08-17) — season grouping instead of calendar year

Everything above still holds structurally (Option A, remove pagination, filter in JS). The one change: group and filter by **fencing season** (Sept–Aug, matching `events.yaml` and `join.yaml`) instead of calendar year. A news reader thinking "show me articles from this season" means Sept 2026–Aug 2027, not Jan–Dec 2026 — a calendar-year filter would arbitrarily split a season's coverage across two dropdown entries (e.g. the Sept 2026 season-opener article and the June 2027 provincials results article would land in different "years" despite being the same season).

**No new front matter needed.** Season is derived from each article's existing `date` field:

```go
{{- /* partials/news-season.html — takes a time.Time, returns its season label, e.g. "2026–2027" */ -}}
{{- $d := . -}}
{{- $y := $d.Year -}}
{{- $label := "" -}}
{{- if ge (int $d.Month) 9 -}}
  {{- $label = printf "%d–%d" $y (add $y 1) -}}
{{- else -}}
  {{- $label = printf "%d–%d" (sub $y 1) $y -}}
{{- end -}}
{{- return $label -}}
```

(Hugo's `return` only accepts a bare value/variable, not a nested function-call expression — assign to a variable first.)

Deriving avoids drift (an editor typing the wrong season string into front matter) and works retroactively on all ~15 existing articles with zero migration.

**Deltas from the Option A plan above:**

| Original (year-based) | Revised (season-based) |
|---|---|
| `data-year="{{ $page.Date.Format "2006" }}"` on `.fenb-news-card` | `data-season="{{ partial "news-season.html" $page.Date }}"` |
| `$years` collection loop (`.Date.Format "2006"`) | Same loop shape, collecting `partial "news-season.html" .Date` instead; sort descending so the current season is first |
| `#news-year-select`, `news_filter_year`, `news_filter_all_years` i18n keys | Rename to `#news-season-select`, `news_filter_season`, `news_filter_all_seasons` |
| JS `yearSelect` / `year` variable names | Rename to `seasonSelect` / `season`; comparison logic (`===` / `'all'`) is unchanged |

Everything else — the pagination removal, the category toggle buttons, the CSS, the dark-mode note — is unchanged from the Option A plan above.
