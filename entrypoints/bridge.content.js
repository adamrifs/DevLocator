import { defineContentScript } from 'wxt/sandbox';
import { initMainWorldBridge } from '../modules/framework-detector/main-world-bridge.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    initMainWorldBridge();
  },
});
