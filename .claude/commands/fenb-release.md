Prepare and open a release PR from `dev` into `main` for the FencingNB Hugo site.

Run through this checklist in order, pausing to report the result of each step before continuing:

1. **Branch check** — confirm the current branch is `dev`. If not, stop and tell the user.

2. **Remote sync** — run `git fetch origin` then `git status` to confirm:
   - `dev` is not behind `origin/dev` — if it is, stop and ask the user to pull first.
   - The working tree is clean (no uncommitted changes) — if it isn't, stop and warn the user to commit or stash before releasing.

3. **Production build** — run `make build-prod` from the repo root. Report any errors or warnings. A clean build is required to proceed.

4. **Bilingual parity check** — find all `.en.md` files under `fenb-1/content/` and check that each has a matching `.fr.md`, and vice versa. When checking `.fr.md` files, accept either `{base}.en.md` **or** `{base}.md` (no language suffix) as a valid English counterpart — section index files use `_index.md` rather than `_index.en.md`. Report any truly unpaired files.

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
