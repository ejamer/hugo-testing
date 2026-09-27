#!/usr/bin/env bash
#
# Prerequisite check for scripts/fencingtimelive-results.py.
#
# Verifies everything the fencingtimelive.com scraper needs before a run:
# Python 3.9+, PyYAML, Playwright, system Google Chrome, and clubs.yaml.
# Prints one PASS/FAIL line per check. Run from the repo root.
#
# Usage:
#   scripts/check-ftl-deps.sh [--fix]
#
#   --fix   pip-install missing Python packages (pyyaml, playwright), then
#           re-check them. Tries --break-system-packages first (needed on
#           Debian/Ubuntu and Homebrew Python), then retries without it for
#           older pip versions (e.g. macOS's bundled Python) that reject the
#           flag. Chrome and clubs.yaml are never auto-fixed.
#
# Exit status: 0 if every check passes, 1 otherwise.
#
# Note on Chrome: the scraper launches Playwright with channel="chrome", which
# requires the Google Chrome binary specifically — Chromium does not satisfy it.

set -uo pipefail

FIX=0
case "${1:-}" in
  "")    ;;
  --fix) FIX=1 ;;
  *)     echo "Usage: $0 [--fix]" >&2; exit 2 ;;
esac

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLUBS_YAML="$REPO_ROOT/fenb-1/data/clubs.yaml"
FAILED=0

pass() { echo "PASS: $*"; }
fail() { echo "FAIL: $*"; FAILED=1; }

# pip_fix <pip-package> — install a missing package when --fix was given
pip_fix() {
  [[ $FIX -eq 1 ]] || return 1
  echo "      installing $1 ..."
  python3 -m pip install --quiet "$1" --break-system-packages >/dev/null 2>&1 ||
    python3 -m pip install --quiet "$1" >/dev/null 2>&1
}

# ── Python 3.9+ ─────────────────────────────────────────────────────────────
if ! command -v python3 >/dev/null 2>&1; then
  fail "python3 not found — install Python 3.9+"
  # Every remaining Python check depends on python3; report them as failed too.
  fail "pyyaml (python3 missing)"
  fail "playwright (python3 missing)"
else
  PY_VER="$(python3 -c 'import sys; print("%d.%d.%d" % sys.version_info[:3])' 2>/dev/null)"
  if [[ -z "$PY_VER" ]]; then
    # On macOS without the Command Line Tools, /usr/bin/python3 is a stub that
    # only prompts for their install — it exists on PATH but can't run code.
    fail "python3 found but not working — on macOS, run: xcode-select --install"
  elif python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'; then
    pass "python3 $PY_VER"
  else
    fail "python3 $PY_VER — need 3.9+"
  fi

  # ── PyYAML ────────────────────────────────────────────────────────────────
  yaml_ver() { python3 -c 'import yaml; print(yaml.__version__)' 2>/dev/null; }
  if V="$(yaml_ver)"; then
    pass "pyyaml $V"
  elif pip_fix pyyaml && V="$(yaml_ver)"; then
    pass "pyyaml $V (installed)"
  else
    fail "pyyaml — rerun with --fix, or: pip install pyyaml (add --break-system-packages if pip refuses)"
  fi

  # ── Playwright ────────────────────────────────────────────────────────────
  pw_ok() { python3 -c 'from playwright.sync_api import sync_playwright' 2>/dev/null; }
  if pw_ok; then
    pass "playwright"
  elif pip_fix playwright && pw_ok; then
    pass "playwright (installed)"
  else
    fail "playwright — rerun with --fix, or: pip install playwright (add --break-system-packages if pip refuses)"
  fi
fi

# ── System Google Chrome ────────────────────────────────────────────────────
CHROME=""
for c in google-chrome google-chrome-stable; do
  if command -v "$c" >/dev/null 2>&1; then CHROME="$(command -v "$c")"; break; fi
done
for p in /opt/google/chrome/chrome \
         "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
  [[ -z "$CHROME" && -x "$p" ]] && CHROME="$p"
done
if [[ -n "$CHROME" ]]; then
  pass "chrome ($CHROME)"
else
  fail "Google Chrome not found — install it (Chromium is not sufficient; the scraper uses channel=\"chrome\")"
fi

# ── clubs.yaml ──────────────────────────────────────────────────────────────
if [[ -s "$CLUBS_YAML" ]]; then
  pass "clubs.yaml"
else
  fail "clubs.yaml missing or empty at fenb-1/data/clubs.yaml"
fi

exit $FAILED
