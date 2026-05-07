# Plan: Downloadable Policy PDFs via md-to-pdf

## Problem

Individual policy pages are served as Hugo content (markdown rendered in site chrome). Users need a way to download just the policy text as a clean PDF — not the full rendered page with nav and sidebar — from both the individual policy page and the policies-and-reports list.

## Approach

Use the [`md-to-pdf`](https://github.com/simonhaenisch/md-to-pdf) npm package to convert the source markdown files in `fenb-policies/policies/` directly to PDFs. The generated PDFs are stored as static assets and served like the existing AGM minutes and other documents.

## Implementation steps

### 1. Install md-to-pdf

```bash
cd fenb-1
npm install --save-dev md-to-pdf
```

### 2. Create a CSS stylesheet for policy PDFs

Create `fenb-1/policy-pdf.css` — applied by md-to-pdf during conversion. Style to match FENB brand (font, headings, spacing, a header with the FENB name). This file is the single place to tune PDF appearance.

### 3. Create a config file for md-to-pdf

Create `fenb-1/pdf-config.json` (or add to `package.json`):

```json
{
  "stylesheet": "./policy-pdf.css",
  "pdf_options": {
    "format": "Letter",
    "margin": { "top": "2cm", "bottom": "2cm", "left": "2.5cm", "right": "2.5cm" }
  }
}
```

### 4. Write a generation script

Create `scripts/generate-policy-pdfs.sh`:

```bash
#!/bin/bash
SRC="../fenb-policies/policies"
DST="fenb-1/static/docs/policies"
mkdir -p "$DST"

# EN policies
npx md-to-pdf "$SRC/FENB Policy 2.1 - Safe Sport..."  --config-file fenb-1/pdf-config.json --dest "$DST/safe-sport-en.pdf"
# ... one line per policy file, mapping to the slug-based filename

# FR policies
# ...
```

Alternatively, drive this from a mapping array so filenames stay in one place.

### 5. Add to Makefile

Add a `pdfs` target and include it in the full build:

```makefile
pdfs:
	bash scripts/generate-policy-pdfs.sh

build: pdfs
	cd fenb-1 && /snap/bin/hugo --environment production
	cd fenb-1 && npx pagefind --site public
```

PDFs only need to be regenerated when policy source files change, so `make pdfs` can be run independently.

### 6. Update `policies.yaml`

Add `pdf_en` and `pdf_fr` fields to each document entry under `documents`:

```yaml
- name_en: "Safe Sport, Conduct, and Athlete Safety Policy"
  name_fr: "..."
  url_en: "/about/policies/safe-sport/"
  url_fr: "/fr/about/policies/safe-sport/"
  pdf_en: "/docs/policies/safe-sport-en.pdf"
  pdf_fr: "/docs/policies/safe-sport-fr.pdf"
```

### 7. Add download link to individual policy pages

In `fenb-1/layouts/about/policies/single.html`, add a download button in the sidebar (below the language switcher) using the page's `pdf_en`/`pdf_fr` params, or look up the matching entry from `hugo.Data.policies.documents`.

The cleanest lookup: add a `pdf` param to each policy's front matter pointing to its PDF path, set during content file generation.

### 8. Add download link to the policies list

In `fenb-1/layouts/about/single.html`, the documents list currently renders EN/FR page links. Add a download icon link alongside them using the new `pdf_en`/`pdf_fr` fields from the YAML.

## File output

```
fenb-1/static/docs/policies/
  safe-sport-en.pdf
  safe-sport-fr.pdf
  concussion-protocol-en.pdf
  concussion-protocol-fr.pdf
  … (one pair per policy)
```

## Open questions

- Should the PDF carry an FENB logo/header, or plain clean text? (Affects CSS complexity.)
- The concussion protocol FR source file has a slightly different structure than the others — spot-check the FR output looks correct.
- Consider whether the `pdf` front matter param should be added to each `.en.md`/`.fr.md` during this work, or looked up dynamically from the YAML in the layout.
