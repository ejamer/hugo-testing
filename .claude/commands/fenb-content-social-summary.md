---
description: Generate a short bilingual Facebook post summarizing a FencingNB news article.
allowed-tools: Read AskUserQuestion Bash(find *) Bash(ls *)
---

Generate a short, copyable bilingual Facebook post for an existing news article.

---

## Step 1 — Identify the article

If not already given a slug or file path (e.g. invoked right after `/fenb-content-add-news` or `/fenb-content-add-results` for the article just created), ask the user which article to summarize. Accept a slug, a filename, or a partial title, and locate the matching pair under `fenb-1/content/news/{year}/{mon}-{dd}-{slug}.en.md` / `.fr.md` (search with `find`/`ls` if needed).

Read both language files in full — front matter and body.

## Step 2 — Extract the key facts

Pull out, in priority order:
- Title (EN + FR)
- The one-sentence `summary` field
- Any concrete logistics in the body or `cta_*` front matter: date, time, location, fee, and a registration link or contact (`cta_button_url`, or a `mailto:`/`https:` link in the body)

## Step 3 — Determine the article URLs

The filename stem (everything before `.en.md`/`.fr.md`, e.g. `aug-23-damocles-armoury-clinic`) is also the URL slug, and the article's year subfolder **does** appear in the URL (no custom permalinks are configured, so Hugo uses the section's default path — `content/news/{year}/{stem}.md` → `/news/{year}/{stem}/`). Confirm the year against the file's own path — it's the year subfolder the file lives in, not necessarily the publication year in front matter. Build:
- EN: `https://www.fenb.ca/news/{year}/{filename-stem}/`
- FR: `https://www.fenb.ca/fr/news/{year}/{filename-stem}/`

## Step 4 — Compose the post

Keep it short — a couple of sentences per language, not a full re-telling of the article. Format, matching the site's established FB post style:

```
{EN title} / {FR title}

(Version française ci-dessous)

{1–2 short EN sentences: what, when/where, cost if relevant, and the key call to action (register, RSVP, etc.)}
{Label}: {EN URL or CTA link}
~~~~~~~~~~
{1–2 short FR sentences, same content}
{Label} : {FR URL or CTA link}
```

Rules:
- The title line is bilingual, separated by ` / `.
- `(Version française ci-dessous)` always appears on its own line before the English body.
- The two languages are separated by a line of `~~~~~~~~~~` (ten tildes).
- Always link to the article's own EN/FR URL (label it "Details" / "Détails") — never link directly to a `cta_button_url` or other off-site/registration link, even if one exists. The goal is to drive traffic to fenb.ca; readers get the registration link from the article page itself.
- Do not invent details not present in the article — if time/fee/location aren't in the source, omit them rather than guessing.
- French punctuation: use the non-breaking-space convention (`13 h 30`, `10 $`, `Détails :`) matching the article's own French copy.

## Step 5 — Output

Present the finished post inside a single fenced code block (```) so it's directly copyable — do not wrap it in additional prose formatting that would break copy-paste.
