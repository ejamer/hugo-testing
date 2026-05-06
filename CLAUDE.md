# Claude Code Instructions

## Project overview

Hugo static site replacing www.fencingnb.ca, located in `fenb-1/`. Bilingual (English + French). See `fenb-1/hugo.toml` for site config.

## Reference files

- **`README.md`** — authoritative reference for site structure, conventions, page status, and how to add content. Read it when starting work on a new section or when unsure about a pattern. Update the Pages table and any relevant sections when new pages are built or conventions change.
- **`TODO.md`** — outstanding items that need follow-up.

## Outstanding TODOs

**At the start of every session, read `TODO.md`** in the repo root. Review each open item and flag to the user if any work in the session addresses or alters an item.

**When creating or modifying content**, check whether any new placeholder links, missing pages, or deferred decisions arise. If so, add a `- [ ]` entry to `TODO.md` under the relevant section before finishing. Mark items `- [x]` (and note the fix) when they are resolved.

## Key conventions

- Brand colours: `#006156` (teal) and `#79242f` (crimson) — defined as CSS vars in `fenb-1/assets/ananke/css/fenb.css`
- All UI text goes through `i18n` — add keys to both `fenb-1/i18n/en.yaml` and `fenb-1/i18n/fr.yaml`
- Every content page needs both an English (`_index.md`) and French (`_index.fr.md`) version so the language switcher links directly between them rather than falling back to the home page
- Structured content (events, clubs) lives in `fenb-1/data/` as YAML; layouts read it via `hugo.Data`
- Custom CSS only — no inline styles for anything that will be reused; add classes to `fenb.css`
- Dev server: run `/snap/bin/hugo server` from `fenb-1/`
- Production build (required for search): `/snap/bin/hugo --environment production && npx pagefind --site public` from `fenb-1/`
- For dev with search working: `/snap/bin/hugo && npx pagefind --site public && /snap/bin/hugo server --renderStaticToDisk`
- Hero elements wider than `.fenb-hero-content` (max-width ~760px) use a negative-margin breakout: `width: Xvw; margin: 0 calc((100% - Xvw) / 2)`. This centers the element on the viewport while leaving surrounding text content at its normal width.

## Post-mortem

After completing a feature, ask the user whether a post-mortem is needed. A post-mortem covers:

1. **What worked** — approaches that were right first time and worth repeating
2. **What didn't** — missteps, reversals, or wasted implementation rounds, and why they happened
3. **Docs** — whether `README.md` or `CLAUDE.md` need updating to reflect new conventions or schema changes

Always get user approval on the proposed changes before editing any docs.

## Nav chrome changes

Before implementing anything that touches the nav bar layout (adding/moving buttons, icons, or controls), confirm placement and behaviour with the user first. The nav has a fixed-height sticky layout and interactions between flex children are non-obvious — a short description or ASCII sketch avoids wasted implementation rounds.

## Page header band

`site-header.html` renders a coloured `.fenb-page-header` band below the nav for all non-home pages. By default it shows the page's own `.Title`.

If a section's single pages should show the **section title** in the band instead (e.g. "News & Results" on every news article), add this cascade to the section's `_index.md` and `_index.fr.md`:

```yaml
cascade:
  - _target:
      kind: page
    page_header_uses_section: true
```

`site-header.html` checks `.Params.page_header_uses_section` and substitutes `.CurrentSection.Title` / `.CurrentSection.Params.description` when set. The `_target: kind: page` scoping means the section's list page is unaffected.

If a layout provides its own page header inside `main`, set `hide_page_header: true` in the section's front matter to prevent `site-header.html` from also rendering one.

**When a user says "use the same header as page X"**, confirm whether they mean the *content* of the band (which title is shown) or just the *style* (height, colours) — they look similar in words but require completely different fixes.
