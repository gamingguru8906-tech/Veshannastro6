"""Builds the "Your account" page: /account/index.html

The header's account button (far left on every page built by build_report.py and sitekit.py) leads here.
One page, several views, switched by assets/r27/account.js from what /api/account/me says:
  start     signed out: Sign in, or Create new account
  phone     the WhatsApp number (Kamala sends the 6-digit code there)
  code      the code
  profile   a new number's details: name, email, phone (already verified), date of birth; birth time, place, gender optional
  dashboard signed in: details and orders
  closed    sign-in is not switched on yet (the API answers 503)
On phones the header has no slide-in menu, so the site links sit at the foot of this page.

Run from the repo root:  python3 tools/build_account.py   (build_report.py runs it too)
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import build_report as br  # noqa: E402

REPO = br.REPO
PATH = "/account/"
OUT = os.path.join(REPO, "account", "index.html")


def css():
    out = []
    for name in ("styles.css", "account.css", "perf.css"):
        with open(os.path.join(REPO, "assets", "r27", name), encoding="utf-8") as fh:
            text = re.sub(r"/\*.*?\*/", "", fh.read(), flags=re.S)
        out.append(re.sub(r"\s*\n\s*", " ", re.sub(r"[ \t]+", " ", text)).strip())
    return "".join(out)


def options(values, first):
    return f'<option value="">{first}</option>' + "".join(f'<option value="{v}">{t}</option>' for v, t in values)


DAYS = [(str(d), str(d)) for d in range(1, 32)]
MONTHS = [(str(i + 1), m) for i, m in enumerate(["January", "February", "March", "April", "May", "June", "July", "August",
                                                  "September", "October", "November", "December"])]
HOURS = [(str(h), str(h)) for h in range(1, 13)]
MINS = [(f"{m:02d}", f"{m:02d}") for m in range(0, 60)]

EXPLORE = [
    ("/2027-numerology-report/", "2027 Numerology Report"),
    ("/2027-numerology-report/#services", "Consultations"),
    ("/calculators/", "Free calculators"),
    ("/blog/", "Blog"),
    ("/2027-numerology-report/#faq", "Questions"),
    ("/about.html", "About Shashank"),
    ("/contact.html", "Contact"),
]

ICON_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg>'
ICON_TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>'


def birth_fields(prefix):
    """Birth time (hour, minute, AM/PM), place and gender: all optional."""
    return f"""<div class="field"><label for="{prefix}-tob-h">Birth time <span class="optional">(optional)</span></label>
          <div class="tob-row"><select id="{prefix}-tob-h" aria-label="Hour">{options(HOURS, "Hour")}</select><select id="{prefix}-tob-m" aria-label="Minute">{options(MINS, "Min")}</select><select id="{prefix}-tob-p" aria-label="AM or PM"><option value="">AM/PM</option><option value="AM">AM</option><option value="PM">PM</option></select></div>
          <span class="field-error" id="{prefix}-tob-err"></span></div>
        <div class="field"><label for="{prefix}-pob">Birth place <span class="optional">(optional)</span></label><input id="{prefix}-pob" autocomplete="off" maxlength="120" placeholder="Town or city"><span class="field-error" id="{prefix}-pob-err"></span></div>
        <div class="field"><label for="{prefix}-gender">Gender <span class="optional">(optional)</span></label><select id="{prefix}-gender">{options([("female", "Female"), ("male", "Male"), ("other", "Other")], "Prefer not to say")}</select><span class="field-error" id="{prefix}-gender-err"></span></div>"""


def page():
    explore = "".join(f'<li><a href="{h}">{n}</a></li>' for h, n in EXPLORE)
    year_opts = [(str(y), str(y)) for y in range(2026, 1919, -1)]
    return f"""<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Your account · Veshannastro</title>
  <meta name="description" content="Sign in with your WhatsApp number to see your details and your Veshannastro orders.">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#04050b">
  <link rel="canonical" href="{br.BASE}{PATH}">
  <link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  <style>{css()}</style>
  {br.ACCOUNT_SCRIPT}
</head>
<body class="acct-page">
  <div class="nebula" aria-hidden="true"></div><div class="vignette" aria-hidden="true"></div>
{br.topbar(br.PATH, "account")}  <main class="acct-main" id="acct-app" aria-live="polite">
    <div class="acct-wrap">
      <header class="acct-hero">
        <p class="acct-kicker">Veshannastro</p>
        <h1 id="acct-title">Your account</h1>
        <p class="acct-lead" id="acct-lead">Your details and orders in one place. We sign you in with a code on WhatsApp, so there is no password to remember.</p>
      </header>

      <section class="acct-view on" data-view="loading" aria-busy="true" aria-label="Loading your account">
        <div class="acct-card"><div class="sk-line w60"></div><div class="sk-line w80"></div><div class="sk-line tall"></div></div>
      </section>

      <section class="acct-view" data-view="start" aria-label="Sign in or create an account">
        <p class="acct-error acct-start-err" id="acct-start-err" role="alert" hidden></p>
        <div class="acct-choice">
          <button type="button" class="acct-option" data-intent="signin"><b>Sign in</b><span>You have ordered before, or made an account</span></button>
          <button type="button" class="acct-option" data-intent="create"><b>Create new account</b><span>New here: it takes about a minute</span></button>
        </div>
        <p class="acct-fine">Both start with your WhatsApp number. We send a 6-digit code there and you type it here.</p>
      </section>

      <form class="acct-view acct-card" data-view="phone" id="acct-phone-form" novalidate>
        <button type="button" class="acct-back" data-go="start">{ICON_BACK}Back</button>
        <h2 class="acct-step-title" id="acct-phone-title">Sign in with WhatsApp</h2>
        <p class="acct-text">Enter the number you use on WhatsApp. The code arrives there in a few seconds.</p>
        <div class="field"><label for="acct-mobile">WhatsApp number <i>*</i></label><div class="phone-row"><select id="acct-cc" aria-label="Country code"><option value="India|+91">+91 India</option></select><input id="acct-mobile" data-focus type="tel" inputmode="tel" autocomplete="tel-national" placeholder="98765 43210" maxlength="20" aria-describedby="acct-mobile-err"></div><span class="field-error" id="acct-mobile-err"></span></div>
        <p class="acct-error" id="acct-phone-err" role="alert" hidden></p>
        <button class="btn-solid acct-submit" type="submit">Send code on WhatsApp</button>
        <p class="acct-fine">By continuing you agree to our <a href="/terms.html">terms</a> and <a href="/privacy-policy.html">privacy policy</a>.</p>
      </form>

      <form class="acct-view acct-card" data-view="code" id="acct-code-form" novalidate>
        <button type="button" class="acct-back" data-go="phone">{ICON_BACK}Change number</button>
        <h2 class="acct-step-title">Enter your code</h2>
        <p class="acct-text">We sent a 6-digit code on WhatsApp to <b id="acct-sent-to"></b>. It works for 5 minutes.</p>
        <div class="otp"><input id="acct-otp" data-focus type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{{6}}" maxlength="6" aria-label="6-digit code" aria-describedby="acct-otp-err"><div class="otp-cells" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div></div>
        <p class="acct-error" id="acct-otp-err" role="alert" hidden></p>
        <button class="btn-solid acct-submit" type="submit">Verify</button>
        <div class="acct-row"><span class="acct-fine">No message? Check the number, then resend.</span><button type="button" class="link-btn" id="acct-resend" disabled>Resend in 60s</button></div>
      </form>

      <form class="acct-view acct-card" data-view="profile" id="acct-profile-form" novalidate>
        <h2 class="acct-step-title">Create your account</h2>
        <p class="acct-text" id="acct-profile-note">Your number is verified. Add your details to finish.</p>
        <div class="acct-grid">
          <div class="field acct-wide"><label for="acct-name">Full name <i>*</i></label><input id="acct-name" data-focus autocomplete="name" maxlength="80" placeholder="As on your records"><span class="field-error" id="acct-name-err"></span></div>
          <div class="field"><label for="acct-email">Email <i>*</i></label><input id="acct-email" type="email" inputmode="email" autocomplete="email" maxlength="120" placeholder="you@example.com"><span class="field-error" id="acct-email-err"></span></div>
          <div class="field"><label for="acct-phone-shown">Phone number <i>*</i></label><div class="verified-input"><input id="acct-phone-shown" type="tel" readonly aria-describedby="acct-phone-ok"><span id="acct-phone-ok">{ICON_TICK}Verified</span></div></div>
          <div class="field acct-wide"><label for="acct-dob-d">Date of birth <i>*</i></label>
            <div class="dob-row"><select id="acct-dob-d" aria-label="Day">{options(DAYS, "Day")}</select><select id="acct-dob-m" aria-label="Month">{options(MONTHS, "Month")}</select><select id="acct-dob-y" aria-label="Year">{options(year_opts, "Year")}</select></div>
            <span class="field-error" id="acct-dob-err"></span></div>
        </div>
        <fieldset class="acct-optional">
          <legend>Birth details <span>Optional. Needed for the Astro-Numero Blend and kundli readings; you can add them later.</span></legend>
          <div class="acct-grid">{birth_fields("acct")}</div>
        </fieldset>
        <p class="acct-error" id="acct-profile-err" role="alert" hidden></p>
        <button class="btn-solid acct-submit" type="submit">Create account</button>
      </form>

      <section class="acct-view" data-view="dashboard" aria-labelledby="acct-hello">
        <div class="dash-head">
          <span class="acct-avatar" aria-hidden="true"></span>
          <div class="dash-who"><h2 id="acct-hello"></h2><p id="acct-sub"></p></div>
          <button type="button" class="btn-quiet" id="acct-logout">Log out</button>
        </div>
        <div class="dash-grid">
          <section class="acct-card dash-orders" aria-labelledby="orders-title">
            <div class="panel-head"><h3 id="orders-title">Your orders</h3><span class="panel-count" id="orders-count"></span></div>
            <div class="orders-loading" id="orders-loading"><div class="sk-line tall"></div><div class="sk-line tall"></div></div>
            <ol class="orders" id="orders" hidden></ol>
            <div class="orders-empty" id="orders-empty" hidden>
              <p><b>No orders yet.</b> When you order a report or a consultation with this number, it shows up here.</p>
              <a class="btn-solid" href="/2027-numerology-report/#register">See the 2027 report</a>
            </div>
            <p class="acct-error" id="orders-err" role="alert" hidden></p>
          </section>
          <section class="acct-card dash-details" aria-labelledby="details-title">
            <div class="panel-head"><h3 id="details-title">Your details</h3><button type="button" class="link-btn" id="acct-edit" aria-expanded="false" aria-controls="acct-details-form">Edit birth details</button></div>
            <dl class="acct-details" id="acct-details"></dl>
            <form class="acct-edit" id="acct-details-form" novalidate hidden>
              <div class="acct-grid">{birth_fields("edit")}</div>
              <p class="acct-error" id="acct-edit-err" role="alert" hidden></p>
              <div class="acct-edit-actions"><button class="btn-solid acct-submit" type="submit">Save</button><button type="button" class="btn-quiet" id="acct-edit-cancel">Cancel</button></div>
            </form>
            <p class="acct-fine">To change your name, email or date of birth, message us on WhatsApp.</p>
          </section>
        </div>
      </section>

      <section class="acct-view acct-card" data-view="closed" aria-label="Sign in is not open yet">
        <h2 class="acct-step-title">Sign in opens soon</h2>
        <p class="acct-text">Accounts are being switched on. Until then, we can share your order status on WhatsApp.</p>
        <a class="btn-solid" href="{br.wa("Hi Veshannastro, I would like to know the status of my order.")}" target="_blank" rel="noopener">Ask on WhatsApp</a>
      </section>

      <nav class="acct-explore" aria-labelledby="explore-title">
        <h2 id="explore-title">Explore Veshannastro</h2>
        <ul>{explore}</ul>
      </nav>
    </div>
  </main>
  <footer class="acct-foot"><div class="acct-wrap">
    <p><a href="mailto:{br.EMAIL}">{br.EMAIL}</a><a href="{br.wa(br.ASK_MSG)}" target="_blank" rel="noopener">WhatsApp {br.WA_SHOW}</a><a href="tel:+{br.PHONE2}">Phone {br.PHONE2_SHOW}</a></p>
    <p><a href="/privacy-policy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/refund-policy.html">Refunds and delivery</a><span>&copy; 2026 Veshannastro</span></p>
  </div></footer>
</body>
</html>
"""


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(page())
    print(os.path.relpath(OUT, REPO))


if __name__ == "__main__":
    main()
