#!/usr/bin/env bash
#
# Compare the Hugo version pinned in the GitHub Actions workflows against the
# local install and the newest available release, or update the pin.
#
# Used by /fenb-git-release (Step 3). Writes files only with --set — never runs
# git. Run from anywhere inside the repo.
#
# Usage:
#   scripts/check-hugo-version.sh               # report
#   scripts/check-hugo-version.sh --set 0.170.0 # rewrite the pin in both workflows
#
# Report output (key=value lines):
#   pinned=0.166.0          hugo-version in .github/workflows/release-website.yml
#   local=0.166.0           `hugo version` on this machine
#   installable=0.169.0     newest version Homebrew can install (what a local
#                           build can actually test) — empty if brew is unavailable
#   latest_release=0.169.0  newest GitHub release of gohugoio/hugo — empty if offline
#   update_available=yes    yes | no — installable is newer than pinned
#   local_matches_pin=yes   yes | no — the local build tests the pinned version
#
# Exits non-zero if the two workflows pin different versions.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
WORKFLOWS=("$ROOT/.github/workflows/release-website.yml" "$ROOT/.github/workflows/pr-check.yml")

pinned_in() {
  sed -nE "s/^[[:space:]]*hugo-version:[[:space:]]*'([^']+)'.*/\1/p" "$1" | head -1
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
  for f in "${WORKFLOWS[@]}"; do
    sed -i.bak -E "s/^([[:space:]]*hugo-version:[[:space:]]*)'[^']+'/\1'$NEW'/" "$f" && rm -f "$f.bak"
    echo "$(basename "$f"): hugo-version '$(pinned_in "$f")'"
  done
  exit 0
elif [[ $# -ne 0 ]]; then
  echo "Usage: $0 [--set X.Y.Z]" >&2
  exit 2
fi

PINNED="$(pinned_in "${WORKFLOWS[0]}")"
OTHER="$(pinned_in "${WORKFLOWS[1]}")"
if [[ "$PINNED" != "$OTHER" ]]; then
  echo "Error: workflows disagree — release-website.yml pins '$PINNED', pr-check.yml pins '$OTHER'" >&2
  exit 1
fi

LOCAL="$(hugo version 2>/dev/null | sed -nE 's/^hugo v([0-9]+\.[0-9]+\.[0-9]+).*/\1/p')"

INSTALLABLE=""
if command -v brew >/dev/null 2>&1; then
  INSTALLABLE="$(brew info --json=v2 hugo 2>/dev/null \
    | python3 -I -c 'import json,sys; print(json.load(sys.stdin)["formulae"][0]["versions"]["stable"])' 2>/dev/null || true)"
fi

LATEST="$(gh api repos/gohugoio/hugo/releases/latest -q .tag_name 2>/dev/null \
  || curl -fsSL https://api.github.com/repos/gohugoio/hugo/releases/latest 2>/dev/null \
     | sed -nE 's/.*"tag_name":[[:space:]]*"([^"]+)".*/\1/p' \
  || true)"
LATEST="${LATEST#v}"

UPDATE=no
if [[ -n "$INSTALLABLE" ]] && version_gt "$INSTALLABLE" "$PINNED"; then
  UPDATE=yes
fi

echo "pinned=$PINNED"
echo "local=$LOCAL"
echo "installable=$INSTALLABLE"
echo "latest_release=$LATEST"
echo "update_available=$UPDATE"
echo "local_matches_pin=$([[ "$LOCAL" == "$PINNED" ]] && echo yes || echo no)"
