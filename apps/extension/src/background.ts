// Open side panel on extension icon click (only in sidebar mode)
if (chrome.sidePanel) {
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id })
    }
  })
}

// Message routing between content script ↔ popup/sidebar
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_TOKEN') {
    chrome.storage.local.get(['accessToken'], (result) => {
      sendResponse({ token: result.accessToken ?? null })
    })
    return true // async
  }

  if (message.type === 'SET_TOKENS') {
    chrome.storage.local.set({
      accessToken: message.accessToken,
      refreshToken: message.refreshToken,
    })
    sendResponse({ ok: true })
    return true
  }

  if (message.type === 'CLEAR_TOKENS') {
    chrome.storage.local.remove(['accessToken', 'refreshToken'])
    sendResponse({ ok: true })
    return true
  }
})
