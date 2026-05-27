# Facebook Newsfeed Widget — Implementation Plan

**Goal:** Surface FENB Facebook posts (`https://www.facebook.com/FencingEscrimeNB`) on the Hugo site as a newsfeed-style widget, without duplicating the full news section — and while respecting the bilingual, static-site constraints.

---

## Background context

Hugo is a *static* site generator: it has no runtime server. Any content must either be:

1. **Embedded at build time** — Hugo reads data files or Markdown during `hugo build`; the HTML is fixed until the next build.
2. **Loaded at runtime by the browser** — a `<script>` block fetches live data after page load (client-side JS).

Facebook posts are also inherently dynamic and single-language. FENB's page posts in a mix of EN and FR and shares content from other clubs. This creates two design tensions:

- *Freshness vs. build pipeline* — build-time approaches need a scheduled rebuild to stay current.
- *Facebook content vs. site news articles* — the user noted these are often similar but not identical; shared posts from other clubs should probably not appear as FENB news.

---

## Option 1 — Facebook Page Plugin (JS embed, zero setup)

Facebook provides a free embeddable Page Plugin that renders an iframe with the page's timeline.

```html
<div id="fb-root"></div>
<script async defer crossorigin="anonymous"
  src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v20.0"></script>
<div class="fb-page"
  data-href="https://www.facebook.com/FencingEscrimeNB"
  data-tabs="timeline"
  data-width="380"
  data-height="500"
  data-small-header="true"
  data-adapt-container-width="true"
  data-hide-cover="false"
  data-show-facepile="true">
</div>
```

**Pros:**
- Zero API approval; works immediately.
- Always live — no rebuild needed.

**Cons:**
- Renders Facebook's UI inside an iframe; can't be styled to match the site.
- Loads ~300 kB of Facebook JS on every page view — significant performance cost.
- Major GDPR/privacy issue: Facebook drops tracking cookies on load, even if the visitor is not logged in. The EU Cookie Directive and Quebec Law 25 would require explicit user consent before loading this.
- The French locale uses a different SDK URL (`fr_FR`) — bilingual handling is non-trivial.
- Meta can deprecate or change the plugin at any time.

**Verdict:** Viable only as a proof-of-concept or very temporary placeholder. Not recommended for a production bilingual site.

---

## Option 2 — Third-party social aggregator (Curator.io, Tagembed, Juicer.io)

Services like Curator.io aggregate social media feeds and provide a JS snippet that renders a customizable widget. They handle the Facebook API interaction on their end.

**How it works:**
1. Create an account on the aggregator service; connect your Facebook page.
2. Embed a `<script>` and a `<div>` placeholder in a Hugo partial.
3. The widget renders live posts styled to your specification.

**Pros:**
- Much more styleable than the native Page Plugin.
- Handles API changes and rate limits for you.
- Can filter by post type, exclude shared posts.

**Cons:**
- **Paid** — Curator.io's free tier allows one feed with branding; useful tiers start around $25–$50/month.
- Still client-side JS: GDPR consent needed.
- External dependency; if the service shuts down or changes pricing, the widget breaks.
- Content is not indexed by search engines (client-rendered).

**Verdict:** Reasonable short-term option if budget allows and GDPR is addressed with a consent banner. Not ideal for a community-run sports federation site.

---

## Option 3 — Facebook Graph API + GitHub Actions (build-time data file)

Hugo's data pipeline approach: a scheduled GitHub Actions workflow fetches posts from the Facebook Graph API and writes them to `fenb-1/data/facebook_posts.yaml`. Hugo reads the file at build time and renders the posts using native templates.

### API setup
1. Create a Meta App at `developers.facebook.com`.
2. Request `pages_read_engagement` permission — **requires App Review**, which Meta restricts and can take weeks.
3. Generate a long-lived Page Access Token.
4. Store as a GitHub Actions secret.

### Workflow sketch
```yaml
# .github/workflows/sync-facebook.yml
name: Sync Facebook posts
on:
  schedule:
    - cron: '0 */6 * * *'  # every 6 hours
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fetch posts
        run: python scripts/fetch_facebook.py
        env:
          FB_PAGE_ID: ${{ secrets.FB_PAGE_ID }}
          FB_ACCESS_TOKEN: ${{ secrets.FB_ACCESS_TOKEN }}
      - name: Commit data file
        run: |
          git config user.name "github-actions[bot]"
          git add fenb-1/data/facebook_posts.yaml
          git diff --staged --quiet || git commit -m "chore: sync Facebook posts"
          git push
```

### Data file schema
```yaml
# fenb-1/data/facebook_posts.yaml
posts:
  - id: "123456789_987654321"
    message: "Post text here..."
    created_time: "2025-05-20T14:30:00Z"
    permalink: "https://www.facebook.com/..."
    full_picture: "https://..."   # optional image URL
    from_page: "FencingEscrimeNB"  # "other" if a shared post
```

### Hugo template (partial)
Hugo renders these as "From Our Facebook" cards on the home page or a sidebar, styled consistently with the site but visually distinct from news articles.

**Pros:**
- Content is fully styled to match the site.
- Search-engine indexable (server-rendered HTML).
- No runtime JS for the feed; no GDPR consent needed for the content itself.
- Shared posts from other clubs can be labelled or excluded via `from_page`.
- Bilingual: can render post dates in EN/FR using existing i18n infrastructure.

**Cons:**
- **Facebook API approval** is the main blocker. Meta's Graph API access for public page posts is restricted and requires business verification plus app review.
- Long-lived tokens expire (60 days) and need rotation — add a refresh step to the workflow or use a system user token.
- Rebuild lag: between syncs (up to 6 hours) the widget shows stale data. A `workflow_dispatch` manual trigger or `push`-triggered workflow on the data file can reduce this.

**Verdict:** Best fit for a Hugo static site once API access is obtained. The implementation effort is moderate; the bottleneck is the Meta App Review process.

---

## Option 4 — RSS scraper service → GitHub Actions (no API approval needed)

An intermediate approach that avoids the Meta App Review requirement.

Services like **RSS.app**, **FetchRSS**, or **Politepol** can convert a public Facebook page into an RSS feed. GitHub Actions then fetches the RSS and writes `facebook_posts.yaml` on a schedule.

```python
# scripts/fetch_facebook_rss.py
import feedparser, yaml, pathlib

FEED_URL = "https://rss.app/feeds/XXXX.xml"  # replace with service-provided URL

feed = feedparser.parse(FEED_URL)
posts = []
for entry in feed.entries[:10]:
    posts.append({
        "id": entry.id,
        "message": entry.summary,
        "created_time": entry.published,
        "permalink": entry.link,
    })

pathlib.Path("fenb-1/data/facebook_posts.yaml").write_text(
    yaml.dump({"posts": posts}, allow_unicode=True)
)
```

**Pros:**
- No Meta App Review.
- No Facebook developer account required.
- Same Hugo data pipeline as Option 3 — easy to swap out the data source later.

**Cons:**
- RSS scraping services are **paid** ($5–$15/month for RSS.app), or free with heavy rate limits.
- Scraping a social media page may technically violate Meta's Terms of Service (personal/non-commercial use clauses vary).
- Post content may be truncated in the RSS excerpt; full post text requires the API.
- Image URLs scraped from RSS are CDN URLs that Meta can rotate without notice.

**Verdict:** Good stepping stone — lets you build and test the Hugo template before waiting for API approval. Revisit ToS risk with FENB leadership before using in production.

---

## Option 5 — Semi-automated dual publishing (recommended pragmatic baseline)

Rather than pulling from Facebook reactively, FENB authors *push* content outward: write once in Hugo, share to Facebook (or vice versa via a lightweight sync script).

### Workflow
1. Significant news posts are created as Hugo articles via `/fenb-content-add-news`.
2. A GitHub Action can optionally auto-post new articles to Facebook via the Graph API (reverse direction — requires the same API approval, but `pages_manage_posts` instead of `pages_read_engagement`).
3. Quick Facebook-only posts (event check-ins, photos, casual updates) *stay on Facebook* and are not mirrored to the Hugo site.
4. A small "Follow us on Facebook" CTA widget on the home page / news page links to the Facebook page — no API, no JS cost, no GDPR issue.

**Pros:**
- Immediate to implement — the "Follow us" CTA requires zero API work.
- Content quality stays high; Hugo articles go through the bilingual review workflow.
- Avoids the Facebook-as-CMS problem: shared posts from other clubs don't leak into the site's news feed.

**Cons:**
- Requires editorial discipline to dual-post when appropriate.
- Doesn't give a live "social wall" effect on the site.

**Verdict:** Lowest risk, lowest maintenance, and most aligned with the site's bilingual quality bar. Pair with a linked Facebook badge/card widget rather than a full feed embed.

---

## Recommended phased approach

| Phase | Action | Effort | Dependency |
|---|---|---|---|
| **0 — Now** | Add a styled "Follow us on Facebook" CTA widget to the news section or home page | 1–2h | None |
| **1 — Short term** | Build the Hugo template + data schema for `facebook_posts.yaml`; populate manually (test with 3–5 example posts) | 2–3h | None |
| **2 — Medium term** | Apply for Facebook Graph API access; build the GitHub Actions sync workflow using Option 3 | 4–8h | Meta App Review (weeks) |
| **2-alt** | While waiting for API approval, wire up a cheap RSS scraper service to feed the data file | 2h | RSS.app account |
| **3 — On approval** | Replace RSS scraper with direct Graph API calls; add token rotation; tune sync frequency | 2h | Approved Meta App |

---

## Getting Facebook Graph API access — what FENB needs to do

This section applies to Options 3 (read posts into site) and the `/fenb-content-fb-post` cross-post skill (write posts from Claude Code). Both require a Meta App with approved permissions. The process is the same; only the permission names differ.

### What permissions are needed

| Feature | Permission required |
|---|---|
| Read FENB page posts into the site widget | `pages_read_engagement` |
| Post to the FENB page from the Claude skill | `pages_manage_posts` |
| Both features | Both permissions (can be submitted together in one App Review) |

### Step 1 — Ensure a Meta Business Account exists (1–5 business days)

Meta requires the app to be linked to a verified Business Account before App Review can be submitted.

1. Go to `business.facebook.com` and sign in with the Facebook account that administers the FENB page.
2. Create a Meta Business Account for FENB if one doesn't exist (name it "Fencing New Brunswick" or similar).
3. Submit for **business verification**: Meta asks for one of:
   - Certificate of incorporation / non-profit registration papers
   - CRA business number documentation
   - Utility bill or bank statement showing the organization name and address
4. Verification typically takes 1–5 business days. You'll get an email notification when approved.

> **Who should do this:** whoever has Admin access to the FENB Facebook page. The Facebook account used here must be a Page admin — not just an editor.

### Step 2 — Create the Meta App (30 minutes)

1. Go to `developers.facebook.com` and log in with the same Facebook account.
2. Click **My Apps → Create App**.
3. App type: choose **Business** (enables the Pages API permissions).
4. App name: `FencingNB Website` (or similar).
5. Link the app to the FENB Meta Business Account created in Step 1.
6. Under **Add Products**, add:
   - **Facebook Login** (required to generate tokens)
   - **Pages API** (provides the `pages_manage_posts` and `pages_read_engagement` permissions)
7. Under App Settings → Basic, fill in:
   - App icon (can be FENB logo)
   - Privacy Policy URL — **required before submitting App Review**. The FENB site must have a publicly accessible `/privacy/` page. If it doesn't exist yet, create a placeholder before submitting.
   - App Domain: `fencingnb.ca`
   - Website URL: `https://fencingnb.ca`

### Step 3 — Test in Development mode (before App Review)

While the app is in Development mode it can only read/write data for Facebook users who are listed as app admins or testers. Use this to:

1. Test the token generation flow (Step 4 below).
2. Build and verify the GitHub Actions workflow or the Claude skill against a test page post.
3. Record a brief screen recording of the feature in use — **this is required for App Review submission**.

Add team members under **Roles → App Roles** if more than one person needs to test.

### Step 4 — Generate a Page Access Token

Do this after the app exists (even in Development mode). The token generated here is what goes into the `.env.local` file and GitHub Secret.

1. Open the **Graph API Explorer** at `developers.facebook.com/tools/explorer`.
2. Select your app from the top-right dropdown.
3. Click **Generate Access Token** and grant these scopes:
   - `pages_manage_posts` and/or `pages_read_engagement` (whichever you need now)
   - `pages_show_list` (needed to list pages you manage)
4. In the Explorer, make the request: `GET /me/accounts`
5. In the JSON response, find the entry for the FENB page. Copy its `access_token` value. This is a short-lived token (~1 hour).
6. **Exchange for a long-lived User Access Token** (60-day expiry) by calling:
   ```
   GET /oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={app-id}
     &client_secret={app-secret}
     &fb_exchange_token={short-lived-token}
   ```
7. Repeat `GET /me/accounts` using the long-lived token to get a new page token. A Page Access Token generated from a long-lived User Access Token **never expires** and does not need rotation.
8. Copy the never-expiring Page Access Token. Also note the Page ID (numeric, shown as `"id"` in the `/me/accounts` response).

Store these values:
- Local: add to `.env.local` (gitignored):
  ```
  FB_PAGE_ACCESS_TOKEN=your_token_here
  FB_PAGE_ID=123456789
  ```
- GitHub Actions: go to the repo → Settings → Secrets and variables → Actions → New repository secret. Add `FB_PAGE_ACCESS_TOKEN` and `FB_PAGE_ID`.

### Step 5 — Submit for App Review (1–4 weeks)

1. In the app dashboard, go to **App Review → Permissions and Features**.
2. Request the permissions you need (`pages_manage_posts`, `pages_read_engagement`).
3. For each permission, Meta asks for:
   - **Use case description** — a written explanation of exactly what FENB will do with the permission (e.g. "Post news articles from our website's content management CLI to the FENB public Facebook page").
   - **Screen recording** — a short video (1–2 minutes) showing the feature in action using a test page in Development mode. Record your screen using QuickTime (Mac) or the Windows Game Bar.
   - Both permissions can be bundled into one submission.
4. Submit the review. Meta typically responds within 1–4 weeks; they may ask clarifying questions by email.
5. Once approved, set the app from **Development → Live** mode. The feature then works for the real FENB page.

### Privacy policy requirement

Meta blocks App Review submission without a public privacy policy. If the FENB site doesn't have one yet, add a stub at `/privacy/` before submitting. It should cover: what data the site collects (if any), how it's used, and a contact email. A brief plain-language page is sufficient — it does not need to be a lawyer-drafted document. Add this to the TODO list if not yet done.

### Summary timeline

| Step | Who | Time required |
|---|---|---|
| Create Meta Business Account | FENB Facebook page admin | 30 min |
| Business verification | FENB admin (submit docs) | 1–5 business days |
| Create Meta App + configure | Developer | 30 min |
| Test in Development mode + screen record | Developer | 1–2 hours |
| Create privacy policy page on site | Developer | 1–2 hours |
| Submit App Review | Developer | 30 min |
| App Review decision | Meta | 1–4 weeks |
| **Total elapsed time** | | **~1–5 weeks** |

---

## Integration with the existing site

### Home page widget placement
Below the Latest News section and above the Programs section. Add a new `fenb-social-section` block in `layouts/index.html` that renders the latest N posts from `facebook_posts.yaml`. It should be visually distinct from news cards (lighter style, no category badge, explicit "From Facebook" label).

### News section sidebar (alternative)
A narrow "From our Facebook" column on the `/news/` list page. Less intrusive than the home page.

### Bilingual notes
- Facebook posts are posted in either EN or FR (or both, in the same post). The data file should store a `lang` field if detectable; the widget filters by `.Site.Language.Lang` and falls back to showing all posts.
- Shared posts from other clubs (`from_page != "FencingEscrimeNB"`) should be labelled "Shared from [Club Name]" rather than presented as FENB content.
- The date formatting in cards must use the existing i18n `cal_month_*` keys — same pattern as `news-card.html`.

### Avoiding duplication with news articles
- The Facebook widget should link *to Facebook* (external link with `target="_blank"`), not to a Hugo page.
- News articles that exist on both the site and Facebook should *not* be duplicated in the Facebook widget — the sync script can check for existing articles by date range and exclude posts that have a matching Hugo article.
- Alternatively, the widget can be hidden on the news section landing page (since it would duplicate content), shown only on the home page.

---

## Open questions for FENB

1. Does FENB already have a Meta Business Account, or does one need to be created?
2. Who is the Facebook page admin and available to do the Meta App steps? (Must be a Page Admin, not just Editor.)
3. Does the site have a privacy policy page? (Required before App Review can be submitted.)
4. Is there a budget for a third-party RSS/social aggregator service (~$10–$15/month) as a bridge while waiting for App Review?
5. Should shared posts from partner clubs appear in the site widget (labelled), or be excluded entirely?
6. What rebuild frequency is acceptable for the read-back widget — 6-hour lag, 1-hour lag, or live?

---

## Cross-posting from news articles

A separate `/fenb-content-fb-post` skill handles all Facebook API interaction. The `/fenb-content-add-news` skill stays unchanged except for a short opt-in prompt at the end:

> "Post this article to Facebook? Run `/fenb-content-fb-post` with the details above, or skip."

Keeping them separate means:
- The news skill stays focused and testable without API credentials.
- The Facebook skill can be invoked independently (e.g. to post a standalone announcement that doesn't have a Hugo article).
- If the Graph API setup isn't done yet, the news skill still works normally.

### `/fenb-content-fb-post` skill responsibilities

1. Accept article details (title, summary, live URL, language) — either passed in from the news skill or entered by the user directly.
2. Construct a draft Facebook post message. Default template:
   ```
   {English title} | {English summary}
   Read more: {live URL}
   ```
3. Show the draft to the user and allow editing before posting.
4. Warn clearly that the URL may not be live for 1–3 minutes after push; ask the user to confirm timing.
5. Call the Graph API `/{page-id}/feed` endpoint via `curl` using `FB_PAGE_ACCESS_TOKEN` from the environment.
6. Report the posted URL on success, or the error on failure.

### Credentials setup
The skill checks for `FB_PAGE_ACCESS_TOKEN` and `FB_PAGE_ID` in the environment before doing anything. If either is missing, it prints setup instructions and exits cleanly. This way the skill is safe to create now; it will do nothing harmful until credentials are configured.

Store tokens in `.env.local` (gitignored) for local use, and as GitHub Secrets for the GHA sync workflow.

---

## Files to create (implementation checklist)

- [ ] `.claude/commands/fenb-content-fb-post.md` — Facebook cross-post skill
- [ ] Update `.claude/commands/fenb-content-add-news.md` — add opt-in cross-post prompt at the end
- [ ] `fenb-1/data/facebook_posts.yaml` — data schema (even if empty initially)
- [ ] `fenb-1/layouts/partials/facebook-card.html` — single post card partial
- [ ] `fenb-1/layouts/partials/facebook-feed.html` — feed wrapper (renders N cards from the data file)
- [ ] `fenb-1/i18n/en.yaml` additions: `section_label_social`, `section_title_social`, `from_facebook`, `shared_from`
- [ ] `fenb-1/i18n/fr.yaml` additions: same keys in French
- [ ] `fenb-1/static/css/facebook-feed.css` (or extend existing) — card styles
- [ ] `.github/workflows/sync-facebook.yml` — scheduled data sync (Option 3/4)
- [ ] `scripts/fetch_facebook.py` (or `fetch_facebook_rss.py`) — fetch + serialize script (Option 3/4)
- [ ] Phase 0 only: `fenb-1/layouts/partials/social-follow-cta.html` — simple CTA banner (no API)

See [`plans/non-technical-maintenance.md`](non-technical-maintenance.md) for editorial tooling context; the Facebook sync is a natural extension of that automation track.
