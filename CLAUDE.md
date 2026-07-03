# Claude Code Instructions

## Project overview

Hugo static site replacing www.fencingnb.ca, located in `fenb-1/`. Bilingual (English + French). See `fenb-1/hugo.toml` for site config.

## Reference files

- **`README.md`** — how to add/update each content type (news, events, clubs). Read it when starting work on a new section or when unsure about data schemas.
- **`docs/PROJECT_LAYOUT.md`** — full directory tree with file-by-file descriptions. Read it when navigating an unfamiliar part of the repo.
- **`docs/STYLE_GUIDE.md`** — brand colours, CSS conventions, i18n rules, bilingual file rules, naming conventions, category colours, shared components, and page header band usage.
- **`docs/TODO.md`** — outstanding items that need follow-up. Update when pages are built or new placeholders are created.
- **`docs/GOTCHAS.md`** — past build/template gotchas and their fixes. Read before working on XML templates, sitemaps, Hugo data files, or git submodules.
- **`plans/`** — detailed implementation plans for multi-session features. Read the relevant plan file before starting any TODO item that links to one.

## Outstanding TODOs

**At the start of every session, read `docs/TODO.md`**. Review each open item and flag to the user if any work in the session addresses or alters an item.

**When creating or modifying content**, check whether any new placeholder links, missing pages, or deferred decisions arise. If so, add a `- [ ]` entry to `docs/TODO.md` under the relevant section before finishing. Mark items `- [x]` (and note the fix) when they are resolved.

## Claude Code skills

Project skills live in `.claude/commands/` and are invoked with `/fenb-*` in the Claude Code CLI.

**All project-specific skills must use the `fenb-` prefix.** This keeps them distinct from global Claude Code skills when browsing with tab-completion or searching by name.

| Skill | What it does |
|---|---|
| `/fenb-git-commit` | Stage, commit, and push — handles branch checks, feature branch creation, and remote state |
| `/fenb-docs-update` | Review current git changes and assess whether system docs (CLAUDE.md, README.md, docs/*.md) need updating |
| `/fenb-git-merge` | Discover unmerged feature branches, let user select one, and open a PR into `dev` |
| `/fenb-git-release` | Production build check, bilingual parity check, and open a PR from `dev` into `main` |
| `/fenb-content-add-news` | Create a bilingual news article with correct filenames and front matter |
| `/fenb-content-add-page` | Create a new bilingual content page pair |
| `/fenb-content-add-results` | Generate a bilingual EN/FR news article from a saved results JSON file |
| `/fenb-data-get-results` | Fetch tournament results from fencingtimelive.com — hosted-tournament mode reports full podiums (all medalists, any province); away-tournament mode reports NB fencer placements |
| `/fenb-data-season-rollover` | Archive the current season's events and start a fresh `events.yaml` |

When adding a new skill, name the file `fenb-{type}-{name}.md` in `.claude/commands/`. Types: `git` (branch/commit/PR workflows), `content` (creating new pages or articles), `data` (fetching or managing structured data files).

## version.json

`fenb-1/static/version.json` is managed automatically by `/fenb-git-release` — do not edit it manually. See `docs/DEVELOPMENT.md` for the field schema.

## Content creation — use skills, not `hugo new`

`/fenb-content-add-news` and `/fenb-content-add-results` are the correct entry points for news articles. They enforce bilingual pair creation, correct filename format (`{mon}-{dd}-{slug}.{lang}.md`), year subfolder existence, and required front matter fields. Never use `hugo new` directly for news content.

## Development workflow

See **`docs/DEVELOPMENT.md`** for the full branch strategy and build commands.

Key rules:
- **`main`** — production; pushing here triggers a GitHub Pages deploy. **Never commit directly.**
- **`dev`** — permanent development branch; all work lands here first. **Never delete.**
- **Feature branches** — cut from `dev`, PR back into `dev` when done, then delete.
- **Release** — PR from `dev` into `main`.

Dev server: `make serve` | Production build: `make build-prod` | Clean: `make clean`

All `make` commands run from the repo root.

## Git commit and push — skills only

`git commit`, `git push`, and `git push -u` are **never run autonomously**. They may only execute inside the `/fenb-git-commit` or `/fenb-git-release` skills, which start with an explicit user confirmation gate. There are no exceptions: not for "small fixes", not for updating version files, not for anything.

## Key conventions

See **`docs/STYLE_GUIDE.md`** for brand colours, CSS conventions, i18n rules, bilingual file rules, naming conventions, and category colours.

- Structured content (events, clubs) lives in `fenb-1/data/` as YAML; layouts read it via `hugo.Data`
- **News article filenames:** `{mon}-{dd}-{title}.{lang}.md` in the year subfolder — the dot before `{lang}` is required; a dash breaks Hugo's translation linking (see docs/STYLE_GUIDE.md)
- **Recurring event slugs:** for tournaments that repeat annually, include the year in the slug — e.g. `east-coast-games-2026-registration`. This prevents cross-season collisions in the archive.
- **News article images** — this is the standard way to add images to a news article; the legacy inline `figure` shortcode still works but is discouraged for new articles. Front matter fields (no shortcodes needed in the body):
  - `image` + `image_alt` — renders a centred logo/image above the article body (`.fenb-article-event-logo` styling)
  - `image_dark` (optional) — a light-on-dark variant of `image`, swapped in automatically under `[data-theme="dark"]`. Only add it if the default `image` doesn't read well on a dark background.
  - `photos` — list of `{src, alt, caption}` objects; rendered as a responsive grid below the article body. `caption` is optional per item. Example:
    ```yaml
    image: "images/canada-games/qc2027-logo-horizontal.png"
    image_dark: "images/canada-games/qc2027-logo-horizontal-dark.png"
    image_alt: "Canada Winter Games 2027 — Quebec City"
    photos:
      - src: "images/news/2026/cwg-2027-team-staff-jim-stevens.jpeg"
        alt: "Jim Stevens, Team Coach"
        caption: "Jim Stevens — Team Coach"
    ```
    Paths must not have a leading slash (see URL paths rule above).

## Pattern reuse — check before creating

Before adding any new visual element (card, banner, callout, heading style), **first check `docs/STYLE_GUIDE.md`** (Shared UI components) and shared partials in `layouts/partials/`. If an existing component almost fits, add a CSS modifier class (e.g. `fenb-callout--quote`) rather than a new component.

## Post-mortem

After completing a feature, ask the user whether a post-mortem is needed. A post-mortem covers:

1. **What worked** — approaches that were right first time and worth repeating
2. **What didn't** — missteps, reversals, or wasted implementation rounds, and why they happened
3. **Docs** — whether `README.md`, `docs/STYLE_GUIDE.md`, or `CLAUDE.md` need updating to reflect new conventions or schema changes

Always get user approval on the proposed changes before editing any docs.

## `gh` CLI — TTY and output quirks

All `gh` commands that produce output (lists, JSON, status) must be wrapped with `script -q -c "..." /dev/null` to get visible output in non-TTY environments. Without the wrapper, commands silently return nothing — including `--json` variants.

```bash
script -q -c "gh pr list --state open" /dev/null
```

Use `--input` for complex `gh api` payloads that contain special characters.

## `gh pr merge` requires an explicit PR number

Never run `gh pr merge` without specifying a PR number. Without one, `gh` resolves to the current branch's PR — if you're on `dev`, it can delete `dev`.

Always capture the PR number from `gh pr create` output and pass it explicitly:

```bash
gh pr merge $PR_NUMBER --merge --delete-branch
```

## Nav chrome changes

Before implementing anything that touches the nav bar layout (adding/moving buttons, icons, or controls), confirm placement and behaviour with the user first. After any nav change, verify the result in the browser before reporting done.

**Direct-child selectors in nav CSS:** whenever you add a nested `<ul>` or `<li>` inside `.fenb-nav-links`, use direct-child selectors (`> ul`, `> ul > li`, `> ul > li:last-child`) to prevent bleed-through into dropdowns. `fenb-nav.css` already uses this pattern.

**`--nav-height` is the single source of truth for nav bar height.** It is defined in `fenb-base.css` (`:root`) and referenced via `var(--nav-height)` in both `.fenb-nav-inner` (height) and `.fenb-nav-links.is-open` (top offset in the mobile menu). If the nav height ever changes, update only `--nav-height` — never hardcode the pixel value in CSS or templates.

## Hugo data file naming

**Never use hyphens in data filenames. Use underscores** (e.g. `board_members.yaml`, `join_paths.yaml`). Hugo stores the data key as the literal filename, so `program-cards.yaml` produces key `program-cards` — a syntax error in Go template dot notation. The page renders silently empty with no build error.

Match the top-level YAML key to the filename exactly. Only create data files for genuinely editable content — static structural elements belong directly in the template.

## URL paths — the no-leading-slash rule

Both `absURL` and `relLangURL`/`relURL` treat a leading `/` as host-root-relative, stripping the base URL's path component. With the GitHub Pages `baseURL` (`/hugo-testing/`):

- `"/events/" | relLangURL` → `/events/` ❌ (base path lost)
- `"events/" | relLangURL` → `/hugo-testing/events/` ✓

**Rule: never use a leading `/` with any Hugo URL function.** This applies to hardcoded strings in templates and to paths stored in data YAML files piped through URL functions.

## Sweep rule — before any structural git or template change

Before renaming a field, moving a file, or restoring a submodule, grep for related references first:

```bash
grep -rn 'field_name' fenb-1/layouts/ fenb-1/static/js/ .claude/commands/
git ls-files | grep -i 'relevant_name'
```

## Verify output content, not just output existence

After generating any file output (RSS feed, sitemap, JSON endpoint), inspect the actual content before declaring done. An empty feed, missing field, or leading whitespace character are silent failures that only surface when a user opens the output.
