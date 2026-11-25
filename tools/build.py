#!/usr/bin/env python3
"""Render the product log from tools/products.json into index.html (tr) and en/index.html (en).

Only the text between <!-- products:start --> and <!-- products:end --> is replaced,
so the rest of each page stays hand-editable. Usage: python3 tools/build.py
"""
import json
import pathlib
import re
import sys
from html import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = {"tr": ROOT / "index.html", "en": ROOT / "en" / "index.html"}

UI = {
    "tr": {"live": "● YAYINDA", "wip": "◐ YOLDA", "count": "{n} kayıt", "download": "App Store'dan indir",
           "overview": "Tanıtım", "support": "Destek", "privacy": "Gizlilik", "path": "/{slug}/", "anchor": "#tr"},
    "en": {"live": "● LIVE", "wip": "◐ IN PROGRESS", "count": "{n} entries", "download": "Download on the App Store",
           "overview": "Overview", "support": "Support", "privacy": "Privacy", "path": "/{slug}/#en", "anchor": "#en"},
}


def live_card(p, i, lang):
    t = UI[lang]
    slug = p["slug"]
    tags = "".join(f"<span>{escape(x)}</span>" for x in p["tags"][lang])
    return f"""<article class="product" id="{escape(slug)}">
<span class="idx">{i:02d}</span>
<img class="product-icon" src="{escape(p['icon'])}" width="96" height="96" alt="">
<div class="product-body">
<div class="product-title"><h3>{escape(p['name'][lang])}</h3><span class="status status-live">{t['live']}</span></div>
<p>{escape(p['text'][lang])}</p>
<div class="tags">{tags}</div>
</div>
<div class="product-cta">
<a class="btn btn-light" href="https://apps.apple.com/app/id{escape(p['appStoreId'])}">{t['download']}</a>
<div class="product-links"><a href="{t['path'].format(slug=slug)}">{t['overview']}</a><a href="/{slug}/support/{t['anchor']}">{t['support']}</a><a href="/{slug}/privacy/{t['anchor']}">{t['privacy']}</a></div>
</div>
</article>"""


def wip_card(p, i, lang):
    id_attr = f' id="{escape(p["id"])}"' if p.get("id") else ""
    return f"""<div class="placeholder"{id_attr}>
<span class="idx">{i:02d}</span>
<div class="placeholder-body"><strong>{escape(p['title'][lang])}</strong><span>{escape(p['text'][lang])}</span></div>
<span class="status status-wip">{UI[lang]['wip']}</span>
</div>"""


def render(products, lang):
    cards = []
    for i, p in enumerate(products, 1):
        if p["status"] == "live":
            cards.append(live_card(p, i, lang))
        elif p["status"] == "wip":
            cards.append(wip_card(p, i, lang))
        else:
            sys.exit(f"unknown status: {p['status']}")
    return cards


def main():
    products = json.loads((ROOT / "tools" / "products.json").read_text(encoding="utf-8"))["products"]
    for lang, page in PAGES.items():
        html = page.read_text(encoding="utf-8")
        block = "<!-- products:start -->\n" + "\n\n".join(render(products, lang)) + "\n<!-- products:end -->"
        html, n = re.subn(r"<!-- products:start -->.*?<!-- products:end -->", lambda _: block, html, flags=re.S)
        if n != 1:
            sys.exit(f"{page}: products markers not found")
        count = UI[lang]["count"].format(n=len(products))
        html, n = re.subn(r'(<span class="count">).*?(</span>)', lambda m: m.group(1) + count + m.group(2), html)
        if n != 1:
            sys.exit(f"{page}: count span not found")
        page.write_text(html, encoding="utf-8")
        print(f"updated {page.relative_to(ROOT)} ({len(products)} products)")


if __name__ == "__main__":
    main()
