serve:
	cd fenb-1 && /snap/bin/hugo && npx pagefind --site public && /snap/bin/hugo server --renderStaticToDisk
