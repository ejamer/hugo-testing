Open a pull request from a feature branch into `dev` for the FencingNB Hugo site.

Walk through each step in order. After each step, report the result clearly before continuing.

---

## Step 1 — Discover feature branches

Run in parallel:
```bash
git fetch origin
git branch --no-merged dev | sed 's/^[* ]*//' | grep -v '^$'
git branch -r --no-merged dev | grep -v "origin/main\|origin/dev\|origin/HEAD" | sed 's|.*origin/||' | sort -u
```

Combine both lists, deduplicate, and exclude `main`, `dev`, and any empty lines. These are the candidate branches for the PR.

**If no branches found:** tell the user "No feature branches found that haven't been merged into dev." and stop.

**If the current branch is already a feature branch** (not `dev` or `main`): note it — it will be the default option in Step 2.

---

## Step 2 — Select branch

Use the `AskUserQuestion` tool to let the user pick the branch. Build the options dynamically from the discovered list, up to 4 options; if there are more the user can type any branch name via the Other input. If the current branch is a feature branch, list it first.

- **Question:** "Which feature branch should be merged into dev?"
- Label each option with the branch name; description: "Merge `<branch>` → dev"
- If only one branch was found, add a second option: label `"Cancel"`, description `"Stop without opening a PR"`

Record the chosen branch name as `$BRANCH`.

---

## Step 3 — Inspect the branch

Run:
```bash
git log dev..$BRANCH --oneline
git log $BRANCH..dev --oneline
git ls-remote --heads origin $BRANCH
```

Report:
- **Commits ahead of dev** (first command) — these will land in the PR. List them.
- **Commits behind dev** (second command) — if any exist, warn the user: "This branch is missing N commit(s) from dev. The PR will still work but you may want to rebase first." Continue regardless.
- **Remote state** — note whether the branch exists on origin.

---

## Step 4 — Ensure branch is pushed

If the branch does **not** exist on origin (Step 3 showed no remote), run:
```bash
git checkout $BRANCH
git push -u origin $BRANCH
```

If the branch **does** exist on origin, ensure local and remote are in sync:
```bash
git log origin/$BRANCH..$BRANCH --oneline
```
If there are unpushed local commits, run `git push`. If the local branch is behind origin, stop and tell the user to pull first.

Report the push result. If push fails, stop and tell the user.

---

## Step 5 — Draft PR title and body

Review the commits (`git log dev..$BRANCH --oneline`) and diff stat (`git diff dev...$BRANCH --stat | tail -5`).

Draft:
- **Title:** concise imperative summary (sentence case, no trailing period) that describes the overall change, e.g. `"Add provincial results news article"` or `"Refactor events calendar layout"`
- **Body:** brief bullet list summarising what the PR contains

Show the draft and proceed directly to Step 6 without asking for confirmation.

---

## Step 6 — Create the PR

Run:
```bash
gh pr create --base dev --head $BRANCH --title "<title from Step 5>" --body "$(cat <<'EOF'
## Summary
<bullet list from Step 5>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Capture the PR URL from the output and extract the PR number (the integer at the end of the URL). Store it as `$PR_NUMBER`.

**If the command fails:** report the error and stop.

On success, report the PR URL.

---

## Step 7 — Merge or leave open

Use the `AskUserQuestion` tool:
- **Question:** "PR created. What next?"
- **Option 1:** label `"Merge now"`, description `"Merge into dev immediately and delete the feature branch"`
- **Option 2:** label `"Leave open"`, description `"Leave the PR open to review or merge later in GitHub"`

**If the user picks "Merge now":**
1. Run `script -q -c "gh pr merge $PR_NUMBER --merge --delete-branch" /dev/null` — always pass the PR number explicitly to avoid operating on the wrong PR.
2. Switch to dev and pull: `git checkout dev && git pull origin dev`
3. Delete the local branch: `git branch -d $BRANCH`
4. Report success.

**If the user picks "Leave open":** note "Merge when ready at the PR URL above."

Show the following as plain text (not a code block):

┌─ PR Summary ──────────────────────────────────
│  PR:      <PR URL>
│  Branch:  <branch> → dev
│  Status:  Merged ✓  (or "Open — merge when ready")
└───────────────────────────────────────────────
