---
description: Prepare and open a release PR from `dev` into `main` for the FencingNB Hugo site. Runs a production build check, bilingual parity check, and opens a PR.
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(make *) Bash(gh *) Bash(script *) Bash(scripts/compute-next-version.sh) Bash(scripts/generate-version-json.sh *) Read AskUserQuestion
---

Run the checks, then ask **once** (Step 7) — that single popup is the release gate. This skill can only be started by the user (`disable-model-invocation`), so don't add an up-front "are you sure?" prompt. Report each step's result briefly as you go.

**Stash rule:** if Step 2 stashes changes, then no matter how or where the skill exits — failure, cancel, or success — run `git stash pop` before stopping and tell the user "Stashed changes have been restored."

---

1. **Tag lookup** — run `scripts/compute-next-version.sh`. It prints `current=` (latest `vX.Y.Z` tag, or `v0.0.0` if none), `tagged=` (`yes`/`no`), and the candidates `patch=`, `minor=`, `major=`. Keep these for Step 7. Report the current tag (e.g. "Current release tag: v1.2.3", or "No release tags exist yet" when `tagged=no`).

2. **Branch and remote state** — run `git fetch origin`, `git branch --show-current`, and `git status`:
   - **Not on `dev`:** stop and tell the user.
   - **`dev` behind `origin/dev`:** run `git pull --ff-only`; if it fails, stop and report.
   - **Uncommitted changes:** list them, then `AskUserQuestion` — the only other prompt this skill may show:
     - **Question:** "The working tree has uncommitted changes. How would you like to proceed?"
     - label `"Stash and release"` — description `"Stash changes, release what's committed, then restore the stash"` → `git stash push -m "fenb-git-release: pre-release stash"` and continue (see stash rule)
     - label `"Cancel release"` — description `"Stop — run /fenb-git-commit first, then re-run /fenb-git-release"` → stop
   - **Sync local `main`:** `git merge-base --is-ancestor main origin/main`; if it succeeds run `git fetch origin main:main` (safe — `main` is never checked out). If it fails (local `main` diverged), stop and alert the user. Needed because `gh pr merge` updates `origin/main` but not local `main`, which would make Step 5's `main..dev` list stale.

3. **Production build** — `make build-prod`. Report errors or warnings; a clean build is required to continue.

4. **Bilingual parity** — `make check-parity`. Report any `MISSING FR:` / `MISSING EN:` lines (no output = all paired).

5. **Commit summary** — `git log main..dev --oneline`. If empty, report "Nothing to release" and stop.

6. **TODO.md review** — read `docs/TODO.md` and flag unchecked items the commits above appear to address.

7. **Release decision (the only gate)** — present the results of Steps 3–6 compactly, then one `AskUserQuestion` call with **two questions**:

   **Question 1** — header `"Version"`, "Which version for this release?"
   - label `"Content update (→ <patch>)"` — description `"Content updates and fixes"`
   - label `"New feature (→ <minor>)"` — description `"New sections or features"`
   - label `"Major redesign (→ <major>)"` — description `"Major redesigns or restructures"`
   - label `"No tag (<current>-dev)"` — description `"Release without a version tag"`

   **Question 2** — header `"Merge"`, "After opening the PR:"
   - label `"Merge now"` — description `"Merge into main immediately — triggers the deploy"`
   - label `"Leave open"` — description `"Open the PR; merge later in GitHub"`
   - label `"Cancel release"` — description `"Stop without opening a PR"`

   Substitute the real version strings from Step 1 into the labels. If the checks in Steps 3–4 failed, don't offer to proceed — report and stop instead. If Question 2 is "Cancel release", stop (stash rule applies). Otherwise answering is the approval — continue without further prompts.

8. **Open PR** — check for an existing one: `script -q -c "gh pr list --base main --head dev --state open --json url,number" /dev/null`. If found, reuse it ("Using existing PR #N"). Otherwise:
   ```bash
   gh pr create --base main --head dev --title "Release: <summary of changes>" --body "<commit summary from Step 5>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)"
   ```
   Capture the PR URL and number. If it fails, report and stop.

9. **Write and commit version.json**:
   ```bash
   scripts/generate-version-json.sh <target-version | --untagged> <PR-URL>
   ```
   Pass the version chosen in Step 7 (e.g. `v0.1.0`), or `--untagged` for "No tag". The script writes `fenb-1/static/version.json` and prints it — keep `commits_since_tag` for the summary. It never touches git; if it exits non-zero, report its error and stop. Then:
   ```bash
   git add fenb-1/static/version.json
   git commit -m "Update version.json for release <version>"
   git push
   ```
   The open PR picks up this commit automatically.

10. **Merge and tag** — only if Step 7 chose "Merge now":
    - `script -q -c "gh pr merge <PR-number> --merge --body ''" /dev/null` — always the explicit PR number; never `--delete-branch` (`dev` is permanent).
    - `git fetch origin`. Don't merge or reset `dev` — GitHub will show `dev` "1 behind main"; the content is identical and it resolves with the next commit on `dev`.
    - If a version was chosen: `git tag -a <version> -m "Release <version>" origin/main && git push origin <version>`.

    If "Leave open" was chosen with a version, remind the user to apply the tag after merging: `git tag -a <version> -m "Release <version>" origin/main && git push origin <version>`.

11. **Summary** — pop the stash if one was taken, then show as plain text (not a code block):

    ┌─ Release Summary ────────────────────────────
    │  PR:      <PR URL>
    │  Commits: <commits_since_tag> since last tag
    │  Target:  dev → main
    │  Tag:     <vX.Y.Z>  — or —  None  (existing: <current-tag>)
    │  Status:  Merged ✓  (or "Open — merge when ready")
    └─────────────────────────────────────────────

    Tag line: the applied tag (e.g. `v1.2.4`); if none, `None  (existing: <current>)`, or `None  (no tags yet)` when `tagged=no`.
