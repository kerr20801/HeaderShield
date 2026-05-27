# HeaderShield

Chrome extension that checks HTTP security headers on any page you visit — instant grade, plain-language risk explanation, and copy-paste fix configs for nginx / Apache / Caddy.

**Supports English and Traditional Chinese (繁體中文).**

---

## Why

Tools like [securityheaders.com](https://securityheaders.com) require you to enter a URL and fetch it externally — meaning they can't check pages that require login. HeaderShield runs inside your browser, so it works on authenticated pages (admin panels, internal tools, staging environments) with zero external requests.

---

## Features

- **Instant grade** — A to F based on 8 security headers
- **Plain-language risk** — explains what each missing header actually means, not just the header name
- **Copy-paste fix** — one click to copy the exact config line for nginx / Apache / Caddy
- **"Copy all fixes"** — grab everything missing in one shot
- **Works on authenticated pages** — no URL sent anywhere, everything stays local
- **EN / 中文** — language toggle in the popup, preference saved

---

## Headers checked

| Header | Weight | Risk if missing |
|--------|--------|----------------|
| Content-Security-Policy | 25pts | XSS — injected scripts run freely |
| Strict-Transport-Security | 20pts | Downgrade attacks to HTTP |
| X-Frame-Options | 15pts | Clickjacking via iframe embedding |
| X-Content-Type-Options | 10pts | MIME sniffing misinterprets file types |
| Referrer-Policy | 10pts | Internal URLs leak to third parties |
| Permissions-Policy | 10pts | Scripts may access camera / mic / location |
| Cross-Origin-Opener-Policy | 5pts | Cross-origin window access |
| Cross-Origin-Resource-Policy | 5pts | Resources loaded by any cross-origin site |

---

## Install (dev / unpacked)

1. Clone or download this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select this folder
5. Visit any HTTPS page and click the extension icon

> The extension needs to capture headers when the page loads.
> If you see "No header data yet", reload the page after installing.

---

## Usage

1. Open a page you want to audit
2. Click the HeaderShield icon
3. Check the grade and missing headers
4. Select your server (nginx / Apache / Caddy) from the tabs
5. Click **Copy** next to each fix, or **Copy all fixes** to grab everything at once
6. Paste into your server config and reload

**Language toggle:** Click the `中文` / `EN` button in the top-right corner of the popup.

---

## Permissions

| Permission | Why |
|------------|-----|
| `webRequest` | Read response headers as pages load |
| `storage` | Cache headers across service worker restarts (MV3); save language preference |
| `tabs` | Identify which tab is currently active |
| `host_permissions: <all_urls>` | Required for webRequest to work on all sites |

No data is collected or transmitted. Everything runs locally.

---

## Part of the browser security toolkit

| Extension | Purpose |
|-----------|---------|
| [SentinelDLP](https://github.com/kerr20801/SentinelDLP) | Intercepts paste events, detects 18 types of sensitive data |
| [EnvGuard](https://github.com/kerr20801/EnvGuard) | Color bar for PROD / STAGING / DEV detection |
| [PIW](https://github.com/kerr20801/PIW-repo) | Detects prompt injection in text pasted to AI chatbots |
| **HeaderShield** | HTTP security header grader with fix configs |

---

## License

MIT
