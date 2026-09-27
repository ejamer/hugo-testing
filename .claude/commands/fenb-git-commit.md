---
description: Stage, commit, and push changes for the FencingNB Hugo site, following the project's branch strategy.
allowed-tools: Bash(git *) Bash(gh *) Bash(script *) AskUserQuestion
---

Inspect first, then ask **once**, then commit and push. The single popup in Step 3 is the confirmation gate — it shows exactly what will be committed. Don't add other confirmation prompts.

---

## Step 1 — Inspect

Run `git fetch origin`, then in parallel:
- `git branch --show-current`
- `git status --short`
- `git diff --stat HEAD`
- `git log --oneline -8` (commit message style reference)

**Stop conditions:**
- **Nothing to commit:** say so and stop.
- **On `main`:** commits never go to `main`. Run `git checkout dev` (uncommitted changes carry over) and re-run the inspection. If the checkout fails, stop and report.

**Branch vs. origin** — from `git status`:
- **Behind origin:** run `git pull --rebase --autostash`. If it fails or conflicts, stop and report — don't try to resolve conflicts.
- **Branch not on origin yet:** note it — Step 4 pushes with `-u`.
- **Ahead of origin:** note the unpushed commits — they'll be pushed with the new one.

Scan the file list for anything that looks unintended (build output, `.env`, large binaries, scratch files) and flag it — don't stage those files without asking.

---

## Step 2 — Draft the commit message

Read `git diff HEAD` (plus untracked files) and draft a message in this repo's style: imperative mood, sentence case, no trailing period, concise summary line. Add a short body only if the change spans several unrelated areas.

---

## Step 3 — Confirm (the only prompt)

Show the file summary (grouped Modified / Untracked, one list — don't repeat it elsewhere) and any flags from Step 1, then use `AskUserQuestion`:

- **Question:** `Commit "<message>" (<N> files) → <branch>?`
- **Options on `dev`:**
  1. label `"Commit & push"` — description `"Commit to dev and push to origin"`
  2. label `"Commit to new branch…"` — description `"Rarely needed — for multi-session work. You'll be asked for a feat/<name> branch name"`
  3. label `"Cancel"` — description `"Stop without committing"`
- **Options on a feature branch:**
  1. label `"Commit & push"` — description `"Commit and push to <branch>"`
  2. label `"Commit, push & merge into dev"` — description `"Also open a PR into dev, merge it, and delete <branch>"`
  3. label `"Cancel"` — description `"Stop without committing"`

Tell the user in the question text that typing a message in **Other** replaces the proposed commit message (then proceed as "Commit & push").

**"Commit to new branch…":** ask for the name with one more `AskUserQuestion` (option `"feat/my-feature"`; the user types their own via Other). Rule: `feat/` + one or two dash-separated words, no further slashes (`dev/` can't be used — a `dev` branch exists). Run `git checkout -b <name>` and continue.

**"Cancel":** stop. Nothing has been changed.

---

## Step 4 — Commit and push

```bash
git add <the files shown in Step 3, excluding anything flagged and not approved>
git commit -m "$(cat <<'EOF'
<message>

Co-Authored-By: <current model's co-author line from this session's attribution instructions>
EOF
)"
git push            # or: git push -u origin <branch>  if the branch isn't on origin yet
```

If a pre-commit hook fails, show its output, fix the underlying issue, and commit again (never `--no-verify`).

---

## Step 5 — Merge into dev (only if chosen in Step 3)

```bash
gh pr create --base dev --head <branch> --title "<message>" --body "<one-line summary>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

Capture the PR number from the URL it prints, then — always with the explicit number:

```bash
script -q -c "gh pr merge <PR-number> --merge --delete-branch" /dev/null
git checkout dev && git pull origin dev && git branch -d <branch>
```

If any command fails, stop and report — the commit is already safely pushed to the branch.

---

## Step 6 — Summary

Show as plain text (not a code block):

┌─ Commit Summary ─────────────────────────────
│  <short-hash>  →  origin/<branch>
│  <commit message>
│  <N files changed · X insertions(+) · Y deletions(-)>
│  Merged: <PR URL> → dev          (only if Step 5 ran)
└─────────────────────────────────────────────
