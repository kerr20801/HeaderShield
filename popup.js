// ── Header definitions ────────────────────────────────────────────────────────

const HEADERS = [
  {
    key: "strict-transport-security", weight: 20,
    check: (v) => v && v.includes("max-age"),
    configs: {
      nginx:  'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
      apache: 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
      caddy:  'header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
    },
  },
  {
    key: "content-security-policy", weight: 25,
    check: (v) => !!v,
    configs: {
      nginx:  "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\" always;",
      apache: "Header always set Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\"",
      caddy:  "header Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\"",
    },
  },
  {
    key: "x-frame-options", weight: 15,
    check: (v) => v && /^(DENY|SAMEORIGIN)$/i.test(v.trim()),
    configs: {
      nginx:  'add_header X-Frame-Options "SAMEORIGIN" always;',
      apache: 'Header always set X-Frame-Options "SAMEORIGIN"',
      caddy:  'header X-Frame-Options "SAMEORIGIN"',
    },
  },
  {
    key: "x-content-type-options", weight: 10,
    check: (v) => v && v.toLowerCase().includes("nosniff"),
    configs: {
      nginx:  'add_header X-Content-Type-Options "nosniff" always;',
      apache: 'Header always set X-Content-Type-Options "nosniff"',
      caddy:  'header X-Content-Type-Options "nosniff"',
    },
  },
  {
    key: "referrer-policy", weight: 10,
    check: (v) => !!v,
    configs: {
      nginx:  'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
      apache: 'Header always set Referrer-Policy "strict-origin-when-cross-origin"',
      caddy:  'header Referrer-Policy "strict-origin-when-cross-origin"',
    },
  },
  {
    key: "permissions-policy", weight: 10,
    check: (v) => !!v,
    configs: {
      nginx:  'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
      apache: 'Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"',
      caddy:  'header Permissions-Policy "camera=(), microphone=(), geolocation=()"',
    },
  },
  {
    key: "cross-origin-opener-policy", weight: 5,
    check: (v) => !!v,
    configs: {
      nginx:  'add_header Cross-Origin-Opener-Policy "same-origin" always;',
      apache: 'Header always set Cross-Origin-Opener-Policy "same-origin"',
      caddy:  'header Cross-Origin-Opener-Policy "same-origin"',
    },
  },
  {
    key: "cross-origin-resource-policy", weight: 5,
    check: (v) => !!v,
    configs: {
      nginx:  'add_header Cross-Origin-Resource-Policy "same-origin" always;',
      apache: 'Header always set Cross-Origin-Resource-Policy "same-origin"',
      caddy:  'header Cross-Origin-Resource-Policy "same-origin"',
    },
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────

function analyse(headers) {
  let score = 100;
  const results = [];
  for (const hdr of HEADERS) {
    const val = headers[hdr.key];
    const pass = hdr.check(val);
    if (!pass) score -= hdr.weight;
    results.push({ ...hdr, val: val || null, pass });
  }
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 55 ? "C" : score >= 35 ? "D" : "F";
  return { score: Math.max(0, score), grade, results };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeColor(g) {
  return { A: "#22c55e", B: "#84cc16", C: "#f59e0b", D: "#f97316", F: "#ef4444" }[g] || "#6b7280";
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = t("copied");
    btn.style.background = "#22c55e";
    setTimeout(() => { btn.textContent = orig; btn.style.background = ""; }, 1500);
  });
}

// ── Render ────────────────────────────────────────────────────────────────────

let currentServer = "nginx";
let lastResults   = [];
let lastHeaders   = {};
let lastUrl       = "";

function renderItem(item) {
  const info = th(item.key);
  const div  = document.createElement("div");
  div.style.cssText = `
    border-left: 3px solid ${item.pass ? "#22c55e" : "#ef4444"};
    padding: 8px 10px; margin-bottom: 8px; background: #1e1e2e; border-radius: 4px;
  `;

  if (item.pass) {
    div.innerHTML = `<div style="display:flex;align-items:center;gap:6px;">
      <span style="color:#22c55e;font-size:14px;">✓</span>
      <span style="color:#a6e3a1;font-size:12px;font-weight:600;">${info.name}</span>
    </div>`;
    return div;
  }

  const configLine = item.configs[currentServer];
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <span style="color:#ef4444;font-size:14px;">✗</span>
      <span style="color:#f38ba8;font-size:12px;font-weight:700;">${info.name}</span>
      <span style="margin-left:auto;background:#ef4444;color:#fff;font-size:10px;padding:1px 5px;border-radius:3px;">${t("pts", item.weight)}</span>
    </div>
    <div style="color:#cdd6f4;font-size:11px;margin-bottom:6px;">${info.risk}</div>
    <div style="position:relative;">
      <code style="display:block;background:#11111b;color:#cba6f7;font-size:10px;padding:6px 8px;border-radius:3px;white-space:pre-wrap;word-break:break-all;padding-right:56px;">${escHtml(configLine)}</code>
      <button class="copy-btn" style="position:absolute;right:4px;top:4px;background:#313244;color:#cdd6f4;border:none;border-radius:3px;padding:2px 6px;font-size:10px;cursor:pointer;">${t("copy")}</button>
    </div>
  `;
  div.querySelector(".copy-btn").addEventListener("click", (e) => copyText(configLine, e.currentTarget));
  return div;
}

function render() {
  const { score, grade, results } = analyse(lastHeaders);
  lastResults = results;

  const failed = results.filter(r => !r.pass);
  const passed = results.filter(r => r.pass);

  try { document.getElementById("url").textContent = new URL(lastUrl).hostname; }
  catch { document.getElementById("url").textContent = lastUrl || "—"; }

  const gradeEl = document.getElementById("grade");
  const scoreEl = document.getElementById("score");
  gradeEl.textContent = grade;
  gradeEl.style.color = gradeColor(grade);
  scoreEl.textContent = `${score}/100`;
  scoreEl.style.color = gradeColor(grade);

  document.getElementById("summary").textContent =
    failed.length === 0 ? t("perfect") :
    failed.length === 1 ? t("missing_one") :
    t("missing_many", failed.length);

  const list = document.getElementById("list");
  list.innerHTML = "";

  if (failed.length === 0) {
    list.innerHTML = `<div style="color:#a6e3a1;text-align:center;padding:16px;font-size:12px;">${t("all_fixed")}</div>`;
    return;
  }
  [...failed, ...passed].forEach(item => list.appendChild(renderItem(item)));
}

function buildAllConfigs() {
  const missing = lastResults.filter(r => !r.pass);
  if (!missing.length) return t("comment_none");
  return t("comment", currentServer) + "\n" + missing.map(r => r.configs[currentServer]).join("\n");
}

function refreshI18nUI() {
  document.getElementById("copy-all").textContent  = t("copy_all");
  document.getElementById("footer").textContent    = t("footer");
  document.getElementById("lang-toggle").textContent = t("lang_btn");
  document.getElementById("lang-toggle").style.display = "block";
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  refreshI18nUI();
  document.getElementById("summary").textContent = t("loading");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.runtime.sendMessage({ type: "GET_HEADERS", tabId: tab.id }, (resp) => {
    if (chrome.runtime.lastError || !resp) {
      document.getElementById("summary").textContent = "—";
      document.getElementById("list").innerHTML =
        `<div style="color:#6c7086;text-align:center;padding:16px;font-size:12px;white-space:pre-line;">${t("no_data")}</div>`;
      return;
    }
    lastHeaders = resp.headers;
    lastUrl     = resp.url;
    render();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Load stored language preference first, then init
  applyStoredLang(() => {
    init();
  });

  // Language toggle
  document.getElementById("lang-toggle").addEventListener("click", () => {
    const next = LANG === "en" ? "zh" : "en";
    chrome.storage.local.set({ lang: next }, () => {
      LANG = next;
      refreshI18nUI();
      if (Object.keys(lastHeaders).length) render();
      else document.getElementById("summary").textContent = "—";
    });
  });

  // Server tabs
  document.querySelectorAll(".server-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".server-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentServer = btn.dataset.server;
      if (Object.keys(lastHeaders).length) render();
    });
  });

  // Copy all fixes
  document.getElementById("copy-all").addEventListener("click", (e) => {
    copyText(buildAllConfigs(), e.currentTarget);
  });
});
