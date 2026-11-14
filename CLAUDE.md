# Claude Code Instructions

Keep this file lean — it is re-sent on every turn. Put detail in `README.md` / `docs/*.md` and leave a one-line pointer here.

## Project overview

Hugo static site replacing www.fencingnb.ca, located in `fenb-1/`. Bilingual (English + French). See `fenb-1/hugo.toml` for site config.

## Reference files

- **`README.md`** — how to add/update each content type (news, events, clubs), data schemas, news image front matter, season rollover.
- **`docs/PROJECT_LAYOUT.md`** — folder tree, plus tables of data files, layouts, partials, JS and scripts.
- **`docs/STYLE_GUIDE.md`** — brand colours, CSS conventions, i18n/bilingual rules, naming, shared components, URL path rules, nav CSS.
- **`docs/DEVELOPMENT.md`** — branches, builds, Hugo/Pagefind pins, `gh` quirks, Claude Code permissions.
- **`docs/GOTCHAS.md`** — read before working on XML templates, sitemaps, data files, submodules, third-party PDFs, headless/Playwright testing, or JS show/hide toggles.
- **`plans/TODO.md`** — outstanding items. **Don't read it unless the user asks.**
- **`plans/`** — implementation plans for multi-session features.

When creating or modifying content that leaves a placeholder link, missing page, or deferred decision, add a `- [ ]` entry to `plans/TODO.md`. Resolved items are deleted, not ticked.

## Skills

Project skills live in `.claude/commands/`, all prefixed `fenb-`, named `fenb-{type}-{name}.md` (types: `git`, `content`, `data`, `docs`).

## Git — skills only

- **`main`** — production; never commit directly. **`dev`** — all work lands here; never delete. Release = PR from `dev` into `main`.
- `git commit` / `git push` run **only** inside `/fenb-git-commit` or `/fenb-git-release`, behind their single confirmation popup. No exceptions. Don't add extra prompts inside those skills.
- Scripts in `scripts/` write files only — never `git add`/`commit`/`push`.
- `gh pr merge` always takes an explicit PR number (without one, on `dev`, it can delete `dev`).

Dev server: `make serve` | Production build: `make build-prod` | Clean: `make clean` (all from repo root).

## Don't hand-edit

- `fenb-1/static/version.json` — managed by `/fenb-git-release`.
- Hugo / Pagefind version pins — change only via `scripts/check-hugo-version.sh --set` / `scripts/check-pagefind-version.sh --set`. Never a bare `npx pagefind`.

## Key conventions

- News articles: create via `/fenb-content-add-news` or `/fenb-content-add-results`, never `hugo new`. Filenames are `{mon}-{dd}-{slug}.{lang}.md` — the **dot** before `{lang}` is required.
- Structured content lives in `fenb-1/data/` as YAML. **Data filenames use underscores, never hyphens** (a hyphenated key renders silently empty). Bilingual fields are `x_en`/`x_fr` with `_fr` falling back to `_en`; read them via `partial "localized.html"`.
- **Never use a leading `/` with Hugo URL functions** (`relLangURL`, `absURL`, etc.) — it drops the `/hugo-testing/` base path. Exceptions (`results_url_*`, `details_url_*`) are in STYLE_GUIDE.
- Before adding a new visual element, check STYLE_GUIDE's shared components and `layouts/partials/`; prefer a modifier class over a new component.
- Nav bar changes: confirm placement with the user first, and verify in the browser before reporting done.

## Post-mortem

After completing a feature, ask whether a post-mortem is wanted (what worked, what didn't, doc updates). Get approval before editing any docs.
