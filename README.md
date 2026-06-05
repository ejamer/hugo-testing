# Fencing-Escrime NB — Website

This repo is testing a replacement tech stack for [fencingnb.ca](https://fencingnb.ca), generating a static site built with Hugo.

**[► View live site](https://ejamer.github.io/hugo-testing/)**

## Related docs

| File | Covers |
|------|--------|
| [CLAUDE.md](CLAUDE.md) | Instructions and conventions for Claude Code; lists available `/fenb-*` skills |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Branch strategy, local build commands, GitHub Pages deployment |
| [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) | Brand, CSS, i18n, bilingual rules, naming conventions, category colours |
| [docs/PROJECT_LAYOUT.md](docs/PROJECT_LAYOUT.md) | Full directory tree with file-by-file descriptions |
| [docs/TODO.md](docs/TODO.md) | Outstanding items |

### Claude Code skills

Content and data workflows are available as Claude Code skills (invoked with `/fenb-*` in the CLI):

| Skill | What it does |
|---|---|
| `/fenb-content-add-news` | Create a bilingual news article with correct filenames and front matter |
| `/fenb-content-add-page` | Create a new bilingual content page pair |
| `/fenb-content-add-results` | Generate a bilingual EN/FR news article from a saved results JSON file |
| `/fenb-data-get-results` | Fetch recent tournament results from fencingtimelive.com and report NB fencer placements |
| `/fenb-data-season-rollover` | Archive the current season's events and start a fresh `events.yaml` |

For git and release workflow skills (`/fenb-git-commit`, `/fenb-git-merge`, `/fenb-git-release`), see `docs/DEVELOPMENT.md`.

---

## Scripts

Utility scripts live in `scripts/`. They are independent of the Hugo build — run them from the repo root with `python3 scripts/<name>.py`.

### fencingtimelive-results.py

Fetches recent tournament results from [fencingtimelive.com](https://www.fencingtimelive.com) and checks each event for NB fencer participation, matching competitors against the club list in `fenb-1/data/clubs.yaml`.

> **Skill available:** run `/fenb-data-get-results` in Claude Code — it handles parameters, login, tournament selection, and result reporting interactively.

**Usage:**

```bash
# Option A — browser login (recommended): opens system Chrome for Google sign-in
python3 scripts/fencingtimelive-results.py

# Option B — manual cookie: copy Cookie header from browser DevTools
python3 scripts/fencingtimelive-results.py --cookie "connect.sid=...;AWSALB=..."

# Other options
python3 scripts/fencingtimelive-results.py --country USA --days -2
python3 scripts/fencingtimelive-results.py --help
```

| Flag | Default | Notes |
|---|---|---|
| `--cookie` | *(opens browser)* | Full `Cookie:` header string from DevTools; omit to use browser login |
| `--country` | `CAN` | FIE country code |
| `--days` | `-1` | `-2` last 30 days, `-1` last 10 days, `0` in progress, `1` next 7 days |
| `--list` | — | Print tournament list as JSON and exit (used by skill) |
| `--select N` | — | Skip interactive picker, use tournament N from the list (used by skill) |

**Authentication:** the site uses Google OAuth, which cannot be automated. On first run, system Chrome opens and you complete the Google login normally. The session is saved to `scripts/.browser-profile/` (gitignored) and reused on subsequent runs until it expires.

**Output:** JSON written to `scripts/output/<tournament-slug>-<date>.json` (gitignored) and printed to stdout. Progress logs go to stderr, so `python3 scripts/fencingtimelive-results.py > out.json` captures only the JSON.

**Dependencies:** `pip install playwright pyyaml` — no extra browser install needed; the script uses system Chrome.

---

## Adding content

### Site-wide announcement banner

A sticky red banner can be shown across all pages to alert visitors (e.g. "draft site", maintenance notices). It sticks with the nav so it never scrolls out of view.

All settings live in `fenb-1/hugo.toml` under `[params.announcement]`:

```toml
[params.announcement]
  enabled    = true          # false = banner hidden, no layout impact
  bg_color   = "#cc0000"    # background colour (any CSS colour value)
  text_color = "#ffffff"    # text colour
  text_en    = "DRAFT — EXPLORING WEBSITE UPDATE OPTIONS"
  text_fr    = "BROUILLON — EXPLORATION DES OPTIONS DE MISE À JOUR DU SITE"
```

**To hide the banner:** set `enabled = false`.  
**To change the message:** edit `text_en` and `text_fr`.  
**To change colours:** edit `bg_color` and `text_color`.

The banner is rendered by `layouts/partials/site-announcement.html` and hidden from print output automatically.

---

### New news post

> **Skill available:** run `/fenb-content-add-news` in Claude Code — it prompts for date, slug, titles, category, and summaries, then creates both language files with correct front matter and filenames.

**File naming:** `{mon}-{dd}-{title}.{lang}.md` inside the year subfolder — see [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for the full naming convention.

Example: `content/news/2026/jun-01-provincial-team-announced.en.md` + `.fr.md`

**Front matter:**

```yaml
---
title: "Post title"
date: 2026-06-01
category: results   # canonical ID — drives CSS colour, badge label (via i18n), and results table
summary: "One-sentence summary shown on the homepage card."
---

Full post body here (Markdown).
```

**Category values:**

| `category` | Badge label (EN) | Badge label (FR) | Colour | Notes |
|---|---|---|---|---|
| `results` | Results | Résultats | Teal | Also loads the interactive results table |
| `announcement` | Announcement | Annonce | Crimson | |
| `registration` | Registration | Inscription | Green | |
| `community` | Community | Communauté | Navy | |

The article page header band shows "News & Results" (the section title) rather than the article title — controlled by `page_header_uses_section: true` in the news `_index.md` cascade. The article title appears in the scrolling body below the band.

**New year folder:** when the first article of a new calendar year is created, add a year subfolder with `_index.md` and `_index.fr.md` (copy from the previous year folder).

**Internal links in article body:** use Hugo's `relref` shortcode rather than hardcoded paths. `relref` resolves to the correct URL at build time (including language prefix) and produces a build error if the target page doesn't exist.

```markdown
Visit our [club directory]({{< relref "clubs/" >}}) for more information.
```

Do **not** write `[clubs](/clubs/)` or `[clubs](/fr/clubs/)` — root-relative paths skip the base URL and will silently break if the site is ever served from a subdirectory. `relref` is language-aware: in a French article it automatically resolves to the French version of the target page.

Note: `relref` only works for Hugo content pages (`content/`). For links to static files (PDFs in `static/documents/`), use a plain Markdown link with a site-root-relative path: `[Annual Report](/documents/about/agm-minutes/2024.pdf)` — this is correct for production at `fenb.ca/` where there is no subpath.

---

### New event

Add an entry to `data/events.yaml`.

**Fields:**

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | |
| `start_date` | ✅ | ISO `YYYY-MM-DD` — used for sort/filter and to compute the displayed date |
| `end_date` | — | ISO `YYYY-MM-DD`. Omit or leave blank for single-day events. If set, the displayed date shows as a range (`Sep 20–21` or `Nov 29 – Dec 1`) and the calendar draws bars across the full range. |
| `category` | ✅ | See categories below — must be a canonical ID from `data/event_categories.yaml` |
| `location` | ✅ | Display string shown on the card. Use `"City, Province"` when there is no specific venue, or `"Venue Name, City, Province"` when there is one. |
| `description_en` | — | Optional English description. Shown on the schedule page; not shown on homepage cards |
| `description_fr` | — | Optional French description. Falls back to `description_en` if blank |
| `details_url_en` | — | English URL for the **Learn More →** badge. Used for both languages when `details_url_fr` is blank |
| `details_url_fr` | — | Optional French URL override for the **Learn More →** badge |
| `registration_url` | — | If set, a crimson **Register Now →** badge appears on the card (opens in new tab). Hidden for past events (date < today). |
| `results_url` | — | If set, a navy **View Results →** badge appears on the card (opens in new tab). Populated automatically by `/fenb-data-get-results` after a tournament scrape. |

**Example:**

```yaml
- title: "Event Name"
  start_date: "2026-06-01"         # ISO YYYY-MM-DD
  end_date: "2026-06-02"           # optional; omit for single-day events
  category: competition            # see categories below
  location: "Venue Name, City, NB" # or just "City, NB" if no specific venue
  description_en: ""               # optional; shown on schedule page, not homepage
  description_fr: ""               # optional; falls back to description_en if blank
  details_url_en: ""               # optional Learn More link (used for both languages if _fr is blank)
  details_url_fr: ""               # optional French override for the Learn More link
  registration_url: ""             # optional; hidden once event date has passed
  results_url: ""                  # optional; populated by /fenb-data-get-results
```

**Category colours:**

Each category drives three visual elements: the date badge on the event card, the tag pill, and the calendar bar on the month grid.

| `category` | Display label (via i18n) | Colour |
|---|---|---|
| `competition` | Competition / Compétition | Teal |
| `training` | Training Camp / Camp d'entraînement | Dark green |
| `national` | National Event / Événement national | Navy |
| `provincial` | NB Provincial / Provincial NB | Crimson |
| `clinic` | Clinic / Clinique | Olive |
| `meeting` | FENB Meeting / Réunion FENB | Grey |
| `announcement` | Announcement / Annonce | Teal |

`category` is the canonical ID — must match exactly (lowercase, no spaces) and must exist in `data/event_categories.yaml`. The display label is looked up from `i18n/en.yaml` and `i18n/fr.yaml` automatically.

**Adding a new category:** add the ID to `data/event_categories.yaml`, add i18n keys to both `i18n/en.yaml` and `i18n/fr.yaml`, and add the corresponding CSS colour rules to `fenb-events.css`.

The homepage always shows 4 event cards: the next 4 upcoming events (date ≥ today), falling back to the most recent past events if fewer than 4 are upcoming. When the season ends, add an off-season placeholder entry (category `announcement`) so the section stays populated through the summer gap.

#### Season rollover

> **Skill available:** run `/fenb-data-season-rollover` in Claude Code — it verifies the outgoing season label, archives `events.yaml`, creates a fresh one, and updates the events calendar page subtitles.

At the end of each season (typically late August):

1. Move `data/events.yaml` to `data/events_archive/YYYY-YYYY.yaml` — use a regular hyphen in the filename (e.g. `2025-2026.yaml`).
2. Create a fresh `data/events.yaml` for the incoming season with `season: "YYYY–YYYY"` (en-dash in the label) and an empty `events:` list.

The season schedule page at `/events/schedule/` automatically adds a dropdown entry for the archived season on the next build — no layout or template changes needed.

The **`season` field** at the top of `events.yaml` (e.g. `season: "2025–2026"`) is required — it drives the schedule page season dropdown label.

Also update the events calendar page subtitle in `content/events/_index.md` and `content/events/_index.fr.md` at rollover time:
```yaml
# _index.md
description: "2026–2027 season schedule"

# _index.fr.md
description: "Calendrier de la saison 2026–2027"
```

---

### Board of Directors

Edit `data/board_members.yaml`. Top-level keys:

- `season` — display label (e.g. `"2025–2026"`); update at the start of each season
- `contact` — board inquiry email shown on the About contact section
- `affiliations` — provincial/national affiliations shown in the About sidebar:
  ```yaml
  affiliations:
    - name_en: "Canadian Fencing Federation"
      name_fr: "Fédération canadienne d'escrime"
      url: "https://fencing.ca/"
  ```
- `members` — board member list. Each entry:
  ```yaml
  - name: "Full Name"
    role_en: "President"       # displayed in English
    role_fr: "Présidente"      # displayed in French
  ```
  Members are displayed in the order they appear in the file. Add `card_color: teal` or `card_color: crimson` to any member whose avatar and role label should use a non-default colour (omit for standard directors, which use navy).

---

### Policies & Reports documents

#### Add or update an individual policy

1. Create `content/about/policies/{slug}.en.md` and `{slug}.fr.md`:

   ```yaml
   ---
   title: "Policy Name"
   translationKey: "{slug}"
   ---

   Policy body in Markdown…
   ```

2. Add (or update) the entry in `data/policies.yaml` under `documents`:

   ```yaml
   - name_en: "Policy Name"
     name_fr: "Nom de la politique"
     url_en: about/policies/{slug}/
     url_fr: fr/about/policies/{slug}/
   ```

#### Add a new AGM minutes year

1. Drop the PDF in `static/documents/about/agm-minutes/YYYY.pdf` where `YYYY` is the **season start year** (e.g. `2025.pdf` = the 2025–2026 season).
2. Add an entry at the top of `annual_reports` in `data/policies.yaml`:

   ```yaml
   - year: 2025
     url: documents/about/agm-minutes/2025.pdf
   ```

The season label ("2025–2026 Season AGM Minutes") is computed automatically from `year` in the layout.

---

### Hall of Fame inductees

Inductees are bilingual Markdown pairs in `content/about/hall-of-fame/`. File naming follows the standard bilingual convention: `{slug}.en.md` + `{slug}.fr.md`.

**Front matter:**

```yaml
---
title: "Full Name"
year_inducted: 2025
category:              # YAML array — one or more canonical IDs from data/hof_categories.yaml
  - "Athlete"
  - "Coach"
posthumous: false      # true if the award was given posthumously
award_recipient: ""    # name of person who accepted on the inductee's behalf (if posthumous)
links: []              # optional array of related links
  - label: "Link label"
    url: "https://…"
---

Biographical text in Markdown.
```

The body is the inductee's biography. Leave the body empty (no content after the `---`) to show a "Full biography coming soon." placeholder on the profile page.

**Category IDs** are defined in `data/hof_categories.yaml`. Currently: `athlete`, `coach`, `builder`. To add a new category:
1. Add the ID to `data/hof_categories.yaml`
2. Add `hof_cat_{id}` keys to both `i18n/en.yaml` and `i18n/fr.yaml`
3. Add `.fenb-hof-badge--{id}` CSS rules (light mode + dark mode) to `fenb-hof.css`

The landing page table at `/about/hall-of-fame/` is generated automatically from all `.en.md` / `.fr.md` file pairs in the directory — no layout changes needed when adding a new inductee.

**Inductee photos:** store in `static/images/hall-of-fame/{slug}.jpg` and set `photo: images/hall-of-fame/{slug}.jpg` in the front matter. If `photo` is omitted, a coloured circle with the inductee's initials is shown instead (colour driven by the first category).

---

### New club

Add an entry to `data/clubs.yaml` and drop the logo in `static/images/clubs/`:

```yaml
- id: XYZ
  name: "Club Name"
  logo: images/clubs/club-logo-XYZ.png
  email: "club@example.com"
  website: "https://example.com"   # omit if none
  city: "City, NB"
```

---

### Hero carousel images

Drop replacement images into `static/images/hero/` and update `data/hero_slides.yaml`:

```yaml
slides:
  - src: images/hero/hero1.jpg
    alt: "Alt text for accessibility"
  - src: images/hero/hero2.jpg
    alt: ""
```

Images should be 2.5:1 aspect ratio (e.g. 1250×500 px). The carousel auto-advances every 5 seconds; prev/next arrows allow manual control.

---

### New section page

> **Skill available:** run `/fenb-content-add-page` in Claude Code — it prompts for section, slug, titles, and an optional subtitle, then creates both language files with correct front matter.

1. Create `layouts/{section}/list.html` defining the `main` block
2. Create `content/{section}/_index.md` and `content/{section}/_index.fr.md`
   - Set `description:` in both files for a subtitle in the page header band (the partial renders it automatically)
   - Only add `hide_page_header: true` if the layout needs to render a **dynamic** subtitle itself (e.g. one computed from live data)
3. Add i18n keys for any new UI strings to both `en.yaml` and `fr.yaml`

If the section has single-page posts and you want the page header band to show the **section title** rather than each page's own title, add to the section `_index.md`:

```yaml
cascade:
  - target:
      kind: page
    page_header_uses_section: true
```

Then create `layouts/{section}/single.html` defining only `title` and `main` — the band is rendered by `site-header.html` automatically.

If pages within the section need **fundamentally different HTML structure** (not just different data), use `layout: {name}` in the page's front matter instead of a shared `single.html`. Hugo looks for `layouts/{section}/{name}.html`. The join section uses this pattern — each sub-page has its own layout file (`membership.html`, `clubs.html`, `volunteer.html`).

---

### Join section seasonal updates

Two URLs in `data/join.yaml` need updating at the start of each season:

- `membership_url` — the 2MEV registration portal URL (includes the season slug, e.g. `fencing-nb-2025-2026`); update when 2MEV creates the new season's registration page
- `club_form_url` — the Google Form URL for club registration; leave blank to fall back to an email CTA (the clubs layout handles the empty case automatically)

