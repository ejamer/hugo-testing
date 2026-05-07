serve:
	cd fenb-1 && /snap/bin/hugo && npx pagefind --site public && /snap/bin/hugo server --renderStaticToDisk

build:
	cd fenb-1 && /snap/bin/hugo

build-prod:
	cd fenb-1 && /snap/bin/hugo --environment production --minify && npx pagefind --site public

clean:
	rm -rf fenb-1/public fenb-1/resources/_gen
	rm -f fenb-1/.hugo_build.lock fenb-1/hugo_stats.json

.PHONY: serve build build-prod clean
