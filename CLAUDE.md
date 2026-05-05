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

## Nav chrome changes

Before implementing anything that touches the nav bar layout (adding/moving buttons, icons, or controls), confirm placement and behaviour with the user first. The nav has a fixed-height sticky layout and interactions between flex children are non-obvious — a short description or ASCII sketch avoids wasted implementation rounds.
