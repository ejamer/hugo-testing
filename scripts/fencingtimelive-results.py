#!/usr/bin/env python3
"""
Fetch tournament results from fencingtimelive.com.

LOCATION MODES
--------------
  --location away
    NB athletes competed out of province. Scans every event for NB fencer
    participation (matched against fenb-1/data/clubs.yaml) and saves only
    events where NB athletes appear.

    Output: scripts/output/{slug}-{date}.json
    Top-level key: events_with_nb_fencers

  --location hosted
    Tournament was held in New Brunswick. Fetches the full final standings
    for every finished event and extracts the top-4 medalists (gold, silver,
    two tied bronze). NB-club filtering is not applied.

    Output: scripts/output/{slug}-podiums-{date}.json
    Top-level key: events (each with a podium array)

AUTHENTICATION
--------------
fencingtimelive.com uses Google OAuth for login. Google's login flow includes
bot-detection and CAPTCHA, so it cannot be automated programmatically.

  Option A — Browser login (default, recommended for recurring use):
    Run without --cookie. Your system Chrome opens and navigates to
    fencingtimelive.com. Complete the Google login normally. Once the script
    detects an active session, it captures the cookies and closes the browser.

    The login session is saved in scripts/.browser-profile/ so subsequent
    runs reuse it — you only need to sign in again when the session expires.

    Requires: pip install playwright
    (No extra browser install — uses your existing system Chrome.)

  Option B — Manual cookie paste (fallback, no extra dependencies):
    1. Open fencingtimelive.com in Chrome or Firefox and log in via Google.
    2. Open DevTools (F12) → Network tab → refresh the page.
    3. Click any request to www.fencingtimelive.com.
    4. In Headers → Request Headers, copy the entire "Cookie:" value.
    5. Pass it via: --cookie "connect.sid=...;AWSALB=..."

    Cookies expire after a session or period of inactivity. When the script
    returns empty results or an HTTP 401/403 error, re-copy the cookie string.

USAGE
-----
  # Away — search recent CAN tournaments, pick interactively:
  python3 scripts/fencingtimelive-results.py --location away

  # Away — search USA, last 30 days:
  python3 scripts/fencingtimelive-results.py --location away --country USA --days -2

  # Hosted — search recent tournaments and pick:
  python3 scripts/fencingtimelive-results.py --location hosted

  # Hosted — use a direct tournament ID (bypasses --days limit):
  python3 scripts/fencingtimelive-results.py --location hosted --tournament-id 4A78131AF1154821BF95F71B1D4FD913

  # Skip tournament picker (useful for scripting):
  python3 scripts/fencingtimelive-results.py --location away --select 2

  # Manual cookie:
  python3 scripts/fencingtimelive-results.py --location away --cookie "connect.sid=...;AWSALB=..."

WORKFLOW (away)
---------------
  1. Obtain session cookies.
  2. Fetch recent tournaments matching --country and --days.
  3. Select a tournament (interactively or via --select N / --tournament-id).
  4. Fetch the event schedule.
  5. For each event: fetch final results (or competitor list if not finished)
     and check for NB fencers by matching against fenb-1/data/clubs.yaml.
  6. Save JSON to scripts/output/{slug}-{date}.json.

WORKFLOW (hosted)
-----------------
  1. Obtain session cookies.
  2. Select tournament (from list or via --tournament-id).
  3. Fetch the event schedule.
  4. For each finished event: fetch full final standings, extract top-4
     medalists (places 1, 2, 3T, 3T). Unfinished events get an empty podium.
  5. Save JSON to scripts/output/{slug}-podiums-{date}.json.

OUTPUT
------
  away:
    {
      "tournament": { name, location, dates, schedule_url },
      "nb_clubs_checked": [...],
      "events_with_nb_fencers": [
        {
          "event_name": ..., "day": ..., "start_time": ..., "status": ...,
          "source": "results" | "competitors",
          "results_url": "https://www.fencingtimelive.com/events/results/{id}",
          "nb_fencers": [ { "name": ..., "place": ..., "club": ..., "license": ... } ]
        }
      ]
    }

  hosted:
    {
      "tournament": { name, location, dates, schedule_url },
      "events": [
        {
          "event_name": ..., "day": ...,
          "results_url": "https://www.fencingtimelive.com/events/results/{id}",
          "podium": [
            { "place": "1",  "name": ..., "club": ... },
            { "place": "2",  "name": ..., "club": ... },
            { "place": "3T", "name": ..., "club": ... },
            { "place": "3T", "name": ..., "club": ... }
          ]
        }
      ]
    }

Verbose progress is written to stderr; only the JSON goes to stdout:
  python3 scripts/fencingtimelive-results.py --location away > out.json
"""

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
import urllib.parse
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

import yaml

BASE_URL = "https://www.fencingtimelive.com"

# 2 seconds between API calls — stay well within normal interactive usage patterns.
RATE_LIMIT_SECS = 2.0

# Path to fenb-1/data/clubs.yaml, which lists all FencingNB member clubs.
# Club IDs here (e.g. "RST", "DAM") match the 3-letter abbreviation prefix used
# by fencingtimelive.com in its club name strings (e.g. "RST - Escrime La Résistance").
CLUBS_YAML = Path(__file__).parent.parent / "fenb-1" / "data" / "clubs.yaml"

# Output directory for saved JSON files. Gitignored — not committed to the repo.
OUTPUT_DIR = Path(__file__).parent / "output"

# How long (seconds) to wait for the user to complete Google login in the browser.
BROWSER_LOGIN_TIMEOUT_SECS = 3 * 60  # 3 minutes

# Persistent Chrome profile directory. Storing it here means Google login is
# remembered between runs — you only need to sign in once. Gitignored.
BROWSER_PROFILE_DIR = Path(__file__).parent / ".browser-profile"


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def log(msg: str, level: str = "info") -> None:
    """
    Write a progress message to stderr.

    Levels and their prefixes:
      info  →  [info]   general progress
      ok    →  [ ok ]   success / positive result
      warn  →  [warn]   recoverable issue, scraping continues
      error →  [err!]   fatal, script will exit
    """
    prefix = {
        "info":  "[info]",
        "ok":    "[ ok ]",
        "warn":  "[warn]",
        "error": "[err!]",
    }.get(level, "[info]")
    print(f"{prefix} {msg}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class SessionExpiredError(Exception):
    """
    Raised when the FTL server returns HTTP 401 or 403, indicating the session
    cookies are no longer valid. Caught in main() to fail fast with a clear
    message rather than producing many consecutive confusing HTTP errors.
    """


# ---------------------------------------------------------------------------
# Option A: browser login via Playwright
# ---------------------------------------------------------------------------

def get_cookie_via_browser() -> str:
    """
    Open system Chrome, navigate to fencingtimelive.com, wait for Google login,
    verify the session with a live API call, then return the cookies as a
    header string.

    Uses system Chrome (not Playwright's bundled Chromium) because Google blocks
    sign-in from Playwright's browser, identifying it as an insecure automated app.

    Uses a persistent profile directory (BROWSER_PROFILE_DIR) so the session is
    saved between runs. After the first login, subsequent runs may not need any
    user interaction at all.

    Session detection strategy:
      - Polls context.cookies() for the 'connect.sid' session cookie rather than
        watching a DOM element. The cookie is the actual auth artifact and is
        independent of FTL's markup — a nav redesign won't break detection.
      - Waits 1 second after the cookie appears to let any final redirects settle
        before capturing the full cookie set.
      - Makes a live tournament-list API call to confirm the session is accepted
        server-side before closing the browser. If verification fails, exits with
        a clear message rather than proceeding into a broken scrape.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log(
            "Playwright is not installed. Run:\n"
            "       pip install playwright\n"
            "    (No extra browser install — this script uses your system Chrome.)\n"
            "    Or provide your cookie manually with --cookie.",
            "error",
        )
        sys.exit(1)

    BROWSER_PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        # channel="chrome" uses the system Chrome binary — Google trusts its
        # fingerprint and won't show the "browser may not be secure" error.
        # launch_persistent_context saves the session to BROWSER_PROFILE_DIR.
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(BROWSER_PROFILE_DIR),
            headless=False,
            channel="chrome",
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = context.pages[0] if context.pages else context.new_page()
        page.goto(BASE_URL)

        # Check whether we're already logged in before asking the user to do anything.
        already_logged_in = any(
            c["name"] == "connect.sid"
            for c in context.cookies(BASE_URL)
        )

        if already_logged_in:
            log("Existing session found in saved profile. Verifying...", "info")
            # Brief pause to let any redirects settle before capturing cookies.
            time.sleep(1)
            cookies = context.cookies(BASE_URL)
            cookie_str = "; ".join(f"{c['name']}={c['value']}" for c in cookies)
            try:
                fetch_tournaments(cookie_str)
                log("Session verified.", "ok")
                context.close()
                log("Browser closed.", "info")
                return cookie_str
            except SessionExpiredError:
                pass  # fall through to fresh login below
            except Exception:
                pass  # empty response / network blip — treat as expired, fall through

            # Saved session is stale. Clear cookies and wait for fresh login.
            log("Saved session has expired — please log in again.", "warn")
            context.clear_cookies()

        log("Browser open — please complete the Google sign-in.", "info")
        log("The script will continue automatically once you are logged in.", "info")
        log(f"Waiting up to {BROWSER_LOGIN_TIMEOUT_SECS // 60} minutes...", "info")

        # Navigate to the site so the login page is visible.
        page.goto(BASE_URL)

        # Poll until the session cookie is present AND the API call succeeds.
        # connect.sid is set on the very first page load (unauthenticated), so
        # detecting the cookie alone is not enough — we must verify server-side.
        cookie_str = None
        deadline = time.time() + BROWSER_LOGIN_TIMEOUT_SECS
        while time.time() < deadline:
            cookies = context.cookies(BASE_URL)
            if any(c["name"] == "connect.sid" for c in cookies):
                candidate = "; ".join(f"{c['name']}={c['value']}" for c in cookies)
                try:
                    fetch_tournaments(candidate)
                    cookie_str = candidate
                    log("Session verified.", "ok")
                    break
                except Exception:
                    pass  # OAuth not yet complete; keep waiting
            time.sleep(2)
        else:
            context.close()
            log(
                f"Login timed out after {BROWSER_LOGIN_TIMEOUT_SECS // 60} minutes. "
                "Re-run to try again.",
                "error",
            )
            sys.exit(1)

        context.close()

    log("Browser closed.", "info")
    return cookie_str


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def http_get_json(url: str, cookie: str) -> list | dict:
    """
    GET a URL and parse the response as JSON.

    Raises:
      SessionExpiredError  — on HTTP 401 or 403 (bad/expired session)
      RuntimeError         — on other HTTP errors or network failures
    """
    req = urllib.request.Request(url, headers={
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            raise SessionExpiredError(
                f"HTTP {e.code} — session expired. "
                "Re-run without --cookie to log in again."
            ) from e
        raise RuntimeError(f"HTTP {e.code} fetching {url}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error fetching {url}: {e.reason}") from e


def http_get_html(url: str, cookie: str) -> str:
    """
    GET a URL and return the response body as a UTF-8 string.

    Raises:
      SessionExpiredError  — on HTTP 401 or 403 (bad/expired session)
      RuntimeError         — on other HTTP errors or network failures
    """
    req = urllib.request.Request(url, headers={
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            raise SessionExpiredError(
                f"HTTP {e.code} — session expired. "
                "Re-run without --cookie to log in again."
            ) from e
        raise RuntimeError(f"HTTP {e.code} fetching {url}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error fetching {url}: {e.reason}") from e


# ---------------------------------------------------------------------------
# NB club matching (away mode only)
# ---------------------------------------------------------------------------

def load_nb_clubs(yaml_path: Path) -> tuple[set[str], set[str], list[dict]]:
    """
    Read fenb-1/data/clubs.yaml and return (ids, names, clubs):
      ids   — short abbreviations, e.g. {"RST", "DAM"}
      names — full club names, e.g. {"Damocles Fencing Club"}
      clubs — list of {"id": ..., "name": ...} dicts sorted by id, for output
    """
    with open(yaml_path) as f:
        data = yaml.safe_load(f)
    ids = {c["id"] for c in data["clubs"]}
    names = {c["name"] for c in data["clubs"]}
    clubs = sorted([{"id": c["id"], "name": c["name"]} for c in data["clubs"]], key=lambda c: c["id"])
    return ids, names, clubs


def is_nb_entry(entry: dict, nb_ids: set[str], nb_names: set[str]) -> bool:
    """
    Return True if a results or competitors entry belongs to a FencingNB club.

    Three independent checks (any one is sufficient):
      a) Full club name matches a name in clubs.yaml
         (FTL results API returns full names like "Damocles Fencing Club")
      b) Club field prefix before " - " matches a known abbreviation
         (handles a "DAM - Damocles..." format if FTL ever uses it)
      c) Division field equals "NB" or "New Brunswick"

    Both API endpoints include a 'club1' field, so it is checked first.
    The remaining fallbacks cover the endpoint-specific alternatives:
      - results endpoint:     'clubs'
      - competitors endpoint: 'clubNames'
    """
    club_field = (
        entry.get("club1") or entry.get("clubs") or entry.get("clubNames") or ""
    ).strip()

    # (a) full name match
    if club_field in nb_names:
        return True

    # (b) ID prefix match — handles "DAM - Damocles Fencing Club" format
    if " - " in club_field:
        if club_field.split(" - ")[0].strip() in nb_ids:
            return True
    elif club_field in nb_ids:
        return True  # bare abbreviation (unlikely but handled)

    # (c) division field
    div = (entry.get("div") or "").strip()
    if div in {"NB", "New Brunswick"}:
        return True

    return False


# ---------------------------------------------------------------------------
# Tournament list
# ---------------------------------------------------------------------------

def fetch_tournaments(cookie: str, country: str = "CAN", days: int = -1) -> list[dict]:
    """
    Call the FTL tournament search API and return a list of tournament dicts.
    Each dict contains: id, name, location, dates, start.

    The 'today' parameter is required by the API to compute relative date ranges
    (e.g. "last 10 days"). Without it the server returns an empty list.
    """
    today = date.today().strftime("%Y-%m-%d")
    params = urllib.parse.urlencode({
        "filter": "Country",
        "usa": "Loc",       # sub-filter only relevant for USA; harmlessly ignored for others
        "country": country,
        "region": 0,
        "local": "All",
        "state": "",
        "date": days,
        "search": "",
        "today": today,
    })
    return http_get_json(f"{BASE_URL}/tournaments/search/data?{params}", cookie)


# ---------------------------------------------------------------------------
# Event schedule HTML parser
# ---------------------------------------------------------------------------

class ScheduleParser(HTMLParser):
    """
    Parses the server-rendered HTML of /tournaments/eventSchedule/{id}.

    The page groups events under <h5> day headings, then lists them as <tr>
    elements with id="ev_{eventId}". Each row has three <td> columns:
    start time, event name, status.

    Also captures the tournament name from the <title> tag, used when the
    tournament was selected via --tournament-id (no list API call was made).

    Produces:
      self.events         — list of dicts with keys: id, day, start_time, name, status
      self.tournament_name — string extracted from <title>, or None
    """

    def __init__(self):
        super().__init__()
        self.events: list[dict] = []
        self.tournament_name: str | None = None
        self._day: str | None = None
        self._in_h5 = False
        self._in_row = False
        self._in_title = False
        self._row_id: str | None = None
        self._cols: list[str] = []
        self._col_buf: str | None = None
        self._title_buf: str = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "h5":
            self._in_h5 = True
        elif tag == "tr" and attrs.get("id", "").startswith("ev_"):
            self._in_row = True
            self._row_id = attrs["id"][3:]  # strip "ev_" prefix to get the event UUID
            self._cols = []
        elif self._in_row and tag == "td":
            self._col_buf = ""

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
            # FTL page titles look like "Tournament Name | FencingTimeLive"
            raw = self._title_buf.strip()
            self.tournament_name = raw.split("|")[0].strip() if "|" in raw else raw or None
        elif tag == "h5":
            self._in_h5 = False
        elif tag == "td" and self._in_row and self._col_buf is not None:
            self._cols.append(self._col_buf.strip())
            self._col_buf = None
        elif tag == "tr" and self._in_row:
            self.events.append({
                "id": self._row_id,
                "day": self._day,
                "start_time": self._cols[0] if len(self._cols) > 0 else "",
                "name": re.sub(r"\s+", " ", self._cols[1]).strip() if len(self._cols) > 1 else "",
                "status":     self._cols[2] if len(self._cols) > 2 else "",
            })
            self._in_row = False

    def handle_data(self, data):
        if self._in_title:
            self._title_buf += data
        if self._in_h5:
            self._day = data.strip()
        if self._in_row and self._col_buf is not None:
            self._col_buf += data


def fetch_event_schedule(tournament_id: str, cookie: str) -> tuple[list[dict], str | None]:
    """
    Fetch and parse the event schedule page for a tournament.

    Returns (events, tournament_name). tournament_name is extracted from the
    page <title> tag — useful when --tournament-id bypasses the list API.
    """
    html = http_get_html(f"{BASE_URL}/tournaments/eventSchedule/{tournament_id}", cookie)
    parser = ScheduleParser()
    parser.feed(html)
    return parser.events, parser.tournament_name


# ---------------------------------------------------------------------------
# Event results / competitors
# ---------------------------------------------------------------------------

def is_finished(status: str) -> bool:
    """True if the event status string indicates the event has completed."""
    return "finished" in status.lower()


def fetch_event_entries(event: dict, cookie: str) -> tuple[list[dict], str]:
    """
    Fetch fencer entries for an event. Returns (entries, source).

    source is 'results' when final results are available, 'competitors' when
    the event is still in progress or results are not yet posted.

    Strategy:
      - Finished events: try /events/results/data/{id} first (has place/ranking).
        If that fails or returns empty, fall back to /events/competitors/data/{id}.
      - In-progress / not-started events: go straight to competitors.
    """
    if is_finished(event["status"]):
        try:
            entries = http_get_json(
                f"{BASE_URL}/events/results/data/{event['id']}", cookie
            )
            if entries:
                return entries, "results"
            # Empty list means the results endpoint responded but published no data yet.
            # Fall through to competitors so we can still detect NB fencers.
        except SessionExpiredError:
            raise  # propagate immediately — no point trying competitors
        except Exception as exc:
            # Results not yet published despite "finished" status — fall through.
            log(f"Results fetch failed ({exc}), trying competitors", "warn")

    entries = http_get_json(
        f"{BASE_URL}/events/competitors/data/{event['id']}", cookie
    )
    return entries, "competitors"


def numeric_place(place_str) -> int:
    """Strip trailing 'T' and return the integer place, or 9999 if missing/invalid."""
    if not place_str:
        return 9999
    try:
        return int(str(place_str).rstrip("T"))
    except ValueError:
        return 9999


# ---------------------------------------------------------------------------
# Interactive tournament picker
# ---------------------------------------------------------------------------

def pick_tournament(tournaments: list[dict], country: str) -> dict:
    """Print the tournament list and prompt the user to pick one by number."""
    print(f"\nTournaments in {country} (filtered by --days range):\n", file=sys.stderr)
    for i, t in enumerate(tournaments, 1):
        print(f"  {i}. {t['name']}", file=sys.stderr)
        print(f"     {t['location']}  |  {t['dates']}", file=sys.stderr)
    print(file=sys.stderr)
    while True:
        raw = input("Select a tournament (number): ").strip()
        try:
            idx = int(raw) - 1
            if 0 <= idx < len(tournaments):
                return tournaments[idx]
        except ValueError:
            pass
        print(f"  Please enter a number between 1 and {len(tournaments)}.", file=sys.stderr)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Fetch tournament results from fencingtimelive.com."
    )
    parser.add_argument(
        "--location", required=True, choices=["hosted", "away"],
        help=(
            "Tournament type. "
            "'away' — NB athletes competed out of province; reports NB fencer placements. "
            "'hosted' — tournament held in NB; reports full podium for every event."
        ),
    )
    parser.add_argument(
        "--cookie", default=None,
        help=(
            "Cookie header string from browser DevTools (Option B / manual mode). "
            "If omitted, a browser window opens for Google login automatically (Option A)."
        ),
    )
    parser.add_argument(
        "--country", default="CAN",
        help="FIE country code for tournament filter (default: CAN). E.g. USA, FRA.",
    )
    parser.add_argument(
        "--days", type=int, default=-1,
        help=(
            "Date range for tournament search. "
            "-2=last 30 days, -1=last 10 days (default), "
            "0=currently in progress, 1=next 7 days."
        ),
    )
    parser.add_argument(
        "--tournament-id", default=None, metavar="ID",
        help=(
            "Bypass the tournament list and use this tournament ID directly. "
            "Useful for older tournaments outside the --days range or when the "
            "FTL URL is known. Extract the ID from the schedule URL: "
            "fencingtimelive.com/tournaments/eventSchedule/{ID}"
        ),
    )
    parser.add_argument(
        "--list", action="store_true",
        help=(
            "Fetch the tournament list and print it as JSON, then exit. "
            "Used by the fenb-data-get-results skill to present the list before "
            "running the full scrape."
        ),
    )
    parser.add_argument(
        "--select", type=int, default=None, metavar="N",
        help=(
            "Skip the interactive tournament picker and use tournament number N "
            "(1-indexed, matching the order returned by --list). "
            "Used by the fenb-data-get-results skill."
        ),
    )
    args = parser.parse_args()

    # --tournament-id is incompatible with --list and --select (they only make
    # sense when going through the tournament list search).
    if args.tournament_id and (args.list or args.select):
        log("--tournament-id cannot be combined with --list or --select.", "error")
        sys.exit(1)

    # Obtain session cookies — browser login (Option A) or manual paste (Option B).
    if args.cookie:
        cookie = args.cookie
        log("Using provided --cookie value.", "info")
    else:
        cookie = get_cookie_via_browser()

    # -------------------------------------------------------------------------
    # Select tournament — either via direct ID or from the search list
    # -------------------------------------------------------------------------

    if args.tournament_id:
        # Direct tournament ID: skip the list API entirely.
        # Tournament name, location, and dates come from the schedule page HTML
        # (parsed in fetch_event_schedule below). Location and dates are not
        # available from the page — they'll be filled with empty strings and
        # the user can note them from context.
        tourn = {
            "id": args.tournament_id,
            "name": "",        # filled after fetch_event_schedule
            "location": "",
            "dates": "",
        }
        log(f"Using direct tournament ID: {args.tournament_id}", "info")
    else:
        # Standard path: fetch the tournament list and let the user pick.
        log(f"Fetching {args.country} tournaments (days={args.days})...", "info")
        try:
            tournaments = fetch_tournaments(cookie, args.country, args.days)
        except SessionExpiredError as e:
            log(str(e), "error")
            sys.exit(1)
        except Exception as e:
            log(f"Failed to fetch tournament list: {e}", "error")
            sys.exit(1)

        if not tournaments:
            log(
                "No tournaments found. Session may have expired (re-run without --cookie "
                "to log in again), or no tournaments match --country / --days.",
                "warn",
            )
            sys.exit(0)

        log(f"Found {len(tournaments)} tournament(s).", "ok")

        if args.list:
            print(json.dumps(tournaments, indent=2, ensure_ascii=False))
            sys.exit(0)

        if args.select is not None:
            idx = args.select - 1
            if not 0 <= idx < len(tournaments):
                log(f"--select {args.select} is out of range (1–{len(tournaments)}).", "error")
                sys.exit(1)
            tourn = tournaments[idx]
            log(f"Auto-selected tournament {args.select}: {tourn['name']}", "info")
        else:
            tourn = pick_tournament(tournaments, args.country)

        log(f"Selected: {tourn['name']}", "ok")

    # -------------------------------------------------------------------------
    # Fetch event schedule
    # -------------------------------------------------------------------------

    log("Fetching event schedule...", "info")
    try:
        events, page_title = fetch_event_schedule(tourn["id"], cookie)
    except SessionExpiredError as e:
        log(str(e), "error")
        sys.exit(1)
    except Exception as e:
        log(f"Failed to fetch event schedule: {e}", "error")
        sys.exit(1)

    # When --tournament-id was used, fill in the name from the page title.
    if args.tournament_id and page_title:
        tourn["name"] = page_title
        log(f"Tournament name from page: {page_title}", "info")
    elif args.tournament_id and not page_title:
        tourn["name"] = args.tournament_id  # fallback: use the raw ID

    log(f"Found {len(events)} event(s).", "ok")

    # -------------------------------------------------------------------------
    # HOSTED — fetch full podiums for every finished event
    # -------------------------------------------------------------------------

    if args.location == "hosted":
        event_results = []
        errors = 0
        for i, event in enumerate(events, 1):
            status_oneline = event["status"].replace("\n", " ")
            log(f"[{i}/{len(events)}] {event['name']} — {status_oneline[:50]}", "info")

            if not is_finished(event["status"]):
                log("Not finished — skipping (empty podium recorded).", "info")
                event_results.append({
                    "event_name": event["name"],
                    "day": event["day"],
                    "results_url": f"{BASE_URL}/events/results/{event['id']}",
                    "podium": [],
                })
                time.sleep(RATE_LIMIT_SECS)
                continue

            try:
                entries = http_get_json(
                    f"{BASE_URL}/events/results/data/{event['id']}", cookie
                )
            except SessionExpiredError as e:
                log(str(e), "error")
                sys.exit(1)
            except Exception as exc:
                log(f"Failed to fetch results: {exc}", "warn")
                errors += 1
                event_results.append({
                    "event_name": event["name"],
                    "day": event["day"],
                    "results_url": f"{BASE_URL}/events/results/{event['id']}",
                    "podium": [],
                })
                time.sleep(RATE_LIMIT_SECS)
                continue

            # Fencing podium: 1st, 2nd, 3T, 3T = 4 medalists.
            # Filter (not break) so both 3T entries are always captured.
            podium_entries = sorted(
                [e for e in entries if numeric_place(e.get("place", "")) <= 3],
                key=lambda e: numeric_place(e.get("place", "")),
            )
            podium = [
                {
                    "place": str(e.get("place", "")).strip(),
                    "name": e.get("name") or f"{e.get('lastName', '')} {e.get('firstName', '')}".strip(),
                    "club": e.get("club1") or e.get("clubs") or e.get("clubNames") or "",
                }
                for e in podium_entries
            ]

            log(f"  {len(podium)} medalist(s): {[p['name'] for p in podium]}", "ok")
            event_results.append({
                "event_name": event["name"],
                "day": event["day"],
                "results_url": f"{BASE_URL}/events/results/{event['id']}",
                "podium": podium,
            })
            time.sleep(RATE_LIMIT_SECS)

        output = {
            "tournament": {
                "name": tourn["name"],
                "location": tourn["location"],
                "dates": tourn["dates"],
                "schedule_url": f"{BASE_URL}/tournaments/eventSchedule/{tourn['id']}",
            },
            "events": event_results,
        }
        slug = re.sub(r"[^a-z0-9]+", "-", tourn["name"].lower()).strip("-")
        out_path = OUTPUT_DIR / f"{slug}-podiums-{date.today()}.json"

        error_note = f", {errors} error(s)" if errors else ""
        log(
            f"Done. {len(events)} events checked, "
            f"{sum(1 for e in event_results if e['podium'])} had podium results{error_note}.",
            "ok",
        )

    # -------------------------------------------------------------------------
    # AWAY — scan every event for NB fencers
    # -------------------------------------------------------------------------

    else:
        nb_ids, nb_names, nb_clubs = load_nb_clubs(CLUBS_YAML)
        log(f"Loaded {len(nb_ids)} NB clubs: {', '.join(sorted(nb_ids))}", "info")

        nb_events = []
        errors = 0
        for i, event in enumerate(events, 1):
            status_oneline = event["status"].replace("\n", " ")
            log(f"[{i}/{len(events)}] {event['name']} — {status_oneline[:50]}", "info")

            try:
                entries, source = fetch_event_entries(event, cookie)
            except SessionExpiredError as e:
                log(str(e), "error")
                sys.exit(1)
            except Exception as exc:
                log(f"Failed to fetch entries: {exc}", "warn")
                errors += 1
                time.sleep(RATE_LIMIT_SECS)
                continue

            nb_fencers = [e for e in entries if is_nb_entry(e, nb_ids, nb_names)]

            if nb_fencers:
                log(f"{len(nb_fencers)} NB fencer(s) found (source: {source})", "ok")
                nb_events.append({
                    "event_name": event["name"],
                    "day": event["day"],
                    "start_time": event["start_time"],
                    "status": status_oneline,
                    "source": source,
                    "total_fencers": len(entries),
                    "results_url": f"{BASE_URL}/events/results/{event['id']}",
                    "nb_fencers": [
                        {
                            "name": e["name"],
                            # 'place' (string e.g. "3T") is in results data;
                            # 'rank' (integer) is in competitors data.
                            # Use explicit None checks so a value of 0 is not skipped.
                            "place": next(
                                (e[k] for k in ("place", "rank") if e.get(k) is not None), ""
                            ),
                            "club": e.get("club1") or e.get("clubs") or e.get("clubNames") or "",
                            "license": e.get("memberNum") or "",
                        }
                        for e in nb_fencers
                    ],
                })
            else:
                log("No NB fencers.", "info")

            time.sleep(RATE_LIMIT_SECS)

        output = {
            "tournament": {
                "name": tourn["name"],
                "location": tourn["location"],
                "dates": tourn["dates"],
                "schedule_url": f"{BASE_URL}/tournaments/eventSchedule/{tourn['id']}",
            },
            "nb_clubs_checked": nb_clubs,
            "events_with_nb_fencers": nb_events,
        }
        slug = re.sub(r"[^a-z0-9]+", "-", tourn["name"].lower()).strip("-")
        out_path = OUTPUT_DIR / f"{slug}-{date.today()}.json"

        error_note = f", {errors} error(s)" if errors else ""
        log(
            f"Done. {len(events)} events checked, {len(nb_events)} had NB fencers{error_note}.",
            "ok",
        )

    # -------------------------------------------------------------------------
    # Save output
    # -------------------------------------------------------------------------

    json_str = json.dumps(output, indent=2, ensure_ascii=False)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json_str, encoding="utf-8")
    log(f"Output saved to {out_path}", "ok")
    print(json_str)


if __name__ == "__main__":
    main()
