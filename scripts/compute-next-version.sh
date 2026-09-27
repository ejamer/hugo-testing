#!/usr/bin/env bash
#
# Find the latest release tag and compute the next patch/minor/major versions.
#
# Used by /fenb-git-release (Step 1) and by scripts/generate-version-json.sh.
# Read-only — makes no changes to the repo. Run from anywhere inside the repo.
#
# Usage:
#   scripts/compute-next-version.sh
#
# Output (key=value lines, easy to read or parse with sed):
#   current=v0.5.13     latest vX.Y.Z tag, or v0.0.0 if no tags exist
#   tagged=yes          yes | no — whether any vX.Y.Z tag exists
#   patch=v0.5.14
#   minor=v0.6.0
#   major=v1.0.0
#
# Only plain semver tags (vX.Y.Z) count — anything else (v1.2.3-rc1, etc.) is
# ignored. Tags must be present locally, so run `git fetch origin` first.

set -euo pipefail

if [[ $# -ne 0 ]]; then
  echo "Usage: $0   (takes no arguments)" >&2
  exit 2
fi

LATEST="$(git tag --sort=-version:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)"

if [[ -n "$LATEST" ]]; then
  TAGGED=yes
else
  LATEST=v0.0.0
  TAGGED=no
fi

IFS=. read -r MAJOR MINOR PATCH <<< "${LATEST#v}"

echo "current=$LATEST"
echo "tagged=$TAGGED"
echo "patch=v$MAJOR.$MINOR.$((PATCH + 1))"
echo "minor=v$MAJOR.$((MINOR + 1)).0"
echo "major=v$((MAJOR + 1)).0.0"
