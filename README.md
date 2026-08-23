# Fencing-Escrime NB — Website

This repo is testing a replacement tech stack for [fencingnb.ca](https://fencingnb.ca), generating a static site built with Hugo.

**[► View live site](https://ejamer.github.io/hugo-testing/)**

### Claude Code skills

Content and data workflows are available as Claude Code skills (invoked with `/fenb-*` in the CLI):

| Skill | What it does |
|---|---|
| `/fenb-content-add-news` | Create a bilingual news article with correct filenames and front matter |
| `/fenb-content-add-page` | Create a new bilingual content page pair |
| `/fenb-content-add-results` | Generate a bilingual EN/FR news article from a saved results JSON file |
| `/fenb-data-get-results` | Fetch recent tournament results from fencingtimelive.com and report NB fencer placements |

For git and release workflow skills (`/fenb-git-commit`, `/fenb-git-merge`, `/fenb-git-release`), see `docs/DEVELOPMENT.md`.

---

## Adding content

<details>
<summary><strong>Site-wide announcement banner</strong></summary>

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

</details>

<details>
<summary><strong>New news post</strong></summary>

> **Skill available:** run `/fenb-content-add-news` in Claude Code — it prompts for date, slug, titles, category, and summaries, then creates both language files with correct front matter and filenames.

**File naming:** `{mon}-{dd}-{title}.{lang}.md` inside the year subfolder — see [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for the full naming convention. For recurring annual events (same tournament each season), include the year in the slug to prevent cross-season collisions: e.g. `east-coast-games-2026-registration`.

Example: `content/news/2026/jun-01-provincial-team-announced.en.md` + `.fr.md`

**Front matter:**

```yaml
---
title: "Post title"
date: 2026-06-01
category: national   # canonical ID — same IDs used by events; drives badge colour and label
summary: "One-sentence summary shown on the homepage card."
update: "<strong>Update:</strong> The deadline has been extended to August 15, 2026."  # optional — alert banner above the article body, HTML allowed
image: "images/event-logos/ecg.png"           # optional — centred logo above body (no leading slash)
image_alt: "East Coast Games 2026"             # optional — alt text for image
results_table: true  # optional — add to load the interactive sortable table on articles with result tables
photos:              # optional — photo gallery rendered below the article body
  - src: "images/news/2026/action-shot.jpg"   #   no leading slash
    alt: "Athletes competing"
    caption: "Caption shown below photo"       #   caption is optional per item
cta_label: "Registration"                      # optional — call-to-action banner below the article body
cta_heading: "Register by August 5"            #   cta_heading is the trigger; omit the whole block to skip it
cta_text: "Email us to reserve your spot."     #   optional supporting sentence
cta_button_label: "Email to Register"
cta_button_url: "mailto:someone@example.com"   #   or any URL
cta_note: "Spots are limited."                 #   optional small note under the button
related_news:         # optional — "Related News" sidebar, shown above "Recent News"
  - "news/2026/jun-01-another-article"        #   content path, no leading slash, no file extension
---

Full post body here (Markdown).
```

**Category values:** news articles share the same category IDs as events (see [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for the full colour table and typical mapping guidance).

| `category` | Badge label (EN) | Badge label (FR) | Colour |
|---|---|---|---|
| `competition` | Competition | Compétition | Teal |
| `national` | National Event | Événement national | Crimson |
| `provincial` | NB Provincial | Provincial NB | Crimson |
| `training` | Training Camp | Camp d'entraînement | Yellow |
| `announcement` | Announcement | Annonce | Blue |
| `meeting` | FENB Meeting | Réunion FENB | Grey |

**`results_table: true`** — add this field to any article that contains markdown tables of placements; it loads `results-table.js` which makes the tables sortable. It is independent of category.

**`results_hide_placements: true`** — optional companion to `results_table`. When set, the last column (placement) is hidden by default with a "Show placements / Hide placements" toggle button. Use this for **away-tournament** articles where placement context varies across events. Omit it for **hosted-tournament** articles where placements should always be visible.

**`update`** — optional alert banner rendered above the article body (`fenb-callout fenb-callout--alert`, see [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)). Use for a short, urgent notice on an already-published article (e.g. an extended deadline). HTML is allowed and rendered via `safeHTML`, so wrap the lead-in with `<strong>` as shown above.

**`cta_heading`** (+ `cta_label`, `cta_text`, `cta_button_label`, `cta_button_url`, `cta_note`) — optional call-to-action banner (`fenb-cta-banner`, see [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)) rendered below the article body. Use for a registration deadline or other action you want to visually separate from the body copy. `cta_heading` presence is what triggers the block — omit it (and the other `cta_*` fields) to skip the banner entirely. All values are literal strings, not i18n keys, so write them in the article's own language.

**`related_news`** — optional list of content paths to other news articles (e.g. `news/2026/jun-01-another-article`, matching the source file path without the `.{lang}.md` extension). Resolved via Hugo's `GetPage` — a typo or missing page is silently skipped (no build warning, no link rendered), so double-check paths by hand. Set it separately per language file — an EN article should list EN paths, an FR article FR paths — since `GetPage` only resolves pages in the current language. When present, renders a crimson "Related News" sidebar block above the standard "Recent News" block.

The article page header band shows "News & Results" (the section title) rather than the article title — controlled by `page_header_uses_section: true` in the news `_index.md` cascade. The article title appears in the scrolling body below the band.

**New year folder:** when the first article of a new calendar year is created, add a year subfolder with `_index.md` and `_index.fr.md` (copy from the previous year folder).

**Internal links in article body:** use Hugo's `relref` shortcode rather than hardcoded paths. `relref` resolves to the correct URL at build time (including language prefix) and produces a build error if the target page doesn't exist.

```markdown
Visit our [club directory]({{< relref "clubs/" >}}) for more information.
```

Do **not** write `[clubs](/clubs/)` or `[clubs](/fr/clubs/)` — root-relative paths skip the base URL and will silently break if the site is ever served from a subdirectory. `relref` is language-aware: in a French article it automatically resolves to the French version of the target page.

Note: `relref` only works for Hugo content pages (`content/`). For links to static files (PDFs in `static/documents/`), use a plain Markdown link with a site-root-relative path: `[Annual Report](/documents/about/agm-minutes/2024.pdf)` — this is correct for production at `fenb.ca/` where there is no subpath.

</details>

<details>
<summary><strong>New event</strong></summary>

Add an entry to `data/events.yaml`.

**Fields:**

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | |
| `title_fr` | — | Optional French override for the title. Falls back to `title` if blank. Only needed for generic/translatable titles (e.g. "Training Camp", "Annual General Meeting") — proper nouns and tournament names are usually left as-is |
| `start_date` | ✅ | ISO `YYYY-MM-DD` — used for sort/filter and to compute the displayed date |
| `end_date` | — | ISO `YYYY-MM-DD`. Omit or leave blank for single-day events. If set, the displayed date shows as a range (`Sep 20–21` or `Nov 29 – Dec 1`) and the calendar draws bars across the full range. |
| `category` | ✅ | See categories below — must be a canonical ID from `data/event_categories.yaml` |
| `location` | ✅ | Display string shown on the card. Use `"City, Province"` when there is no specific venue, or `"Venue Name, City, Province"` when there is one. |
| `description_en` | — | Optional English description. Shown on the schedule page; not shown on homepage cards |
| `description_fr` | — | Optional French description. Falls back to `description_en` if blank |
| `details_url_en` | — | English URL for the **Learn More →** badge. Used for both languages when `details_url_fr` is blank |
| `details_url_fr` | — | Optional French URL override for the **Learn More →** badge |
| `registration_url_en` | — | English URL for the **Register Now →** badge. Used for both languages when `registration_url_fr` is blank. Hidden for past events (date < today). |
| `registration_url_fr` | — | Optional French URL override for the **Register Now →** badge. Falls back to `registration_url_en` if blank. |
| `results_url_en` | — | English URL for the **View Results →** badge. Populated automatically by `/fenb-data-get-results` after a tournament scrape (FTL links are language-agnostic, so `_fr` is left blank). |
| `results_url_fr` | — | Optional French URL override for the **View Results →** badge (set when the results link is an internal bilingual news article). Falls back to `results_url_en` if blank. |

**Example:**

```yaml
- title: "Event Name"
  title_fr: ""                     # optional French override; falls back to title if blank
  start_date: "2026-06-01"         # ISO YYYY-MM-DD
  end_date: "2026-06-02"           # optional; omit for single-day events
  category: competition            # see categories below
  location: "Venue Name, City, NB" # or just "City, NB" if no specific venue
  description_en: ""               # optional; shown on schedule page, not homepage
  description_fr: ""               # optional; falls back to description_en if blank
  details_url_en: ""               # optional Learn More link (used for both languages if _fr is blank)
  details_url_fr: ""               # optional French override for the Learn More link
  registration_url_en: ""          # optional; hidden once event date has passed
  registration_url_fr: ""          # optional French override; falls back to _en if blank
  results_url_en: ""               # optional; populated by /fenb-data-get-results
  results_url_fr: ""               # optional French override; falls back to _en if blank
```

**Category colours:**

Each category drives three visual elements: the date badge on the event card, the tag pill, and the calendar bar on the month grid.

| `category` | Display label (via i18n) | Colour |
|---|---|---|
| `competition` | Competition / Compétition | Teal |
| `training` | Training Camp / Camp d'entraînement | Dark green |
| `national` | National Event / Événement national | Navy |
| `provincial` | NB Provincial / Provincial NB | Crimson |
| `clinic` | Clinic / Clinique | Dark orange |
| `meeting` | FENB Meeting / Réunion FENB | Grey |
| `announcement` | Announcement / Annonce | Teal |

`category` is the canonical ID — must match exactly (lowercase, no spaces) and must exist in `data/event_categories.yaml`. The display label is looked up from `i18n/en.yaml` and `i18n/fr.yaml` automatically.

**Adding a new category:** add the ID to `data/event_categories.yaml`, add i18n keys to both `i18n/en.yaml` and `i18n/fr.yaml`, and add the corresponding CSS colour rules to `fenb-events.css`.

The homepage always shows 4 event cards: the next 4 upcoming events (date ≥ today). This pulls from `partials/all-events.html` — current season + every archived season merged — so an event archived mid-season (e.g. a rollover run before the outgoing season's last event has happened) doesn't disappear from the homepage or the `/events/` calendar just because it moved to `events_archive/`. When there's a genuine gap in scheduled events (off-season), add a placeholder entry (category `announcement`) so the section stays populated instead of showing "more coming soon" placeholders.

#### Season rollover

At the end of each season (typically late August), run:

```
scripts/season-rollover.sh 2025-2026 "2026–2027"
```

There's no skill for this — it's a fully mechanical set of steps (verify a label match, copy a file, template a fresh one, edit two front-matter fields), so it's just a script; ask Claude to run it and relay the output if you'd rather not run it yourself. The script:

1. Verifies `data/events.yaml`'s `season:` field matches the outgoing season you specified — stops if it doesn't.
2. Moves `data/events.yaml` to `data/events_archive/YYYY-YYYY.yaml` (regular hyphen filename) — refuses to overwrite an existing archive file.
3. Creates a fresh `data/events.yaml` with `season: "YYYY–YYYY"` (en-dash label) and an empty `events:` list.
4. Updates the `description:` subtitle in `content/events/_index.md` and `content/events/_index.fr.md`.

Archiving events that are still current/upcoming (a rollover doesn't necessarily land after the outgoing season's very last event) is safe — the homepage and `/events/` calendar merge current + archived seasons at render time, so nothing disappears. See `plans/events-data-archive.md`.

The season schedule page at `/events/schedule/` automatically adds a dropdown entry for the archived season on the next build — no layout or template changes needed there.

**Not handled by the script** (needs human/AI judgment):
- Add the first events of the new season to `data/events.yaml`
- Add an off-season placeholder announcement event if there's a gap before the first real event
- Update `membership_url` / `club_form_url` in `data/join.yaml` once 2MEV/a new form is published for the new season

</details>

<details>
<summary><strong>Board of Directors</strong></summary>

Edit `data/board_members.yaml`. Top-level keys:

- `contact` — board inquiry email used on the `/contact/` page
- `affiliations` — provincial/national affiliations shown in the Mission & Leadership page sidebar (`/about/organization/`):
  ```yaml
  affiliations:
    - name_en: "Canadian Fencing Federation"
      name_fr: "Fédération canadienne d'escrime"
      url: "https://fencing.ca/"
  ```
- `members` — the **current** board roster, shown on `/about/organization/`. Each entry:
  ```yaml
  - name: "Full Name"
    role_en: "President"       # displayed in English
    role_fr: "Présidente"      # displayed in French
    start_date: "2025-09"      # optional — "YYYY-MM" (month + year only), historical record only, doesn't affect display
  ```
  Members are displayed in the order they appear in the file. Add `card_color: teal` or `card_color: crimson` to any member whose avatar and role label should use a non-default colour (omit for standard directors, which use navy). To mark a position as **vacant**, set `name: ""` — the card will display "Vacant" (bilingual) with a `~` avatar.

  **Keep this list at exactly the board's bylaws-defined seat count at all times.** A departure should never change how many entries are here — see "When someone leaves" below.

- `previous_members` — past board members, not displayed anywhere yet (a future "Board History" page — see `docs/TODO.md`). Each entry adds `end_date` to the `members` schema:
  ```yaml
  - name: "Full Name"
    role_en: "Director"
    role_fr: "Administrateur"
    start_date: "2024-09"
    end_date: "2026-06"        # "YYYY-MM" — presence here is what marks them as no longer active
  ```

  **When someone leaves the board:**
  1. Copy their entry from `members` into `previous_members`, adding an `end_date`.
  2. In `members`, either set that entry's `name` back to `""` (seat now vacant) or overwrite it with their successor's info. Never delete the entry — the list length must stay constant.

</details>

<details>
<summary><strong>Policies &amp; Reports documents</strong></summary>

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

</details>

<details>
<summary><strong>Hall of Fame inductees</strong></summary>

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

</details>

<details>
<summary><strong>New club</strong></summary>

Add an entry to `data/clubs.yaml` and drop the logo in `static/images/clubs/`:

```yaml
- id: XYZ
  name: "Club Name"
  logo: images/clubs/club-logo-XYZ.png
  email: "club@example.com"
  website: "https://example.com"   # omit if none
  city: "City, NB"
```

</details>

<details>
<summary><strong>Hero carousel images</strong></summary>

Drop replacement images into `static/images/hero/` and update `data/hero_slides.yaml`:

```yaml
slides:
  - src_en: images/hero/hero1.jpg
    src_fr: ""                                    # optional — French-language variant of the image
    alt: "Alt text for accessibility"
    link_en: "news/2026/jun-16-some-article/"   # optional — makes slide clickable
    link_fr: ""                                  # leave empty to fall back to link_en
    publish_from: ""                              # optional — hide until this date
    expires: ""                                   # optional — hide after this date
  - src_en: images/hero/hero2.jpg
    src_fr: ""
    alt: ""
    link_en: ""
    link_fr: ""
    publish_from: ""
    expires: ""
```

**`link_en` / `link_fr`** — optional. When provided, the slide becomes clickable and shows a "Read more →" / "Lire la suite →" badge in the bottom-right corner. Rules:
- Internal paths: no leading slash, e.g. `news/2026/jun-16-article/`
- External URLs: full URL, e.g. `https://example.com/page` — opens in a new tab automatically
- `link_fr` falls back to `link_en` if empty or omitted

**`src_en` / `src_fr`** — `src_fr` is optional; use it when a slide's image contains text that needs a French version (e.g. a bilingual notice graphic). `src_fr` falls back to `src_en` if empty or omitted.

**`publish_from` / `expires`** — optional, `"YYYY-MM-DD"`. Checked against the *visitor's own browser clock*, not the last build — so a time-boxed slide (a registration deadline, a hiring notice) goes live and retires itself on schedule without a redeploy.
- `publish_from`: slide is hidden until this date; omit/empty = live immediately.
- `expires`: slide is hidden starting the day *after* this date (it stays visible through the date itself); omit/empty = never expires.
- If every slide is currently outside its window, the carousel shows a default FENB logo slate instead of going empty.
- A slide that has already expired by the last site build is dropped from the page entirely (never shipped in the HTML); a slide with a future `publish_from` can be added ahead of time and will just wait for its date.

Images should be 2.5:1 aspect ratio (e.g. 1250×500 px). The carousel auto-advances every 5 seconds; click the prev/next arrows or the dot indicators to navigate manually; use the pause/play button (top-right corner) to stop or resume auto-advance.

**Creating a new announcement-style slide (event date, location, title, CTA text):** start from the reusable Inkscape template at `design-sources/hero/fenb-hero-template.svg` rather than designing from scratch, then export the edited panel to EN/FR JPGs in `static/images/hero/`.

</details>

<details>
<summary><strong>New section page</strong></summary>

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

</details>

<details>
<summary><strong>Join section seasonal updates</strong></summary>

Two URLs in `data/join.yaml` need updating at the start of each season:

- `membership_url` — the 2MEV registration portal URL (includes the season slug, e.g. `fencing-nb-2025-2026`); update when 2MEV creates the new season's registration page
- `club_form_url` — the Google Form URL for club registration; leave blank to fall back to an email CTA (the clubs layout handles the empty case automatically)

</details>

---

## Related docs

| File | Covers |
|------|--------|
| [CLAUDE.md](CLAUDE.md) | Instructions and conventions for Claude Code; lists available `/fenb-*` skills |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Branch strategy, local build commands, GitHub Pages deployment |
| [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) | Brand, CSS, i18n, bilingual rules, naming conventions, category colours |
| [docs/PROJECT_LAYOUT.md](docs/PROJECT_LAYOUT.md) | Full directory tree with file-by-file descriptions |
| [docs/TODO.md](docs/TODO.md) | Outstanding items |
