/**
 * Utilities for reading DevLocator compilation metadata and framework debug sources from DOM elements.
 */

/**
 * Reads DevLocator Vite plugin metadata attributes from an element or its nearest ancestor.
 * @param {Element} element
 * @returns {object|null}
 */
export function readDevLocatorMetadata(element) {
  if (!element || !(element instanceof Element)) return null;

  let current = element;
  let depth = 0;

  while (current && depth < 10) {
    const file = current.getAttribute('data-devlocator-file');
    if (file) {
      const lineStr = current.getAttribute('data-devlocator-line');
      const colStr = current.getAttribute('data-devlocator-column');
      const comp = current.getAttribute('data-devlocator-component');

      const line = lineStr ? parseInt(lineStr, 10) : null;
      const column = colStr ? parseInt(colStr, 10) : null;

      return {
        file,
        line: isNaN(line) ? null : line,
        column: isNaN(column) ? null : column,
        componentName: comp || null,
        strategy: 'vite-plugin',
        verified: true,
        confidence: 'high',
      };
    }

    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Normalizes file paths (removes webpack:/// prefixes, query params, etc.).
 * @param {string} rawPath
 * @returns {string}
 */
export function normalizeSourcePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '';

  let cleaned = rawPath;

  // Remove webpack protocol prefixes
  cleaned = cleaned.replace(/^webpack:\/\/\/?/, '');

  // Remove leading ./ if present
  if (cleaned.startsWith('./') && !cleaned.startsWith('../')) {
    cleaned = cleaned.slice(2);
  }

  // Remove Vite query parameters (?import, ?v=..., etc.)
  cleaned = cleaned.split('?')[0];

  return cleaned;
}

/**
 * Formats a source location string e.g. "src/App.jsx:42:10".
 * @param {string} file
 * @param {number|null} line
 * @param {number|null} column
 * @returns {string}
 */
export function formatSourceLocation(file, line, column) {
  if (!file) return '';
  let loc = file;
  if (typeof line === 'number') {
    loc += `:${line}`;
    if (typeof column === 'number') {
      loc += `:${column}`;
    }
  }
  return loc;
}

