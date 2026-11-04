import { detectReact } from './react-adapter.js';
import { detectVue } from './vue-adapter.js';
import { detectAngular } from './angular-adapter.js';
import { detectVanilla } from './vanilla-adapter.js';

/**
 * Common output format for framework detection:
 * {
 *   framework: string,          // e.g. "React", "Next.js (React)", "Vue 3", "Angular", "Vanilla HTML"
 *   componentName: string|null,  // e.g. "LoginButton", "UserProfileComponent"
 *   componentHierarchy: string[]|null, // e.g. ["App", "Navbar", "LoginButton"]
 *   sourceFile: string|null,    // Original source file if discovered in dev metadata
 *   lineNumber: number|null,    // Source line number
 *   columnNumber: number|null,  // Source column number
 *   confidence: "high"|"partial"|"low",
 *   details: object
 * }
 */

/**
 * Detects the UI framework and component associated with a DOM element.
 * @param {Element} element
 * @returns {object} Standardized framework metadata
 */
export function detectFramework(element) {
  if (!element || !(element instanceof Element)) {
    return detectVanilla(element);
  }

  // 1. Try React Adapter
  const reactResult = detectReact(element);
  if (reactResult) {
    return normalizeFrameworkResult(reactResult);
  }

  // 2. Try Vue Adapter
  const vueResult = detectVue(element);
  if (vueResult) {
    return normalizeFrameworkResult(vueResult);
  }

  // 3. Try Angular Adapter
  const angularResult = detectAngular(element);
  if (angularResult) {
    return normalizeFrameworkResult(angularResult);
  }

  // 4. Fallback to Vanilla DOM Adapter
  return normalizeFrameworkResult(detectVanilla(element));
}

/**
 * Normalizes framework detection output ensuring contract integrity.
 * @param {object} result
 * @returns {object}
 */
function normalizeFrameworkResult(result) {
  return {
    framework: result.framework || 'Vanilla HTML',
    componentName: result.componentName || null,
    componentHierarchy: Array.isArray(result.componentHierarchy) && result.componentHierarchy.length > 0
      ? result.componentHierarchy
      : null,
    sourceFile: result.sourceFile || null,
    lineNumber: typeof result.lineNumber === 'number' ? result.lineNumber : null,
    columnNumber: typeof result.columnNumber === 'number' ? result.columnNumber : null,
    confidence: ['high', 'partial', 'low'].includes(result.confidence) ? result.confidence : 'partial',
    details: result.details || {},
  };
}
