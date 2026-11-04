import { defineBackground } from 'wxt/sandbox';
import { MESSAGE_TYPES, isValidMessage } from '../utils/messages.js';
import { getSettings } from '../utils/storage.js';

export default defineBackground(() => {
  console.log('[DevLocator] Background service worker initialized.');

  // Handle extension installation or update
  chrome.runtime.onInstalled.addListener((details) => {
    console.log('[DevLocator] Extension installed/updated:', details.reason);
  });

  // Listen for keyboard command shortcuts (e.g. Alt+Shift+X)
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-inspect') {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) return;

        // Skip internal chrome pages
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
          return;
        }

        const settings = await getSettings();

        // Query current inspection state of the tab
        chrome.tabs.sendMessage(
          tab.id,
          { type: MESSAGE_TYPES.GET_INSPECTION_STATUS },
          (response) => {
            if (chrome.runtime.lastError) {
              // Inject content script if not ready
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id },
                  files: ['content-scripts/content.js'],
                },
                () => {
                  chrome.tabs.sendMessage(tab.id, {
                    type: MESSAGE_TYPES.START_INSPECTION,
                    settings,
                  });
                }
              );
              return;
            }

            const isCurrentlyInspecting = response?.isInspecting || false;
            chrome.tabs.sendMessage(tab.id, {
              type: isCurrentlyInspecting ? MESSAGE_TYPES.STOP_INSPECTION : MESSAGE_TYPES.START_INSPECTION,
              settings,
            });
          }
        );
      } catch (err) {
        console.error('[DevLocator] Failed to handle command shortcut:', err);
      }
    }
  });

  // Message listener for runtime messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isValidMessage(message)) {
      return false;
    }

    if (message.type === MESSAGE_TYPES.GET_INSPECTION_STATUS) {
      sendResponse({ status: 'ok' });
      return true;
    }

    return false;
  });
});

