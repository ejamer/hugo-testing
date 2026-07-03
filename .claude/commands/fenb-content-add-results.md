---
description: Generate a bilingual EN/FR news article from a saved fenb-get-results JSON output file.
allowed-tools: AskUserQuestion Read Write Bash(ls *) Bash(find *)
---

Create a bilingual news article summarising results from a saved results JSON file.

---

## Step 1 — Locate the JSON file

If the user provided a file path, use it. Otherwise list `scripts/output/` and ask the user which file to use via `AskUserQuestion`.

Read the JSON file.

**Detect format** — the JSON is one of two shapes:
- **Away format** (standard NB-fencer tracking): top-level key `events_with_nb_fencers`. Shows NB athletes only across all placements.
- **Hosted format** (NB-hosted tournament): top-level key `events`, each entry has a `podium` array. Shows all medalists regardless of province, top-4 only per event.

All steps below branch on this format. Follow the appropriate branch throughout.

---

## Step 2 — Check for in-progress events

**Away format:** Scan `events_with_nb_fencers` for any entry where `source` is `"competitors"` (place values are empty — results not yet posted).

**Hosted format:** Scan `events` for any entry whose `podium` array is empty or missing — this means final results were not entered in the system.

**If any exist**, report:
- A warning that not all events are finished.
- A list of the in-progress events (name, day, start time).

Then ask the user via `AskUserQuestion` whether to:
- **Wait** — stop here; re-run `/fenb-content-add-results` once all events are complete.
- **Proceed anyway** — continue generating the article. Two sub-cases:
  - **Day 1 of a multi-day tournament** — exclude the in-progress events entirely (don't show them with "—"). Frame the title and intro as Day 1 results (e.g. "East Coast Games 2026 — Day 1 Results") with a closing note that Day 2 results will follow. When Day 2 finishes, re-run `/fenb-data-get-results` for a fresh JSON, then **manually update the existing article** — do not create a second article. Add a `## Day 2 — [date]` section, append the new event tables, and update the title to "Final Results".
  - **Single-day event with a late result** — include the in-progress event with "—" for placement and a note that the result is pending.

Stop if the user chooses to wait. Otherwise continue.

---

## Step 3 — Confirm article parameters

Determine the tournament **start date** by finding the earliest `day` value across all events and converting it to `YYYY-MM-DD` format (e.g. "Friday May 15, 2026" → `2026-05-15`).

Ask the user two things via `AskUserQuestion`:

1. **Publication date** — default today's date (YYYY-MM-DD)
2. **Article slug suffix** — a short kebab-case label the user can edit; suggest one derived from the tournament name (e.g. for "May Nationals 2026" suggest `may-nationals`). The full slug will be `{tournament-start-date}-{suffix}` (e.g. `2026-05-15-may-nationals`).

   **Caution:** the full slug already contains the year via the start-date prefix (e.g. `2026-05-15`). Do not repeat the year in the suffix — use `may-nationals`, not `may-nationals-2026`.

---

## Step 4 — Identify top results

**Away format:**
Count unique NB fencers across all events (deduplicate by name across multiple events).

From all finished events, collect:
- **Medalists**: any NB fencer with a numeric place of 1, 2, or 3. Strip any trailing `T` before comparing. Map to medal emoji: 1 → 🥇, 2 → 🥈, 3 → 🥉.
- **Top-16 non-medalists**: any NB fencer with a numeric place of 4–16 (strip `T` before comparing).

**Hosted format:**
No pre-processing needed — the `podium` array for each event already contains only medalists (4 entries: 1st, 2nd, 3T, 3T). Medal emoji map: place 1 → 🥇, 2 → 🥈, 3 (or 3T) → 🥉.

---

## Step 5 — Write EN article body

### Away format

**Paragraph 1** (2 sentences):
- Name the tournament, location, and dates. State the total number of unique NB fencers and how many events they appeared in.

**Paragraph 2** — top performers block:
- Open with a generic congratulatory sentence ("Congratulations to our podium finishers!" or similar).
- List each medalist on its own line using a backslash line-break (`\`):
  ```
  🥇 NAME — Event\
  🥈 NAME — Event\
  🥉 NAME — Event
  ```
- Follow with a congratulatory sentence and a comma-separated inline list of top-16 non-medalists:
  `NAME (Event), NAME (Event), …`

**Per-event sections** (one per event, in the order they appear in the JSON):
- Heading: `### [Event name]` — hyperlink the heading text to `results_url`
- Markdown table with columns **`Name | Club | Place`** (Place is always last)
- Add the appropriate medal emoji before the fencer's name for places 1–3 (e.g. `🥇 YANO Wendy`)
- Leave Place as `—` for any in-progress event rows
- One blank line between the table and the next heading

### Hosted format

**Paragraph 1** (2 sentences):
- Name the tournament, location, and dates. State the number of events contested and the weapons/age groups covered.

No top-performers block. Go directly to per-event sections.

**Combined pool/seeding rounds (hosted format only):** Some tournaments run combined age-group pool rounds (e.g. "U11/U13 Mixed Sabre Pools") before splitting into separate DE brackets by age. These events appear in the JSON with podium data but are not standalone competitions — do not include them as per-event podium sections. Instead, reference them by name with a hyperlink to their `results_url` in the intro paragraph (e.g. "Pool rounds for [U11/U13 Mixed Sabre](...) were held as combined age groups to seed the direct elimination brackets below."). Apply this rule to any event whose name contains "Pool" or "Pools" and whose age group spans multiple categories (e.g. "U11/U13", "U13/U15").

**Per-event sections** (one per event, in order from the JSON, excluding combined pool rounds):
- Heading: `### [Event name]` — hyperlink to `results_url`
- Markdown table with columns **`Name | Club | Place`** (Place is always last)
- Add the appropriate medal emoji before the fencer's name for places 1–3 (e.g. `🥇 ZHANG Zhirong`)
- If a fencer has no club recorded, use `—` in the Club column
- If an event's `podium` is empty (results not in system), note this under the heading instead of a table
- One blank line between the table and the next heading

The JS in `static/js/results-table.js` automatically hides the Place column and makes headers sortable — the markdown table format is all that is needed.

---

## Step 6 — Write FR article body

Translate the full article into French using the same structure (away or hosted, matching whatever was used for EN). Standard French fencing terminology:

| English         | French       |
|-----------------|--------------|
| Women's         | féminin      |
| Men's           | masculin     |
| Foil            | Fleuret      |
| Épée            | Épée         |
| Saber           | Sabre        |
| Senior          | Senior       |
| Junior          | Junior       |
| Cadet           | Cadet        |
| U-15            | U-15         |
| U-13            | U-13         |
| Veteran         | Vétéran      |
| Vet-50          | Vét-50       |
| Vet-60          | Vét-60       |
| Place           | Position     |
| Name            | Nom          |
| Club            | Club         |

Translate event name headings fully (e.g. "Senior Women's Épée" → "Épée senior féminin"). The FR table header for the name column is `Nom`, for place is `Position`. Translate all prose. Keep fencer names and club names unchanged. Medal emoji and backslash line-breaks carry over unchanged.

---

## Step 7 — Write files

1. Derive `{mon}` (3-letter lowercase month, e.g. `may`) and `{dd}` (zero-padded day) from the **publication date**.
2. Set `{year}` to the 4-digit year of the publication date.
3. Full slug: `{tournament-start-date}-{suffix}` (e.g. `2026-05-15-may-nationals`).
4. Check whether `fenb-1/content/news/{year}/_index.md` and `_index.fr.md` exist. If not, create them by copying front matter from the previous year's folder.
5. Write `fenb-1/content/news/{year}/{mon}-{dd}-{slug}.en.md`:
   ```yaml
   ---
   title: "{English title}"
   date: {YYYY-MM-DD}
   category: results
   results_table: true
   summary: "{One-sentence English summary for the homepage card}"
   ---

   {EN article body}
   ```
   For **away tournaments** (NB athletes competed out of province), also add `results_hide_placements: true` below `results_table: true`. This hides the Place column in the rendered table since placement context differs across events.
   For **hosted tournaments**, `results_table: true` is sufficient — placements are shown.

6. Write `fenb-1/content/news/{year}/{mon}-{dd}-{slug}.fr.md`:
   ```yaml
   ---
   title: "{French title}"
   date: {YYYY-MM-DD}
   category: results
   results_table: true
   summary: "{One-sentence French summary for the homepage card}"
   ---

   {FR article body}
   ```
   Apply the same `results_hide_placements: true` rule as the EN file.

**Critical:** language code uses a **dot** separator (`.en.md`, `.fr.md`), never a dash.

Report the two file paths created and tell the user to review them before committing.
