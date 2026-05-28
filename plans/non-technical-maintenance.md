# Plan: Non-Technical Content Maintenance

## Problem

The site's current editing workflow assumes a developer: git branch management, raw YAML editing, Markdown front matter, bilingual pair creation with exact filename conventions, local Hugo installation, and command-line tools. A non-technical maintainer (e.g. a FENB administrator) cannot reliably perform routine content updates without introducing errors that are either silent or produce cryptic build failures.

## Content types and current barriers

| Content type | Frequency | Barriers |
|---|---|---|
| Add event | Weekly/monthly | Raw YAML append, indentation errors, category ID must match canonical list |
| Update board members | Annual | Raw YAML edit, bilingual role fields |
| News article | Monthly | Bilingual pair, exact filename format, front matter fields, year subfolder |
| Tournament results | Post-event | Existing Python script + `/fenb-data-get-results` skill (already mostly scripted) |
| Update join URLs (2MEV, club form) | Annual | Raw YAML field edit |
| Add club | Rare | YAML append + image file upload |
| Add policy / AGM minutes | Rare | Markdown pair + `data/policies.yaml` entry + PDF upload |
| Season rollover | Annual | Multi-step; existing `/fenb-data-season-rollover` skill |

## Specific failure modes to prevent

1. **YAML indentation error** — silently drops events or crashes the build with a cryptic error
2. **Wrong category ID** — `result` instead of `results`; wrong or missing badge colour, no build error
3. **Missing FR bilingual pair** — language switcher broken on that article; no build error
4. **Filename hyphen vs dot** — `article-en.md` instead of `article.en.md` breaks translation linking silently
5. **Missing year subfolder `_index.md`** — first article of a new year breaks the news listing
6. **Forgetting `translationKey`** in policy files — language switcher broken on that policy
7. **Direct commit to `main`** — bypasses the review gate and immediately deploys to production
8. **Data file named with hyphens** — `new-file.yaml` produces a TOML-inaccessible key (see CLAUDE.md)

## Chosen approach: three phases

### Phase 1 — Shell scripts + editor guide

Interactive shell scripts handle the most frequent data tasks. The editor runs a script, answers prompts, and gets correctly-formatted YAML appended to the right file. No YAML knowledge, no filename decisions, no category memorization required.

**Scripts to write** (in `scripts/`):

#### `scripts/add-event.sh`

Prompts: title, date (validated as YYYY-MM-DD), optional end_date, category (numbered menu from `event_categories.yaml`), venue, location, optional details/registration/results URLs.

Validates:
- Date format (reject non-ISO input immediately)
- Category against the canonical list in `data/event_categories.yaml` (numbered menu, not free-text entry)
- Non-empty required fields

Appends a correctly-indented YAML block to `fenb-1/data/events.yaml` and prints a confirmation with the event's display date.

#### `scripts/add-board-member.sh`

Prompts: name, English role, French role, optional card_color (numbered menu: default/teal/crimson).

Appends to the `members:` list in `fenb-1/data/board_members.yaml`.

#### `scripts/update-join-urls.sh`

Prompts for the 2MEV registration URL and the club registration Google Form URL (with option to leave blank). Does an in-place update of the relevant fields in `fenb-1/data/join.yaml` using `sed` or Python, printing the old and new values for confirmation.

**Editor guide** (`EDITOR_GUIDE.md` in repo root):

A 2-page plain-language guide covering:
1. What tools you need installed (bash, git — nothing else for data tasks)
2. Routine tasks: run this script, review the output, commit
3. News articles: use `/fenb-content-add-news` in Claude Code, or follow the step-by-step checklist below
4. How to submit changes for review (create PR to `dev`, tag reviewer)
5. What NOT to touch (templates, CSS, `main` branch directly)

The editor guide is the human-readable complement to the developer README.

---

### Phase 2 — Staging preview + branch protection

**Staging deployment via GitHub Actions:**

Add `.github/workflows/deploy-staging.yml` that triggers on every push to `dev`, runs `make build-prod`, and deploys to a second GitHub Pages URL (e.g. a `gh-pages-staging` branch, served at a separate path or subdomain).

This lets an editor see their changes rendered before requesting a PR to `main`. Removes the primary anxiety of "did I break something?" without requiring a local Hugo install.

**Branch protection on `main`:**

Enable `Require a pull request before merging` with at least one required approval on the `main` branch. Editors push to `dev` or a feature branch, a technical reviewer approves the PR to `main` before production deploy. This is a one-time GitHub repository settings change.

---

### Phase 3 — Decap CMS web UI (optional / if needed)

[Decap CMS](https://decapcms.org/) (formerly Netlify CMS) is a git-backed headless CMS that adds an `/admin` web interface to the site. An editor logs in with GitHub, fills out forms, and Decap commits to the repo on their behalf. No git knowledge required.

Use this phase if: (a) the editor has zero terminal comfort, or (b) news article frequency is high enough that the checklist approach in Phase 1 is unreliable.

**Implementation steps:**

1. Add `fenb-1/static/admin/index.html` (Decap CMS loader) and `fenb-1/static/admin/config.yml`
2. Configure collections in `config.yml` (see schema notes below)
3. Set up GitHub OAuth — either via Netlify Identity (free tier) or a small OAuth proxy (e.g. `netlify-cms-github-oauth-provider` deployed to a free host)
4. Deploy: `admin/` ships as static files with the Hugo build, no server needed
5. Document the `/admin` URL for the editor; no link needed in the public nav

**Decap CMS collection schema:**

| Collection | Maps to | Notes |
|---|---|---|
| `events` | `data/events.yaml` (list field) | All event fields as typed inputs; category as select |
| `board_members` | `data/board_members.yaml` (list field) | name, role_en, role_fr, card_color select |
| `clubs` | `data/clubs.yaml` (list field) | Includes media upload for logo |
| `news_en` | `content/news/YYYY/*.en.md` | Markdown body + front matter fields |
| `news_fr` | `content/news/YYYY/*.fr.md` | Matching French collection |
| `join_urls` | `data/join.yaml` | Just the two URL fields |

**Bilingual limitation:**

Decap does not natively pair EN/FR article files. The `news_en` and `news_fr` collections are independent. The editor must create both — document this clearly in the editor guide and in the Decap UI via `hint:` fields. This is a known limitation; accepting it is simpler than a custom widget.

**Media library:**

Configure the Decap media folder to point to `fenb-1/static/images/`. This gives the editor a browser for uploaded images (club logos, hero slides) without needing to use git for file uploads.

---

## Decision log

**Why shell scripts before Decap CMS?**
Scripts are low-risk (no new infrastructure, no OAuth setup, no config file to maintain), cover the most frequent tasks (events, board), and can be written and tested incrementally. Decap is higher effort and only worthwhile if the editor genuinely cannot use a terminal.

**Why not a full custom web app?**
A bespoke form-to-GitHub-API app would require hosting, maintenance, and auth management. Decap already solves this problem and is purpose-built for static site workflows.

**Bilingual requirement — accept the limitation?**
Yes. Requiring a perfectly paired EN/FR article from a non-technical editor is unrealistic regardless of tooling. The pragmatic approach: scripts and Decap both create the EN file; the FR file is created separately (either by the editor following the guide, or by a translator with Claude Code assistance). A broken language switcher on one article is recoverable; a broken YAML file blocks all events.

**Direct commit to `dev` vs feature branch for editors?**
Editors commit directly to `dev`. Feature branches add complexity with no benefit for non-developer content updates. The staging preview + required PR review on `main` provides the safety gate.

## Implementation order

1. `scripts/add-event.sh` — highest-frequency task, biggest error surface
2. `scripts/add-board-member.sh` — annual but easy to get wrong
3. `EDITOR_GUIDE.md` — needed before handing off to anyone
4. `.github/workflows/deploy-staging.yml` + `main` branch protection
5. `scripts/update-join-urls.sh` — annual, low urgency
6. Decap CMS — only if Phase 1–2 proves insufficient

## Files created or modified

| File | Action | Phase |
|---|---|---|
| `scripts/add-event.sh` | Create | 1 |
| `scripts/add-board-member.sh` | Create | 1 |
| `scripts/update-join-urls.sh` | Create | 1 |
| `EDITOR_GUIDE.md` | Create | 1 |
| `.github/workflows/deploy-staging.yml` | Create | 2 |
| `fenb-1/static/admin/index.html` | Create | 3 |
| `fenb-1/static/admin/config.yml` | Create | 3 |
