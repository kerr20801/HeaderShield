// Capture response headers per tab, store in memory
const tabHeaders = {};

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type !== "main_frame") return;
    const headers = {};
    for (const h of details.responseHeaders || []) {
      headers[h.name.toLowerCase()] = h.value;
    }
    tabHeaders[details.tabId] = {
      url: details.url,
      headers,
      ts: Date.now(),
    };
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabHeaders[tabId];
});

// Respond to popup requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_HEADERS") {
    sendResponse(tabHeaders[msg.tabId] || null);
  }
});
