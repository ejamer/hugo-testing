---
description: Create a new bilingual news article for the FencingNB Hugo site.
disable-model-invocation: true
allowed-tools: Read Write
---

Ask the user for:
1. Publication date (YYYY-MM-DD)
2. Article slug — short kebab-case, no year (e.g. `provincial-results`)
3. English title
4. French title
5. Category ID — one of:
   - `results` — teal; also loads the interactive results table
   - `announcement` — crimson
   - `registration` — green
   - `community` — navy
6. English summary — one sentence shown on the homepage card
7. French summary

Then:
1. Derive `{mon}` (3-letter lowercase month, e.g. `apr`) and `{dd}` (zero-padded day) from the date.
2. Set `{year}` to the 4-digit year from the date.
3. Check whether `fenb-1/content/news/{year}/_index.md` and `_index.fr.md` exist. If not, create them by copying the front matter from the previous year's folder (title, description, cascade block).
4. Create `fenb-1/content/news/{year}/{mon}-{dd}-{slug}.en.md`:
   ```yaml
   ---
   title: "{English title}"
   date: {YYYY-MM-DD}
   category: {category-id}
   summary: "{English summary}"
   ---
   ```
5. Create `fenb-1/content/news/{year}/{mon}-{dd}-{slug}.fr.md`:
   ```yaml
   ---
   title: "{French title}"
   date: {YYYY-MM-DD}
   category: {category-id}
   summary: "{French summary}"
   ---
   ```

Both files get the same `category` value — it's a canonical ID, not a display string. The badge label is derived from i18n at render time.

**Critical:** the language code is separated by a **dot** (`.en.md`, `.fr.md`), never a dash (`-en.md`). A dash breaks Hugo's translation linking between the two files.
