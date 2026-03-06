import { extensionConfig } from './config'

// Open side panel on extension icon click (only in sidebar mode)
if (chrome.sidePanel) {
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id })
    }
  })
}

// Built-in message handlers (token management)
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
