Prepare and open a release PR from `dev` into `main` for the FencingNB Hugo site.

Run through this checklist in order, pausing to report the result of each step before continuing:

1. **Branch check** — confirm the current branch is `dev`. If not, stop and tell the user.

2. **Remote sync** — run `git fetch origin` then `git status` to confirm:
   - `dev` is not behind `origin/dev` — if it is, stop and ask the user to pull first.
   - The working tree is clean (no uncommitted changes) — if it isn't, describe the changes found (list the modified/untracked files), then use the `AskUserQuestion` tool with:
     - **Question:** "The working tree has uncommitted changes. How would you like to proceed?"
     - **Option 1:** label `"Commit first"`, description `"Run the fenb-commit skill to commit the changes, then continue the release"`
     - **Option 2:** label `"Cancel release"`, description `"Stop here without opening a PR"`

     If the user picks **"Commit first"**: invoke the `fenb-commit` skill. After it completes, run `git status` again. If the working tree is still not clean (commit failed or was cancelled), stop and tell the user: "The working tree still has uncommitted changes — release cancelled. You can run `/fenb-commit` to commit them, or `git stash` to set them aside, then re-run `/fenb-release`."

     If the user picks **"Cancel release"**: stop and tell the user: "Release cancelled. You can run `/fenb-commit` to commit your changes, or `git stash` to set them aside, then re-run `/fenb-release`."

3. **Production build** — run `make build-prod` from the repo root. Report any errors or warnings. A clean build is required to proceed.

4. **Bilingual parity check** — run from the repo root (no `cd`):
   ```
   find fenb-1/content -name "*.en.md" | while read f; do fr="${f%.en.md}.fr.md"; [ ! -f "$fr" ] && echo "MISSING FR: $f"; done
   find fenb-1/content -name "*.fr.md" | while read f; do base="${f%.fr.md}"; [ ! -f "${base}.en.md" ] && [ ! -f "${base}.md" ] && echo "MISSING EN: $f"; done
   ```
   When checking `.fr.md` files, accept either `{base}.en.md` **or** `{base}.md` (no language suffix) as a valid English counterpart — section index files use `_index.md` rather than `_index.en.md`. Report any truly unpaired files.

5. **Commit summary** — run `git log main..dev --oneline` to list what will land in this release. Show it to the user.

6. **TODO.md review** — read `TODO.md`. Flag any unchecked items that appear to be addressed or affected by the commits above.

7. **User approval** — present the full checklist results, then use the `AskUserQuestion` tool with:
   - **Question:** "Ready to open the PR?"
   - **Option 1 (default):** label `"Open PR"`, description `"Create the pull request from dev into main"`
   - **Option 2:** label `"Cancel"`, description `"Stop here without opening a PR"`

   If the user picks "Cancel", stop. Do not open the PR without explicit user approval.

8. **Open PR** — run:
   ```
   gh pr create --base main --head dev --title "Release: {summary of changes}" --body "..."
   ```
   Include the commit summary in the PR body. Use the `gh` CLI.

   On success, show the following as plain text (not a code block):

   ┌─ Release Summary ────────────────────────────
   │  PR:      <PR URL>
   │  Commits: <N commits from git log main..dev --oneline | wc -l>
   │  Target:  dev → main
   └─────────────────────────────────────────────
