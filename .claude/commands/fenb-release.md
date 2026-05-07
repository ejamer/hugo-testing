Prepare and open a release PR from `dev` into `main` for the FencingNB Hugo site.

Run through this checklist in order, pausing to report the result of each step before continuing:

1. **Branch check** — confirm the current branch is `dev`. If not, stop and tell the user.

2. **Remote sync** — run `git fetch origin` then `git status` to confirm `dev` is not behind `origin/dev`. If it is behind, stop and ask the user to pull first.

3. **Production build** — run `cd fenb-1 && /snap/bin/hugo --environment production --minify`. Report any errors or warnings. A clean build is required to proceed.

4. **Bilingual parity check** — find all `.en.md` files under `fenb-1/content/` and check that each has a matching `.fr.md` at the same path (and vice versa). Report any unpaired files.

5. **Commit summary** — run `git log main..dev --oneline` to list what will land in this release. Show it to the user.

6. **TODO.md review** — read `TODO.md`. Flag any unchecked items that appear to be addressed or affected by the commits above.

7. **User approval** — present the full checklist results and ask the user to confirm they want to open the PR.

8. **Open PR** — only after explicit user approval, run:
   ```
   gh pr create --base main --head dev --title "Release: {summary of changes}" --body "..."
   ```
   Include the commit summary in the PR body. Use the `gh` CLI.

Do not open the PR without explicit user confirmation in step 7.
