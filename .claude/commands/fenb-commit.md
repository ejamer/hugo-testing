---
description: Stage, commit, and push changes for the FencingNB Hugo site, following the project's branch strategy.
disable-model-invocation: true
allowed-tools: Bash(git *) AskUserQuestion
---

Walk through each step below in order. After each step, report the result clearly before continuing. Use bold headers and plain status lines so the output is easy to scan.

---

## Step 1 — Identify current branch

Run `git branch --show-current` and `git status --short`.

Report:
- Current branch name
- Number of modified/untracked files (summarise, don't dump the full list yet)

**Branch rules:**
- If on **`main`**: warn the user that commits never go directly to `main`, then automatically run `git checkout dev` and continue to Step 2.
- If on **`dev`**: continue to Step 2.
- If on any other branch (feature branch): continue to Step 2 (treating the current branch as the default target).

---

## Step 2 — Confirm target branch

Show the user a brief summary of the pending changes (`git diff --stat HEAD`), then use the `AskUserQuestion` tool to present a popup.

**If currently on `dev`:**

- **Question:** "Where should these changes land?"
- **Option 1 (default):** label `"Continue on dev"`, description `"Commit directly to the dev branch"`
- **Option 2:** label `"Create a new branch"`, description `"You will be prompted for the branch name"`

If the user picks **"Continue on dev":** continue to Step 3.

If the user picks **"Create a new branch":** use `AskUserQuestion` again to ask for the branch name:
- **Question:** "Enter a branch name (kebab-case, e.g. feature/events-fix)"
- **Option 1:** `"feature/my-changes"` — they will likely choose Other and type their own name

Take the name they provide (or their Other input), run `git checkout -b <name>`, report the new branch name, and continue to Step 3.

**If currently on a feature branch (not `dev` or `main`):**

- **Question:** "Where should these changes land?"
- **Option 1 (default):** label `"Stay on <branch-name>"`, description `"Commit to the current feature branch"`
- **Option 2:** label `"Move to dev"`, description `"Stash changes, switch to dev, and commit there instead"`

If the user picks **"Stay on <branch-name>":** continue to Step 3.

If the user picks **"Move to dev":**
1. Run `git stash push -m "fenb-commit: moving changes to dev"`
2. Run `git checkout dev`
3. Run `git stash pop`
4. Report that changes have been moved to `dev`, then continue to Step 3 (targeting `dev`).

---

## Step 3 — Inspect remote state

Run the following in parallel:
- `git fetch origin`
- (after fetch) `git status` to check ahead/behind
- `git log origin/<branch>..<branch> --oneline 2>/dev/null` to list any unpushed local commits (if the remote branch exists)

Report one of these situations clearly:

| Situation | What to report |
|---|---|
| Branch doesn't exist on remote yet | "This branch hasn't been pushed to origin yet — will push with `-u` flag." |
| Branch exists, no unpushed commits | "Branch is in sync with origin. New commit will be the first to push." |
| Branch exists, N unpushed commits | "There are N unpushed commits ahead of origin. New commit will be pushed along with them." |
| Branch is behind origin | Stop. Tell the user to pull first (`git pull origin <branch>`) before committing. |

---

## Step 4 — Show pending changes

Run `git diff --stat HEAD` and `git status --short`. Present a clean summary:

```
Modified:
  fenb-1/content/news/2026/may-07-example.en.md
  fenb-1/content/news/2026/may-07-example.fr.md

Untracked:
  fenb-1/static/images/example.jpg
```

Do not ask for confirmation — proceed directly to Step 5.

---

## Step 5 — Draft commit message

Inspect the staged/unstaged diff (`git diff HEAD`) and recent commit log (`git log --oneline -8`) to match this repo's commit message style.

Draft a concise message (imperative mood, sentence case, no trailing period). Show it:

> Proposed commit message:
> **"Add May 2026 provincial results news article"**

Do not ask for confirmation — proceed directly to Step 6.

---

## Step 6 — Stage and commit

Run:
```
git add <files confirmed in Step 4>
git commit -m "$(cat <<'EOF'
<message from Step 5>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Report: commit hash and message on success. If the pre-commit hook fails, show the hook output, fix the underlying issue, and re-run as a new commit (never use `--no-verify`).

---

## Step 7 — Push

- If branch is new (no remote): `git push -u origin <branch>`
- Otherwise: `git push`

Report the push result. On success, show the following as plain text (not a code block):

┌─ Commit Summary ─────────────────────────────
│  <short-hash>  →  origin/<branch-name>
│  <commit message>
│  <N files changed · X insertions(+) · Y deletions(-)>
└─────────────────────────────────────────────

Use the file-change stats from the commit output for the last line.

If this is a feature branch, remind the user: "When ready, open a PR into `dev` (not `main`)."
