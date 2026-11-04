import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'DevLocator — Component & Source Inspector',
    description: 'Inspect elements, identify React, Vue, Angular components, and open source directly in your IDE.',
    version: '0.1.0',
    permissions: [
      'storage',
      'activeTab',
      'scripting',
    ],
    action: {
      default_title: 'DevLocator',
      default_icon: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
      },
    },
    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    commands: {
      'toggle-inspect': {
        suggested_key: {
          default: 'Alt+Shift+X',
          mac: 'Alt+Shift+X',
        },
        description: 'Toggle DevLocator Inspection Mode',
      },
    },
    web_accessible_resources: [
      {
        resources: ['content-scripts/bridge.js'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
