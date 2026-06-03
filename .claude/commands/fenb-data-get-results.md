---
description: Fetch recent tournament results from fencingtimelive.com and report NB fencer placements.
allowed-tools: Bash(python3 scripts/fencingtimelive-results.py *) Bash(python3 -c *) Bash(python3 -m pip *) Bash(pip install *) Bash(pip3 install *) Bash(which *) AskUserQuestion Read
---

Fetch recent tournament results from fencingtimelive.com and check for NB fencer participation.

---

## Step 0 — Prerequisites

Check all requirements before running anything. Run checks in parallel where possible.

**Check all of the following:**

1. **Python 3.9+** — `python3 --version`. Required for `str | None` type union syntax used in the script.

2. **PyYAML** — `python3 -c "import yaml; print(yaml.__version__)"`. Used to read `fenb-1/data/clubs.yaml`.

3. **Playwright** — `python3 -c "import playwright; print(playwright.__version__)"`. Used to open Chrome for login.

4. **System Chrome** — `which google-chrome || which google-chrome-stable || which chromium-browser || which chromium`. Playwright drives system Chrome (not its bundled browser) to avoid Google's bot detection.

5. **clubs.yaml** — confirm `fenb-1/data/clubs.yaml` exists. This file defines which clubs count as NB clubs.

**For any missing dependency, attempt to install or fix it automatically:**

- PyYAML missing: `pip install pyyaml --break-system-packages`
- Playwright missing: `pip install playwright --break-system-packages` (no extra browser install needed — system Chrome is used)
- Chrome missing: cannot auto-install; tell the user to install Google Chrome and stop.
- clubs.yaml missing: tell the user the file is missing and stop — do not continue without it.

**Report the status of each check** (pass/installed/fail) before continuing. If any prerequisite cannot be satisfied, stop and explain what the user needs to do.

---

## Step 1 — Parameters

Ask the user what search parameters to use:

- **Question:** "Which tournaments should we search?"
- **Country:** default `CAN`; offer `USA` as an alternative or let the user type a FIE country code.
- **Date range:** default "Last 10 days" (`--days -1`); offer "Last 30 days" (`--days -2`).

Use `AskUserQuestion` with two questions — one for country, one for date range.

---

## Step 2 — Fetch tournament list

Run the script in list mode to get the available tournaments. This may open a Chrome window for Google login if no saved session exists — tell the user to complete the login in the browser.

```bash
python3 scripts/fencingtimelive-results.py --list --country {COUNTRY} --days {DAYS}
```

The script writes logs to stderr and JSON to stdout. Parse the JSON array from stdout.

If the list is empty or the command fails, report the error clearly and stop.

---

## Step 3 — Select tournament

Present the tournament list to the user using `AskUserQuestion`:

- **Question:** "Which tournament do you want to check for NB fencers?"
- One option per tournament, labelled with the tournament name; description shows location and dates.

---

## Step 4 — Run full scrape

Run the script with the selected tournament number (1-indexed position in the list from Step 2):

```bash
python3 scripts/fencingtimelive-results.py --select {N} --country {COUNTRY} --days {DAYS}
```

This may take a minute or two — there is a 2-second rate limit between each event. Keep the user informed that the script is running.

The script saves output to `scripts/output/<slug>-<date>.json` and logs the exact path to stderr. Find the output file path in the stderr log line that starts with `[ ok ] Output saved to`.

---

## Step 5 — Report results

Read the saved JSON output file and present the findings clearly.

**If `events_with_nb_fencers` is empty:**

Report that no NB fencers were found at this tournament. Show the tournament name, location, and dates. Note the total number of events checked.

**If NB fencers were found:**

For each event in `events_with_nb_fencers`, show:
- Event name, day, start time
- A table of NB fencer results: Place | Name | Club
- Direct link to the results page (`results_url`)

End with a summary: how many events had NB fencers, total NB fencer appearances across all events.

---

## Step 5.5 — Update events.yaml results_url

After reporting results, check whether the tournament matches an event in `fenb-1/data/events.yaml`.

**Match logic:** Read `fenb-1/data/events.yaml`. For each event in the `events` list, check whether:
- The tournament dates overlap the event's `date` (and `end_date` if set), AND
- The event title is a plausible match for the tournament name (case-insensitive substring or fuzzy match — e.g. "May Nationals" matching "CC #4 — May Nationals")

If a match is found:
- Check whether the event already has a `results_url` field set to a non-empty value.
- **If empty or missing:** Ask the user: "I found a matching event in events.yaml: `{event title}` ({display_date}). Would you like to set its `results_url` to the FTL tournament schedule URL?\n`{tournament.schedule_url}`"
- **If the user confirms:** Update the matching event in `fenb-1/data/events.yaml` by adding or setting `results_url: "{tournament.schedule_url}"` on the event, preserving all other fields and the file's existing formatting style.
- **If already set:** Report the existing URL and take no action.

If no match is found, skip silently and proceed to Step 6.

---

## Step 6 — Publish results

Once **all** events at the tournament are complete, tell the user: "Run `/fenb-content-add-results` to generate a bilingual news article from the saved JSON output file."
