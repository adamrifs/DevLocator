import { defineContentScript } from 'wxt/sandbox';
import { detectFramework } from '../modules/framework-detector/detect-framework.js';

/**
 * Main-world bridge script.
 * Runs directly in the webpage's JavaScript context (MAIN world).
 * Has unrestricted access to webpage JS objects:
 * - React Fiber: element.__reactFiber$..., fiber.return, fiber._debugSource
 * - Vue: element.__vueParentComponent, element.__vue_app__, vnode
 * - Angular: window.ng, ng.getComponent(element)
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    console.log('[DevLocator] Main-world bridge active.');

    // Listen for inspect requests from the isolated content script
    window.addEventListener('__DEVLOCATOR_INSPECT_REQUEST__', (event) => {
      try {
        const target = event.target instanceof Element ? event.target : document.body;
        const frameworkInfo = detectFramework(target);

        // Send results back to the isolated content script
        window.dispatchEvent(
          new CustomEvent('__DEVLOCATOR_INSPECT_RESPONSE__', {
            detail: JSON.stringify(frameworkInfo),
          })
        );
      } catch (err) {
        console.warn('[DevLocator Main Bridge] Error inspecting element:', err);
      }
    });

    // Mark that main-world bridge is ready
    document.documentElement.setAttribute('data-devlocator-bridge', 'ready');
  },
});
