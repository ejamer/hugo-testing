---
description: Create a new bilingual content page pair for the FencingNB Hugo site.
disable-model-invocation: true
allowed-tools: Read Write Bash(grep *) Bash(cat *)
---

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

5. **Check for existing wiring and stale placeholders** — after creating the files, grep the codebase to surface anything that needs attention:

   a. **Nav menu** — check `fenb-1/hugo.toml` for an existing `[[languages.*.menus.main]]` entry pointing to `/{section}/` or `/{section}/{slug}/`. If one exists, confirm it's already wired up. If not, remind the user to add one if the page should appear in the nav.

   b. **`data/programs.yaml`** — check whether the new URL appears in the homepage quick-link cards. If it does, confirm it's already wired up.

   c. **Existing links to the new URL** — grep `fenb-1/layouts/` and `fenb-1/data/` for the new page's URL. Report any matches so the user knows what was already pointing here (and can confirm those links are intentional).

   d. **Placeholder links in related layouts** — grep `fenb-1/layouts/{section}/` for placeholder hrefs (`mailto:`, `href="#"`, `href=""`) that might now be intended to point to the new page. Report any found.

   e. **TODO.md** — grep `TODO.md` for the section name or slug. Report any open items that reference this area so the user can decide if any are now addressed.

   Report all findings clearly. Don't silently skip any check — if nothing is found, say so briefly.

6. **Review project docs and skills for needed updates** — check each of the following and report whether it needs updating:

   - **`README.md`** — does the content tree, layouts tree, or data file list need a new entry for this section or page?
   - **`STYLE_GUIDE.md`** — does the new section introduce any CSS files, layout patterns, or conventions not yet documented?
   - **`CLAUDE.md`** — do the project conventions, data schemas, or skill descriptions need updating?
   - **`DEVELOPMENT.md`** — does the release checklist or any build step need updating?
   - **Other skills** (`fenb-data-season-rollover`, `fenb-git-release`, etc.) — does the new section introduce any seasonal maintenance steps or release checks that should be added to an existing skill?

   For each item, state clearly: needs update / no update needed, and why. Get user approval before making any changes to these files.

For **section index pages** (`_index.md` / `_index.fr.md`) ask whether single pages in this section should show the section title in the page header band rather than the individual page title. If yes, add this cascade block to both index files (use `target:` — no underscore):

```yaml
cascade:
  - target:
      kind: page
    page_header_uses_section: true
```

Do not add the cascade block to section index pages that should show their own title in the band.
