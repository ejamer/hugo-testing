# Plan: Events Data Archive Pattern

## Problem

`fenb-1/data/events.yaml` will grow unbounded as new fencing seasons are added. Splitting it naively into subdirectory files would break all existing layouts, which reference `hugo.Data.events.events` directly.

## Chosen approach: archive pattern

Keep `data/events.yaml` as the current season file at all times. When a season ends, move it into `data/events_archive/` before starting the new file.

```
fenb-1/data/
  events.yaml                  ← always the current season
  events_archive/
    2024-2025.yaml             ← past seasons moved here at rollover
    2025-2026.yaml
    ...
```

Both the current file and archive files use the same schema:

```yaml
events:
  - title: "..."
    date: "YYYY-MM-DD"
    end_date: ""
    display_date: "..."
    location: "..."
    venue: "..."
    category: "..."
    category_label: "..."
    description: "..."
    details_url: ""
    registration_url: ""
```

## Season rollover steps

At the start of each new season:

1. Copy `fenb-1/data/events.yaml` → `fenb-1/data/events_archive/YYYY-YYYY.yaml` (e.g. `2025-2026.yaml`)
2. Replace `fenb-1/data/events.yaml` with the new season's events
3. No layout or template changes required

## Existing layouts — no changes needed

| Layout | Data reference | Impact |
|--------|---------------|--------|
| `layouts/index.html` | `hugo.Data.events.events` | None — reads current season only |
| `layouts/events/list.html` | `hugo.Data.events.events` | None — reads current season only |

The archive files are simply not loaded by these pages.

## Future: Past Events page

When a dedicated archive/history page is wanted, add a new content page and layout. The template pattern to combine all archive seasons:

```go
{{/* Flat list of all archived events, newest first */}}
{{ $all := slice }}
{{ range $season, $data := hugo.Data.events_archive }}
  {{ range $data.events }}
    {{ $all = $all | append . }}
  {{ end }}
{{ end }}
{{ $all = sort $all "date" "desc" }}
```

To group by season with headings instead:

```go
{{ range $season, $data := hugo.Data.events_archive }}
  <h2>{{ $season }}</h2>
  {{ range sort $data.events "date" "desc" }}
    {{/* render event card */}}
  {{ end }}
{{ end }}
```

Note: Hugo keys the `events_archive` map by filename without extension, so the key is the season string (e.g. `"2025-2026"`). Iteration order is alphabetical by key, which is chronological for `YYYY-YYYY` filenames.

## Why not split into subdirectories from the start?

Hugo merges files in a data subdirectory into a map keyed by filename. That means `hugo.Data.events` would become `{"2025-2026": {events: [...]}, ...}` — a map, not a slice. Every layout that currently does `hugo.Data.events.events` would break and need to be rewritten to iterate-and-flatten. The archive pattern avoids that by keeping the current-season access path unchanged.

---

## Revision (2026-08-17) — view continuity across the rollover boundary

**This plan's "no layout changes needed" claim (above) is now wrong for two of the three consumers.** It was true when written, but `layouts/events/schedule.html` was later built to merge `hugo.Data.events.events` with every file in `hugo.Data.events_archive` into a season-grouped view (current + archived seasons, toggled by a sidebar `<select>`, via `events-schedule.js`). That merge pattern works well and ships today. `layouts/index.html` and `layouts/events/list.html` were never updated to match it — they still read `hugo.Data.events.events` only.

### The bug this caused

A season rollover archives the *entire* outgoing file, including any events whose `start_date` is still current or upcoming relative to the rollover date (rollovers happen "around late August," not necessarily after the very last event of the outgoing season has passed). Tested 2026-08-17: rolling `2025-2026` → `2026-2027` archived events through Aug 31, 2026 — including an épée camp that was literally in progress (Aug 17–21) on rollover day. Those events immediately became invisible on:

- The homepage "next 4 upcoming events" section (`layouts/index.html:89` — `where hugo.Data.events.events "start_date" "ge" $today`)
- The interactive month/year calendar at `/events/` (`layouts/events/list.html` — `window.FENB_CAL.events` is built from `hugo.Data.events.events` only; browsing to the archived month shows nothing)

They remained visible only on `/events/schedule/`, because that page alone does the merge.

### Rejected alternative: reorganize by calendar year instead of season

Considered switching `data/events_archive/` to calendar-year files (`events_2026.yaml`, etc.) so "the currently viewed year" maps directly to a data file. Rejected: the fencing season runs Sept–Aug, not Jan–Dec, so a calendar-year split just relocates the same mid-file boundary problem from the quiet end of August to the middle of the season (Dec 31/Jan 1) — worse, since that's peak competition season. It would also require rebuilding `/events/schedule/`'s season selector as a year selector, discarding a working pattern, and would put it out of step with `data/join.yaml`, which already organizes around "season" as the site's real unit of time. Season-based archive files are kept.

### Fix: merge at the template layer, not the storage layer

Add `layouts/partials/all-events.html` — returns one flat slice of `hugo.Data.events.events` + every archived season's events (using Hugo's `{{ return }}` partial pattern, already used in `partials/event-date.html`). Point `index.html`'s upcoming-events query and `events/list.html`'s calendar JSON + no-JS fallback at this partial instead of `hugo.Data.events.events` directly. `events/schedule.html` keeps its own season-grouped merge (different output shape — grouped, not flat) but could be refactored to share the same underlying data-gathering step later; not required for this fix.

Once every "what's current/this month" query pulls from the full pool instead of the current-season file alone, archiving becomes a pure file-organization concern again — an event's visibility no longer depends on which file it physically lives in, which also means the rollover skill/script does **not** need special-case logic to avoid stranding not-yet-past events in the archive.

**Scale note:** current archive is one ~25 KB file (30 events/season). `plans/news-filter.md`'s Option A analysis treats ~300 KB of embedded JSON as comfortably fine for this site's traffic — at ~25–30 KB/season that's 10+ seasons before it's worth a second look. No action needed now; revisit if `events_archive/` ever holds double digits of files.

**Files to change:**

| File | Change |
|---|---|
| `layouts/partials/all-events.html` | New — returns flat, sorted (`start_date` asc) slice of current + all archived seasons' events |
| `layouts/index.html` | `$upcoming := where hugo.Data.events.events ...` → source from `partials/all-events.html` |
| `layouts/events/list.html` | `window.FENB_CAL.events` JSON blob and the `<noscript>` fallback loop → source from `partials/all-events.html` |

**Testing checklist:**

- [ ] Homepage shows the in-progress/upcoming August 2026 events without any new data being added
- [ ] `/events/` calendar, viewing August 2026, shows the archived-but-current events
- [ ] `/events/` calendar, viewing a fully-past month (e.g. October 2025), still renders correctly
- [ ] `/events/schedule/` still works unchanged (season dropdown, season-grouped blocks)
- [ ] No duplicate events between current and archived data (season files shouldn't overlap)
- [ ] `make build` succeeds and both EN/FR homepage + calendar pages render the merged set
