// ── Header definitions ────────────────────────────────────────────────────────

const HEADERS = [
  {
    key: "strict-transport-security",
    name: "HSTS",
    weight: 20,
    risk: "Allows downgrade attacks — attackers can force HTTP connections.",
    check: (v) => v && v.includes("max-age"),
    advice: "Enforce HTTPS for all future visits.",
    configs: {
      nginx:  'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
      apache: 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
      caddy:  'header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
    },
  },
  {
    key: "content-security-policy",
    name: "CSP",
    weight: 25,
    risk: "No XSS protection — injected scripts can run freely on this page.",
    check: (v) => !!v,
    advice: "Define which sources can load scripts, styles, and media.",
    configs: {
      nginx:  "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\" always;",
      apache: "Header always set Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\"",
      caddy:  "header Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\"",
    },
  },
  {
    key: "x-frame-options",
    name: "X-Frame-Options",
    weight: 15,
    risk: "Clickjacking risk — this page can be embedded in iframes on attacker sites.",
    check: (v) => v && /^(DENY|SAMEORIGIN)$/i.test(v.trim()),
    advice: "Prevent this page from being embedded in iframes.",
    configs: {
      nginx:  'add_header X-Frame-Options "SAMEORIGIN" always;',
      apache: 'Header always set X-Frame-Options "SAMEORIGIN"',
      caddy:  'header X-Frame-Options "SAMEORIGIN"',
    },
  },
  {
    key: "x-content-type-options",
    name: "X-Content-Type-Options",
    weight: 10,
    risk: "MIME sniffing enabled — browsers may misinterpret file types.",
    check: (v) => v && v.toLowerCase().includes("nosniff"),
    advice: "Stop browsers from guessing content types.",
    configs: {
      nginx:  'add_header X-Content-Type-Options "nosniff" always;',
      apache: 'Header always set X-Content-Type-Options "nosniff"',
      caddy:  'header X-Content-Type-Options "nosniff"',
    },
  },
  {
    key: "referrer-policy",
    name: "Referrer-Policy",
    weight: 10,
    risk: "Full URLs are sent as referrers — internal paths may leak to third parties.",
    check: (v) => !!v,
    advice: "Limit how much referrer info is sent to other sites.",
    configs: {
      nginx:  'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
      apache: 'Header always set Referrer-Policy "strict-origin-when-cross-origin"',
      caddy:  'header Referrer-Policy "strict-origin-when-cross-origin"',
    },
  },
  {
    key: "permissions-policy",
    name: "Permissions-Policy",
    weight: 10,
    risk: "No browser feature restrictions — third-party scripts may access camera, mic, or location.",
    check: (v) => !!v,
    advice: "Restrict which browser APIs this page can use.",
    configs: {
      nginx:  'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
      apache: 'Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"',
      caddy:  'header Permissions-Policy "camera=(), microphone=(), geolocation=()"',
    },
  },
  {
    key: "cross-origin-opener-policy",
    name: "COOP",
    weight: 5,
    risk: "Cross-origin pages can access this window — risk of cross-origin info leaks.",
    check: (v) => !!v,
    advice: "Isolate this page from cross-origin popups.",
    configs: {
      nginx:  'add_header Cross-Origin-Opener-Policy "same-origin" always;',
      apache: 'Header always set Cross-Origin-Opener-Policy "same-origin"',
      caddy:  'header Cross-Origin-Opener-Policy "same-origin"',
    },
  },
  {
    key: "cross-origin-resource-policy",
    name: "CORP",
    weight: 5,
    risk: "Resources can be loaded by any cross-origin site — potential data leakage.",
    check: (v) => !!v,
    advice: "Restrict which origins can load your resources.",
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

  const grade =
    score >= 90 ? "A" :
    score >= 75 ? "B" :
    score >= 55 ? "C" :
    score >= 35 ? "D" : "F";

  return { score: Math.max(0, score), grade, results };
}

// ── Render ─────────────────────────────────────────────────────────────────────

let currentServer = "nginx";

function gradeColor(g) {
  return { A: "#22c55e", B: "#84cc16", C: "#f59e0b", D: "#f97316", F: "#ef4444" }[g] || "#6b7280";
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    btn.style.background = "#22c55e";
    setTimeout(() => { btn.textContent = orig; btn.style.background = ""; }, 1500);
  });
}

function renderItem(item) {
  const div = document.createElement("div");
  div.style.cssText = `
    border-left: 3px solid ${item.pass ? "#22c55e" : "#ef4444"};
    padding: 8px 10px; margin-bottom: 8px; background: #1e1e2e; border-radius: 4px;
  `;

  if (item.pass) {
    div.innerHTML = `<div style="display:flex;align-items:center;gap:6px;">
      <span style="color:#22c55e;font-size:14px;">✓</span>
      <span style="color:#a6e3a1;font-size:12px;font-weight:600;">${item.name}</span>
    </div>`;
    return div;
  }

  const configLine = item.configs[currentServer];

  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <span style="color:#ef4444;font-size:14px;">✗</span>
      <span style="color:#f38ba8;font-size:12px;font-weight:700;">${item.name}</span>
      <span style="margin-left:auto;background:#ef4444;color:#fff;font-size:10px;padding:1px 5px;border-radius:3px;">-${item.weight}pts</span>
    </div>
    <div style="color:#cdd6f4;font-size:11px;margin-bottom:6px;">${item.risk}</div>
    <div style="position:relative;">
      <code style="display:block;background:#11111b;color:#cba6f7;font-size:10px;padding:6px 8px;border-radius:3px;white-space:pre-wrap;word-break:break-all;padding-right:56px;">${escHtml(configLine)}</code>
      <button class="copy-btn" style="position:absolute;right:4px;top:4px;background:#313244;color:#cdd6f4;border:none;border-radius:3px;padding:2px 6px;font-size:10px;cursor:pointer;">Copy</button>
    </div>
  `;

  div.querySelector(".copy-btn").addEventListener("click", (e) => {
    copyText(configLine, e.currentTarget);
  });

  return div;
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function render(data, url) {
  const { score, grade, results } = analyse(data);
  const failed = results.filter(r => !r.pass);
  const passed = results.filter(r => r.pass);

  document.getElementById("url").textContent = url ? new URL(url).hostname : "—";
  document.getElementById("grade").textContent = grade;
  document.getElementById("grade").style.color = gradeColor(grade);
  document.getElementById("score").textContent = `${score}/100`;
  document.getElementById("score").style.color = gradeColor(grade);
  document.getElementById("summary").textContent =
    failed.length === 0
      ? "All security headers present ✓"
      : `${failed.length} header${failed.length > 1 ? "s" : ""} missing`;

  const list = document.getElementById("list");
  list.innerHTML = "";

  if (failed.length === 0) {
    list.innerHTML = '<div style="color:#a6e3a1;text-align:center;padding:16px;font-size:12px;">Perfect score! Nothing to fix.</div>';
    return;
  }

  // Missing first, then passing
  [...failed, ...passed].forEach(item => list.appendChild(renderItem(item)));
}

// ── Copy all missing ──────────────────────────────────────────────────────────

function buildAllConfigs(results) {
  const missing = results.filter(r => !r.pass);
  if (missing.length === 0) return "# All headers present — nothing to add";
  return `# Add to your ${currentServer} config\n` +
    missing.map(r => r.configs[currentServer]).join("\n");
}

// ── Init ──────────────────────────────────────────────────────────────────────

let lastData = null;
let lastUrl = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.runtime.sendMessage({ type: "GET_HEADERS", tabId: tab.id }, (resp) => {
    if (!resp) {
      document.getElementById("list").innerHTML =
        '<div style="color:#6c7086;text-align:center;padding:16px;font-size:12px;">No header data yet.<br>Reload the page to capture headers.</div>';
      return;
    }
    lastData = resp.headers;
    lastUrl = resp.url;

    const { results } = analyse(resp.headers);
    lastResults = results;
    render(resp.headers, resp.url);
  });
}

let lastResults = [];

document.addEventListener("DOMContentLoaded", () => {
  // Server tabs
  document.querySelectorAll(".server-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".server-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentServer = btn.dataset.server;
      if (lastData) render(lastData, lastUrl);
    });
  });

  // Copy all button
  document.getElementById("copy-all").addEventListener("click", (e) => {
    if (!lastResults.length) return;
    copyText(buildAllConfigs(lastResults), e.currentTarget);
  });

  // Reload hint
  document.getElementById("reload-btn")?.addEventListener("click", () => {
    chrome.tabs.reload();
    window.close();
  });

  init();
});
