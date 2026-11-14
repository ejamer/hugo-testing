---
description: Create a new bilingual news article for the FencingNB Hugo site.
disable-model-invocation: true
allowed-tools: Read Edit Bash(scripts/create-news-stub.sh *) AskUserQuestion Skill
---

Ask the user for:
1. Publication date (YYYY-MM-DD)
2. Article slug — short kebab-case, no year (e.g. `provincial-results`)
3. English title
4. French title
5. Category ID — one of (`docs/STYLE_GUIDE.md` "News category colours" is the authoritative table):
   - `competition` — registration or announcement for a competition
   - `results` — results from any competition other than nationals or the NB Provincials (results articles usually come from `/fenb-content-add-results` instead)
   - `national` — results from a national championship
   - `provincial` — results from the NB Provincial Championship
   - `training` — registration/announcement for a training camp / summer camp
   - `clinic` — registration/announcement for a skills clinic (armoury, referee, etc.)
   - `announcement` — general announcements
   - `meeting` — FENB meeting notices

   `results_table: true` (sortable results tables) is separate from the category. Add it only when the body contains Markdown tables of placements.
6. English summary — one sentence shown on the homepage card
7. French summary

Then:
1. From the repo root, run `scripts/create-news-stub.sh {YYYY-MM-DD} {slug} {category-id}`. It validates the inputs, creates the year folder's `_index` files if this is the first article of a new year, and writes both `fenb-1/content/news/{year}/{mon}-{dd}-{slug}.{en,fr}.md` with empty `title`/`summary`. It prints the paths it created. If it exits with an error (e.g. the article already exists), report it and stop.
2. Read each new file and fill in `title` and `summary` (English in `.en.md`, French in `.fr.md`), plus any optional front matter or body the user asked for.

Both files get the same `category` value — it's a canonical ID, not a display string. The badge label is derived from i18n at render time.

**Multi-event articles** (e.g. a registration roundup covering several tournaments): give each event its own `##` section and put `{{< host-logo id="..." >}}` on its own line directly under each heading, instead of `image` or `photos` — `id` is the host's club id from `fenb-1/data/clubs.yaml` or an organization id from `fenb-1/data/organizations.yaml` (e.g. `CFF`). Use the same line in both language files; the shortcode picks the localized name. If the host isn't in either file, add it to `organizations.yaml` (see README.md for sourcing logos) rather than using a one-off `src`. See `docs/STYLE_GUIDE.md` → `host-logo` shortcode.

After both files are written, ask the user via `AskUserQuestion` whether they'd also like a sample Facebook post for this article. If yes, invoke `/fenb-content-social-summary` against the two files just created.
