// MV3-compatible: store in chrome.storage.session so headers survive SW restarts

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type !== "main_frame") return;
    const headers = {};
    for (const h of details.responseHeaders || []) {
      headers[h.name.toLowerCase()] = h.value;
    }
    chrome.storage.session.set({
      [`tab_${details.tabId}`]: { url: details.url, headers, ts: Date.now() },
    });
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove([`tab_${tabId}`]);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_HEADERS") {
    chrome.storage.session.get([`tab_${msg.tabId}`], (result) => {
      sendResponse(result[`tab_${msg.tabId}`] || null);
    });
    return true; // keep channel open for async response
  }
});
