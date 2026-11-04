/**
 * Vanilla JavaScript / HTML adapter.
 * Fallback adapter for standard DOM elements when no modern framework is detected.
 */

/**
 * Returns standardized metadata for plain HTML/DOM elements.
 * @param {Element} element
 * @returns {object}
 */
export function detectVanilla(element) {
  if (!element || !(element instanceof Element)) {
    return {
      framework: 'Vanilla HTML',
      componentName: null,
      componentHierarchy: null,
      sourceFile: null,
      lineNumber: null,
      columnNumber: null,
      confidence: 'low',
      details: {},
    };
  }

  const tagName = element.tagName.toLowerCase();
  const isCustomElement = tagName.includes('-');

  return {
    framework: 'Vanilla HTML',
    componentName: isCustomElement ? tagName : null,
    componentHierarchy: null,
    sourceFile: null,
    lineNumber: null,
    columnNumber: null,
    confidence: 'high',
    details: {
      tagName,
      isCustomElement,
    },
  };
}
