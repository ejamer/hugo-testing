# Security review — open items (2026-11-12)

Seven security findings from the 2026-11-12 code audit, held over to work through later. Code-quality findings from the same audit were all fixed in that session.

For each item: what's wrong, where it is, the proposed fix, and how to test it. **Nothing here has been changed yet.** As with the rest of the audit, plan each fix and get it approved before changing anything. Line numbers were current on 2026-11-12, so re-check them before editing.

Delete an item from this file once it's fixed (or decided against). Delete the file, and its TODO entry, when it's empty.

| # | Severity | Item |
|---|---|---|
| 1 | Medium | Markdown links bypass Hugo's URL safety check |
| 2 | Medium | Calendar view doesn't check link schemes |
| 3 | Medium | Pagefind and a third-party action aren't pinned in CI |
| 4 | Low–Medium | Branch name pasted into a shell command in `delete-branches.yml` |
| 5 | Low | Personal email addresses published on the Canada Games page |
| 6 | Low | `update:` front matter is rendered as raw HTML |
| 7 | Low | Committed Claude settings bypass permission prompts |

Overall: no critical or actively exploitable holes. Items 1, 2 and 6 matter most once people other than the developer edit content (see `plans/non-technical-maintenance.md`, which plans Decap CMS).

---

## 1. Markdown links bypass Hugo's URL safety check — Medium

**Where:** `fenb-1/layouts/_default/_markup/render-link.html` line 2: `href="{{ .Destination | safeURL }}"`.

**Problem:** `safeURL` tells Hugo to trust every link in Markdown content. That turns off the check that normally replaces dangerous URLs, so `[click](javascript:alert(1))` in any page or article becomes a working script link. This undercuts `unsafe = false` in `hugo.toml`, which exists to keep raw HTML and scripts out of content.

**Proposed fix:** only mark the URL safe when it starts with an allowed scheme or is a site path. Otherwise pass it through unmarked so Hugo's own sanitiser handles it (a bad URL becomes `#ZgotmplZ`). Allowed: `http:`, `https:`, `mailto:`, a leading `/`, `#`, or a relative path (no scheme). Content currently uses only `http(s)`, `mailto:` (12 links) and relative paths. Phone (`tel:`) links are deliberately **not** supported, as decided on 2026-11-12.

**Test:** in a scratch copy of the site, add a page with one link of each kind, including `javascript:` and `data:`. Build and check that the allowed ones render unchanged and the others become `#ZgotmplZ`. Then diff the full build against a baseline: real content output should be byte-identical.

## 2. Calendar view doesn't check link schemes — Medium

**Where:** `fenb-1/static/js/events-calendar.js` lines 395, 399, 403 (the Learn More, Register and Results links built with `innerHTML`).

**Problem:** the JS HTML-escapes the URLs (good) but doesn't check their scheme. A `javascript:` URL in `events.yaml` would be neutralised by Hugo on event cards and the schedule, but would run from the JS calendar view. It also still renders `tel:` links, which the Hugo templates refuse.

**Proposed fix:** a small `safeHref(url)` helper beside `targetAttr()` (line 343) that returns the URL only if it starts with `http:`, `https:`, `mailto:` or `/`, and `''` otherwise. Skip the link when it returns `''`. This makes all three views behave the same, with no `tel:`.

**Test:** put test events in a scratch copy's `events.yaml` with an `https:`, a `/` path, a `mailto:`, a `tel:` and a `javascript:` URL. In headless Playwright, check the calendar view (JS) and the card/schedule views (Hugo) render the same set of links. Rerun the existing new-tab test, since `targetAttr()` must still apply.

## 3. Pagefind and a third-party action aren't pinned in CI — Medium

**Where:**
- `npx pagefind …` in `.github/workflows/release-website.yml` line 56, `.github/workflows/pr-check.yml` line 33, and `Makefile` lines 16 and 34.
- `peaceiris/actions-hugo@v3` in `release-website.yml` line 47 and `pr-check.yml` line 24.

**Problem:** `npx pagefind` downloads whatever version npm has as the newest on every run. That includes the deploy job, which has Pages-write permission, and Pagefind's JavaScript is served on every page of the site. A compromised or broken release would go live with no change in this repo. `peaceiris/actions-hugo@v3` is a third-party action pinned only by a tag the owner can move. The `actions/*` actions are GitHub's own, so tag pins are fine there.

**Proposed fix:**
- Pin Pagefind to an exact version everywhere, e.g. `npx -y pagefind@1.x.y …`. Use the version the site currently builds with, and check its output against the current search.
- Pin `peaceiris/actions-hugo` to a full commit SHA, with the tag in a comment (`@<sha> # v3.x.y`).
- Decide how upgrades happen. The suggested route is a Pagefind check next to the existing Hugo-version check in `/fenb-git-release`, or Dependabot for Actions.

**Test:** run `make build-prod` (or `hugo -d <scratch>` plus the pinned `npx` command) and confirm the search index builds and search works in the browser. YAML-check the workflows. The real test is the next PR check and release run.

## 4. Branch name pasted into a shell command in `delete-branches.yml` — Low–Medium

**Where:** `.github/workflows/delete-branches.yml` line 24: `${{ github.event.pull_request.head.ref }}` inside `run:`.

**Problem:** GitHub inserts the branch name into the shell script before it runs. Branch names can contain `$(…)`, so a crafted branch name would run as a command (the classic Actions "script injection" pattern). Separately, a merged pull request from a fork would delete a *same-named* branch in this repo.

**Proposed fix:** pass the name in through `env:` and quote it (`"$HEAD_REF"`). Add a condition so the job only runs when `github.event.pull_request.head.repo.full_name == github.repository`.

**Test:** YAML-check, then merge a throwaway feature branch into `dev` and confirm the branch is deleted and `dev`/`main` are untouched.

## 5. Personal email addresses published on the Canada Games page — Low

**Where:** `fenb-1/layouts/programs/canada-games-2027.html` line 8. The "report a result" `mailto:` sends to two personal Gmail addresses, which appear in the EN and FR pages.

**Problem:** addresses published in page source get harvested by spammers. They're also hard-coded in a template rather than kept in data, so changing them needs a developer.

**Decision needed:** which address should receive results reports? A role address (e.g. FENB's general contact, `fencingnb@gmail.com` in `data/board_members.yaml → contact`, or a Canada Games team address) is the usual choice.

**Proposed fix:** move the recipient(s) into a data file (e.g. a `cwg_report_email` field) and build the `mailto:` from it.

**Test:** build and check that the link opens with the right recipient, subject and body (the body's `%20` encoding must survive). Confirm neither personal address appears anywhere in the built site.

## 6. `update:` front matter is rendered as raw HTML — Low

**Where:** `fenb-1/layouts/news/single.html` line 18: `{{ . | safeHTML }}` for `.Params.update`. It's used by 4 files: `jun-13-damocles-foil-camp-2026.{en,fr}.md` and `jul-16-executive-director-hiring-2026.{en,fr}.md`. It's documented with `<strong>` in `README.md` (lines 67 and 110) and `docs/STYLE_GUIDE.md` (line 180).

**Problem:** front matter skips the `unsafe = false` protection, so any HTML in `update:` (including `<script>`) is output as-is. Of the template's escape hatches, this is the one a non-technical editor is most likely to type into.

**Proposed fix:** render with `markdownify` instead of `safeHTML`. Change the 4 files from `<strong>Update:</strong>` to `**Update:**` and `<strong>Mise à jour :</strong>` to `**Mise à jour :**`, and update the README and STYLE_GUIDE examples.

**Test:** build and diff the 4 article pages against a baseline. The callout HTML should be identical (`markdownify` produces the same `<strong>`). Check that a test `update:` containing `<script>` is escaped.

## 7. Committed Claude settings bypass permission prompts — Low

**Where:** `.claude/settings.json` lines 3–8: `"defaultMode": "bypassPermissions"` plus `Bash(git *)` and `Bash(gh *)` in `allow`.

**Problem:** this file is committed, so anyone who clones the repo and opens Claude Code gets no permission prompts, including for `git push` and `gh pr merge`. That conflicts with the CLAUDE.md rule that git writes happen only inside the `/fenb-git-*` skills behind one confirmation. It isn't a website risk; it's a repo and workflow risk.

**Decision needed:** keep this behaviour for your own machine only, or for everyone who uses the repo?

**Proposed fix (if your machine only):** move `defaultMode` and the broad `git`/`gh` allows into `.claude/settings.local.json`, which is per-user and already gitignored by the `.claude/*` rule. Keep only narrow read-only allows (e.g. `git status`, `git diff`, `git log`, `hugo`, `make build*`) in the committed file. Also drop the allow entry for `scripts/fencingtimelive-results.py`, which is retired (it only exits).

**Test:** in a fresh clone, start Claude Code and confirm that `git push` asks for permission and that the `/fenb-git-commit` flow still works with its one confirmation.
