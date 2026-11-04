import { defineContentScript } from 'wxt/sandbox';
import { MESSAGE_TYPES, isValidMessage } from '../utils/messages.js';
import { ElementPicker } from '../modules/element-inspector/element-picker.js';
import { DEVLOCATOR_ATTRIBUTE } from '../modules/element-inspector/element-details.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let picker = null;
    let toastElement = null;

    /**
     * Displays a brief selection confirmation toast on the webpage.
     */
    function showSelectionToast(details) {
      if (toastElement && toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }

      toastElement = document.createElement('div');
      toastElement.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
      toastElement.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #38bdf8;
        border-radius: 8px;
        padding: 10px 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 10px rgba(56, 189, 248, 0.2);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: devlocator-fadein 0.2s ease-out;
        user-select: none;
      `;

      const idString = details.id ? `#${details.id}` : '';
      const classString = details.classList.length ? `.${details.classList.slice(0, 2).join('.')}` : '';

      toastElement.innerHTML = `
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>
        <div>
          <div style="font-weight: 600; color: #38bdf8;">
            &lt;${details.tagName}${idString}${classString}&gt;
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
            Selector: <span style="color: #f1f5f9; font-family: monospace;">${details.selector}</span>
            &bull; Size: ${details.dimensions.width} &times; ${details.dimensions.height}px
          </div>
        </div>
      `;

      (document.body || document.documentElement).appendChild(toastElement);

      setTimeout(() => {
        if (toastElement && toastElement.parentNode) {
          toastElement.style.transition = 'opacity 0.3s ease-out';
          toastElement.style.opacity = '0';
          setTimeout(() => {
            if (toastElement && toastElement.parentNode) {
              toastElement.parentNode.removeChild(toastElement);
              toastElement = null;
            }
          }, 300);
        }
      }, 3500);
    }

    /**
     * Initializes the element picker.
     */
    function getPicker(settings) {
      if (!picker) {
        picker = new ElementPicker({
          highlightColor: settings?.highlightColor || '#38bdf8',
          showTooltip: settings?.showTooltip !== false,
        });
      } else if (settings) {
        picker.highlighter.updateConfig({
          highlightColor: settings.highlightColor,
          showTooltip: settings.showTooltip,
        });
      }
      return picker;
    }

    // Listen for messages from popup or background service worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!isValidMessage(message)) {
        return false;
      }

      switch (message.type) {
        case MESSAGE_TYPES.GET_INSPECTION_STATUS: {
          const isInspecting = picker ? picker.isActive : false;
          sendResponse({ isInspecting });
          return true;
        }

        case MESSAGE_TYPES.START_INSPECTION: {
          const currentPicker = getPicker(message.settings);

          currentPicker.start(
            // onSelect callback
            (element, details) => {
              console.log('[DevLocator] Element selected:', details);
              showSelectionToast(details);

              // Notify extension of selection
              chrome.runtime.sendMessage({
                type: MESSAGE_TYPES.ELEMENT_SELECTED,
                details,
              }).catch(() => {
                // Ignore errors if popup is closed
              });
            },
            // onCancel callback
            () => {
              console.log('[DevLocator] Inspection cancelled by user.');
              chrome.runtime.sendMessage({
                type: MESSAGE_TYPES.INSPECTION_STATUS_CHANGED,
                isInspecting: false,
              }).catch(() => {});
            }
          );

          sendResponse({ success: true, isInspecting: true });
          return true;
        }

        case MESSAGE_TYPES.STOP_INSPECTION: {
          if (picker) {
            picker.stop();
          }
          sendResponse({ success: true, isInspecting: false });
          return true;
        }

        default:
          return false;
      }
    });

    console.log('[DevLocator] Content script initialized with ElementPicker.');
  },
});
