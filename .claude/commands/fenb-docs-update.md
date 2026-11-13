---
description: Review current git changes and assess whether CLAUDE.md, README.md, or docs/*.md need updating.
disable-model-invocation: true
allowed-tools: Bash(git *) Read Edit AskUserQuestion
---

Review the current git state and assess each system documentation file for needed updates.

1. **Gather changes** — run all three of the following and capture the output:
   - `git status --short` — staged, unstaged, and untracked files
   - `git diff HEAD` — full diff of all uncommitted changes (staged + unstaged)
   - `git diff main..HEAD` — full diff of committed-but-unreleased changes on this branch

   If all three return empty output, report: "No changes found — nothing to assess." and stop.

2. **Assess each system file** — read each file below if needed to understand its current scope, then make a definitive call: **needs update** or **no update needed**. Give a one-line reason drawn from the actual diff. Do not hedge.

   - **`CLAUDE.md`** — kept deliberately lean (re-sent every turn): hard rules and one-line pointers only. Needs updating only if the diff adds/removes a project-wide rule or a new reference doc. Put schemas, gotchas, CSS patterns and skill details in README.md, docs/GOTCHAS.md, docs/STYLE_GUIDE.md or docs/DEVELOPMENT.md instead.

   - **`README.md`** — how to add/update each content type, layouts tree, data files, and skill list. Needs updating if the diff adds a new content type, changes a data file name or schema, adds/removes a skill, or changes the way content is authored.

   - **`docs/STYLE_GUIDE.md`** — brand colours, CSS class names and conventions, i18n/bilingual rules, naming conventions, shared UI components, category colour reference. Needs updating if the diff adds a new CSS class that should be reused, modifies a shared component, or introduces a new naming pattern.

   - **`docs/DEVELOPMENT.md`** — branch strategy, local build commands, GitHub Pages deployment, release checklist. Needs updating if the diff changes a build command, adds a Makefile target, changes deployment config, or introduces a new release step.

   - **`docs/TODO.md`** — outstanding items. Needs updating if the diff resolves an open item (delete it — fold any context a pending item still needs into that item) or if new deferred decisions or known-missing pages were introduced.

   - **`docs/PROJECT_LAYOUT.md`** — folder tree plus reference tables. Needs updating if the diff adds, removes, renames or repurposes a top-level folder, a data YAML file, a layout template, a partial, a JS file, or a script (CSS files are listed in STYLE_GUIDE instead).

3. **Report findings** — present a table:

   ```
   CLAUDE.md              — needs update  / no update needed — <one-line reason>
   README.md              — ...
   docs/STYLE_GUIDE.md    — ...
   docs/DEVELOPMENT.md    — ...
   docs/TODO.md           — ...
   docs/PROJECT_LAYOUT.md — ...
   ```

   For each file that needs updating, state specifically which section or entry is out of date and what the correct content should be.

4. **Apply updates** — if any files need updating, use `AskUserQuestion`:
   - **Question:** "Apply all recommended doc updates now?"
   - **Option 1:** label `"Yes, apply all"`, description `"Update all flagged files now"`
   - **Option 2:** label `"No, skip"`, description `"Leave docs as-is"`

   If yes, make all the edits. If no, stop without editing anything.
