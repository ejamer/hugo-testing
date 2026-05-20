# All commands run from repo root. Hugo site lives in fenb-1/.
# Hugo installed via snap; pagefind via npm. Override HUGO if installed elsewhere:
#   make serve HUGO=/usr/local/bin/hugo
HUGO ?= /snap/bin/hugo

# Dev server: pre-builds pagefind search index, then serves with live reload.
# --renderStaticToDisk + --disableFastRender ensures pagefind files are on disk so the
# search UI works locally. --noHTTPCache prevents stale assets during development.
serve:
	cd fenb-1 && $(HUGO) --environment development && npx pagefind --site public && $(HUGO) server --renderStaticToDisk --disableFastRender --noHTTPCache --watch

# Quick local build (no minification, no pagefind). Useful for checking output.
build: clean
	cd fenb-1 && $(HUGO) --environment development

# Production build: minifies output and generates the pagefind search index.
# Used by /fenb-release before opening a dev→main PR.
build-prod: clean
	cd fenb-1 && $(HUGO) --environment production --minify && npx pagefind --site public

# Remove Hugo's output and cache directories so the next build starts clean.
clean:
	rm -rf fenb-1/public fenb-1/resources/_gen
	rm -f fenb-1/.hugo_build.lock fenb-1/hugo_stats.json

# Bilingual parity check: report any content file that is missing its translation pair.
# Exits 0 even when mismatches are found so CI doesn't hard-fail — output is informational.
check-parity:
	@bash -c 'find fenb-1/content -name "*.en.md" | while read f; do fr="$${f%.en.md}.fr.md"; [ ! -f "$$fr" ] && echo "MISSING FR: $$f"; done; true'
	@bash -c 'find fenb-1/content -name "*.fr.md" | while read f; do base="$${f%.fr.md}"; [ ! -f "$${base}.en.md" ] && [ ! -f "$${base}.md" ] && echo "MISSING EN: $$f"; done; true'

.PHONY: serve build build-prod clean check-parity
