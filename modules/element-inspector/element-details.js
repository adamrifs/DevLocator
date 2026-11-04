/**
 * Utility functions for extracting metadata from DOM elements, computed styles,
 * DOM hierarchy, and generating selectors.
 */
import { detectFramework } from '../framework-detector/detect-framework.js';
import { findSourceLocation } from '../source-locator/find-source.js';

export const DEVLOCATOR_ROOT_ID = '__devlocator-inspector-root__';
export const DEVLOCATOR_PANEL_HOST_ID = '__devlocator-panel-host__';
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
    node.closest(`#${DEVLOCATOR_PANEL_HOST_ID}`) ||
    node.closest(`[${DEVLOCATOR_ATTRIBUTE}]`) ||
    node.id === DEVLOCATOR_ROOT_ID ||
    node.id === DEVLOCATOR_PANEL_HOST_ID ||
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
 * Builds the full DOM ancestor hierarchy from document root down to target element.
 * @param {Element} element
 * @returns {Array<{ tagName: string, id: string, className: string, selector: string }>}
 */
export function getDomHierarchy(element) {
  const hierarchy = [];
  let current = element;

  while (current && current instanceof Element && current !== document.documentElement) {
    if (!isDevLocatorElement(current)) {
      hierarchy.unshift({
        tagName: current.tagName.toLowerCase(),
        id: current.id || '',
        className: current.className && typeof current.className === 'string' ? current.className : '',
        selector: getElementSelector(current),
      });
    }
    current = current.parentElement;
  }

  // Include html tag as root
  if (document.documentElement && !isDevLocatorElement(document.documentElement)) {
    hierarchy.unshift({
      tagName: 'html',
      id: document.documentElement.id || '',
      className: document.documentElement.className || '',
      selector: 'html',
    });
  }

  return hierarchy;
}

/**
 * Extracts key computed styles and box model values.
 * @param {Element} element
 * @returns {object}
 */
export function getElementComputedStyles(element) {
  if (!element || !(element instanceof Element)) {
    return { categorized: {}, boxModel: {} };
  }

  const computed = window.getComputedStyle(element);

  const boxModel = {
    marginTop: computed.marginTop,
    marginRight: computed.marginRight,
    marginBottom: computed.marginBottom,
    marginLeft: computed.marginLeft,
    paddingTop: computed.paddingTop,
    paddingRight: computed.paddingRight,
    paddingBottom: computed.paddingBottom,
    paddingLeft: computed.paddingLeft,
    borderTopWidth: computed.borderTopWidth,
    borderRightWidth: computed.borderRightWidth,
    borderBottomWidth: computed.borderBottomWidth,
    borderLeftWidth: computed.borderLeftWidth,
    boxSizing: computed.boxSizing,
  };

  const categorized = {
    layout: {
      display: computed.display,
      position: computed.position,
      flexDirection: computed.flexDirection,
      justifyContent: computed.justifyContent,
      alignItems: computed.alignItems,
      gap: computed.gap,
      zIndex: computed.zIndex,
      overflow: computed.overflow,
    },
    dimension: {
      width: computed.width,
      height: computed.height,
      minWidth: computed.minWidth,
      maxWidth: computed.maxWidth,
      minHeight: computed.minHeight,
      maxHeight: computed.maxHeight,
    },
    typography: {
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      lineHeight: computed.lineHeight,
      color: computed.color,
      textAlign: computed.textAlign,
    },
    appearance: {
      backgroundColor: computed.backgroundColor,
      border: `${computed.borderTopWidth} ${computed.borderTopStyle} ${computed.borderTopColor}`,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      opacity: computed.opacity,
      cursor: computed.cursor,
    },
  };

  return { categorized, boxModel };
}

/**
 * Formats an element's outerHTML for clean display.
 * @param {Element} element
 * @returns {string}
 */
export function getFormattedHTML(element) {
  if (!element || !(element instanceof Element)) {
    return '';
  }

  const clone = element.cloneNode(true);
  // Remove DevLocator internal attributes from clone
  clone.removeAttribute(DEVLOCATOR_ATTRIBUTE);
  const elements = clone.querySelectorAll(`[${DEVLOCATOR_ATTRIBUTE}]`);
  elements.forEach((el) => el.removeAttribute(DEVLOCATOR_ATTRIBUTE));

  return clone.outerHTML || '';
}

/**
 * Queries framework metadata from the main-world bridge via postMessage.
 * @param {Element} element
 * @returns {Promise<object|null>}
 */
export function queryMainWorldFramework(element) {
  return new Promise((resolve) => {
    if (!element || !(element instanceof Element)) {
      resolve(null);
      return;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let resolved = false;

    // Mark the element temporarily so the main-world bridge can locate it accurately
    element.setAttribute('data-devlocator-inspect-target', 'true');

    const handleMessage = (event) => {
      if (
        event.data &&
        event.data.source === 'DEVLOCATOR_MAIN' &&
        event.data.action === 'INSPECT_RESULT' &&
        event.data.requestId === requestId
      ) {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', handleMessage);
          element.removeAttribute('data-devlocator-inspect-target');
          resolve(event.data.frameworkInfo || null);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Send postMessage to main world
    window.postMessage(
      {
        source: 'DEVLOCATOR_ISOLATED',
        action: 'INSPECT_ELEMENT',
        requestId,
        selector: getElementSelector(element),
      },
      '*'
    );

    // Quick fallback timeout (75ms) if main world does not respond
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        element.removeAttribute('data-devlocator-inspect-target');
        resolve(null);
      }
    }, 75);
  });
}

/**
 * Extracts comprehensive details from a DOM element.
 * @param {Element} element
 * @returns {Promise<object|null>}
 */
export async function extractElementDetails(element) {
  if (!element || !(element instanceof Element)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const tagName = element.tagName.toLowerCase();
  const id = element.id || '';
  const classNames = Array.from(element.classList);

  // Extract all attributes except DevLocator internal ones
  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (!attr.name.startsWith('data-devlocator')) {
      attributes[attr.name] = attr.value;
    }
  }

  const { categorized, boxModel } = getElementComputedStyles(element);
  const domHierarchy = getDomHierarchy(element);
  const outerHTML = getFormattedHTML(element);

  // Query main-world bridge for Fiber/Vue/Angular JS objects, with local fallback
  const bridgeInfo = await queryMainWorldFramework(element);
  const frameworkInfo = (bridgeInfo && bridgeInfo.framework !== 'Vanilla HTML')
    ? bridgeInfo
    : detectFramework(element);

  // Source code location detection (Vite metadata, React _debugSource, Vue __file)
  const sourceLoc = findSourceLocation(element);
  const finalSourceFile = sourceLoc.file || frameworkInfo.sourceFile || null;
  const finalLine = sourceLoc.line ?? frameworkInfo.lineNumber ?? null;
  const finalColumn = sourceLoc.column ?? frameworkInfo.columnNumber ?? null;
  const finalStrategy = sourceLoc.file ? sourceLoc.strategy : (frameworkInfo.sourceFile ? 'react-debug-source' : 'none');
  const isSourceVerified = Boolean(finalSourceFile && (sourceLoc.verified || frameworkInfo.sourceFile));

  // Parent & Child elements for hierarchy navigation
  const parent = element.parentElement && !isDevLocatorElement(element.parentElement) && element.parentElement !== document.documentElement
    ? {
        tagName: element.parentElement.tagName.toLowerCase(),
        id: element.parentElement.id || '',
        className: typeof element.parentElement.className === 'string' ? element.parentElement.className : '',
        selector: getElementSelector(element.parentElement),
      }
    : null;

  const children = Array.from(element.children)
    .filter((child) => !isDevLocatorElement(child))
    .slice(0, 12)
    .map((child) => ({
      tagName: child.tagName.toLowerCase(),
      id: child.id || '',
      className: typeof child.className === 'string' ? child.className : '',
      selector: getElementSelector(child),
    }));

  return {
    tagName,
    id,
    classList: classNames,
    className: element.className && typeof element.className === 'string' ? element.className : '',
    selector: getElementSelector(element),
    xpath: getElementXPath(element),
    parent,
    children,
    dimensions: {
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      top: Math.round(rect.top * 10) / 10,
      left: Math.round(rect.left * 10) / 10,
      bottom: Math.round(rect.bottom * 10) / 10,
      right: Math.round(rect.right * 10) / 10,
    },
    boxModel,
    styles: categorized,
    domHierarchy,
    outerHTML,
    attributes,
    textContent: (element.textContent || '').trim().slice(0, 150),
    childElementCount: element.childElementCount || 0,
    framework: frameworkInfo.framework,
    componentName: frameworkInfo.componentName || sourceLoc.componentName,
    componentHierarchy: frameworkInfo.componentHierarchy,
    sourceFile: finalSourceFile,
    lineNumber: finalLine,
    columnNumber: finalColumn,
    sourceStrategy: finalStrategy,
    sourceVerified: isSourceVerified,
    confidence: frameworkInfo.confidence,
    frameworkDetails: frameworkInfo.details,
  };
}
