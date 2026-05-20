---
description: Perform a season rollover for the FencingNB events data — archives current season YAML and creates a fresh events.yaml for the new season.
disable-model-invocation: true
allowed-tools: Read Write Bash(ls *)
---

Ask the user for:
1. The **outgoing season** in filename format — regular hyphen, no spaces (e.g. `2025-2026`)
2. The **new season label** for display — en-dash, no spaces (e.g. `2026–2027`)

Then:

1. Confirm `fenb-1/data/events.yaml` exists and read its `season:` field to verify it matches the outgoing season the user specified. If it doesn't match, stop and flag the discrepancy.

2. Copy `fenb-1/data/events.yaml` → `fenb-1/data/events_archive/{outgoing-season}.yaml`. Use the regular-hyphen filename (e.g. `2025-2026.yaml`).

3. Replace `fenb-1/data/events.yaml` with a fresh file:
   ```yaml
   season: "{new-season-label}"   # en-dash display label, e.g. "2026–2027"

   events: []
   ```

4. Verify both files exist: the archive file and the new `events.yaml`.

5. Update `fenb-1/content/events/_index.md` and `fenb-1/content/events/_index.fr.md` — change the `description:` field to match the new season label:
   ```yaml
   # _index.md
   description: "{new-season-label} season schedule"

   # _index.fr.md
   description: "Calendrier de la saison {new-season-label}"
   ```
   These files drive the subtitle shown in the events calendar page header band.

6. Remind the user to:
   - Add the first events of the new season to `fenb-1/data/events.yaml`
   - Update the `season:` field in `fenb-1/data/board.yaml` to the new season label
   - Add a placeholder announcement event (category `announcement`) so the homepage events section stays populated during the off-season gap
   - Update `membership_url` in `fenb-1/data/join.yaml` once 2MEV creates the new season's registration page (the slug in the URL changes each season, e.g. `fencing-nb-2026-2027`)
   - Update `club_form_url` in `fenb-1/data/join.yaml` if a new Google Form is created for the new season
