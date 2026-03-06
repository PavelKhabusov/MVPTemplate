import { extensionConfig } from './config'

// Open side panel on extension icon click (only in sidebar mode)
if (chrome.sidePanel) {
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id })
    }
  })
}

// Built-in message handlers (token management + tab context)
const builtinHandlers: Record<string, (message: any, sender: chrome.runtime.MessageSender, sendResponse: (r: any) => void) => boolean | void> = {
  GET_TOKEN: (_message, _sender, sendResponse) => {
    chrome.storage.local.get(['accessToken'], (result) => {
      sendResponse({ token: result.accessToken ?? null })
    })
    return true
  },

  SET_TOKENS: (message, _sender, sendResponse) => {
    chrome.storage.local.set({
      accessToken: message.accessToken,
      refreshToken: message.refreshToken,
    })
    sendResponse({ ok: true })
    return true
  },

  CLEAR_TOKENS: (_message, _sender, sendResponse) => {
    chrome.storage.local.remove(['accessToken', 'refreshToken'])
    sendResponse({ ok: true })
    return true
  },

  // Always available — needed before custom handlers finish loading
  GET_CURRENT_SHEET: (_message, _sender, sendResponse) => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        const match = tab.url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
        if (match) { sendResponse({ spreadsheetId: match[1] }); return }
      }
      sendResponse({ spreadsheetId: null })
    }).catch(() => sendResponse({ spreadsheetId: null }))
    return true
  },
}

// Tab tracking — registered synchronously as required by MV3 service workers
if (extensionConfig.tabTracking) {
  function _notifyTabChange(url: string | undefined) {
    const match = url?.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    const spreadsheetId = match?.[1] || null
    chrome.runtime.sendMessage({
      type: 'TAB_CONTEXT_CHANGED',
      payload: { url: url || null, isGoogleSheets: !!spreadsheetId, spreadsheetId },
    }).catch(() => {})
  }

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId)
      _notifyTabChange(tab.url)
    } catch {}
  })

  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
        if (activeTab?.id === tab.id) _notifyTabChange(tab.url)
      }).catch(() => {})
    }
  })
}

// Merge custom handlers from config
let customHandlers: Record<string, (message: any, sender: any, sendResponse: (r: any) => void) => boolean | void> = {}

if (extensionConfig.backgroundHandlers) {
  extensionConfig.backgroundHandlers().then((mod) => {
    customHandlers = mod.default
  }).catch(() => {})
}

// Unified message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message

  if (builtinHandlers[type]) {
    return builtinHandlers[type](message, sender, sendResponse)
  }

  if (customHandlers[type]) {
    return customHandlers[type](message, sender, sendResponse)
  }
})
