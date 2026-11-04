import { detectFramework } from './detect-framework.js';

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
      const { requestId, selector } = event.data;
      let targetElement = null;

      try {
        // Find element by selector or marker attribute
        targetElement =
          document.querySelector('[data-devlocator-inspect-target="true"]') ||
          (selector ? document.querySelector(selector) : null) ||
          document.body;

        const frameworkInfo = detectFramework(targetElement);

        // Send reply back to isolated world
        window.postMessage(
          {
            source: 'DEVLOCATOR_MAIN',
            action: 'INSPECT_RESULT',
            requestId,
            frameworkInfo,
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
