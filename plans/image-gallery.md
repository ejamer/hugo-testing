# Plan: Photo Gallery

## Problem

The site has no way to browse tournament/event photos in bulk, tag them, or sort by tag/date. News articles can already attach a small hand-picked set of photos via the `photos:` front matter field (renders as a grid with lightbox), but there's no home for the full archive of event photography. Committing dozens of full-resolution photos per event directly into this repo's `static/images/` would grow git history and the GitHub Pages deployment unboundedly across multiple seasons — the repo is currently only 46MB of git history / 30MB of images, but at an estimated <30 photos/event × ~10 events/season, local storage would become a real problem within a few years.

## Decisions locked in (see conversation for full rationale)

- **External storage from day one** — a separate GitHub repo for raw image bytes, not `static/images/`. Retrofitting later (rewriting paths, existing git history bloat) is worse than starting right.
- **Storage mechanism: new GitHub repo, added as a git submodule, served via jsDelivr's GitHub CDN.** No new paid accounts (rules out Cloudinary/R2 for now), fits the existing submodule precedent (`fenb-1/themes/ananke`) and the git-native, skill-driven content workflow already used everywhere else in this project.
- **Metadata lives in this repo**, not the image repo — Hugo data YAML under `fenb-1/data/gallery/`, matching the existing convention that structured content lives in `data/` and layouts read it via `hugo.Data`.
- **Tagging is internal-only for now.** No public submission form/flow — that's a separate crowdsourcing problem (spam moderation, GitHub-account friction, PII in tag suggestions naming minors) bundled with a storage problem. Revisit post-launch if there's real demand.
- **News articles are unchanged in behavior.** Keep the existing hand-picked `photos:` front matter list — just point `src` at CDN URLs instead of local paths. No auto-pull-by-tag into articles; tag-based browsing is a gallery-page-only feature.
- **Gallery page: client-side JS filtering**, not per-tag static pages. At this scale (low hundreds of photos/year) a client-side filter over a build-time JSON blob is trivially fast, supports combining tag + date filters for free, and mirrors an existing pattern in this codebase (the checkbox-dropdown filter in `hof-table.js`) rather than inventing a new one.
- **CDN URLs are branch-pinned (`@main`), not commit-SHA-pinned**, with an automatic jsDelivr purge call as the last step of the upload workflow, to sidestep jsDelivr's up-to-7-day cache lag on branch refs.

## Architecture

### 1. Image repo (new, external)

- New repo (e.g. `ejamer/fenb-gallery`), added as a submodule — same pattern as the `fenb-1/themes/ananke` entry in `.gitmodules`.
- Folder structure by year/event:
  ```
  2026/
    provincial-championships/
      action-01.jpg
      action-02.jpg
      podium-01.jpg
  ```
- Images are resized/compressed **before** committing (target: long edge ~2000px, JPEG quality ~80 — large enough for the lightbox, small enough to keep the image repo's own growth manageable). This happens in the upload skill, not via Hugo.
- The submodule only needs to be checked out locally / in a Claude Code session when *adding* photos. It is **not** required at CI build time — the Hugo build never reads local image bytes for the gallery, since every `src` in the data YAML is already a complete jsDelivr URL. `submodules: true` can stay in `release-website.yml` for the theme's sake, but the gallery feature itself has no CI dependency on it.

### 2. CDN serving

- URL pattern: `https://cdn.jsdelivr.net/gh/ejamer/fenb-gallery@main/{path}`
- Upload workflow's last step calls jsDelivr's purge endpoint per new file: `https://purge.jsdelivr.net/gh/ejamer/fenb-gallery@main/{path}` — keeps new photos visible within seconds instead of waiting out the branch-ref cache window.

### 3. Gallery metadata (this repo)

`fenb-1/data/gallery/{event-slug}.yaml`, one file per event — mirrors the `events_archive` map-of-files pattern in `plans/events-data-archive.md`:

```yaml
event_en: "2026 Provincial Championships"
event_fr: "Championnats provinciaux 2026"
date: 2026-03-15
photos:
  - file: "2026/provincial-championships/action-01.jpg"
    tags: [epee, podium, u17]
    caption_en: "..."
    caption_fr: "..."
```

- `file` is the path relative to the image repo root; the template prepends the jsDelivr base (kept as a single site param, not repeated per entry) so the CDN host/repo name only needs to change in one place if it ever moves.
- `event_en`/`event_fr` and `caption_en`/`caption_fr` follow the `_en`/`_fr` bilingual field convention from `docs/STYLE_GUIDE.md` (`_fr` falls back to `_en` when empty).
- Hugo merges all files in `data/gallery/` into `hugo.Data.gallery`, keyed by filename.

### 4. Gallery page

- New content section: `fenb-1/content/gallery/_index.md` + `_index.fr.md`.
- New layout: `fenb-1/layouts/gallery/list.html`.
- Template flattens all `data/gallery/*.yaml` entries into one array (`{src, tags, date, caption, eventTitle}`) via `jsonify`, embedded for JS to consume.
- New `fenb-1/static/js/gallery-filter.js`: tag-chip multi-select (reusing the checkbox-dropdown interaction pattern from `hof-table.js`) + a date-sort toggle; filters/sorts the in-memory array and re-renders the grid client-side.
- Reuse the `.fenb-article-photo-gallery-grid` CSS pattern (responsive `auto-fill`/`minmax(200px,1fr)`) for visual consistency with the existing per-article galleries. Mark the container `data-lightbox-zone` so the existing `lightbox.js` zoom-in viewer works with no new JS.
- **Nav entry required.** Per CLAUDE.md's nav-chrome rule: confirm placement/behaviour with the user before implementing anything in the nav, and verify the result in-browser afterward.

### 5. Upload skill

New `/fenb-content-add-gallery-photos` (type `content`, per the `fenb-{type}-{name}` naming convention):

1. Take a folder of source photos + event name/date + tags/captions.
2. Resize/compress each photo.
3. Commit + push to the gallery submodule repo.
4. Create/update `fenb-1/data/gallery/{event-slug}.yaml` with the new entries.
5. Purge jsDelivr cache for each new file.
6. Leave the resulting YAML change in this repo staged for review — actually committing/pushing *this* repo's change still goes through `/fenb-git-commit`, per the existing rule.

**Open question to resolve before building this skill:** step 3 requires `git commit`/`git push` against the *separate* gallery repo. CLAUDE.md's "git commit and push — skills only" rule is written with no stated exceptions and doesn't distinguish by repository. Recommend treating the gallery repo's commit/push the same way — an explicit confirmation gate, same spirit as `/fenb-git-commit` — rather than assuming it's exempt just because it's a different repo. Worth confirming explicitly when this skill is built.

### 6. Storage/scale sanity check

~30 photos/event × ~10 events/season × ~400KB post-resize ≈ 120MB/season landing in the *gallery repo's* history — entirely separate from this repo's clone time or GitHub Pages deployment size. At that rate the gallery repo would take years to approach GitHub's repo-size comfort zone, and can be split into per-season repos later without touching this repo.

## Migrating the one existing pending case

`docs/TODO.md` already has an open item for the interscholastic finals article's `photos:` (4 local action shots, not yet added). Once the gallery repo/skill exist, add those 4 files there instead of `static/images/news/2026/`, get their CDN URLs, and use that as the first real test of the new pipeline before backfilling anything else.

## Documentation updates (once built)

- `README.md` — new "Photo gallery" section describing the `data/gallery/` schema, alongside the existing `photos:` front matter docs.
- `docs/STYLE_GUIDE.md` — add the gallery page/tag-filter UI to the shared components section.
- `docs/PROJECT_LAYOUT.md` — add `data/gallery/`, `layouts/gallery/`, and the new submodule.
- `.gitmodules` — new entry for the gallery repo.
- `docs/TODO.md` — mark this item done and record any deferred pieces.

## Explicitly out of scope for this phase

- Public/external tag submissions.
- Auto-pulling gallery photos into news articles by tag (articles keep manual `photos:` curation).
- Hugo-side image processing / responsive `srcset` generation (images are pre-optimized before upload instead).
- Per-tag static URLs or Hugo taxonomy pages for the gallery.
- Cloudinary/R2/other paid storage — revisit only if jsDelivr + submodule proves insufficient.
