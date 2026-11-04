import { defineContentScript } from 'wxt/sandbox';
import { MESSAGE_TYPES, isValidMessage } from '../utils/messages.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let isInspecting = false;
    let currentSettings = null;

    console.log('[DevLocator] Content script loaded on:', window.location.href);

    // Listen for messages from popup and background worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!isValidMessage(message)) {
        return false;
      }

      switch (message.type) {
        case MESSAGE_TYPES.GET_INSPECTION_STATUS:
          sendResponse({ isInspecting });
          return true;

        case MESSAGE_TYPES.START_INSPECTION:
          isInspecting = true;
          currentSettings = message.settings || null;
          console.log('[DevLocator] Inspection mode started. Settings:', currentSettings);
          sendResponse({ success: true, isInspecting });
          return true;

        case MESSAGE_TYPES.STOP_INSPECTION:
          isInspecting = false;
          console.log('[DevLocator] Inspection mode stopped.');
          sendResponse({ success: true, isInspecting });
          return true;

        default:
          return false;
      }
    });
  },
});
