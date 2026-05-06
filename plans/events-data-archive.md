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
