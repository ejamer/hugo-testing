#!/usr/bin/env bash
#
# Write fenb-1/static/version.json for a release.
#
# Used by /fenb-git-release (Step 11). Computes every field and writes the
# file — nothing else. It deliberately does NOT git add/commit/push: commits
# only happen inside the /fenb-git-* skills (see CLAUDE.md), which run the git
# commands themselves after calling this script. Run from the repo root.
#
# Usage:
#   scripts/generate-version-json.sh [--out PATH] <vX.Y.Z | --untagged> <pr-url>
#
#   vX.Y.Z       the new tag selected for this release (must not already exist)
#   --untagged   no tag this release — version becomes "<latest-tag>-dev"
#   <pr-url>     the release PR, e.g. https://github.com/ejamer/hugo-testing/pull/100
#   --out PATH   write somewhere else (for testing); default fenb-1/static/version.json
#
# Fields (schema documented in docs/DEVELOPMENT.md → "version.json fields"):
#   version            vX.Y.Z, or <latest-tag>-dev (v0.0.0-dev if no tags yet)
#   released_at        UTC timestamp, ISO 8601
#   released_by        "Name <anonymized email>" from git config
#   pr                 the PR URL
#   commits_since_tag  commits on HEAD since the latest tag (all commits if none)
#
# Prints the written JSON on success.

set -euo pipefail

usage() {
  echo "Usage: $0 [--out PATH] <vX.Y.Z | --untagged> <pr-url>" >&2
  exit 2
}

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO_ROOT/fenb-1/static/version.json"

if [[ "${1:-}" == "--out" ]]; then
  [[ $# -ge 2 ]] || usage
  OUT="$2"
  shift 2
fi
[[ $# -eq 2 ]] || usage

VERSION_ARG="$1"
PR_URL="$2"

if [[ ! "$PR_URL" =~ ^https://github\.com/[^/]+/[^/]+/pull/[0-9]+$ ]]; then
  echo "ERROR: PR URL should look like https://github.com/<owner>/<repo>/pull/<N>, got: $PR_URL" >&2
  exit 1
fi

# ── Latest tag (shared logic lives in compute-next-version.sh) ──────────────
TAG_INFO="$("$REPO_ROOT/scripts/compute-next-version.sh")"
CURRENT="$(sed -n 's/^current=//p' <<< "$TAG_INFO")"
TAGGED="$(sed -n 's/^tagged=//p' <<< "$TAG_INFO")"

# ── version ─────────────────────────────────────────────────────────────────
if [[ "$VERSION_ARG" == "--untagged" ]]; then
  VERSION="$CURRENT-dev"
elif [[ "$VERSION_ARG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  if git rev-parse -q --verify "refs/tags/$VERSION_ARG" >/dev/null; then
    echo "ERROR: tag $VERSION_ARG already exists — pick the next version (see scripts/compute-next-version.sh)" >&2
    exit 1
  fi
  VERSION="$VERSION_ARG"
else
  echo "ERROR: version must be vX.Y.Z or --untagged, got: $VERSION_ARG" >&2
  exit 1
fi

# ── commits_since_tag ───────────────────────────────────────────────────────
# Cumulative across consecutive untagged releases; resets only when a new tag
# is applied (the tag itself is created after merge, so it isn't counted here).
if [[ "$TAGGED" == "yes" ]]; then
  COMMITS="$(git rev-list --count "$CURRENT..HEAD")"
else
  COMMITS="$(git rev-list --count HEAD)"
fi

# ── released_by ─────────────────────────────────────────────────────────────
NAME="$(git config user.name || true)"
EMAIL="$(git config user.email || true)"
if [[ -z "$NAME" || "$EMAIL" != *@*.* ]]; then
  echo "ERROR: git config user.name / user.email must be set (email as local@domain.tld)" >&2
  exit 1
fi
LOCAL="${EMAIL%%@*}"
DOMAIN="${EMAIL#*@}"
ANON_EMAIL="${LOCAL:0:3}*****@${DOMAIN:0:1}*****.${DOMAIN#*.}"

# JSON-escape backslashes and double quotes in the free-text field
json_str() { local s="${1//\\/\\\\}"; printf '%s' "${s//\"/\\\"}"; }
RELEASED_BY="$(json_str "$NAME <$ANON_EMAIL>")"

# ── released_at ─────────────────────────────────────────────────────────────
RELEASED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cat > "$OUT" <<EOF
{
  "version": "$VERSION",
  "released_at": "$RELEASED_AT",
  "released_by": "$RELEASED_BY",
  "pr": "$PR_URL",
  "commits_since_tag": $COMMITS
}
EOF

cat "$OUT"
