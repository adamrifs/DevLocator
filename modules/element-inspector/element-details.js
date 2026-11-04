/**
 * Utility functions for extracting metadata from DOM elements and generating selectors.
 */

export const DEVLOCATOR_ROOT_ID = '__devlocator-inspector-root__';
export const DEVLOCATOR_ATTRIBUTE = 'data-devlocator-ui';

/**
 * Checks if a given node or any of its ancestors belongs to DevLocator's own UI.
 * @param {Node|null} node
 * @returns {boolean}
 */
export function isDevLocatorElement(node) {
  if (!node || !(node instanceof Element)) {
    return false;
  }
  return Boolean(
    node.closest(`#${DEVLOCATOR_ROOT_ID}`) ||
    node.closest(`[${DEVLOCATOR_ATTRIBUTE}]`) ||
    node.id === DEVLOCATOR_ROOT_ID ||
    node.hasAttribute(DEVLOCATOR_ATTRIBUTE)
  );
}

/**
 * Generates a clean, readable CSS selector for an element.
 * @param {Element} element
 * @returns {string}
 */
export function getElementSelector(element) {
  if (!element || !(element instanceof Element)) {
    return '';
  }

  if (element.id) {
    return `#${element.id}`;
  }

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'body' || tagName === 'html') {
    return tagName;
  }

  const classList = Array.from(element.classList)
    .filter((c) => !c.startsWith('__devlocator') && c.length < 30)
    .slice(0, 2);

  if (classList.length > 0) {
    return `${tagName}.${classList.join('.')}`;
  }

  // Fallback to parent nth-of-type
  const parent = element.parentElement;
  if (!parent) {
    return tagName;
  }

  const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
  if (siblings.length > 1) {
    const index = siblings.indexOf(element) + 1;
    return `${tagName}:nth-of-type(${index})`;
  }

  return tagName;
}

/**
 * Generates an XPath string for an element.
 * @param {Element} element
 * @returns {string}
 */
export function getElementXPath(element) {
  if (!element || !(element instanceof Element)) {
    return '';
  }

  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const paths = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = current.previousSibling;

    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.nodeName.toLowerCase();
    const pathIndex = index > 0 ? `[${index + 1}]` : '';
    paths.unshift(`${tagName}${pathIndex}`);

    current = current.parentNode;
  }

  return paths.length ? `/${paths.join('/')}` : '';
}

/**
 * Extracts comprehensive details from a DOM element.
 * @param {Element} element
 * @returns {object|null}
 */
export function extractElementDetails(element) {
  if (!element || !(element instanceof Element)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const tagName = element.tagName.toLowerCase();
  const id = element.id || '';
  const classNames = Array.from(element.classList);

  // Extract all attributes
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (!attr.name.startsWith('data-devlocator')) {
      attributes[attr.name] = attr.value;
    }
  }

  return {
    tagName,
    id,
    classList: classNames,
    className: element.className && typeof element.className === 'string' ? element.className : '',
    selector: getElementSelector(element),
    xpath: getElementXPath(element),
    dimensions: {
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      top: Math.round(rect.top * 10) / 10,
      left: Math.round(rect.left * 10) / 10,
      bottom: Math.round(rect.bottom * 10) / 10,
      right: Math.round(rect.right * 10) / 10,
    },
    attributes,
    textContent: (element.textContent || '').trim().slice(0, 100),
  };
}
