# Gotchas

Past build/template issues with their fixes. These are already resolved in the codebase — read this file before working on the relevant area to avoid re-introducing them.

---

## Hugo XML template — no whitespace before the XML declaration

Hugo can emit a leading newline before `<?xml` even when `{{- ... -}}` whitespace trimming is used. A leading character breaks XML parsers with "Start tag expected, '<' not found".

Fix: emit the declaration via `printf | safeHTML`:

```xml
{{- $var := .Something -}}
{{- printf "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>" | safeHTML }}
<rss ...>
```

See `layouts/news/rss.xml` for the established pattern.

**XML processing instructions also require `printf | safeHTML`.** Hugo's template engine escapes `<` to `&lt;` in XML context, so a bare `<?xml-stylesheet ...?>` line is emitted as `&lt;?xml-stylesheet...` and ignored by parsers. Chain it into the same `printf | safeHTML`:

```xml
{{- printf "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>\n<?xml-stylesheet type=\"text/xsl\" href=\"../sitemap.xsl\"?>" | safeHTML }}
```

**Relative `../sitemap.xsl` path for language sitemaps.** Language sitemaps are at `/en/sitemap.xml` and `/fr/sitemap.xml`. A relative `href="../sitemap.xsl"` resolves to `/sitemap.xsl` from both paths and works across all three environments (localhost, GitHub Pages subpath, production root).

---

## Sitemap exclusion for no-render pages

Any content page with `build: render: never` has no permalink. Hugo still includes it in the sitemap, emitting `<url><loc/></url>` (empty `<loc>`). Always pair `build: render: never` with `sitemap: disable: true`:

```yaml
build:
  render: never
sitemap:
  disable: true
```

The sitemap template also guards defensively: `{{- if not .Permalink }}{{- continue }}{{- end }}` skips any page that slips through.

---

## Restoring a git submodule gitlink

When a submodule's files have been committed as regular tracked files (mode `100644`) instead of a gitlink (mode `160000`), `git rm --cached` + `git add` alone re-tracks the files rather than creates the gitlink. Use `git update-index` to force the gitlink:

```bash
# 1. Remove regular-file tracking
git rm -r --cached path/to/submodule/

# 2. Create .gitmodules at repo root (not inside a subdirectory)

# 3. Force-register the gitlink at the pinned commit hash
git update-index --add --cacheinfo 160000,<sha1>,path/to/submodule

# 4. Verify
git ls-files --stage path/to/submodule   # should show mode 160000
git submodule status                      # should show the hash
```

Also verify the `.git` file inside the submodule has the correct relative `gitdir:` depth, and that `worktree` in `.git/modules/<name>/config` includes any intermediate path components.

---

## Hugo template functions with 3+ args: pipe puts the value last, not first

Pipe passes the value as the **last** argument, so any multi-arg function whose first parameter is the "subject" breaks when you pipe into it — `collection | sort "Key" "dir"` silently sorts the string `"Key"` instead of the collection, and `str | replace "old" "new"` silently calls `replace("old", "new", str)` (replacing `"new"` inside the string `"old"`, i.e. doing nothing useful) instead of `replace(str, "old", "new")`. No build error either way — it just produces the wrong string/order. Always write these positionally, or wrap the piped part in parens as the first arg:

```go
sort .MyCollection "FieldName" "desc"
replace ($myString | urlquery) "+" "%20"
```

**Related trap — inconsistent argument order in `strings.Trim*`:** `strings.Trim` is `(INPUT, CUTSET)`, but `strings.TrimLeft` / `strings.TrimRight` are `(CUTSET, INPUT)`. Swapping them treats your string as the cutset and returns `""` or a stray `-` with no error — this silently blanked every `.ics` download filename (2026-10-15, `partials/ics/event-filename.html`). Write them positionally and check the order in the docs each time:

```go
strings.Trim $s "-"        {{/* input, cutset */}}
strings.TrimRight "-" $s   {{/* cutset, input */}}
```

---

## Embedding Hugo data in `<script>` tags

Go's `html/template` applies JS-context escaping inside `<script>` blocks. A slice passed through `| jsonify` is output as a **quoted JSON string** rather than a raw array. Fix: embed normally and parse in JS:

```html
<script>
window.MY_DATA = { events: {{ .events | jsonify }} };
</script>
```

```js
var events = typeof cal.events === 'string' ? JSON.parse(cal.events) : cal.events;
```

`safeJS` does **not** bypass this — it only prevents double-escaping; it does not remove the context-aware string-wrapping.

---

## TOML subtable ordering in hugo.toml

`[params.subtable]` changes the active TOML context — every key that follows it belongs to the subtable, not the parent. Place all flat `[params]` keys **before** any `[params.child]` subtable headers. Placing a subtable header first silently swallows subsequent flat keys with no build error.

Note: `custom_css` belongs under `[params.ananke]` (not `[params]`) — this is Ananke's namespace for CSS pipeline files.

---

## CSS `display` property overrides the `hidden` attribute

Any element with an explicit `display` property set via a class selector will remain visible even when the HTML `hidden` attribute is present, because the class selector has higher specificity than the browser's `[hidden] { display: none }` rule.

Fix: add a `[hidden]` companion rule:

```css
.your-element {
  display: inline-flex;
}

.your-element[hidden] {
  display: none;
}
```

Caught on `.fenb-hof-filter-badge` (used `display: inline-flex`, stayed visible despite JS setting `hidden`). **Recurred** on `.fenb-news-card` (2026-08-17, `display: flex`) when the news filter bar was built — this doc wasn't consulted first because CLAUDE.md's "read GOTCHAS.md before working on X" list didn't name "JS-driven show/hide filters" as a trigger. Any new element that gets shown/hidden via JS toggling `.hidden` needs this checked, not just XML/sitemap/data-file work.

---

## Hugo deprecated front matter and template APIs

- **`_build:`** front matter key was removed in Hugo 0.145.0 — use **`build:`** instead.
- **`.Language.LanguageName`** was deprecated in Hugo 0.158.0 — use **`.Language.Label`** instead.

---

## FTL browser login — `connect.sid` appears before authentication

`fencingtimelive.com` sets a `connect.sid` session cookie on the very first unauthenticated page load. Detecting the cookie alone is therefore not a reliable signal that the user has logged in — the check fires immediately and closes Chrome before the Google OAuth flow can complete.

`get_cookie_via_browser()` in `scripts/fencingtimelive-results.py` handles this correctly: it polls `context.cookies()` until `connect.sid` appears **and** a live `fetch_tournaments()` API call succeeds. Do not simplify this to a cookie-presence check — that will close the browser the moment the page loads, before the user can authenticate.

---

## Page header band — content vs. style confusion

When a user says "use the same header as page X", confirm whether they mean the *content* of the band (which title is shown) or just the *style* (height, colours). They look similar in words but require completely different fixes — the former is a front matter/cascade change, the latter is a CSS change.

---

## `hugo server` keeps serving deleted partials

After deleting or renaming a partial, a long-running `hugo server` can keep a stale template state and serve pages with whole sections silently missing — no error in the server log, the page just ends early or renders without its main content (2026-10-15: the homepage lost every event card after `partials/ics/add-menu.html` was replaced). Restart the server after removing or renaming partials, and when verifying template output prefer a fresh build into a scratch directory (`hugo --environment development -d <scratch>`) over the running server. Don't use `make build`/`make build-prod` for that while someone's `make serve` is running — both `clean` away `fenb-1/public/`, which `make serve` serves from.

---

## Hugo's built-in `calendar` output format has a `webcal://` Permalink

`(.OutputFormats.Get "calendar").Permalink` returns `webcal://www.fenb.ca/events/index.ics`, not `https://…` — the built-in format sets its protocol to `webcal://`. Two consequences (see `partials/events-viewbar.html`):

- To get the plain URL, swap the scheme for the **site's own** (`(urls.Parse site.BaseURL).Scheme`) — hard-coding `https://` broke the link on the local dev server, which is plain HTTP (`ERR_SSL_PROTOCOL_ERROR`).
- Put the `webcal://` value in an `href` with `| safeURL`, or Go's HTML sanitiser replaces it with `#ZgotmplZ` (it only trusts http/https/mailto).

---

## Headless Chrome screenshots clip the right side below ~500px

When checking a mobile layout with `Google Chrome --headless=new --window-size=390,…`, the page renders wider than the window and the screenshot cuts text off on the right. It looks like horizontal overflow from your change, but every page does it — Chrome won't shrink a headless window that far, so the viewport stays wider than 390px.

Before treating it as a layout bug, screenshot a known-good page (e.g. an older news article) at the same size: if it clips identically, it's the tool. For a true phone-width render, use device emulation (Chrome DevTools Protocol / Puppeteer `setViewport`) rather than `--window-size`.

---

## Editing a third-party PDF in place

Fixing a typo or stripping a footer from a host's flyer: edit the PDF's content stream rather than regenerating it, so fonts, layout and links stay intact (2026-10-28, Tri-Sword flyer). No PDF tools are installed system-wide (`pdftotext`, `qpdf`, `mutool`, `gs` are all missing), so make a scratch venv and install `pikepdf` (plus `pypdf` for text extraction, `pillow` for images). Run with `python -I`.

- **Text is glyph IDs, not characters.** Browser-printed PDFs (Chrome/Skia, e.g. a Gmail "Print") use subset `Type0`/`Identity-H` fonts. Each `Tj` string is 2-byte glyph IDs, and in these subsets glyph ID = character code − 29 (`'0'` = `0x13`, `'5'` = `0x18`, `'6'` = `0x19`). Decode every `Tj` on the page to find the run, and check the replacement glyph already occurs in the **same font** (a subset only has glyphs it uses). Digits in Helvetica/Arial are equal width, so swapping one never shifts the layout; letters are not.
- **Removing a block:** drop its `BT … ET` text ops or its `q … Do /Xn … Q` image ops, delete the unused `/XObject` entry, and remove any `/Link` annotations over the area — the clickable region survives otherwise (Mailchimp footers carry unsubscribe/profile/tracking links).
- **Browser tab title** comes from `docinfo['/Title']` (e.g. "Gmail - FW: …") — set it.
- **Verify both ways:** `pypdf` text extraction for the content, and a render for the visuals — `Read` can't render PDFs without `pdftoppm`, but `qlmanage -t -s 1100 -o <dir> <file>.pdf` (macOS Quick Look) renders page 1; to see another page, save it as a one-page PDF first.
