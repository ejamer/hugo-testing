#!/usr/bin/env python3
"""Convert text to Unicode "Mathematical Sans-Serif Bold" for Facebook post titles.

Facebook's composer doesn't render Markdown, so bold titles use these distinct
codepoints instead. ASCII letters and digits are converted; everything else
(spaces, punctuation, accented letters like é/à/ç, emoji) is left unchanged —
accented letters have no bold form in this Unicode block.

Usage:
    python3 scripts/fb-bold.py "Title text"           # converts the argument(s)
    echo "Title text" | python3 scripts/fb-bold.py    # or reads stdin

Used by /fenb-content-social-summary. Writes to stdout only.
"""
import sys

UPPER, LOWER, DIGIT = 0x1D5D4, 0x1D5EE, 0x1D7EC  # 𝗔, 𝗮, 𝟬


def bold(text: str) -> str:
    out = []
    for ch in text:
        if "A" <= ch <= "Z":
            out.append(chr(UPPER + ord(ch) - ord("A")))
        elif "a" <= ch <= "z":
            out.append(chr(LOWER + ord(ch) - ord("a")))
        elif "0" <= ch <= "9":
            out.append(chr(DIGIT + ord(ch) - ord("0")))
        else:
            out.append(ch)
    return "".join(out)


if __name__ == "__main__":
    text = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else sys.stdin.read().rstrip("\n")
    print(bold(text))
