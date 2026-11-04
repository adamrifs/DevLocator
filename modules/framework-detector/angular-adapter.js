/**
 * Angular framework adapter.
 * Detects Angular applications via ng-version, _ngcontent / _nghost view encapsulation,
 * ng-reflect attributes, and window.ng component inspection.
 */

/**
 * Checks if Angular is present on the element or webpage.
 * @param {Element} element
 * @returns {boolean}
 */
export function isAngularElement(element) {
  if (!element || !(element instanceof Element)) return false;

  const pageFw = document.documentElement.getAttribute('data-devlocator-page-framework');
  if (pageFw && pageFw.includes('Angular')) {
    return true;
  }

  // Check attributes on the element
  for (let i = 0; i < element.attributes.length; i++) {
    const name = element.attributes[i].name;
    if (name.startsWith('_ngcontent-') || name.startsWith('_nghost-') || name.startsWith('ng-reflect-') || name === 'ng-version') {
      return true;
    }
  }

  // Check ancestor elements
  let current = element.parentElement;
  let depth = 0;
  while (current && depth < 5) {
    if (current.hasAttribute('ng-version') || Array.from(current.attributes).some((a) => a.name.startsWith('_nghost-'))) {
      return true;
    }
    current = current.parentElement;
    depth++;
  }

  // Check root element on document
  if (document.querySelector('[ng-version], app-root, [_nghost-]')) {
    return true;
  }

  return false;
}

/**
 * Converts a kebab-case tag name to PascalCase component name.
 * e.g., 'app-user-profile' -> 'UserProfileComponent'
 * @param {string} tagName
 * @returns {string}
 */
function kebabToComponentName(tagName) {
  const clean = tagName.toLowerCase().replace(/^app-/, '');
  const pascal = clean
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return `${pascal}Component`;
}

/**
 * Angular Adapter main detection method.
 * @param {Element} element
 * @returns {object|null} Standardized framework result or null if not Angular
 */
export function detectAngular(element) {
  const isAngular = isAngularElement(element);
  if (!isAngular) return null;

  // Retrieve Angular version if available
  const versionEl = document.querySelector('[ng-version]');
  const ngVersion = versionEl ? versionEl.getAttribute('ng-version') : null;

  // Try window.ng dev utilities if available
  let componentName = null;
  if (typeof window !== 'undefined' && window.ng) {
    try {
      const comp = window.ng.getComponent?.(element) || window.ng.getOwningComponent?.(element);
      if (comp && comp.constructor && comp.constructor.name) {
        componentName = comp.constructor.name;
      }
    } catch (e) {
      // Ignore security/access error in content script context
    }
  }

  // Fallback: Traverse DOM ancestors to find Angular host elements (_nghost-* or hyphenated tags)
  const hierarchy = [];
  let current = element;

  while (current && current !== document.documentElement) {
    const isHost = Array.from(current.attributes).some((a) => a.name.startsWith('_nghost-'));
    const isCustomTag = current.tagName.includes('-') && !current.tagName.startsWith('DEVLOCATOR');

    if (isHost || isCustomTag) {
      const name = kebabToComponentName(current.tagName);
      if (!componentName) {
        componentName = name;
      }
      if (!hierarchy.includes(name)) {
        hierarchy.unshift(name);
      }
    }

    current = current.parentElement;
  }

  let confidence = 'partial';
  if (!componentName) {
    confidence = 'low';
  }

  return {
    framework: 'Angular',
    componentName: componentName || null,
    componentHierarchy: hierarchy.length > 0 ? hierarchy : null,
    sourceFile: null,
    lineNumber: null,
    columnNumber: null,
    confidence,
    details: {
      version: ngVersion ? `Angular ${ngVersion}` : 'Angular',
      isHost: Array.from(element.attributes).some((a) => a.name.startsWith('_nghost-')),
    },
  };
}

