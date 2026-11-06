#!/usr/bin/env python3
"""
Dump the useful content of FencingTimeLive pages saved by hand into a folder.

Reads local files only and makes no network requests. Prints plain text with
one table row per line, for /fenb-data-get-results to read and search. It doesn't
interpret columns, so a change to FTL's table layout can't silently corrupt it.

Usage:
  python3 scripts/ftl-read-saved-pages.py FOLDER > scripts/output/saved-pages.txt
"""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class PageParser(HTMLParser):
    SKIP = {"script", "style", "noscript"}

    def __init__(self):
        super().__init__()
        self.title = ""
        self.headings: list[str] = []
        self.event_rows: list[list[str]] = []
        self.tables: list[list[list[str]]] = []
        self.has_tableau_link = False
        self.has_pool_link = False
        self._skip = 0
        self._title_on = False
        self._heading: str | None = None
        self._day = ""
        self._depth = 0
        self._row: list[str] | None = None
        self._cell: str | None = None
        self._event_id: str | None = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in self.SKIP:
            self._skip += 1
        elif tag == "title":
            self._title_on = True
        elif tag in {"h1", "h2", "h3", "h4", "h5"}:
            self._heading = ""
        elif tag == "a":
            href = a.get("href") or ""
            self.has_tableau_link |= "/tableaus/scores/" in href
            self.has_pool_link |= "/pools/scores/" in href
        elif tag == "table":
            self._depth += 1
            if self._depth == 1:
                self.tables.append([])
        elif tag == "tr" and self._depth:
            self._row = []
            row_id = a.get("id") or ""
            self._event_id = row_id[3:] if row_id.startswith("ev_") else None
        elif tag in {"td", "th"} and self._row is not None:
            self._cell = ""
        elif tag == "img" and self._cell is not None:
            # Country flags can be images, so keep whatever identifies the image.
            label = a.get("alt") or a.get("title") or Path(a.get("src") or "").stem
            if label:
                self._cell += f" [img:{label}] "

    def handle_endtag(self, tag):
        if tag in self.SKIP:
            self._skip = max(0, self._skip - 1)
        elif tag == "title":
            self._title_on = False
        elif tag in {"h1", "h2", "h3", "h4", "h5"} and self._heading is not None:
            text = clean(self._heading)
            if text:
                self.headings.append(text)
                self._day = text
            self._heading = None
        elif tag in {"td", "th"} and self._cell is not None:
            if self._row is not None:
                self._row.append(clean(self._cell))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._event_id:
                self.event_rows.append([self._event_id, self._day] + self._row)
            elif any(self._row) and self.tables:
                self.tables[-1].append(self._row)
            self._row = None
            self._event_id = None
        elif tag == "table" and self._depth:
            self._depth -= 1

    def handle_data(self, data):
        if self._skip:
            return
        if self._title_on:
            self.title += data
        if self._heading is not None:
            self._heading += data
        if self._cell is not None:
            self._cell += data


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    folder = Path(sys.argv[1]).expanduser()
    if not folder.is_dir():
        print(f"Not a folder: {folder}", file=sys.stderr)
        return 2

    files = sorted(p for p in folder.iterdir() if p.is_file())
    pages = [p for p in files if p.suffix.lower() in {".html", ".htm"}]
    others = [p.name for p in files if p.suffix.lower() in {".mhtml", ".mht", ".webarchive"}]

    print(f"pages: {len(pages)}")
    if others:
        print("unsupported_format: " + " | ".join(others))

    for path in pages:
        html = path.read_text(encoding="utf-8", errors="replace")
        parser = PageParser()
        parser.feed(html)
        saved_from = re.search(r"<!-- saved from url=\(\d+\)(\S+?)\s*-->", html)
        rows = sum(len(t) for t in parser.tables)

        print(f"\n=== FILE: {path.name}")
        print(f"saved_from: {saved_from.group(1) if saved_from else ''}")
        print(f"title: {clean(parser.title)}")
        print("headings: " + " | ".join(parser.headings))
        print(f"tableau_link: {parser.has_tableau_link}  pool_link: {parser.has_pool_link}")
        if parser.event_rows:
            print(f"event_rows: {len(parser.event_rows)}")
            for row in parser.event_rows:
                print("EV\t" + "\t".join(row))
        print(f"table_rows: {rows}")
        for table in parser.tables:
            for row in table:
                print("ROW\t" + "\t".join(row))
    return 0


if __name__ == "__main__":
    sys.exit(main())
