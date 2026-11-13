# Run from the repo root; the Hugo site lives in fenb-1/.
# Tools can be overridden, e.g. `make serve HUGO=/usr/local/bin/hugo`.
HUGO ?= hugo

# Pagefind (site search) is pinned — see docs/DEVELOPMENT.md. Change it only with
# `scripts/check-pagefind-version.sh --set X.Y.Z`, which also updates both workflows.
# Try a candidate first with `make serve PAGEFIND=pagefind@<new version>` (no real version
# number in this comment — the check script reads every one it finds in this file).
PAGEFIND ?= pagefind@1.6.0

DEV_URL := http://localhost:1313/

# Dev server with live reload and site search. The search index is built once at
# startup; if that fails (offline before Pagefind is cached), the server still starts,
# without search. Both steps need the same --baseURL or search results link to the
# wrong paths, and pages are written to disk so Pagefind's files can be served.
serve:
	cd fenb-1 && $(HUGO) --environment development --baseURL $(DEV_URL) \
	  && { npx --yes $(PAGEFIND) --site public --root-selector "main" \
	       || echo "==> Search index not built (offline?) — serving without search."; } \
	  && $(HUGO) server --renderStaticToDisk --disableFastRender --noHTTPCache --watch --baseURL $(DEV_URL)

# Quick development build to check for errors (no minify, no search index).
build: clean
	cd fenb-1 && $(HUGO) --environment development

# Production build with search index, as deployed. Run by /fenb-git-release.
build-prod: clean
	cd fenb-1 && $(HUGO) --environment production --minify \
	  && npx --yes $(PAGEFIND) --site public --root-selector "main"

# Delete build output and caches.
clean:
	rm -rf fenb-1/public fenb-1/resources/_gen fenb-1/.hugo_build.lock fenb-1/hugo_stats.json

# List content files missing their EN/FR pair. Informational: always exits 0.
check-parity:
	@bash -c 'find fenb-1/content -name "*.en.md" | while read f; do fr="$${f%.en.md}.fr.md"; [ ! -f "$$fr" ] && echo "MISSING FR: $$f"; done; true'
	@bash -c 'find fenb-1/content -name "*.fr.md" | while read f; do base="$${f%.fr.md}"; [ ! -f "$${base}.en.md" ] && [ ! -f "$${base}.md" ] && echo "MISSING EN: $$f"; done; true'

.PHONY: serve build build-prod clean check-parity
