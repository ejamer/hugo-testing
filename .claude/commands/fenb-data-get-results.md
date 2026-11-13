---
description: Read tournament results from FencingTimeLive pages the user saved by hand and report podiums or NB fencer placements.
allowed-tools: Bash(python3 scripts/ftl-read-saved-pages.py *) AskUserQuestion Read Write Grep
---

Build a results JSON file from FencingTimeLive (FTL) pages the user saved by hand. Two modes:

- **Away** — NB athletes competed out of province. Report only events where NB athletes appear.
- **Hosted** — tournament was held in New Brunswick. Report the full podium (all medalists, any province) for every event.

**Never access fencingtimelive.com.** FTL's terms of service prevent scripted access, so don't use WebFetch, curl, a browser tool, or `scripts/fencingtimelive-results.py` (which now exits with an error). FTL URLs are only written into the output as links.

---

## Step 1 — Tournament type and folder

Ask both via `AskUserQuestion`, skipping anything the user already said:

1. **Tournament type:** "NB-hosted" / "Away"
2. **Folder of saved pages:** options "Already saved — I'll paste the path" (user types it under Other) / "Not saved yet — show me how"

If the pages aren't saved yet, show these steps and stop until the user returns with the path:

1. Create a new folder for this tournament, outside the repo.
2. Wait until the tournament is over, and keep FTL set to English.
3. Save the tournament's **event schedule** page.
4. Save the **Final Results** page of every event, including events with no NB fencers. Wait for the table to load first. An unfinished event opens on its pools or tableau instead, and those pages don't count.
5. In Chrome, use **Save as → Webpage, Complete** and keep the suggested filename. "HTML Only" and "Single File" won't work. The `_files` folders Chrome adds are ignored.

---

## Step 2 — Read the saved pages

```bash
python3 scripts/ftl-read-saved-pages.py "{FOLDER}" > scripts/output/saved-pages.txt
```

The output has one `=== FILE:` block per page, with `EV` lines for schedule rows (`EV`, event ID, day, then the row's cells) and `ROW` lines for table rows. Read it in parts or search it with Grep if it's long. `scripts/output/` is gitignored.

The helper doesn't interpret columns. Work out each column from the table's header row and contents, and tell the user if a page's layout looks different from the others.

---

## Step 3 — Check the pages are complete

Report these problems before going further, and ask whether to continue or wait for corrected pages:

- **`unsupported_format` line** — files saved in a format the helper can't read.
- **No schedule page** (no block has `EV` lines) — ask for it. Without it, events can't be listed or checked for completeness.
- **A results page with `table_rows: 0`** — most likely saved as "HTML Only" or before the table loaded.
- **A page that isn't a results page** — only `/events/results/` in `saved_from` with a "Final Results" heading counts as results, and `/events/competitors/` counts as an entry list. A `/pools/` or `/tableaus/` page holds no final placements, so list that event as not checked.
- **A schedule event with no saved page** — match pages to events using the event ID in `saved_from`, then the page title and headings. If a page can't be matched, ask the user.
- **A schedule event that isn't finished** — its status doesn't start with "Finished".

**Never treat a missing page as "no NB fencers" or "no results".** List it as not checked.

---

## Step 4 — Write the JSON file

Take the tournament name from the schedule page's title. Take dates from the `EV` day values, formatted like `September 19, 2026 - September 20, 2026`. Saved pages don't show the location, so ask the user for it in the form `Saint John, NB, CAN`.

Build URLs without visiting them:
- `schedule_url`: the schedule page's `saved_from`, without any `#today` fragment
- `results_url`: `https://www.fencingtimelive.com/events/results/{event ID}`

`{slug}` is the tournament name lowercased, with each run of other characters replaced by `-`. `{today}` is today's date. Both shapes below are what `/fenb-content-add-results` reads, so keep the keys exactly.

### Hosted — `scripts/output/{slug}-podiums-{today}.json`

```json
{
  "tournament": { "name": "", "location": "", "dates": "", "schedule_url": "" },
  "events": [
    {
      "event_name": "", "day": "", "results_url": "",
      "podium": [ { "place": "1", "name": "", "club": "" } ],
      "pools_only": false
    }
  ]
}
```

- **Podium:** every entry whose place, with any trailing `T` removed, is 3 or better. Keep place text as shown, such as `3T`. Both tied bronze medalists must be included.
- **No elimination bracket** (a finished event with `tableau_link: False` and a populated table): by default this is a **pools-only competition** — small events often run pools only, and the final ranking is the real result. Report its podium like any other event, with ties as shown. Treat it as a **seeding pool** instead — set `pools_only: true` and leave `podium` empty — only if:
  - its name contains "Pool" or "Pools", or
  - a later event in the same tournament and weapon splits its field: by gender (a *Mixed* event, with *Men's*/*Women's* events at the same age), by division (*Div 1/2*, *Div no.1*), or by age (a combined *U11/U13* event, with separate *U11*/*U13* events).

  Example: at the Fundy Open 2026, *U-13 Mixed Épée* (split into U-13 Men's and Women's) and *Senior Men's Épée* (split into Div no.1/no.2) were seeding pools. At the Hoplite Invitational 2026, *Senior Women's Épée* (2 fencers) and *Cadet Women's Épée* (4 fencers) had no bracket and no split events, so they were real results.
- **Unfinished or missing:** set `podium` to `[]` and `pools_only` to false.

### Away — `scripts/output/{slug}-{today}.json`

```json
{
  "tournament": { "name": "", "location": "", "dates": "", "schedule_url": "" },
  "nb_clubs_checked": [],
  "events_with_nb_fencers": [
    {
      "event_name": "", "day": "", "start_time": "", "status": "",
      "source": "results", "total_fencers": 0, "results_url": "",
      "nb_fencers": [ { "name": "", "place": "", "club": "", "license": "" } ]
    }
  ],
  "canadian_fencers_to_review": [
    { "name": "", "club": "", "events": [ { "event_name": "", "place": "" } ] }
  ]
}
```

- **NB match:** read `fenb-1/data/clubs.yaml` and match each entry's club against club names and IDs, including a `DAM - Damocles...` form. Also match a division shown as `NB` or `New Brunswick`. List the clubs checked in `nb_clubs_checked`.
- **`source`:** `"results"` for a Final Results page. Use `"competitors"`, with empty `place` values, for a saved `/events/competitors/` page.
- **`total_fencers`:** the number of fencers in that event's table, not counting the header row. It should match the competitor count in the schedule status, so flag any difference.
- **`license`:** leave it empty unless the page shows it.
- **`canadian_fencers_to_review`:** entries with country `CAN` that didn't match a club. Some tournaments show a Country column and no Club column, so every Canadian lands here and the user has to pick out the NB fencers. If a page shows neither column, say so and ask the user to name them.

---

## Step 5 — Report

### Hosted

Report the podium for each event. For events with an empty `podium`, note that final results weren't available, except `pools_only` events, which go in a separate "pool round only (no podium)" list.

Then list **every event with no elimination bracket**, one line each, with its classification and the reason, so the user can confirm or correct it before the article is written — e.g. `U-13 Mixed Épée: seeding pool (split into U-13 Men's and U-13 Women's Épée)` or `Cadet Women's Épée: pools-only competition, podium kept (no split events)`. If the user corrects one, update its `pools_only` and `podium` in the JSON. List anything not checked from Step 3.

### Away

**If `events_with_nb_fencers` is empty:** report no NB fencers found among the pages checked. Show the tournament name, location, dates, events checked, and any events not checked.

**If NB fencers were found:** split events by `source` under "Completed" and "Upcoming / in progress" headings, leaving out an empty group. For each event, show the event name, day, and start time, a table of Place | Name | Club (no Place column for the upcoming group), and the `results_url` link. End with events with NB fencers and total NB fencer appearances.

**Review other Canadian fencers:** if `canadian_fencers_to_review` isn't empty, show it as a table (Name | Club | Event | Place, one row per event) and ask which, if any, are NB fencers. Move those people to `nb_fencers` in the matching events, add any events this newly qualifies, and report again.

---

## Step 6 — Update events.yaml

Check whether the tournament matches an event in `fenb-1/data/events.yaml`: its dates overlap the event's `start_date` / `end_date`, and the event title plausibly matches the tournament name.

If matched and `results_url_en` is empty, ask the user before setting it to `schedule_url`. Leave `results_url_fr` empty, because FTL links are language-agnostic. If it's already set, report the existing URL and take no action.

---

## Step 7 — Publish

**If any event is unfinished, not checked, or has `source: "competitors"`:** don't suggest publishing yet. Recommend saving the final pages once the tournament ends and re-running this skill.

**Otherwise,** tell the user to run the next command, given as its own fenced code block (not inline backticks) so it can be copied with a click:

```
/fenb-content-add-results scripts/output/{output file}
```
