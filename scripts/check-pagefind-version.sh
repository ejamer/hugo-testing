#!/usr/bin/env bash
#
# Compare the Pagefind version pinned for the search-index build against the newest
# npm release, or update the pin.
#
# Pagefind is pinned in three places, which must always agree:
#   .github/workflows/release-website.yml   npx --yes pagefind@X.Y.Z …
#   .github/workflows/pr-check.yml          npx --yes pagefind@X.Y.Z …
#   Makefile                                PAGEFIND ?= pagefind@X.Y.Z
#
# Used by /fenb-git-release (Step 3b). Writes files only with --set — never runs git.
# Run from anywhere inside the repo.
#
# Usage:
#   scripts/check-pagefind-version.sh              # report
#   scripts/check-pagefind-version.sh --set 1.7.0  # rewrite the pin in all three files
#
# Report output (key=value lines):
#   pinned=1.6.0                 the version all three files pin
#   latest=1.7.0                 newest stable npm release — empty if npm is unreachable
#   latest_published=2026-11-20  its publish date (UTC)
#   latest_age_days=6            whole days since it was published
#   latest_old_enough=yes        yes | no — published at least MIN_AGE_DAYS days ago
#   update_available=yes         yes | no | unknown (npm unreachable) — latest is newer than pinned
#
# Policy: only adopt a release at least MIN_AGE_DAYS (5) days old — compromised or
# broken npm releases are usually caught and pulled within days.
#
# Exits non-zero if the three files don't all pin the same version.

set -euo pipefail

MIN_AGE_DAYS=5
ROOT="$(git rev-parse --show-toplevel)"
FILES=("$ROOT/.github/workflows/release-website.yml" "$ROOT/.github/workflows/pr-check.yml" "$ROOT/Makefile")

# pinned_in FILE — every distinct pagefind@X.Y.Z version in the file, one per line
pinned_in() {
  sed -nE 's/.*pagefind@([0-9]+\.[0-9]+\.[0-9]+).*/\1/p' "$1" | sort -u
}

# version_gt A B — true if A > B (semver X.Y.Z)
version_gt() {
  [[ "$1" != "$2" && "$(printf '%s\n%s\n' "$1" "$2" | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)" == "$1" ]]
}

if [[ $# -eq 2 && "$1" == "--set" ]]; then
  NEW="${2#v}"
  if ! [[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: version must be X.Y.Z (got '$2')" >&2
    exit 2
  fi
  for f in "${FILES[@]}"; do
    sed -i.bak -E "s/pagefind@[0-9]+\.[0-9]+\.[0-9]+/pagefind@$NEW/g" "$f" && rm -f "$f.bak"
    echo "$(basename "$f"): pagefind@$(pinned_in "$f" | paste -sd, -)"
  done
  exit 0
elif [[ $# -ne 0 ]]; then
  echo "Usage: $0 [--set X.Y.Z]" >&2
  exit 2
fi

# ── Pinned version — all three files must agree on exactly one ──────────────
PINNED=""
for f in "${FILES[@]}"; do
  V="$(pinned_in "$f")"
  if [[ -z "$V" || "$V" == *$'\n'* ]]; then
    echo "Error: $(basename "$f") should pin exactly one pagefind@X.Y.Z (found: '${V//$'\n'/, }')" >&2
    exit 1
  fi
  if [[ -n "$PINNED" && "$V" != "$PINNED" ]]; then
    echo "Error: pins disagree — $(basename "${FILES[0]}") has $PINNED, $(basename "$f") has $V. Fix with --set." >&2
    exit 1
  fi
  PINNED="$V"
done

# ── Newest npm release and its age (empty if npm can't be reached) ──────────
INFO="$(npm view pagefind dist-tags time --json 2>/dev/null \
  | python3 -I -c '
import json, sys, datetime as dt
d = json.load(sys.stdin)
latest = d["dist-tags"]["latest"]
t = dt.datetime.fromisoformat(d["time"][latest].replace("Z", "+00:00"))
age = (dt.datetime.now(dt.timezone.utc) - t).days
print(latest, t.date().isoformat(), age)' 2>/dev/null || true)"
read -r LATEST PUBLISHED AGE <<< "${INFO:-}" || true

UPDATE=unknown
OLD_ENOUGH=""
if [[ -n "${LATEST:-}" ]]; then
  UPDATE=no
  version_gt "$LATEST" "$PINNED" && UPDATE=yes
  OLD_ENOUGH=no
  (( AGE >= MIN_AGE_DAYS )) && OLD_ENOUGH=yes
fi

echo "pinned=$PINNED"
echo "latest=${LATEST:-}"
echo "latest_published=${PUBLISHED:-}"
echo "latest_age_days=${AGE:-}"
echo "latest_old_enough=$OLD_ENOUGH"
echo "update_available=$UPDATE"
