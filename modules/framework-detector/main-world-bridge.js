import { detectFramework } from './detect-framework.js';
import { findSourceLocation } from '../source-locator/find-source.js';

function findMarkedTarget(root, selector) {
  const target = root.querySelector(selector);
  if (target) return target;

  for (const element of root.querySelectorAll('*')) {
    if (!element.shadowRoot) continue;
    const nestedTarget = findMarkedTarget(element.shadowRoot, selector);
    if (nestedTarget) return nestedTarget;
  }

  return null;
}

/**
 * Initializes the main-world bridge.
 * Executes in the webpage's JavaScript context (MAIN world).
 */
export function initMainWorldBridge() {
  if (window.__DEVLOCATOR_BRIDGE_INITIALIZED__) return;
  window.__DEVLOCATOR_BRIDGE_INITIALIZED__ = true;

  console.log('[DevLocator] Main-world bridge initialized in webpage context.');

  /**
   * Detects overall framework present on the webpage at startup.
   */
  function detectPageFramework() {
    try {
      // 1. Next.js
      if (window.__NEXT_DATA__ || document.getElementById('__next')) {
        return 'Next.js (React)';
      }

      // 2. React (DevTools hook or React global or React root)
      if (
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.size > 0 ||
        window.React ||
        document.querySelector('[data-reactroot], #root, #app')
      ) {
        // Double check if root has fiber
        const rootEl = document.querySelector('#root, #__next, #app, [data-reactroot]');
        if (rootEl) {
          const keys = Object.getOwnPropertyNames(rootEl);
          if (keys.some((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$') || k === '_reactRootContainer')) {
            return 'React';
          }
        }
      }

      // 3. Vue
      if (window.__VUE__ || document.querySelector('[data-v-app], [data-v-]')) {
        return 'Vue';
      }

      // 4. Angular
      if (window.ng || document.querySelector('[ng-version], app-root, [_nghost-]')) {
        return 'Angular';
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  // Set page-level framework marker on DOM so isolated world knows immediately
  const pageFw = detectPageFramework();
  if (pageFw) {
    document.documentElement.setAttribute('data-devlocator-page-framework', pageFw);
  }

  // Also monitor DOM if React mounts after initial start
  if (!pageFw) {
    const observer = new MutationObserver(() => {
      const fw = detectPageFramework();
      if (fw) {
        document.documentElement.setAttribute('data-devlocator-page-framework', fw);
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 4000);
  }

  // Listen for inspection requests from isolated content script via postMessage
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.source !== 'DEVLOCATOR_ISOLATED') return;

    if (event.data.action === 'INSPECT_ELEMENT') {
      const { requestId, inShadowRoot } = event.data;
      if (typeof requestId !== 'string') return;

      try {
        const selector = `[data-devlocator-inspect-target="${CSS.escape(requestId)}"]`;
        const targetElement = inShadowRoot
          ? findMarkedTarget(document, selector)
          : document.querySelector(selector);
        const frameworkInfo = targetElement ? detectFramework(targetElement) : null;
        const sourceLocation = targetElement ? findSourceLocation(targetElement) : null;

        // Send reply back to isolated world
        window.postMessage(
          {
            source: 'DEVLOCATOR_MAIN',
            action: 'INSPECT_RESULT',
            requestId,
            frameworkInfo,
            sourceLocation,
          },
          '*'
        );
      } catch (err) {
        console.warn('[DevLocator Main Bridge] Inspection error:', err);
        window.postMessage(
          {
            source: 'DEVLOCATOR_MAIN',
            action: 'INSPECT_RESULT',
            requestId,
            frameworkInfo: null,
          },
          '*'
        );
      }
    }
  });

  document.documentElement.setAttribute('data-devlocator-bridge-ready', 'true');
}

