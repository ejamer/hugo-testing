# Claude Code Instructions

## Project overview

Hugo static site replacing www.fencingnb.ca, located in `fenb-1/`. Bilingual (English + French). See `fenb-1/hugo.toml` for site config.

## Reference files

- **`README.md`** — site structure, file layout, and how to add/update each content type (news, events, clubs). Read it when starting work on a new section or when unsure about data schemas.
- **`STYLE_GUIDE.md`** — brand colours, CSS conventions, i18n rules, bilingual file rules, naming conventions, and category colour reference. Read it before implementing any new visual element or content type.
- **`TODO.md`** — outstanding items that need follow-up. Update when pages are built or new placeholders are created.
- **`plans/`** — detailed implementation plans for multi-session features. Files here are referenced from TODO.md items when a task is too detailed for the checklist itself. Read the relevant plan file before starting any TODO item that links to one.

## Outstanding TODOs

**At the start of every session, read `TODO.md`** in the repo root. Review each open item and flag to the user if any work in the session addresses or alters an item.

**When creating or modifying content**, check whether any new placeholder links, missing pages, or deferred decisions arise. If so, add a `- [ ]` entry to `TODO.md` under the relevant section before finishing. Mark items `- [x]` (and note the fix) when they are resolved.

## Claude Code skills

Project skills live in `.claude/commands/` and are invoked with `/fenb-*` in the Claude Code CLI.

**All project-specific skills must use the `fenb-` prefix.** This keeps them distinct from global Claude Code skills when browsing with tab-completion or searching by name.

| Skill | What it does |
|---|---|
| `/fenb-commit` | Stage, commit, and push — handles branch checks, feature branch creation, and remote state |
| `/fenb-merge-features` | Discover unmerged feature branches, let user select one, and open a PR into `dev` |
| `/fenb-new-news` | Create a bilingual news article with correct filenames and front matter |
| `/fenb-new-page` | Create a new bilingual content page pair |
| `/fenb-season-rollover` | Archive the current season's events and start a fresh `events.yaml` |
| `/fenb-release` | Production build check, bilingual parity check, and open a PR from `dev` into `main` |
| `/fenb-get-results` | Fetch recent tournament results from fencingtimelive.com and report NB fencer placements |

When adding a new skill, name the file `fenb-{name}.md` in `.claude/commands/`.

## Development workflow

See **`DEVELOPMENT.md`** for the full branch strategy and build commands.

Key rules:
- **`main`** — production; pushing here triggers a GitHub Pages deploy. **Never commit directly.**
- **`dev`** — permanent development branch; all work lands here first. **Never delete.**
- **Feature branches** — cut from `dev`, PR back into `dev` when done, then delete.
- **Release** — PR from `dev` into `main`.

Dev server: `make serve`
Production build: `make build-prod`
Clean build artifacts: `make clean`

All `make` commands run from the repo root.

## Key conventions

See **`STYLE_GUIDE.md`** for brand colours, CSS conventions, i18n rules, bilingual file rules, naming conventions, category colours, and page header band usage.

- Structured content (events, clubs) lives in `fenb-1/data/` as YAML; layouts read it via `hugo.Data`
- **News article filenames:** `{mon}-{dd}-{title}.{lang}.md` in the year subfolder — the dot before `{lang}` is required; a dash breaks Hugo's translation linking (see STYLE_GUIDE.md)

## Post-mortem

After completing a feature, ask the user whether a post-mortem is needed. A post-mortem covers:

1. **What worked** — approaches that were right first time and worth repeating
2. **What didn't** — missteps, reversals, or wasted implementation rounds, and why they happened
3. **Docs** — whether `README.md`, `STYLE_GUIDE.md`, or `CLAUDE.md` need updating to reflect new conventions or schema changes

Always get user approval on the proposed changes before editing any docs.

## Events data schema and season archive

`fenb-1/data/events.yaml` holds the current season. Required top-level fields:
- `season` — display label with en-dash (e.g. `"2025–2026"`); drives the schedule page season dropdown label
- `events` — list of event objects (see README.md for the full field schema)

The events calendar page subtitle (shown in the page header band) is set separately in `content/events/_index.md` and `content/events/_index.fr.md` via `description:` front matter — update both files at the start of each season.

**Season rollover:** move `data/events.yaml` → `data/events_archive/YYYY-YYYY.yaml` (regular hyphen in the filename), then create a fresh `data/events.yaml` for the new season. The schedule page at `/events/schedule/` picks up all files in `data/events_archive/` automatically via Hugo's data folder — no layout or template changes needed.

Also update the events calendar page subtitle in `content/events/_index.md` and `content/events/_index.fr.md` to match the new season label — e.g. `description: "2026–2027 season schedule"`. These files drive the subtitle shown in the page header band.

**Schedule page filter pattern:** `/events/schedule/` uses SSR + JS visibility toggling. Hugo renders every event with `data-season` and `data-category` HTML attributes; `static/js/events-schedule.js` shows/hides them in response to the season dropdown and category filter buttons. Print always reflects the current filtered state. Prefer this pattern over JS-only rendering for any future filterable list page — it gives a no-JS fallback and print support for free.

## `gh pr merge` requires an explicit PR number

Never run `gh pr merge` without specifying a PR number. Without one, `gh` resolves to the PR associated with the *current branch* — which may not be the PR you just created. If you are on `dev` when you run it, it will find the most recent `dev→main` PR and can delete `dev`.

Always capture the PR number from `gh pr create` output and pass it explicitly:

```bash
gh pr merge $PR_NUMBER --merge --delete-branch
```

Extract `$PR_NUMBER` from the URL returned by `gh pr create` (the integer at the end).

## Nav chrome changes

Before implementing anything that touches the nav bar layout (adding/moving buttons, icons, or controls), confirm placement and behaviour with the user first. The nav has a fixed-height sticky layout and interactions between flex children are non-obvious — a short description or ASCII sketch avoids wasted implementation rounds.

## Hugo data file naming

**Never use hyphens in data filenames. Use underscores as word separators** (e.g. `board_members.yaml`, `join_paths.yaml`). Hugo stores the data key as the literal filename (without extension), so `program-cards.yaml` produces a key of `program-cards`. Go templates cannot use hyphens in dot-notation identifiers, meaning `hugo.Data.program-cards` is a syntax error and `hugo.Data.program_cards` silently returns nil. The page renders empty with no error. `hero_slides.yaml` is the established pattern in this repo.

Match the top-level YAML key to the filename exactly (e.g. file `join_paths.yaml` → top-level key `join_paths:`).

**Only create a data file for genuinely editable content** — clubs, events, board members, hero slides. Static structural elements (a fixed set of cards, navigation icons) belong directly in the template. Data files add indirection without benefit when the content never changes.

## Hugo `absURL` with leading slash

`absURL` treats a leading `/` as **domain-root-relative** and ignores the base path. With `baseURL = "https://ejamer.github.io/hugo-testing/"`:

- `"/pagefind/x.js" | absURL` → `https://ejamer.github.io/pagefind/x.js` ❌ (subpath lost)
- `"pagefind/x.js" | absURL` → `https://ejamer.github.io/hugo-testing/pagefind/x.js` ✓

Always omit the leading slash when using `absURL` for site-root-relative paths that must include the base path.

This is especially important for paths embedded in `<script>` strings, where `canonifyURLs` does **not** apply post-processing.

## Hugo template `sort` syntax

Pipe passes the value as the **last** argument, but `sort` expects the collection first — so `collection | sort "Key" "dir"` silently sorts the string `"Key"` instead of the collection. Always write it positionally: `sort .MyCollection "FieldName" "desc"`.

## Embedding Hugo data in `<script>` tags

Go's `html/template` applies JS-context escaping inside `<script>` blocks. A slice passed through `| jsonify` is output as a **quoted JSON string** rather than a raw array. Fix: embed normally and parse in JS:

```html
<script>
window.MY_DATA = { events: {{ .events | jsonify }} };
</script>
```

```js
// In the JS file:
var events = typeof cal.events === 'string' ? JSON.parse(cal.events) : cal.events;
```

`safeJS` does **not** bypass this — it only prevents double-escaping of already-safe JS values, not the context-aware string-wrapping. Go straight to `JSON.parse()`.

## Hugo deprecated front matter and template APIs

These were caught as build errors in this project:

- **`_build:`** front matter key was removed in Hugo 0.145.0 — use **`build:`** instead.
- **`.Language.LanguageName`** was deprecated in Hugo 0.158.0 — use **`.Language.Label`** instead.

## i18n language-switcher labels

When rendering an "also available in [language]" link, the label text must be in the **target language** (the one you're switching *to*), not the current page's language. Achieve this by storing the label in the *opposite* language's i18n file:

```yaml
# en.yaml — shown on EN pages, so write it in French
policies_also_in: "Aussi disponible en"

# fr.yaml — shown on FR pages, so write it in English
policies_also_in: "Also available in"
```

The language name itself (`.Language.Label`) comes from the translation page and is already correct — only the surrounding label text needs this treatment.

## Page header band

`site-header.html` renders a coloured `.fenb-page-header` band below the nav for all non-home pages. By default it shows the page's own `.Title`.

If a section's single pages should show the **section title** in the band instead (e.g. "News & Results" on every news article), add this cascade to the section's `_index.md` and `_index.fr.md`:

```yaml
cascade:
  - target:
      kind: page
    page_header_uses_section: true
```

`site-header.html` checks `.Params.page_header_uses_section` and substitutes `.CurrentSection.Title` / `.CurrentSection.Params.description` when set. The `_target: kind: page` scoping means the section's list page is unaffected.

**Preferred approach for a subtitle:** set `description:` in the section's `_index.md` / `_index.fr.md` front matter. The partial already reads `.Params.description` and renders it as the page subtitle — no template changes needed.

Only use `hide_page_header: true` when the layout must render its own header with **dynamic content** (e.g. the clubs page, which shows the live club count in the subtitle). Pair it with an explicit `<header class="fenb-page-header">` block in the layout. Never use it simply to add a static subtitle — use `description:` instead.

**When a user says "use the same header as page X"**, confirm whether they mean the *content* of the band (which title is shown) or just the *style* (height, colours) — they look similar in words but require completely different fixes.
