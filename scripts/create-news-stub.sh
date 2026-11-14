#!/usr/bin/env bash
#
# Create the EN/FR file pair for a new FencingNB news article. Run from the repo root.
#
# Usage:
#   scripts/create-news-stub.sh <YYYY-MM-DD> <slug> <category>
#
#   <YYYY-MM-DD>  publication date — also sets the year folder and the {mon}-{dd} prefix
#   <slug>        kebab-case, lowercase (e.g. provincial-results)
#   <category>    news category ID (see docs/STYLE_GUIDE.md "News category colours")
#
# Writes:
#   fenb-1/content/news/{year}/{mon}-{dd}-{slug}.en.md   (front matter with empty title/summary)
#   fenb-1/content/news/{year}/{mon}-{dd}-{slug}.fr.md
#   fenb-1/content/news/{year}/_index.md + _index.fr.md  (only for a new year; copied from
#                                                         the most recent existing year folder)
#
# Fill in title, summary and body afterwards (by hand or with /fenb-content-add-news).
# Refuses to overwrite existing articles. Writes files only — never touches git.

set -euo pipefail

CATEGORIES="competition results national provincial training clinic announcement meeting"
NEWS_DIR="fenb-1/content/news"

die() { echo "Error: $*" >&2; exit 1; }

[ $# -eq 3 ] || die "usage: scripts/create-news-stub.sh <YYYY-MM-DD> <slug> <category>"
date="$1"; slug="$2"; category="$3"

[ -d "$NEWS_DIR" ] || die "$NEWS_DIR not found — run from the repo root."

[[ "$date" =~ ^([0-9]{4})-([0-9]{2})-([0-9]{2})$ ]] || die "date must be YYYY-MM-DD (got '$date')"
year="${BASH_REMATCH[1]}"; month="${BASH_REMATCH[2]}"; dd="${BASH_REMATCH[3]}"
case "$month" in
  01) mon=jan;; 02) mon=feb;; 03) mon=mar;; 04) mon=apr;; 05) mon=may;; 06) mon=jun;;
  07) mon=jul;; 08) mon=aug;; 09) mon=sep;; 10) mon=oct;; 11) mon=nov;; 12) mon=dec;;
  *) die "month must be 01–12 (got '$month')";;
esac
[ "$((10#$dd))" -ge 1 ] && [ "$((10#$dd))" -le 31 ] || die "day must be 01–31 (got '$dd')"

[[ "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || die "slug must be lowercase kebab-case (got '$slug')"

case " $CATEGORIES " in
  *" $category "*) ;;
  *) die "unknown category '$category' — one of: $CATEGORIES";;
esac

year_dir="$NEWS_DIR/$year"
base="$year_dir/$mon-$dd-$slug"
for lang in en fr; do
  [ ! -e "$base.$lang.md" ] || die "$base.$lang.md already exists — not overwriting."
done

# New year: copy the section index files from the most recent existing year folder.
if [ ! -f "$year_dir/_index.md" ] || [ ! -f "$year_dir/_index.fr.md" ]; then
  src=""
  for d in $(ls -d "$NEWS_DIR"/[0-9][0-9][0-9][0-9] 2>/dev/null | sort -r); do
    if [ "$d" != "$year_dir" ] && [ -f "$d/_index.md" ] && [ -f "$d/_index.fr.md" ]; then
      src="$d"; break
    fi
  done
  [ -n "$src" ] || die "no existing year folder with _index.md + _index.fr.md to copy from."
  mkdir -p "$year_dir"
  for f in _index.md _index.fr.md; do
    if [ ! -f "$year_dir/$f" ]; then
      cp "$src/$f" "$year_dir/$f"
      echo "created $year_dir/$f (copied from $src/)"
    fi
  done
fi

for lang in en fr; do
  cat > "$base.$lang.md" <<EOF
---
title: ""
date: $date
category: $category
summary: ""
---

EOF
  echo "created $base.$lang.md"
done
