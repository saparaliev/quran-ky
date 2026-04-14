import json
import os
import re
import time
from html import unescape
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE_URL = "http://transliteration.org/quran/WebSite_CD/RusMixKazak/{num}.asp"
OUT_PATH = "kazakh_translit.json"

# Use a realistic browser UA to reduce blocking.
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/123.0.0.0 Safari/537.36"
)


def strip_tags(html: str) -> str:
    # Remove tags and common non-content fragments.
    html = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", "", html, flags=re.I)
    html = re.sub(r"<style\b[^>]*>[\s\S]*?</style>", "", html, flags=re.I)
    html = re.sub(r"<[^>]+>", "", html)
    html = unescape(html)
    # Collapse whitespace
    html = html.replace("\xa0", " ")
    html = re.sub(r"[ \t\r\f\v]+", " ", html)
    html = re.sub(r"\n\s*\n+", "\n", html)
    return html.strip()


def fetch_html_cp1251(url: str) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        },
        method="GET",
    )
    with urlopen(req, timeout=30) as resp:
        raw = resp.read()
    # The site’s pages are commonly Windows-1251; decode explicitly per requirements.
    return raw.decode("cp1251", errors="replace")


TR_BLOCK = re.compile(r"<tr\b[^>]*>[\s\S]*?</tr>", flags=re.I)
TD_BLOCK = re.compile(r"<td\b[^>]*>([\s\S]*?)</td>", flags=re.I)

REF_RE = re.compile(r"(?P<s>\d{3})-(?P<a>\d{3})\s*(?P<txt>[\s\S]+)$")


def parse_surah_page(html: str) -> dict:
    """
    Returns { ayahNum(str): { translit: str, kazakh: str } }
    """
    out = {}

    for tr in TR_BLOCK.findall(html):
        tds = TD_BLOCK.findall(tr)
        if len(tds) < 2:
            continue

        c1 = strip_tags(tds[0])
        c2 = strip_tags(tds[1]).strip()

        # We only care about rows that look like verse reference + translation.
        r = REF_RE.search(c2)
        if not r:
            continue

        surah = int(r.group("s"))
        ayah = int(r.group("a"))
        kaz = r.group("txt").strip()

        # Some rows may contain empty cells or navigation; skip empties.
        if not c1 or not kaz:
            continue

        out[str(ayah)] = {"translit": c1, "kazakh": kaz}

    # Basic sanity: if nothing parsed, raise to help diagnose quickly.
    if not out:
        raise ValueError("No verse rows found (page structure may have changed).")

    return out


def load_existing(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_json(path: str, data: dict) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(tmp, path)


def main():
    data = load_existing(OUT_PATH)

    for sn in range(1, 115):
        sn_key = str(sn)
        # resumable: skip already scraped surah, but re-scrape if it looks incomplete
        # (this site’s pages always include ayah 1 if parsed correctly).
        if (
            sn_key in data
            and isinstance(data.get(sn_key), dict)
            and data[sn_key]
            and "1" in data[sn_key]
        ):
            # resumable: skip already scraped surah
            continue

        print(f"Scraping surah {sn}/114...")
        url = BASE_URL.format(num=f"{sn:03d}")

        try:
            page = fetch_html_cp1251(url)
            verses = parse_surah_page(page)
        except (HTTPError, URLError) as e:
            print(f"  Failed surah {sn}: {e}")
            time.sleep(1)
            continue
        except Exception as e:
            print(f"  Failed surah {sn}: {e}")
            time.sleep(1)
            continue

        data[sn_key] = verses
        save_json(OUT_PATH, data)
        time.sleep(1)

    print(f"Done. Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()

