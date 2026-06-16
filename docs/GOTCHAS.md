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

## Hugo template `sort` syntax

Pipe passes the value as the **last** argument, but `sort` expects the collection first — so `collection | sort "Key" "dir"` silently sorts the string `"Key"` instead of the collection. Always write it positionally:

```go
sort .MyCollection "FieldName" "desc"
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

Caught on `.fenb-hof-filter-badge` (used `display: inline-flex`, stayed visible despite JS setting `hidden`).

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
