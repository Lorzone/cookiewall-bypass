[README FINAL.md](https://github.com/user-attachments/files/25589604/README.FINAL.md)
<div align="center">


# CookieWall Bypass

**Automatically dismisses cookie banners — no interaction needed.**

[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-FF7139?style=flat-square&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/firefox/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-8b5cf6?style=flat-square)]()
[![No Data Collected](https://img.shields.io/badge/Data%20Collected-None-10b981?style=flat-square)]()

*Firefox Desktop · Firefox for Android · Manifest V3 · Zero data collected*

[Install](#installation) · [How it works](#how-it-works) · [Honest limitations](#honest-limitations) · [What is coming](#what-is-coming-in-v200)

---

</div>

## What it does right now

Every time you open a page with a cookie banner, this extension automatically finds the **"Reject All"** button and clicks it for you. No interaction needed.

If no "Reject All" button is found, it searches by button text across 5 languages. If that also fails, it clicks "Accept" as a last resort — only to unblock the page.

> **v1.0.0 is functional and available on Firefox Add-ons.** The next major version will work very differently, with a much stronger privacy focus. Read [What is coming](#what-is-coming-in-v200) for the full plan.

---

## How it works

The extension injects a content script into every page. On load it runs through this logic:

```
Page loads
    |
    v
Search for "Reject All" button via CSS selector
(explicit support for 15+ CMP libraries)
    |
    +-- Found? --> Click it
    |
    +-- Not found?
            |
            v
        Search all buttons by text content
        (IT / EN / FR / DE / ES patterns)
            |
            +-- Found? --> Click it
            |
            +-- Still nothing?
                    |
                    v
                Click "Accept" to unblock the page
                    |
                    v
                Remove remaining banner elements from DOM
                    |
                    v
                Restore body scroll and layout
```

A `MutationObserver` also watches for banners injected dynamically after load, which is common on JavaScript-heavy sites and single-page apps.

---

## Supported CMP libraries

The extension has explicit CSS selectors for the most common Consent Management Platforms:

| Library | Library | Library |
|---|---|---|
| OneTrust | CookieYes | Usercentrics |
| Cookiebot | Complianz | Borlabs Cookie |
| Didomi | Termly | Moove GDPR |
| iubenda | Sourcepoint | Axeptio |
| Quantcast | Cookiehub | Piwik PRO |

Beyond these, the extension also matches banners by common ID/class patterns (`cookie-banner`, `gdpr-overlay`, `consent-wall`, etc.) so it handles many more sites than this list.

Missing a site? [Open an issue](../../issues/new) with the URL.

---

## Installation

### From Firefox Add-ons (AMO)

[![Get the Add-on](https://img.shields.io/badge/Get%20the%20Add--on-Firefox%20AMO-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/firefox/)

Works on **Firefox Desktop** (109+) and **Firefox for Android** (113+).

### Manual install for testing

1. Download the `.zip` from the [Releases page](../../releases)
2. Extract it to any folder
3. Open Firefox → `about:debugging` → **This Firefox** → **Load Temporary Add-on...**
4. Select `manifest.json` inside the extracted folder

Active until Firefox is closed. For a permanent self-hosted install, use the signed `.xpi` from the [Releases page](../../releases).

---

## Honest limitations

**v1.0.0 still sets cookies.** Clicking "Reject All" tells the site you refused — but the site still receives that signal and typically writes a cookie to store your preference. You leave a trace.

**Server-side paywalls are out of scope.** On sites like Corriere della Sera or Repubblica, the server never sends the article content unless you hold a valid subscription cookie. No browser extension can bypass this because there is nothing to remove — the content simply was not delivered to your browser.

These two problems are exactly what v2.0.0 is being built to solve.

---

## What is coming in v2.0.0

The guiding principle for v2.0.0 is simple: **leave as few traces as possible on every site you visit.**

### New approach: remove, do not click

The current strategy of clicking buttons will be replaced entirely. Instead:

1. **The banner is removed directly from the DOM** — it disappears without any click, without any cookie being set, and without the site receiving any consent signal from you.
2. **Scroll and layout are restored** — inline styles and CSS classes added by the banner to lock the page are reversed.
3. **Only if the content is still blocked** after several removal attempts (some banners are backed by JavaScript that checks cookie state and re-injects the wall): the extension will select **only technically necessary cookies** and immediately delete everything else — analytics, advertising, profiling — from both `document.cookie` and `localStorage`.

This means in the vast majority of cases the extension leaves **zero cookie traces**. In the worst case, only the bare minimum survives.

### Feature comparison

| Feature | v1.0.0 (current) | v2.0.0 (planned) |
|---|---|---|
| Strategy | Click "Reject All" | Remove banner from DOM, no click |
| Cookies set on visit | Yes, rejection preference cookie | None in most cases |
| Fallback when removal fails | Click "Accept" | Select only necessary cookies |
| Cookie cleanup after bypass | No | Yes, automatic scan and delete |
| localStorage tracking cleanup | No | Yes |
| Retries before fallback | No | Yes, multiple attempts before giving up |
| Site whitelist | No | Yes |
| Multilingual popup UI | No | Yes — IT, EN, FR, DE, ES |

### Why multiple retries matter

Some sites inject the cookie wall in multiple waves — one on DOMContentLoaded, another after an API response, another after a timer. v2.0.0 will watch the page for a few seconds and remove each wave as it appears, before ever considering the fallback.

---

## Privacy

CookieWall Bypass collects zero data about you.

- No analytics, no telemetry, no external requests of any kind
- All processing runs locally in your browser
- Declared in `manifest.json`: `"data_collection_permissions": { "required": ["none"] }`

The only storage used is `chrome.storage.local` to save your toggle preferences and bypass counters locally. It never leaves your device.

---

## Project structure

```
cookiewall-bypass/
+-- manifest.json       Extension manifest (Manifest V3)
+-- popup.html          Popup interface
+-- icons/
|   +-- icon16.png
|   +-- icon48.png
|   +-- icon128.png
+-- src/
    +-- content.js      Core logic, injected into every page
    +-- content.css     Hides banners before JS runs (prevents flash)
    +-- background.js   Background event page
    +-- popup.js        Popup logic
```

---

## Contributing

Most useful right now:

- **Unsupported sites** — open an issue with the URL. If you can inspect the "Reject All" button and paste its CSS selector, even better.
- **False positives** — if the extension removed or broke something it should not have touched, please report it.
- **Translations** — help bring the v2.0.0 multilingual UI to your language.

---

## Legal note

The GDPR (Regulation 2016/679) requires consent to be freely given. Cookie walls that block content unless you accept non-essential tracking have been ruled unlawful by the European Data Protection Board in multiple decisions. Using this extension to protect your own privacy is fully lawful.

---

## License

[MIT](LICENSE) — use it, fork it, improve it.

---

<div align="center">

Made with a deep dislike for cookie banners.

**If this saves you a click every day, consider supporting the project:**

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/Lorzone)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-ea4aaa?style=flat-square&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Lorzone)

</div>
