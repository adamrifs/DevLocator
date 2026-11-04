import React from 'react';
import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import { MESSAGE_TYPES, isValidMessage } from '../utils/messages.js';
import { ElementPicker } from '../modules/element-inspector/element-picker.js';
import {
  DEVLOCATOR_PANEL_HOST_ID,
  DEVLOCATOR_ATTRIBUTE,
  extractElementDetails,
  isDevLocatorElement,
} from '../modules/element-inspector/element-details.js';
import { getSettings, onSettingsChange } from '../utils/storage.js';
import InspectorPanel from '../components/inspector/InspectorPanel.jsx';
import ErrorBoundary from '../components/ui/ErrorBoundary.jsx';
import contentCss from '../assets/content.css?inline';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let picker = null;
    let currentSettings = null;
    let lastSelectedDetails = null;
    let currentSelectedElement = null;
    let isShiftHeld = false;
    const lastMousePos = { x: 0, y: 0 };

    /**
     * Checks if an element is a form input, textarea, or contenteditable.
     */
    function isInputOrEditable(element) {
      if (!element || !(element instanceof Element)) return false;
      const tag = element.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return true;
      }
      if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
        return true;
      }
      return Boolean(element.closest && element.closest('input, textarea, select, [contenteditable="true"]'));
    }

    // Passively track mouse coordinates on the page
    window.addEventListener(
      'mousemove',
      (e) => {
        lastMousePos.x = e.clientX;
        lastMousePos.y = e.clientY;
      },
      { capture: true, passive: true }
    );

    // Global keydown: hold Shift to activate inspection mode
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Shift') {
          // Do not re-trigger on repeated OS keydown events
          if (e.repeat) return;

          // Do not trigger if browser shortcut modifiers are held (e.g. Ctrl+Shift, Alt+Shift, Cmd+Shift)
          if (e.ctrlKey || e.metaKey || e.altKey) return;

          // Do not trigger if typing in an input or editable element
          const active = document.activeElement;
          if (active && isInputOrEditable(active)) return;
          if (e.target && isInputOrEditable(e.target)) return;

          // Check if user disabled hold_shift in settings
          const activationMode = currentSettings?.activationMode || 'hold_shift';
          if (activationMode === 'manual') return;

          // Do not inspect if mouse is over DevLocator's own panel
          if (lastMousePos.x > 0 && lastMousePos.y > 0) {
            const elUnderCursor = document.elementFromPoint(lastMousePos.x, lastMousePos.y);
            if (elUnderCursor && isDevLocatorElement(elUnderCursor)) {
              return;
            }
          }

          if (!picker || !picker.isActive) {
            isShiftHeld = true;
            startInspection(currentSettings);

            // Immediately highlight element under current mouse position
            if (picker && lastMousePos.x > 0 && lastMousePos.y > 0) {
              const target = picker.getElementAtPoint(lastMousePos.x, lastMousePos.y);
              if (
                target &&
                target !== document.documentElement &&
                target !== document.body &&
                !isDevLocatorElement(target)
              ) {
                picker.currentHovered = target;
                picker.highlighter.highlight(target);
              }
            }
          }
        }
      },
      { capture: true }
    );

    // Global keyup: release Shift to stop inspection (if no element was locked/selected)
    window.addEventListener(
      'keyup',
      (e) => {
        if (e.key === 'Shift') {
          if (isShiftHeld) {
            isShiftHeld = false;
            if (picker && picker.isActive) {
              picker.stop();
              chrome.runtime.sendMessage({
                type: MESSAGE_TYPES.INSPECTION_STATUS_CHANGED,
                isInspecting: false,
              }).catch(() => {});
            }
          }
        }
      },
      { capture: true }
    );

    // Cancel Shift inspection if window loses focus
    window.addEventListener('blur', () => {
      if (isShiftHeld) {
        isShiftHeld = false;
        if (picker && picker.isActive) {
          picker.stop();
          chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.INSPECTION_STATUS_CHANGED,
            isInspecting: false,
          }).catch(() => {});
        }
      }
    });

    ensureMainWorldBridge();

    // Load initial settings and listen for live changes across all tabs
    getSettings().then((loaded) => {
      currentSettings = loaded;
    });

    onSettingsChange((newSettings) => {
      currentSettings = newSettings;
      if (picker && picker.highlighter) {
        picker.highlighter.updateConfig({
          highlightColor: newSettings.highlightColor,
          showTooltip: newSettings.showTooltip,
          fillOpacity: newSettings.fillOpacity,
        });
      }
      // If inspector panel is currently open, re-render it immediately with updated theme & settings
      if (lastSelectedDetails && document.getElementById(DEVLOCATOR_PANEL_HOST_ID)) {
        renderInspectorPanel(lastSelectedDetails, currentSettings);
      }
    });

    /**
     * Ensures main-world bridge is injected and running.
     */
    function ensureMainWorldBridge() {
      if (document.documentElement.getAttribute('data-devlocator-bridge-ready')) {
        return;
      }
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content-scripts/bridge.js');
        (document.head || document.documentElement).appendChild(script);
      } catch (e) {
        // Fallback
      }
    }

    /**
     * Unmounts and removes the floating inspector panel from the page.
     */
    function removeInspectorPanel() {
      const host = document.getElementById(DEVLOCATOR_PANEL_HOST_ID);
      if (host) {
        if (host._devlocatorRoot) {
          try {
            host._devlocatorRoot.unmount();
          } catch (e) {
            // Ignore unmount error if already cleaned
          }
        }
        if (host.parentNode) {
          host.parentNode.removeChild(host);
        }
      }
    }

    /**
     * Mounts the React InspectorPanel inside an isolated Shadow DOM container.
     */
    function renderInspectorPanel(details, settings) {
      removeInspectorPanel();

      const host = document.createElement('div');
      host.id = DEVLOCATOR_PANEL_HOST_ID;
      host.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
      host.style.cssText = `
        position: fixed;
        z-index: 2147483647;
        pointer-events: auto;
      `;

      // Attach Shadow Root for complete CSS and DOM isolation from the page
      const shadow = host.attachShadow({ mode: 'open' });

      // Inject Tailwind compiled styles into Shadow Root
      const styleEl = document.createElement('style');
      styleEl.textContent = contentCss;
      shadow.appendChild(styleEl);

      // Mount point for React
      const mountPoint = document.createElement('div');
      mountPoint.id = 'devlocator-panel-root';
      shadow.appendChild(mountPoint);

      (document.body || document.documentElement).appendChild(host);

      const root = ReactDOM.createRoot(mountPoint);
      host._devlocatorRoot = root;

      const handleClose = () => {
        removeInspectorPanel();
      };

      const handleReinspect = () => {
        removeInspectorPanel();
        startInspection(settings || currentSettings);
      };

      const handleSelectAncestor = async (item) => {
        try {
          let targetEl = null;

          // 1. If currently selected element is tracked, navigate directly
          if (currentSelectedElement) {
            if (item.selector && currentSelectedElement.matches && currentSelectedElement.matches(item.selector)) {
              targetEl = currentSelectedElement;
            } else if (item.selector && currentSelectedElement.closest) {
              targetEl = currentSelectedElement.closest(item.selector);
            }
          }

          // 2. Query within document if not resolved
          if (!targetEl && item.selector) {
            targetEl = document.querySelector(item.selector);
          }

          if (targetEl) {
            currentSelectedElement = targetEl;
            const newDetails = await extractElementDetails(targetEl);
            lastSelectedDetails = newDetails;
            renderInspectorPanel(newDetails, settings || currentSettings);
          }
        } catch (e) {
          console.warn('[DevLocator] Failed to select ancestor/child:', e);
        }
      };

      const effectiveSettings = settings || currentSettings;

      root.render(
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement(InspectorPanel, {
            details,
            ide: effectiveSettings?.ide || 'antigravity',
            theme: effectiveSettings?.theme || 'dark',
            onClose: handleClose,
            onReinspect: handleReinspect,
            onSelectAncestor: handleSelectAncestor,
            isEmbedded: false,
          })
        )
      );
    }

    /**
     * Starts element inspection mode.
     */
    function startInspection(settings) {
      const effectiveSettings = settings || currentSettings;

      if (!picker) {
        picker = new ElementPicker({
          highlightColor: effectiveSettings?.highlightColor || '#38bdf8',
          showTooltip: effectiveSettings?.showTooltip !== false,
          fillOpacity: typeof effectiveSettings?.fillOpacity === 'number' ? effectiveSettings.fillOpacity : 0.15,
        });
      } else {
        picker.highlighter.updateConfig({
          highlightColor: effectiveSettings?.highlightColor,
          showTooltip: effectiveSettings?.showTooltip,
          fillOpacity: effectiveSettings?.fillOpacity,
        });
      }

      // Close open panel when entering picker mode
      removeInspectorPanel();

      picker.start(
        // onSelect
        (element, details) => {
          isShiftHeld = false;
          currentSelectedElement = element;
          lastSelectedDetails = details;
          console.log('[DevLocator] Element selected:', details);

          // Render inspector panel on webpage
          renderInspectorPanel(details, effectiveSettings);

          // Notify extension
          chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.ELEMENT_SELECTED,
            details,
          }).catch(() => {});
        },
        // onCancel
        () => {
          isShiftHeld = false;
          console.log('[DevLocator] Inspection cancelled.');
          chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.INSPECTION_STATUS_CHANGED,
            isInspecting: false,
          }).catch(() => {});
        }
      );
    }

    // Message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!isValidMessage(message)) {
        return false;
      }

      switch (message.type) {
        case MESSAGE_TYPES.GET_INSPECTION_STATUS: {
          const isInspecting = picker ? picker.isActive : false;
          sendResponse({ isInspecting, hasSelectedElement: Boolean(lastSelectedDetails) });
          return true;
        }

        case MESSAGE_TYPES.GET_SELECTED_ELEMENT: {
          sendResponse({ details: lastSelectedDetails });
          return true;
        }

        case MESSAGE_TYPES.START_INSPECTION: {
          currentSettings = message.settings || currentSettings;
          startInspection(currentSettings);
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

    console.log('[DevLocator] Content script ready with InspectorPanel & Shadow DOM.');
  },
});
