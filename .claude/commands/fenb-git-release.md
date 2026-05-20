---
description: Prepare and open a release PR from `dev` into `main` for the FencingNB Hugo site. Runs a production build check, bilingual parity check, and opens a PR.
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(make *) Bash(gh *) Bash(script *) Read Write AskUserQuestion
---

Run through this checklist in order, pausing to report the result of each step before continuing:

1. **Tag lookup** — run `git tag --sort=-version:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1` to find the current latest semver tag. If none exists, treat the current version as `v0.0.0` (no tags yet). Compute the three candidate versions:
   - **Patch bump:** increment the last component, reset nothing (e.g. `v1.2.3 → v1.2.4`; from `v0.0.0` → `v0.0.1`)
   - **Minor bump:** increment the middle component, reset patch to 0 (e.g. `v1.2.3 → v1.3.0`; from `v0.0.0` → `v0.1.0`)
   - **Major bump:** increment the first component, reset minor and patch to 0 (e.g. `v1.2.3 → v2.0.0`; from `v0.0.0` → `v1.0.0`)

   Store these three candidates and the current tag — they are used in Step 8. Report the current tag to the user (e.g. "Current release tag: v1.2.3" or "No release tags exist yet").

2. **Branch check** — confirm the current branch is `dev`. If not, stop and tell the user.

3. **Remote sync** — run `git fetch origin` then `git status` to confirm:
   - `dev` is not behind `origin/dev` — if it is, stop and ask the user to pull first.
   - The working tree is clean (no uncommitted changes) — if it isn't, describe the changes found (list the modified/untracked files), then use the `AskUserQuestion` tool with:
     - **Question:** "The working tree has uncommitted changes. How would you like to proceed?"
     - **Option 1:** label `"Commit first"`, description `"Run the fenb-git-commit skill to commit the changes, then continue the release"`
     - **Option 2:** label `"Stash and release"`, description `"Stash changes, complete the release, then restore the stash afterward"`
     - **Option 3:** label `"Cancel release"`, description `"Stop here without opening a PR"`

     If the user picks **"Commit first"**: invoke the `fenb-git-commit` skill. After it completes, run `git status` again. If the working tree is still not clean (commit failed or was cancelled), stop and tell the user: "The working tree still has uncommitted changes — release cancelled. You can run `/fenb-git-commit` to commit them, or `git stash` to set them aside, then re-run `/fenb-git-release`."

     If the user picks **"Stash and release"**: run `git stash push -m "fenb-git-release: pre-release stash"`, confirm the stash succeeded, then continue with the checklist. **IMPORTANT: from this point on, no matter how or where the skill exits — build failure, parity issues, user cancellation, PR error, or success — always run `git stash pop` before stopping and tell the user "Stashed changes have been restored."**

     If the user picks **"Cancel release"**: stop and tell the user: "Release cancelled. You can run `/fenb-git-commit` to commit your changes, or `git stash` to set them aside, then re-run `/fenb-git-release`."

4. **Production build** — run `make build-prod` from the repo root. Report any errors or warnings. A clean build is required to proceed. If the build fails, pop the stash (if one was taken) before stopping.

5. **Bilingual parity check** — run from the repo root:
   ```
   make check-parity
   ```
   This checks that every `.en.md` has a `.fr.md` counterpart and vice versa (accepting `_index.md` as a valid English counterpart for section index files). Report any `MISSING FR:` or `MISSING EN:` lines in the output. No output means all files are paired.

6. **Commit summary** — run `git log main..dev --oneline` to list what will land in this release. Show it to the user.

7. **TODO.md review** — read `TODO.md`. Flag any unchecked items that appear to be addressed or affected by the commits above.

8. **Tag selection** — using the current tag and candidate versions computed in Step 1, use the `AskUserQuestion` tool with:
   - **Question:** "Apply a release version tag to this release?"
   - **Option 1 (default):** label `"Yes — Content Update (→ <patch-candidate>)"`, description `"Content updates and fixes"`
   - **Option 2:** label `"Yes — New Feature Added (→ <minor-candidate>)"`, description `"New sections or features"`
   - **Option 3:** label `"Yes — Major Redesign (→ <major-candidate>)"`, description `"Major redesigns or restructures"`
   - **Option 4:** label `"No"`, description `"Skip tagging — no version tag applied to this release"`

   Substitute the actual computed version strings into the option labels (e.g. `"Yes — Content Update (→ v1.2.4)"`). Store the user's choice and the corresponding target version for use in Step 10.

9. **User approval** — present the full checklist results, then use the `AskUserQuestion` tool with:
   - **Question:** "Ready to open the PR?"
   - **Option 1 (default):** label `"Open PR"`, description `"Create the pull request from dev into main"`
   - **Option 2:** label `"Cancel"`, description `"Stop here without opening a PR"`

   If the user picks "Cancel", pop the stash (if one was taken), then stop. Do not open the PR without explicit user approval.

10. **Open PR** — run:
    ```
    gh pr create --base main --head dev --title "Release: {summary of changes}" --body "..."
    ```
    Include the commit summary in the PR body. Use the `gh` CLI. Capture the PR URL from the output.

    If the `gh` command fails, pop the stash (if one was taken) before stopping and report the error.

11. **Write version.json** — compute the following values using bash, then write `fenb-1/static/version.json` using the Write tool:

    - **`version`** — the target version from Step 8 if the user selected "Yes"; otherwise the current tag from Step 1 (or `"untagged"` if no tags exist)
    - **`released_at`** — run `date -u +"%Y-%m-%dT%H:%M:%SZ"`
    - **`released_by`** — run `git config user.name` and `git config user.email`, then anonymize the email:
      ```bash
      email=$(git config user.email)
      local="${email%%@*}"
      domain="${email#*@}"
      anon_email="${local:0:3}*****@${domain:0:1}*****.${domain#*.}"
      ```
      Format as `"Name <anon_email>"` (e.g. `"Ed Jamer <edw*****@g*****.com>"`)
    - **`pr`** — the PR URL captured in Step 10
    - **`commits_in_release`** — run `git log main..dev --oneline | wc -l | tr -d ' '`

    Write the file as valid JSON:
    ```json
    {
      "version": "...",
      "released_at": "...",
      "released_by": "...",
      "pr": "...",
      "commits_in_release": N
    }
    ```

    Then stage, commit, and push:
    ```
    git add fenb-1/static/version.json
    git commit -m "Update version.json for release <version>"
    git push
    ```

    Report that version.json has been committed and the PR has been updated automatically.

12. **Merge** — use the `AskUserQuestion` tool with:
    - **Question:** "PR updated with version.json. Merge it now?"
    - **Option 1:** label `"Merge now"`, description `"Merge the PR into main immediately (regular merge commit, dev branch kept)"`
    - **Option 2:** label `"Leave open"`, description `"Leave the PR open to review or merge later in GitHub"`

    If the user picks **"Merge now"**: extract the PR number from the PR URL captured in Step 10 and run `script -q -c "gh pr merge <PR-number> --merge --body ''" /dev/null`. Never use `--delete-branch` — `dev` is the permanent development branch. Report success or failure.

    After a successful merge, run `git fetch origin` to update remote refs locally. Do not merge or reset `dev` — GitHub's merge commit will leave `dev` showing "1 behind main" in the UI, but the content is identical and collaborators can use normal `git pull`. It resolves naturally when the next commit lands on `dev`.

    **Apply tag** — if the user selected a "Yes" option in Step 8:
    - Create an annotated tag pointing at the merge commit on `main`: `git tag -a <target-version> -m "Release <target-version>" origin/main`
    - Push the tag: `git push origin <target-version>`
    - Record the applied tag name for the summary.

    If the user selected "No" in Step 8: record tag as `None` for the summary.

    Pop the stash (if one was taken), then show the following as plain text (not a code block):

    ┌─ Release Summary ────────────────────────────
    │  PR:      <PR URL>
    │  Commits: <commits_in_release>
    │  Target:  dev → main
    │  Tag:     <vX.Y.Z>  — or —  None  (existing: <current-tag>)
    │  Status:  Merged ✓  (or "Open — merge when ready")
    └─────────────────────────────────────────────

    For the Tag line: if a tag was applied show it (e.g. `v1.2.4`). If no tag was applied, show `None  (existing: <current-tag-from-step-1>)` — if no tags exist at all, show `None  (no tags yet)`.
