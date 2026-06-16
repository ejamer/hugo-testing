---
description: Fetch recent tournament results from fencingtimelive.com and report NB fencer placements.
allowed-tools: Bash(python3 scripts/fencingtimelive-results.py *) Bash(python3 -c *) Bash(python3 -m pip *) Bash(pip install *) Bash(pip3 install *) Bash(which *) AskUserQuestion Read
---

Fetch tournament results from fencingtimelive.com. Two modes:

- **Away** — NB athletes competed out of province. Scan all events for NB fencer placements; report only events where NB athletes appear.
- **Hosted** — tournament was held in New Brunswick. Report the full podium (all medalists, any province) for every event. NB fencer filtering is irrelevant.

---

## Step 0 — Prerequisites

Check all requirements in parallel before running anything.

1. **Python 3.9+** — `python3 --version`
2. **PyYAML** — `python3 -c "import yaml; print(yaml.__version__)"`
3. **Playwright** — `python3 -c "from playwright.sync_api import sync_playwright; print('ok')"`
4. **System Chrome** — `which google-chrome || which google-chrome-stable || which chromium-browser || which chromium`
5. **clubs.yaml** — `ls fenb-1/data/clubs.yaml`

Auto-fix missing dependencies:
- PyYAML: `pip install pyyaml --break-system-packages`
- Playwright: `pip install playwright --break-system-packages`
- Chrome missing: tell user to install Google Chrome and stop.
- clubs.yaml missing: stop and tell the user.

Report pass/installed/fail for each. Stop if any prerequisite cannot be satisfied.

---

## Step 1 — Tournament type and source

Ask the user two questions via `AskUserQuestion`:

1. **Tournament type**: Is this an NB-hosted tournament (held in NB) or an away tournament (NB athletes travelled to compete)?
   - Options: "NB-hosted" / "Away"

2. **Tournament source**: Was a direct FTL URL provided, or should we search the tournament list?
   - If the user already provided a URL in their message (e.g. `https://www.fencingtimelive.com/tournaments/eventSchedule/{id}`), skip this question and note that you'll use the direct URL.
   - Otherwise ask: "Direct URL" (user pastes it via Other) / "Search recent tournaments"

If "Search recent tournaments": also ask country (default CAN) and date range (default last 10 days / `--days -1`, offer last 30 days / `--days -2`).

---

## HOSTED PATH — Steps H2 through H3

*Follow this path when the user said NB-hosted.*

### Step H2 — Run hosted scrape

If the user provided a direct URL, extract the tournament ID from the path (the hex string after `/eventSchedule/`) and run:

```bash
python3 scripts/fencingtimelive-results.py --location hosted --tournament-id {ID} 2>/tmp/ftl-scrape.stderr
```

If no direct URL was provided, run with search parameters and let the user pick interactively, or use `--select N` to skip the picker:

```bash
python3 scripts/fencingtimelive-results.py --location hosted --select {N} --country {COUNTRY} --days {DAYS} 2>/tmp/ftl-scrape.stderr
```

**Do not use `2>&1`.** The script handles session, schedule fetching, and podium extraction automatically. Output is saved to `scripts/output/{slug}-podiums-{today}.json` (path logged to stderr as `[ ok ] Output saved to …`). This may take a minute or two — keep the user informed.

### Step H3 — Report and publish

Read the saved `*-podiums-{today}.json` file. Report the podium for each event. For events with an empty `podium` array, note that final results were not posted in the system.

Check whether the tournament matches an event in `fenb-1/data/events.yaml` (same match logic as Step A5.5 below). If matched and `results_url_en` is empty, ask the user to confirm before setting it.

Tell the user: "Run `/fenb-content-add-results scripts/output/{slug}-podiums-{today}.json` to generate the bilingual news article."

---

## AWAY PATH — Steps A2 through A6

*Follow this path when the user said away tournament.*

### Step A2 — Fetch tournament list

```bash
python3 scripts/fencingtimelive-results.py --location away --list --country {COUNTRY} --days {DAYS} 2>/tmp/ftl-list.stderr
```

**Do not use `2>&1`** — stderr has log lines that break JSON parsing. Parse the JSON array from stdout. Print stderr after for context. Stop and report clearly if the list is empty or the command fails.

### Step A3 — Select tournament

List `scripts/output/` to find files already checked today (`{slug}-{today}.json`).

**≤ 4 tournaments:** `AskUserQuestion` with one option per tournament (name as label, location + dates as description).

**> 4 tournaments:** print a markdown table (#, Name, Location, Dates; ✓ = already checked today), then ask with four options: "All of them" / "New ones only" / "Specific tournament(s)" (Other field) / "Just one" (Other field).

When "All of them" or "New ones only": run scrapes sequentially without prompting again.

### Step A4 — Run NB-fencer scrape

```bash
python3 scripts/fencingtimelive-results.py --location away --select {N} --country {COUNTRY} --days {DAYS} 2>/tmp/ftl-scrape.stderr
```

Do not use `2>&1`. Output is saved to `scripts/output/{slug}-{today}.json` (path logged to stderr as `[ ok ] Output saved to …`). This may take a minute or two — keep the user informed.

### Step A5 — Report NB fencer results

**If `events_with_nb_fencers` is empty:** report no NB fencers found. Show tournament name, location, dates, and total events checked.

**If NB fencers were found:** for each event in `events_with_nb_fencers`, show:
- Event name, day, start time
- Table of NB fencer results: Place | Name | Club
- Direct link to `results_url`

End with a summary: events with NB fencers, total NB fencer appearances.

### Step A5.5 — Update events.yaml results_url

Check whether the tournament matches an event in `fenb-1/data/events.yaml`:
- Tournament dates overlap the event's `start_date` / `end_date`, AND
- Event title is a plausible match for the tournament name (case-insensitive substring or fuzzy match)

If matched and `results_url_en` is empty: ask the user before setting it to `{tournament.schedule_url}`. Leave `results_url_fr` empty (FTL links are language-agnostic). If already set, report the existing URL and take no action.

### Step A6 — Publish results

Tell the user: "Run `/fenb-content-add-results scripts/output/{slug}-{today}.json` to generate the bilingual news article."
