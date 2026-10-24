"""Renders 1200x630 cover images for blog posts into images/blog/.
Run after build_blog.py:  python3 tools/make_covers.py
"""
import os, sys, html
sys.path.insert(0, os.path.dirname(__file__))
from build_blog import POSTS, REPO
from playwright.sync_api import sync_playwright

import base64
FONT = "data:font/woff2;base64," + base64.b64encode(open(os.path.join(REPO, "assets/fonts/manrope-latin.woff2"), "rb").read()).decode()


def mark(p):
    s = p["slug"]
    if s.startswith("personal-year-") and s.endswith("-in-2027"):
        return s.split("-")[2]
    if s.startswith("mulank"):
        return "1&ndash;9"
    return "2027"


def sub(p):
    s = p["slug"]
    if s.startswith("personal-year-") and s.endswith("-in-2027"):
        from data2027 import PY
        return PY[int(s.split("-")[2])]["name"]
    return p["cat"]


def tpl(p):
    title = html.escape(p["h1"])
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:M;src:url('{FONT}') format('woff2');font-weight:200 800}}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:radial-gradient(700px 420px at 85% 20%,rgba(48,88,175,.35),transparent 70%),radial-gradient(600px 400px at 10% 100%,rgba(24,108,148,.25),transparent 70%),#05070f;color:#edf1f9;font-family:M,sans-serif;position:relative;overflow:hidden}}
.stars{{position:absolute;inset:0;background-image:radial-gradient(1.2px 1.2px at 12% 18%,#cfe0ff 50%,transparent 51%),radial-gradient(1px 1px at 33% 72%,#cfe0ff 50%,transparent 51%),radial-gradient(1.4px 1.4px at 58% 12%,#cfe0ff 50%,transparent 51%),radial-gradient(1px 1px at 76% 64%,#cfe0ff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 91% 38%,#cfe0ff 50%,transparent 51%),radial-gradient(1px 1px at 22% 44%,#cfe0ff 50%,transparent 51%),radial-gradient(1px 1px at 48% 88%,#cfe0ff 50%,transparent 51%),radial-gradient(1.3px 1.3px at 66% 33%,#cfe0ff 50%,transparent 51%);opacity:.6}}
.wrap{{position:absolute;inset:64px 72px;display:flex;flex-direction:column}}
.brand{{font-weight:700;letter-spacing:.16em;font-size:22px}}
.cat{{margin-top:auto;color:#f3cd93;font-weight:600;font-size:26px}}
h1{{margin-top:14px;font-weight:300;font-size:{64 if len(p['h1'])<34 else 54}px;line-height:1.08;letter-spacing:-.03em;max-width:900px}}
.by{{margin-top:28px;color:#9aa5bd;font-size:22px}}
.big{{position:absolute;right:64px;top:40px;font-weight:200;font-size:{220 if len(mark(p))<3 else 170}px;line-height:1;color:#f3cd93;opacity:.9;letter-spacing:-.04em}}
.line{{position:absolute;left:72px;right:72px;bottom:150px;height:1px;background:rgba(255,255,255,.0)}}
</style></head><body><div class="stars"></div><div class="big">{mark(p)}</div>
<div class="wrap"><div class="brand">VESHANNASTRO</div><div class="cat">{html.escape(sub(p))}</div><h1>{title}</h1><div class="by">Shashank Agrawal, veshannastro.co.in</div></div></body></html>"""


if __name__ == "__main__":
    out = os.path.join(REPO, "images/blog")
    os.makedirs(out, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 630})
        for p in POSTS:
            pg.set_content(tpl(p), wait_until="load")
            pg.wait_for_timeout(150)
            fp = os.path.join(out, p["slug"] + ".jpg")
            pg.wait_for_function("document.fonts.status === 'loaded'")
            pg.screenshot(path=fp, type="jpeg", quality=86)
            print(os.path.relpath(fp, REPO))
        b.close()
