import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgRs0QdKryO/E+xBsUIigcR/6IGyEJ2TtG7ow57XCFqQvjTq1WnShpJDx68LXEraps3R82ZYROIV33ieLDJw35WWU0XNGi2M178nm6HKwK5c/JE1foEb8Q6s79vSdoHRKBH51l1dui6+kkbvo1P7atYfobagqSII4eYq88k/Wh2vzW4AfbfQDw4p6fF+EeTH+Anf27BYDuPKtf14UQorqvLfRKKzc9GNftO1Js8TTK81xjoxJQEvYhHUrj4My0TjAitlTu9gF6Xt7v4asO3IJsYPIXcFIfUT1ruwh6SQ/6xkEprKyy+GT0pOmZnEXXfl89E2vREenYit7Q+smOUGVwQIDAQAB',
    name: 'DevLocator — Component & Source Inspector',
    description: 'Inspect elements, identify React, Vue, Angular components, and open source directly in your IDE.',
    version: '0.1.0',
    permissions: [
      'storage',
      'activeTab',
      'scripting',
      'nativeMessaging',
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
