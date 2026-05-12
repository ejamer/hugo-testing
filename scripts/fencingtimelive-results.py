#!/usr/bin/env python3
"""
Find NB fencer results on fencingtimelive.com.

AUTHENTICATION
--------------
fencingtimelive.com uses Google OAuth for login. Google's login flow includes
bot-detection and CAPTCHA, so it cannot be automated programmatically.

Two modes are supported:

  Option A — Browser login (default, recommended for recurring use):
    Run with no --cookie flag. Your system Chrome opens and navigates to
    fencingtimelive.com. Complete the Google login normally. Once the script
    detects an active session, it verifies it with a live API call, captures
    the cookies, and closes the browser.

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
  # Option A (opens browser for login):
  python3 scripts/fencingtimelive-results.py

  # Option B (provide cookie manually):
  python3 scripts/fencingtimelive-results.py --cookie "connect.sid=...;AWSALB=..."

  # Other options:
  python3 scripts/fencingtimelive-results.py --country USA --days -2

WORKFLOW
--------
  1. Obtains session cookies (via browser login or --cookie flag).
  2. Fetches recent tournaments matching --country and --days.
  3. Prompts you to select one tournament interactively.
  4. Fetches the event schedule for that tournament.
  5. For each event: fetches final results (or the competitor list if the event
     is not yet finished) and checks for NB fencers by matching their club
     abbreviation (e.g. "RST", "DAM") against fenb-1/data/clubs.yaml.
  6. Writes a JSON file to scripts/output/ and prints it to stdout.
     (scripts/output/ is gitignored — these files are not committed.)

OUTPUT
------
JSON structure:
  {
    "tournament": { name, location, dates, schedule_url },
    "nb_clubs_checked": [...],
    "events_with_nb_fencers": [
      {
        "event_name": ...,
        "day": ..., "start_time": ..., "status": ...,
        "source": "results" | "competitors",
        "results_url": "https://www.fencingtimelive.com/events/results/{id}",
        "nb_fencers": [
          { "name": ..., "place": ..., "club": ..., "license": ... }
        ]
      }
    ]
  }

Verbose progress is written to stderr; only the JSON goes to stdout:
  python3 fencingtimelive-results.py > out.json
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
    Write a timestamped progress message to stderr.

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
    message rather than producing 35 consecutive confusing HTTP errors.
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

        if not already_logged_in:
            log("Browser open — please complete the Google sign-in.", "info")
            log("The script will continue automatically once you are logged in.", "info")
            log(f"Waiting up to {BROWSER_LOGIN_TIMEOUT_SECS // 60} minutes...", "info")

            # Poll for the connect.sid cookie once per second.
            deadline = time.time() + BROWSER_LOGIN_TIMEOUT_SECS
            while time.time() < deadline:
                if any(c["name"] == "connect.sid" for c in context.cookies(BASE_URL)):
                    break
                time.sleep(1)
            else:
                context.close()
                log(
                    f"Login timed out after {BROWSER_LOGIN_TIMEOUT_SECS // 60} minutes. "
                    "Re-run to try again.",
                    "error",
                )
                sys.exit(1)
        else:
            log("Existing session found in saved profile.", "info")

        # Brief pause to let any post-login redirects finish before capturing cookies.
        time.sleep(1)

        cookies = context.cookies(BASE_URL)
        cookie_str = "; ".join(f"{c['name']}={c['value']}" for c in cookies)
        log(f"Captured {len(cookies)} cookies. Verifying session...", "info")

        # Verify the session works server-side before closing the browser.
        # A cookie present in the browser doesn't guarantee the server accepts it
        # (e.g. if it was captured mid-redirect or has already expired server-side).
        try:
            fetch_tournaments(cookie_str)
            log("Session verified.", "ok")
        except SessionExpiredError:
            context.close()
            log("Session verification failed — the server rejected the cookies.", "error")
            log(
                "This can happen if the session expired between the login and the "
                "verification call. Delete scripts/.browser-profile/ and re-run to "
                "force a fresh login.",
                "error",
            )
            sys.exit(1)
        except Exception as exc:
            # Network error during verification — not necessarily a bad session.
            log(f"Could not verify session ({exc}). Proceeding anyway.", "warn")

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
# NB club matching
# ---------------------------------------------------------------------------

def load_nb_club_ids(yaml_path: Path) -> set[str]:
    """
    Read fenb-1/data/clubs.yaml and return the set of club ID strings.
    These IDs (e.g. "RST", "DAM") are the canonical abbreviations used by both
    FencingNB and fencingtimelive.com.
    """
    with open(yaml_path) as f:
        data = yaml.safe_load(f)
    return {c["id"] for c in data["clubs"]}


def club_prefix(club_str: str) -> str:
    """
    Extract the abbreviation from a FTL club string like 'DAM - Damocles Fencing Club'.
    Returns the part before ' - ', or the full string if no separator is present.
    """
    club_str = club_str.strip()
    if " - " in club_str:
        return club_str.split(" - ")[0]
    return club_str


def is_nb_entry(entry: dict, nb_ids: set[str]) -> bool:
    """
    Return True if a results or competitors entry belongs to a FencingNB club.

    Both API endpoints include a 'club1' field, so it is checked first.
    The remaining fallbacks cover the endpoint-specific alternatives:
      - results endpoint:     'clubs'
      - competitors endpoint: 'clubNames'
    """
    club_field = entry.get("club1") or entry.get("clubs") or entry.get("clubNames") or ""
    return club_prefix(club_field) in nb_ids


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

    Produces self.events: list of dicts with keys:
      id, day, start_time, name, status
    """

    def __init__(self):
        super().__init__()
        self.events: list[dict] = []
        self._day: str | None = None   # current day heading, e.g. "Saturday May 9, 2026"
        self._in_h5 = False
        self._in_row = False
        self._row_id: str | None = None
        self._cols: list[str] = []
        self._col_buf: str | None = None  # accumulates text inside the current <td>

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h5":
            self._in_h5 = True
        elif tag == "tr" and attrs.get("id", "").startswith("ev_"):
            self._in_row = True
            self._row_id = attrs["id"][3:]  # strip "ev_" prefix to get the event UUID
            self._cols = []
        elif self._in_row and tag == "td":
            self._col_buf = ""

    def handle_endtag(self, tag):
        if tag == "h5":
            self._in_h5 = False
        elif tag == "td" and self._in_row and self._col_buf is not None:
            self._cols.append(self._col_buf.strip())
            self._col_buf = None
        elif tag == "tr" and self._in_row:
            self.events.append({
                "id": self._row_id,
                "day": self._day,
                "start_time": self._cols[0] if len(self._cols) > 0 else "",
                "name":       self._cols[1] if len(self._cols) > 1 else "",
                "status":     self._cols[2] if len(self._cols) > 2 else "",
            })
            self._in_row = False

    def handle_data(self, data):
        if self._in_h5:
            self._day = data.strip()
        if self._in_row and self._col_buf is not None:
            self._col_buf += data


def fetch_event_schedule(tournament_id: str, cookie: str) -> list[dict]:
    """Fetch and parse the event schedule page for a tournament."""
    html = http_get_html(f"{BASE_URL}/tournaments/eventSchedule/{tournament_id}", cookie)
    parser = ScheduleParser()
    parser.feed(html)
    return parser.events


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
        description="Find NB fencers in recent tournaments on fencingtimelive.com"
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
        "--list", action="store_true",
        help=(
            "Fetch the tournament list and print it as JSON, then exit. "
            "Used by the fenb-get-results skill to present the list before "
            "running the full scrape."
        ),
    )
    parser.add_argument(
        "--select", type=int, default=None, metavar="N",
        help=(
            "Skip the interactive tournament picker and use tournament number N "
            "(1-indexed, matching the order returned by --list). "
            "Used by the fenb-get-results skill."
        ),
    )
    args = parser.parse_args()

    # Obtain session cookies — browser login (Option A) or manual paste (Option B).
    if args.cookie:
        cookie = args.cookie
        log("Using provided --cookie value.", "info")
    else:
        cookie = get_cookie_via_browser()

    # Load NB club IDs from the site's own clubs.yaml so the list stays in sync
    # when clubs are added or removed from the federation.
    nb_ids = load_nb_club_ids(CLUBS_YAML)
    log(f"Loaded {len(nb_ids)} NB clubs: {', '.join(sorted(nb_ids))}", "info")

    # Step 1 — fetch tournament list
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

    # --list mode: print the tournament list as JSON and exit.
    # Used by the fenb-get-results skill to present choices before the full scrape.
    if args.list:
        print(json.dumps(tournaments, indent=2, ensure_ascii=False))
        sys.exit(0)

    # Step 2 — select tournament interactively or via --select N
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

    # Step 3 — fetch the event schedule (server-rendered HTML, parsed locally)
    log("Fetching event schedule...", "info")
    try:
        events = fetch_event_schedule(tourn["id"], cookie)
    except SessionExpiredError as e:
        log(str(e), "error")
        sys.exit(1)
    except Exception as e:
        log(f"Failed to fetch event schedule: {e}", "error")
        sys.exit(1)

    log(f"Found {len(events)} event(s).", "ok")

    # Step 4 — check each event for NB fencers
    nb_events = []
    errors = 0
    for i, event in enumerate(events, 1):
        # The status string often contains a literal newline between the finish
        # time and competitor count — normalise it for single-line display.
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

        nb_fencers = [e for e in entries if is_nb_entry(e, nb_ids)]

        if nb_fencers:
            log(f"{len(nb_fencers)} NB fencer(s) found (source: {source})", "ok")
            nb_events.append({
                "event_name": event["name"],
                "day": event["day"],
                "start_time": event["start_time"],
                "status": status_oneline,
                "source": source,
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

    # Step 5 — serialise and save output
    output = {
        "tournament": {
            "name": tourn["name"],
            "location": tourn["location"],
            "dates": tourn["dates"],
            "schedule_url": f"{BASE_URL}/tournaments/eventSchedule/{tourn['id']}",
        },
        "nb_clubs_checked": sorted(nb_ids),
        "events_with_nb_fencers": nb_events,
    }
    json_str = json.dumps(output, indent=2, ensure_ascii=False)

    # Save to scripts/output/<slug>-<date>.json (directory is gitignored).
    # Running the script twice on the same day for the same tournament overwrites
    # the earlier file — only the most recent run per day is kept.
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", tourn["name"].lower()).strip("-")
    out_path = OUTPUT_DIR / f"{slug}-{date.today()}.json"
    out_path.write_text(json_str, encoding="utf-8")

    error_note = f", {errors} error(s)" if errors else ""
    log(
        f"Done. {len(events)} events checked, {len(nb_events)} had NB fencers{error_note}.",
        "ok",
    )
    log(f"Output saved to {out_path}", "ok")

    print(json_str)


if __name__ == "__main__":
    main()
