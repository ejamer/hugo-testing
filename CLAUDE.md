# Claude Code Instructions

## Project overview

Hugo static site replacing www.fencingnb.ca, located in `fenb-1/`. Bilingual (English + French). See `fenb-1/hugo.toml` for site config.

## Reference files

- **`README.md`** — site structure, file layout, and how to add/update each content type (news, events, clubs). Read it when starting work on a new section or when unsure about data schemas.
- **`STYLE_GUIDE.md`** — brand colours, CSS conventions, i18n rules, bilingual file rules, naming conventions, and category colour reference. Read it before implementing any new visual element or content type.
- **`TODO.md`** — outstanding items that need follow-up. Update when pages are built or new placeholders are created.

## Outstanding TODOs

**At the start of every session, read `TODO.md`** in the repo root. Review each open item and flag to the user if any work in the session addresses or alters an item.

**When creating or modifying content**, check whether any new placeholder links, missing pages, or deferred decisions arise. If so, add a `- [ ]` entry to `TODO.md` under the relevant section before finishing. Mark items `- [x]` (and note the fix) when they are resolved.

## Development workflow

See **`DEVELOPMENT.md`** for the full branch strategy and build commands.

Key rules:
- **`main`** — production; pushing here triggers a GitHub Pages deploy. **Never commit directly.**
- **`dev`** — permanent development branch; all work lands here first. **Never delete.**
- **Feature branches** — cut from `dev`, PR back into `dev` when done, then delete.
- **Release** — PR from `dev` into `main`.

Dev server (run from `fenb-1/`): `/snap/bin/hugo server`
Production build: `/snap/bin/hugo --environment production && npx pagefind --site public`

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

## Nav chrome changes

Before implementing anything that touches the nav bar layout (adding/moving buttons, icons, or controls), confirm placement and behaviour with the user first. The nav has a fixed-height sticky layout and interactions between flex children are non-obvious — a short description or ASCII sketch avoids wasted implementation rounds.

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

If a layout provides its own page header inside `main`, set `hide_page_header: true` in the section's front matter to prevent `site-header.html` from also rendering one.

**When a user says "use the same header as page X"**, confirm whether they mean the *content* of the band (which title is shown) or just the *style* (height, colours) — they look similar in words but require completely different fixes.
