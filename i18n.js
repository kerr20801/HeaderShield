// Language: read from storage (user override) or browser default
// This file is loaded first; LANG is set synchronously for static strings,
// then storage preference is applied on DOMContentLoaded if different.

const _browserLang = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
let LANG = _browserLang;

// Apply stored preference synchronously via a blocking storage read isn't possible,
// so we expose applyStoredLang() — popup.js calls it before first render.
function applyStoredLang(cb) {
  chrome.storage.local.get(["lang"], (res) => {
    if (res.lang === "zh" || res.lang === "en") LANG = res.lang;
    cb();
  });
}

const T = {
  en: {
    loading:      "Capturing headers…",
    no_data:      "No header data yet.\nReload the page to capture headers.",
    perfect:      "All security headers present ✓",
    missing_one:  "1 header missing",
    missing_many: (n) => `${n} headers missing`,
    copy:         "Copy",
    copied:       "Copied!",
    copy_all:     "Copy all fixes",
    footer:       "Local only · Zero telemetry · Data never leaves your browser",
    pts:          (n) => `-${n}pts`,
    all_fixed:    "Perfect score! Nothing to fix.",
    comment:      (s) => `# Add to your ${s} config`,
    comment_none: "# All headers present — nothing to add",
    lang_btn:     "中文",
    headers: {
      "strict-transport-security": {
        name: "HSTS",
        risk: "Allows downgrade attacks — attackers can force HTTP connections.",
      },
      "content-security-policy": {
        name: "CSP",
        risk: "No XSS protection — injected scripts can run freely on this page.",
      },
      "x-frame-options": {
        name: "X-Frame-Options",
        risk: "Clickjacking risk — page can be embedded in iframes on attacker sites.",
      },
      "x-content-type-options": {
        name: "X-Content-Type-Options",
        risk: "MIME sniffing enabled — browsers may misinterpret file types.",
      },
      "referrer-policy": {
        name: "Referrer-Policy",
        risk: "Full URLs sent as referrers — internal paths may leak to third parties.",
      },
      "permissions-policy": {
        name: "Permissions-Policy",
        risk: "No feature restrictions — scripts may access camera, mic, or location.",
      },
      "cross-origin-opener-policy": {
        name: "COOP",
        risk: "Cross-origin pages can access this window — info leak risk.",
      },
      "cross-origin-resource-policy": {
        name: "CORP",
        risk: "Resources can be loaded by any cross-origin site — data leakage risk.",
      },
    },
  },

  zh: {
    loading:      "擷取 Headers 中…",
    no_data:      "尚未取得 Header 資料。\n請重新載入頁面以擷取 Headers。",
    perfect:      "所有安全標頭均已設定 ✓",
    missing_one:  "缺少 1 個標頭",
    missing_many: (n) => `缺少 ${n} 個標頭`,
    copy:         "複製",
    copied:       "已複製！",
    copy_all:     "複製所有修復設定",
    footer:       "本機處理 · 零遙測 · 資料不離開你的瀏覽器",
    pts:          (n) => `-${n}分`,
    all_fixed:    "完美！所有標頭均已設定。",
    comment:      (s) => `# 加入你的 ${s} 設定檔`,
    comment_none: "# 所有標頭均已設定，無需新增",
    lang_btn:     "EN",
    headers: {
      "strict-transport-security": {
        name: "HSTS",
        risk: "缺少 HSTS — 攻擊者可強制降級為 HTTP 連線。",
      },
      "content-security-policy": {
        name: "CSP",
        risk: "缺少 CSP — 注入的惡意腳本可在此頁面自由執行（XSS 風險）。",
      },
      "x-frame-options": {
        name: "X-Frame-Options",
        risk: "缺少點擊劫持防護 — 頁面可被嵌入攻擊者的 iframe 中。",
      },
      "x-content-type-options": {
        name: "X-Content-Type-Options",
        risk: "缺少 nosniff — 瀏覽器可能誤判回應的內容類型。",
      },
      "referrer-policy": {
        name: "Referrer-Policy",
        risk: "完整 URL 作為 Referrer 傳送 — 內部路徑可能洩漏給第三方。",
      },
      "permissions-policy": {
        name: "Permissions-Policy",
        risk: "未限制瀏覽器功能 — 腳本可能存取相機、麥克風或位置。",
      },
      "cross-origin-opener-policy": {
        name: "COOP",
        risk: "跨來源頁面可存取此 window — 存在資訊洩漏風險。",
      },
      "cross-origin-resource-policy": {
        name: "CORP",
        risk: "任何跨來源網站均可載入此資源 — 存在資料洩漏風險。",
      },
    },
  },
};

function t(key, ...args) {
  const val = T[LANG][key] ?? T["en"][key];
  return typeof val === "function" ? val(...args) : val;
}

function th(headerKey) {
  return T[LANG].headers[headerKey] ?? T["en"].headers[headerKey];
}
