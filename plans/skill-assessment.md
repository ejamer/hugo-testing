# Skill Assessment — FencingNB Claude Commands

Reviewed: 2026-06-21  
Skills: 9 files in `.claude/commands/`

Criteria per skill:
- **(a) Format** — frontmatter, tool declarations, structure
- **(b) Relevance & efficiency** — does the scope match the task?
- **(c) Token burn** — sections that are over-specified or low-value for the AI
- **(d) Script candidates** — what can be moved to a shell/Python script

---

## 1. `fenb-content-add-news`

**What it does:** Collect 7 fields from the user; derive filename components; ensure year subfolder exists; write EN + FR stub files.

### (a) Format
Solid. `disable-model-invocation: true`, minimal tool list (`Read Write`). No issues.

### (b) Relevance & efficiency
The skill is lean and well-scoped. The only real AI work is collecting inputs and knowing where to put the files. The instructions are short and unlikely to be misread.

### (c) Token burn
Low. The front-matter template is repeated twice (EN/FR) but that's necessary. The dot-separator warning at the bottom is redundant with CLAUDE.md — it can be dropped since Claude already has that rule.

### (d) Script candidates — HIGH OPPORTUNITY

Almost the entire execution is mechanical:
- Month/day derivation from a date
- Year-folder existence check and creation (copying previous year's `_index.md`)
- Writing two files from a fixed template

**Proposed script:** `scripts/create-news-stub.sh <date> <slug> <category>`

```
Usage: create-news-stub.sh 2026-06-21 provincial-results results
Output:
  ✓ Year folder: fenb-1/content/news/2026/ (exists)
  ✓ Created: fenb-1/content/news/2026/jun-21-provincial-results.en.md
  ✓ Created: fenb-1/content/news/2026/jun-21-provincial-results.fr.md
```

The script writes both stubs with blank title/summary fields. The AI's job then shrinks to: ask 4 questions (title EN, title FR, summary EN, summary FR), then call the script and fill in the fields with `sed` or Edit. The year-folder check/copy logic leaves the script entirely.

---

## 2. `fenb-content-add-page`

**What it does:** Create bilingual content page stubs; run a multi-point wiring audit; assess project docs for needed updates.

### (a) Format
Good. Tool list is explicit (`Read Write Bash(grep *) Bash(cat *)`). `disable-model-invocation: true`.

### (b) Relevance & efficiency
Steps 1–4 (file creation, i18n reminder, layout check) are necessary and appropriate. Steps 5–6 (audit + doc review) are the most valuable parts — they prevent broken link drift and stale docs. This skill correctly earns its complexity.

### (c) Token burn
**Step 5d** (grep for placeholder hrefs in layouts) is low-signal — placeholder `href="#"` entries are rare and widely scattered; the grep output needs significant AI interpretation. This step adds cost without reliable payoff.

**Step 6** (doc review) asks Claude to read and assess 5 docs after every page creation. For simple pages this is overkill — most new content pages don't touch CSS, build commands, or skills. This should be opt-in or conditioned on whether new layout files were created.

### (d) Script candidates — MEDIUM OPPORTUNITY

**File creation (Steps 1–2):** A `create-page-stub.sh <section> <slug>` script can write both stubs with correct frontmatter and `translationKey`.

**Wiring audit (Step 5):** A `page-audit.sh <section> <slug>` script can run all the greps (nav entries in hugo.toml, data files, layouts, TODO.md) and produce a structured report. AI reads the report rather than issuing each grep itself — cuts 5 tool calls to 1.

**Doc review (Step 6):** Should only trigger when layout files are created. Add a condition: skip Step 6 if no `layouts/` files are new or changed.

---

## 3. `fenb-content-add-results`

**What it does:** Read a results JSON file, detect away vs hosted format, ask publication details, generate full bilingual article body, write EN + FR files.

### (a) Format
Good structure. No `disable-model-invocation` (correct — this is the most AI-intensive skill). Tool list is appropriate. The two-path branching (Away/Hosted) is clearly delimited.

### (b) Relevance & efficiency
This skill is correctly scoped. The translation table (Step 6), pool-round exclusion rule, and `results_hide_placements` logic are all domain-specific rules that genuinely need to live here because the AI needs them at generation time.

The Day 1/Day 2 multi-day guidance in Step 2 is correct and hard to express elsewhere.

### (c) Token burn
**The French translation table** (Step 6, ~15 rows) is loaded every run even though most terms are standard fencing vocabulary the model already knows. It's worth keeping only the non-obvious mappings (Veteran → Vétéran, Vet-50 → Vét-50, Place → Position). The rest (Women's → féminin, Foil → Fleuret, etc.) are widely known.

**Step 7 (write files)** re-specifies the year-folder check logic that also appears in `fenb-content-add-news`. This is duplicated — should reference a shared script.

**Step 5 prose templates** ("Paragraph 1 – 2 sentences", "Paragraph 2 – top performers block") are detailed but necessary. The backslash line-break reminder is critical and should stay.

### (d) Script candidates — MEDIUM OPPORTUNITY

**Format detection (Step 1):** A one-liner Python can detect the format and print `away` or `hosted` — the AI shouldn't need to do this inspection.

**Year-folder check + file writing (Step 7):** Same `create-news-stub.sh` proposed for skill #1 handles this. The AI provides article body text; the script writes the file with correct front matter and derives filenames.

**In-progress event detection (Step 2):** A Python wrapper around the existing JSON reader could flag incomplete events before Claude reads the file, reducing what the AI needs to inspect.

---

## 4. `fenb-data-get-results`

**What it does:** Check prerequisites, ask away vs hosted, run the Python scraper, report placements, optionally update `events.yaml`.

### (a) Format
Good. Tool list properly whitelists only the specific Python commands. HOSTED/AWAY path split is visually clear.

### (b) Relevance & efficiency
The skill is well-structured. The Python script does all the heavy lifting; Claude orchestrates it and interprets results. This is appropriate.

**Step A3's branch logic** (≤4 vs >4 tournaments → different UX) is necessary but complex. The markdown table fallback for >4 options adds implementation overhead since the AI then needs to print a markdown table *and* ask a question.

### (c) Token burn
**Step 0 (prerequisites)** is 30 lines specifying what to check, what to auto-fix, and what to report. This runs every invocation even when the environment is stable. It's verbose for what should be a one-shot check.

**Step H3 and A5.5 (events.yaml URL update)** are important but the matching logic description (date overlap + fuzzy name match) is re-described in full here when it could just say "use the matching logic in the script." The script could handle this match and output a proposed update for the AI to confirm.

### (d) Script candidates — HIGH OPPORTUNITY

**Step 0 (prerequisites) → `check-ftl-deps.sh`**
```bash
check-ftl-deps.sh
# → PASS: python3 3.11.2 | PASS: pyyaml 6.0 | PASS: playwright | PASS: chrome | PASS: clubs.yaml
```
One tool call replaces 5 parallel checks + auto-fix logic. If the script exits non-zero, print its output and stop.

**Step A5.5 (events.yaml update) → extend the Python scraper**
The scraper already loads the tournament data. Add a `--match-events` flag that checks `fenb-1/data/events.yaml` for an overlapping event and proposes the `results_url_en` value. AI confirms; edit is one tool call.

**Tournament selection for >4 tournaments:** The scraper could output a numbered list directly in its stdout, and the AI could simply pass `--select N` from the user's answer. Eliminates the need for Claude to format its own markdown table.

---

## 5. `fenb-data-season-rollover`

**What it does:** Archive current `events.yaml`, write a blank new-season `events.yaml`, update two `_index.md` descriptions, print a reminder checklist.

### (a) Format
Clean. `disable-model-invocation: true`, narrow tool list (`Read Write Bash(ls *)`). Correct.

### (b) Relevance & efficiency
Well-scoped. Short and clear. The reminder list at the end is the right level of detail.

### (c) Token burn
The instructions are already lean. The main inefficiency is that AI is doing pure file I/O that has no reasoning component: read a YAML key, copy a file, write a template, edit two description lines.

### (d) Script candidates — HIGHEST OPPORTUNITY

**This skill is a candidate for full script replacement.**

`scripts/season-rollover.sh <outgoing-season> <new-season-label>` can:
1. Verify `events.yaml` `season:` field matches the outgoing season
2. Copy to `data/events_archive/`
3. Write blank new `events.yaml`
4. Patch both `_index.md` description fields

The skill becomes: run the script, report its output, print the reminder checklist. No AI judgment needed for steps 1–4. The script running cleanly is the verification.

The AI's residual role is only: ask the 2 inputs and display the post-rollover reminder list. This could ultimately be a very short skill (10 lines instead of 42).

---

## 6. `fenb-docs-update`

**What it does:** Gather git diff, assess 6 doc files for needed updates, present a summary table, optionally apply edits.

### (a) Format
Good. `disable-model-invocation: true`, appropriate tools (`Bash(git *) Read Edit AskUserQuestion`).

### (b) Relevance & efficiency
The skill earns its complexity — assessing whether a diff touches conventions, schemas, or layout patterns requires genuine AI judgment. The 6-file breakdown and per-file criteria are necessary.

### (c) Token burn
**The "Assess each system file" section** re-describes the content of each doc file (what CLAUDE.md covers, what STYLE_GUIDE covers, etc.). This is useful scaffolding but amounts to about 200 tokens of static explanation that Claude already knows from reading the files themselves. It could be reduced to the decision criteria only.

The `AskUserQuestion` at the end has only Yes/No — simpler than most skills, which is appropriate here.

### (d) Script candidates — LOW OPPORTUNITY

**Step 1 (gather changes) → `git-changes-summary.sh`**
Run all 3 git commands, output a single combined diff — one tool call instead of 3. Minor gain.

This skill is inherently AI-dependent. The file assessments cannot be scripted.

---

## 7. `fenb-git-commit`

**What it does:** Confirm intent; check/select target branch; inspect remote state; stage and commit; push.

### (a) Format
Good. Tool list is minimal (`Bash(git *) AskUserQuestion`). Step numbering is clear. The visual commit summary box is consistent with `fenb-git-merge` and `fenb-git-release`.

### (b) Relevance & efficiency
All steps are load-bearing. Step 2's branch routing (dev/feature/main cases) is necessary for safety. Step 3's remote-state table prevents force-push situations.

### (c) Token burn
**Step 3** lists a 4-row decision table explaining remote state outcomes. This is documentation for the human reader of the skill file — Claude doesn't need it formatted as a table. It adds ~50 tokens per run for zero extra safety.

**Step 5** (draft commit message) says "inspect the diff and match the repo's commit style." This is fine, but the instruction to show the proposed message as a blockquote header with bold text is low-value formatting specification that doesn't affect correctness.

**The stash/move-to-dev path (Step 2, "Move to dev" branch)** is detailed but used rarely. It's correct to have it here, not a candidate for removal.

### (d) Script candidates — MEDIUM OPPORTUNITY

**Steps 1+3 combined → `git-preflight.sh`**
```
Current branch: feat/east-coast-results
Status:  3 files modified, 0 untracked
Remote:  branch exists | 2 unpushed commits ahead of origin
```
One tool call replaces `git branch`, `git status`, `git fetch`, `git status`, `git log origin/...` — 4–5 calls.

**Step 4 (show pending changes):** `git diff --stat HEAD` + `git status --short` combined into the preflight script output. Removes a step entirely.

The commit message draft (Step 5) and the actual commit (Step 6) must remain AI-driven.

---

## 8. `fenb-git-merge`

**What it does:** Find unmerged feature branches, let user pick one, push if needed, create PR, optionally merge immediately.

### (a) Format
Good. `disable-model-invocation: true`. The `script -q -c` wrapper is correctly noted for gh commands.

### (b) Relevance & efficiency
Well-scoped. The behind-dev warning in Step 3 is the right level of care. Step 5 (PR draft) is appropriate.

### (c) Token burn
**Step 1** runs 3 commands and describes complex deduplication logic in prose. This is one of the longer instruction blocks for what is essentially `git branch --no-merged dev`. The deduplication and exclusion of main/dev are stated twice (in the command and in the description below).

**Step 3** repeats the ahead/behind concept explained in `fenb-git-commit` Step 3. Since these are separate skills there's no easy way to avoid this, but it's worth noting as duplicated specification.

### (d) Script candidates — MEDIUM OPPORTUNITY

**Step 1 → `list-feature-branches.sh`**
```
feat/east-coast-results   (3 ahead, 0 behind dev)
feat/board-updates        (1 ahead, 2 behind dev) ⚠️ behind
```
AI reads the output and presents it in the `AskUserQuestion` — no need for the AI to run multiple git commands or describe the deduplication logic.

**Step 4 (push):** These are deterministic git commands. Could be part of the script, or left to AI since they're simple.

---

## 9. `fenb-git-release`

**What it does:** Confirm intent; check branch/remote; build prod; parity check; summarize commits; select version tag; create PR; write version.json; merge; tag.

### (a) Format
Correct but long (143 lines). The stash-pop reminder appears 4 times — necessary for correctness but a sign that the stash path adds significant complexity.

### (b) Relevance & efficiency
Every step is load-bearing. The release process genuinely requires: build verification, parity check, commit summary, version tagging, version.json generation, PR creation, merge, and tag push. This cannot be easily shortened without removing safety checks.

The Step 3 `main` sync (`git merge-base --is-ancestor` + `git fetch origin main:main`) is a subtle correctness fix that must stay and is well-documented.

### (c) Token burn
**Step 11 (version.json)** is the densest section. It specifies exact bash variable manipulation (email anonymization, `commits_since_tag` calculation) inline. This is the most error-prone section for AI to execute correctly — the spec exists because Claude has gotten it wrong. However, this is also exactly the section that should be a script.

**The stash-pop safety reminder** appearing 4× ("pop the stash if one was taken, then stop") is necessary but reads as defensive repetition. A single "stash state: taken/not" variable at the top and a single cleanup note at the end would be cleaner.

**Step 7 (TODO.md review)** adds a doc-review step inside a release skill. This is already done by `fenb-docs-update` — it creates overlap. In practice, a release should have already had docs updated. Consider making this a reminder line ("If you haven't run /fenb-docs-update, do so before proceeding") rather than a full inline check.

### (d) Script candidates — HIGHEST OPPORTUNITY

**Step 1 (tag lookup + version candidates) → `compute-next-version.sh`**
```
Current tag: v0.3.2
→ Patch: v0.3.3 | Minor: v0.4.0 | Major: v1.0.0
```
AI reads the output; step reduces to one Bash call.

**Step 11 (version.json generation) → `generate-version-json.sh <version> <pr-url>`**
This is the strongest script candidate in the entire skill set. The script handles:
- Email anonymization
- `commits_since_tag` computation (tagged vs untagged branch)
- Timestamp generation
- JSON formatting
- git add + commit + push

Eliminates the most error-prone AI step. The AI's only role becomes: pass the version string and PR URL as arguments.

**Step 5 (parity check) → already `make check-parity`** — already a script; well done.

**Step 4 (build) → already `make build-prod`** — same.

**Steps 11's git operations:** The version.json commit is currently a raw `git add / git commit / git push` block inside the skill. This is the only place in the system where git commits happen outside `fenb-git-commit`. If `generate-version-json.sh` handles this, consistency improves.

---

## Summary table

| Skill | Format | Efficiency | Token burn | Script opportunity |
|---|---|---|---|---|
| `fenb-content-add-news` | ✓ | Good | Low | HIGH — file creation + year-folder logic |
| `fenb-content-add-page` | ✓ | Good | Medium — Step 6 trigger | MEDIUM — file stub + grep audit script |
| `fenb-content-add-results` | ✓ | Good | Low-medium — FR table trimming | MEDIUM — format detection, year-folder, stub |
| `fenb-data-get-results` | ✓ | Good | MEDIUM — Step 0 verbosity | HIGH — deps check script, events.yaml match |
| `fenb-data-season-rollover` | ✓ | Lean | Low | HIGHEST — fully scriptable |
| `fenb-docs-update` | ✓ | Good | Low | LOW — inherently AI judgment |
| `fenb-git-commit` | ✓ | Good | Low | MEDIUM — preflight script for branch/remote state |
| `fenb-git-merge` | ✓ | Good | Low | MEDIUM — branch list script |
| `fenb-git-release` | ✓ | Slightly verbose | MEDIUM — Step 11, Step 7 overlap | HIGHEST — version script, tag lookup |

---

## Proposed scripts (priority order)

| Priority | Script | Replaces | Effort |
|---|---|---|---|
| 1 | `scripts/generate-version-json.sh <version> <pr-url>` | Step 11 of git-release (most error-prone AI step) | Low |
| 2 | `scripts/season-rollover.sh <outgoing> <new-label>` | Entire fenb-data-season-rollover execution | Low |
| 3 | `scripts/check-ftl-deps.sh` | Step 0 of fenb-data-get-results | Low |
| 4 | `scripts/create-news-stub.sh <date> <slug> <category>` | File creation in add-news + add-results | Medium |
| 5 | `scripts/compute-next-version.sh` | Step 1 of git-release | Low |
| 6 | `scripts/git-preflight.sh` | Steps 1+3+4 of git-commit | Medium |
| 7 | `scripts/list-feature-branches.sh` | Step 1 of git-merge | Low |
| 8 | `scripts/page-audit.sh <section> <slug>` | Step 5 greps in add-page | Medium |

Scripts 1–3 are the quickest wins: low effort, highest frequency of error or unnecessary token burn. Scripts 4–5 consolidate duplicated logic across multiple skills. Scripts 6–8 are quality-of-life improvements.

---

## Cross-skill observations

1. **`disable-model-invocation: true` is inconsistently applied.** It's set on skills that still say "Ask the user for:" at the top (`add-news`, `add-page`, `season-rollover`). This appears to mean "run in current conversation, not a sub-agent" — which is correct and intentional — but the semantics should be confirmed, since new contributors might misread it as "no AI involved."

2. **Year-folder creation logic is duplicated** between `add-news` (Step 3) and `add-results` (Step 7, step 4). A shared script removes this duplication.

3. **Version.json commit inside `git-release`** is the only raw `git commit` outside the `fenb-git-commit` skill. This is a necessary exception (pre-PR metadata) but worth noting. Moving it to `generate-version-json.sh` makes the exception explicit and contained.

4. **`fenb-docs-update` and `fenb-git-release` Step 7 overlap** on TODO.md review. The release skill's step should be reduced to a reminder to run `/fenb-docs-update` if not already done.

5. **The visual summary boxes** (┌─ Summary ─…└──) at the end of `git-commit`, `git-merge`, and `git-release` are consistent and valuable for UX. Keep them.
