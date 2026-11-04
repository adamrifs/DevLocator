/**
 * DevLocator Automated Unit & Integration Test Suite.
 * Validates framework adapters, component hierarchy extraction, and source locator strategies.
 */
import assert from 'node:assert/strict';

// Set up mock DOM environment globals for Node.js
class MockElement {}
globalThis.Element = MockElement;
globalThis.document = {
  documentElement: {
    getAttribute: () => null,
  },
  querySelector: () => null,
  getElementById: () => null,
};

import { detectReact } from '../modules/framework-detector/react-adapter.js';
import { detectVue } from '../modules/framework-detector/vue-adapter.js';
import { detectAngular } from '../modules/framework-detector/angular-adapter.js';
import { detectVanilla } from '../modules/framework-detector/vanilla-adapter.js';
import { detectFramework } from '../modules/framework-detector/detect-framework.js';
import { findSourceLocation } from '../modules/source-locator/find-source.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n=== DevLocator Test Suite ===\n');

// Mock DOM Element helper
function createMockElement(options = {}) {
  const el = Object.create(MockElement.prototype);
  const attributes = options.attributes || {};
  const classList = options.classList || [];

  el.tagName = options.tagName || 'DIV';
  el.id = options.id || '';
  el.className = classList.join(' ');
  el.classList = {
    contains: (c) => classList.includes(c),
    length: classList.length,
    [Symbol.iterator]: function* () { yield* classList; },
  };
  el.parentElement = options.parentElement || null;
  el.attributes = Object.entries(attributes).map(([name, value]) => ({ name, value }));
  el.getAttribute = (attr) => attributes[attr] ?? null;
  el.hasAttribute = (attr) => attr in attributes;
  el.closest = (selector) => {
    if (options.closestMatch && options.closestMatch(selector)) {
      return options.closestResult || null;
    }
    return null;
  };

  if (options.expando) {
    Object.assign(el, options.expando);
  }

  return el;
}

// 1. Source Locator Tests
console.log('1. Source Locator Module');

test('Detects source location via data-devlocator attributes (Vite Plugin)', () => {
  const el = createMockElement({
    attributes: {
      'data-devlocator-file': 'src/components/Header.tsx',
      'data-devlocator-line': '42',
      'data-devlocator-column': '10',
      'data-devlocator-component': 'Header',
    },
  });

  const res = findSourceLocation(el);
  assert.equal(res.file, 'src/components/Header.tsx');
  assert.equal(res.line, 42);
  assert.equal(res.column, 10);
  assert.equal(res.componentName, 'Header');
  assert.equal(res.strategy, 'vite-plugin');
  assert.equal(res.verified, true);
});

test('Walks up ancestors to inherit source location when child has no attributes', () => {
  const parent = createMockElement({
    attributes: {
      'data-devlocator-file': 'src/components/Card.jsx',
      'data-devlocator-line': '15',
      'data-devlocator-column': '3',
      'data-devlocator-component': 'Card',
    },
  });

  const child = createMockElement({
    tagName: 'SPAN',
    parentElement: parent,
  });

  const res = findSourceLocation(child);
  assert.equal(res.file, 'src/components/Card.jsx');
  assert.equal(res.line, 15);
  assert.equal(res.column, 3);
  assert.equal(res.componentName, 'Card');
  assert.equal(res.verified, true);
});

test('Returns null when no source attributes exist', () => {
  const el = createMockElement();
  const res = findSourceLocation(el);
  assert.equal(res.file, null);
  assert.equal(res.line, null);
  assert.equal(res.verified, false);
});

// 2. React Adapter Tests
console.log('\n2. React Adapter Module');

test('Identifies React component via Fiber expando (__reactFiber$...)', () => {
  const mockFiber = {
    type: function DashboardHeader() {},
    _debugSource: {
      fileName: '/project/src/DashboardHeader.jsx',
      lineNumber: 19,
      columnNumber: 4,
    },
    return: {
      type: function App() {},
      return: null,
    },
  };

  const el = createMockElement({
    expando: {
      __reactFiber$abc123: mockFiber,
    },
  });

  const res = detectReact(el);
  assert.notEqual(res, null);
  assert.equal(res.framework.includes('React'), true);
  assert.equal(res.componentName, 'DashboardHeader');
  assert.equal(res.sourceFile, '/project/src/DashboardHeader.jsx');
  assert.equal(res.lineNumber, 19);
  assert.equal(res.columnNumber, 4);
  assert.deepEqual(res.componentHierarchy, ['App', 'DashboardHeader']);
});

test('Returns null when not a React element', () => {
  const el = createMockElement();
  const res = detectReact(el);
  assert.equal(res, null);
});

// 3. Vue Adapter Tests
console.log('\n3. Vue Adapter Module');

test('Identifies Vue 3 component via __vueParentComponent', () => {
  const mockVueComponent = {
    type: {
      name: 'UserAvatar',
      __file: 'src/components/UserAvatar.vue',
    },
    parent: {
      type: { name: 'UserProfile' },
      parent: null,
    },
  };

  const el = createMockElement({
    expando: {
      __vueParentComponent: mockVueComponent,
    },
  });

  const res = detectVue(el);
  assert.notEqual(res, null);
  assert.equal(res.framework, 'Vue 3');
  assert.equal(res.componentName, 'UserAvatar');
  assert.equal(res.sourceFile, 'src/components/UserAvatar.vue');
  assert.deepEqual(res.componentHierarchy, ['UserProfile', 'UserAvatar']);
});

test('Detects Vue via data-v-* scoped CSS attribute heuristic', () => {
  const el = createMockElement({
    attributes: {
      'data-v-7ba5bd90': '',
    },
  });

  const res = detectVue(el);
  assert.notEqual(res, null);
  assert.equal(res.framework, 'Vue');
  assert.equal(res.confidence, 'partial');
});

// 4. Angular Adapter Tests
console.log('\n4. Angular Adapter Module');

test('Identifies Angular component via custom element tag and _nghost attribute', () => {
  const el = createMockElement({
    tagName: 'APP-NAVBAR',
    attributes: {
      '_nghost-app-c1': '',
      'ng-version': '17.2.0',
    },
  });

  const res = detectAngular(el);
  assert.notEqual(res, null);
  assert.equal(res.framework, 'Angular');
  assert.equal(res.componentName, 'NavbarComponent');
});

// 5. Vanilla Adapter Tests
console.log('\n5. Vanilla HTML Adapter Module');

test('Accurately classifies standard DOM elements as Vanilla HTML', () => {
  const el = createMockElement({
    tagName: 'BUTTON',
    classList: ['btn-primary', 'shadow'],
  });

  const res = detectVanilla(el);
  assert.equal(res.framework, 'Vanilla HTML');
  assert.equal(res.confidence, 'high');
  assert.equal(res.details.tagName, 'button');
});

// 6. Framework Dispatcher & Fallback
console.log('\n6. Framework Dispatcher Module');

test('Dispatches React when element has Fiber metadata', () => {
  const mockFiber = {
    type: function ProfileCard() {},
    return: null,
  };
  const el = createMockElement({
    expando: {
      __reactFiber$test: mockFiber,
    },
  });

  const res = detectFramework(el);
  assert.equal(res.framework.includes('React'), true);
  assert.equal(res.componentName, 'ProfileCard');
});

test('Falls back to Vanilla HTML when no framework metadata exists', () => {
  const el = createMockElement({
    tagName: 'SECTION',
  });

  const res = detectFramework(el);
  assert.equal(res.framework, 'Vanilla HTML');
  assert.equal(res.componentName, null);
});

console.log(`\n============================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`============================\n`);

if (failed > 0) {
  process.exit(1);
}
