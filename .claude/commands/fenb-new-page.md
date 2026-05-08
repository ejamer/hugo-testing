Create a new bilingual content page pair for the FencingNB Hugo site.

Ask the user for:
1. Section path (e.g. `about`, `programs`, `events`)
2. Page slug (e.g. `coach-development`)
3. English title
4. French title
5. Optional subtitle for the page header band (set as `description:` in front matter)
6. Whether the layout renders its own **dynamic** header (e.g. one with live data like a record count) — only if yes is `hide_page_header: true` needed

Then:
1. Create `fenb-1/content/{section}/{slug}.en.md` with front matter:
   ```yaml
   ---
   title: "{English title}"
   translationKey: "{slug}"
   # description: "{subtitle}"       ← set for a static page header subtitle
   # hide_page_header: true          ← only if layout renders its own dynamic header
   ---
   ```
2. Create `fenb-1/content/{section}/{slug}.fr.md` with the same structure and the French title.
3. Remind the user to add any new UI strings to both `fenb-1/i18n/en.yaml` and `fenb-1/i18n/fr.yaml` — never hardcode display text in a layout.
4. Check whether `fenb-1/layouts/{section}/single.html` already exists. If not, remind the user to create it.

For **section index pages** (`_index.md` / `_index.fr.md`) ask whether single pages in this section should show the section title in the page header band rather than the individual page title. If yes, add this cascade block to both index files (use `target:` — no underscore):

```yaml
cascade:
  - target:
      kind: page
    page_header_uses_section: true
```

Do not add the cascade block to section index pages that should show their own title in the band.
