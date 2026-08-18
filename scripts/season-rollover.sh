#!/usr/bin/env bash
#
# Season rollover for the FencingNB events data.
#
# Archives the outgoing season's events.yaml, starts a fresh one for the new
# season, and updates the events calendar page subtitles. Run from the repo root.
#
# Usage:
#   scripts/season-rollover.sh <outgoing-season> <new-season-label>
#
#   <outgoing-season>   filename format, regular hyphen — e.g. 2025-2026
#   <new-season-label>  display format, en-dash          — e.g. 2026–2027
#
# What it does NOT do (deliberately — these need human/AI judgment, not a script):
#   - Add the first events of the new season to events.yaml
#   - Add an off-season placeholder announcement event
#   - Update join.yaml's membership_url / club_form_url once 2MEV publishes
#     the new season's registration page
#
# Note on view continuity: the homepage "upcoming events" widget and the
# interactive /events/ calendar merge current + all archived seasons at
# render time (layouts/partials/all-events.html), so events archived here
# that are still current/upcoming stay visible on the site. No manual
# carry-forward of "tail" events is needed. See plans/events-data-archive.md.

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <outgoing-season e.g. 2025-2026> <new-season-label e.g. 2026–2027>" >&2
  exit 1
fi

OUTGOING="$1"
NEW_LABEL="$2"

if [[ ! "$OUTGOING" =~ ^[0-9]{4}-[0-9]{4}$ ]]; then
  echo "ERROR: outgoing season must be filename format with a regular hyphen (e.g. 2025-2026), got: $OUTGOING" >&2
  exit 1
fi

if [[ ! "$NEW_LABEL" =~ ^[0-9]{4}.[0-9]{4}$ ]]; then
  echo "ERROR: new season label must be YYYY<en-dash>YYYY (e.g. 2026–2027), got: $NEW_LABEL" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

EVENTS_FILE="fenb-1/data/events.yaml"
ARCHIVE_DIR="fenb-1/data/events_archive"
ARCHIVE_FILE="$ARCHIVE_DIR/$OUTGOING.yaml"
INDEX_EN="fenb-1/content/events/_index.md"
INDEX_FR="fenb-1/content/events/_index.fr.md"

if [[ ! -f "$EVENTS_FILE" ]]; then
  echo "ERROR: $EVENTS_FILE not found." >&2
  exit 1
fi

CURRENT_SEASON="$(grep -m1 '^season:' "$EVENTS_FILE" | sed -E 's/^season: *"(.*)"/\1/')"
# Normalize outgoing (hyphen) against current (en-dash) by comparing digit groups only.
OUTGOING_DIGITS="$(echo "$OUTGOING" | tr -dc '0-9')"
CURRENT_DIGITS="$(echo "$CURRENT_SEASON" | tr -dc '0-9')"
if [[ "$OUTGOING_DIGITS" != "$CURRENT_DIGITS" ]]; then
  echo "ERROR: $EVENTS_FILE season is \"$CURRENT_SEASON\", which doesn't match the outgoing season you specified ($OUTGOING). Stopping." >&2
  exit 1
fi

if [[ -f "$ARCHIVE_FILE" ]]; then
  echo "ERROR: $ARCHIVE_FILE already exists. Refusing to overwrite." >&2
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"
cp "$EVENTS_FILE" "$ARCHIVE_FILE"
echo "✓ Archived: $ARCHIVE_FILE"

cat > "$EVENTS_FILE" <<EOF
# Fencing-Escrime NB — $NEW_LABEL Event Calendar
# Sorted chronologically by start_date. Homepage shows the next 4 upcoming events.
#
# Required fields:  title, start_date (YYYY-MM-DD), location ("City, Province" or
#                   "Venue Name, City, Province"), category (must match a key in
#                   data/event_categories.yaml and i18n files)
#
# Optional fields:  title_fr        — French override for the title; falls back to title if blank
#                   end_date        — omit or leave blank for single-day events
#                   description_en  — short note shown on the schedule page (not homepage)
#                   description_fr  — French override; falls back to description_en if blank
#                   details_url_en  — Learn More link (used for both languages if _fr is blank)
#                   details_url_fr  — French override for the Learn More link
#                   registration_url_en — Register Now link (EN); hidden once event date has passed
#                   registration_url_fr — French override; falls back to registration_url_en if blank
#                   results_url_en  — View Results link (EN); populated by /fenb-data-get-results
#                   results_url_fr  — French override; falls back to results_url_en if blank
season: "$NEW_LABEL"

events: []
EOF
echo "✓ Fresh events file: $EVENTS_FILE (season: \"$NEW_LABEL\")"

sed -i.bak -E "s/^description: \".*season schedule\"/description: \"$NEW_LABEL season schedule\"/" "$INDEX_EN" && rm -f "$INDEX_EN.bak"
sed -i.bak -E "s/^description: \"Calendrier de la saison .*\"/description: \"Calendrier de la saison $NEW_LABEL\"/" "$INDEX_FR" && rm -f "$INDEX_FR.bak"
echo "✓ Updated subtitle: $INDEX_EN"
echo "✓ Updated subtitle: $INDEX_FR"

echo ""
echo "Rollover complete: $OUTGOING → $NEW_LABEL"
echo ""
echo "Still needed (not scriptable):"
echo "  - Add the first events of the new season to $EVENTS_FILE"
echo "  - Add a placeholder announcement event so the homepage stays populated in the off-season gap"
echo "  - Update join.yaml membership_url once 2MEV publishes the new season's registration page"
echo "  - Update join.yaml club_form_url if a new Google Form is created for the new season"
