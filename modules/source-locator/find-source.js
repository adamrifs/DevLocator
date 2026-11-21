import { readDevLocatorMetadata, normalizeSourcePath } from './source-metadata.js';
import { getReactFiber } from '../framework-detector/react-adapter.js';
import { getVueComponent } from '../framework-detector/vue-adapter.js';

/**
 * Common source location output contract:
 * {
 *   file: string|null,
 *   line: number|null,
 *   column: number|null,
 *   componentName: string|null,
 *   strategy: "vite-plugin" | "react-debug-source" | "vue-file" | "source-map" | "none",
 *   verified: boolean,
 *   exact?: boolean,
 *   confidence: "high" | "partial" | "low"
 * }
 */

/**
 * Finds source code location for a DOM element across all supported strategies.
 * @param {Element} element
 * @param {object} [options]
 * @returns {object} Source location result
 */
export function findSourceLocation(element, options = {}) {
  if (!element || !(element instanceof Element)) {
    return createEmptySourceResult();
  }

  // Strategy B: DevLocator Vite plugin metadata (data-devlocator-*)
  const directMetadata = readDevLocatorMetadata(element, 1);
  const directFile = normalizeSourcePath(directMetadata?.file);
  const directSource = directFile && directMetadata.exact
    ? { ...directMetadata, file: directFile }
    : null;
  if (directSource?.file.startsWith('/')) return directSource;

  // Strategy A.1: React development _debugSource
  const fiber = getReactFiber(element);
  if (fiber) {
    let current = fiber;
    while (current) {
      const debugSource = current._debugSource;
      const file = normalizeSourcePath(debugSource?.fileName);
      if (file) {
        const line = Number.isInteger(debugSource.lineNumber) && debugSource.lineNumber > 0 ? debugSource.lineNumber : null;
        const column = Number.isInteger(debugSource.columnNumber) && debugSource.columnNumber > 0 ? debugSource.columnNumber : null;
        const exact = current === fiber && fiber.stateNode === element && typeof fiber.type === 'string' && line !== null;
        if (directSource) {
          // Resolve a relative plugin path only when the selected DOM fiber identifies the same file.
          return exact && file.startsWith('/') && file.endsWith(`/${directFile}`)
            ? { ...directSource, file }
            : directSource;
        }
        return {
          file,
          line,
          column,
          componentName: current.type?.displayName || current.type?.name || null,
          strategy: 'react-debug-source',
          verified: true,
          confidence: exact ? 'high' : 'partial',
          exact,
        };
      }
      current = current.return;
    }
  }

  if (directSource) return directSource;

  const inheritedMetadata = readDevLocatorMetadata(element);
  const inheritedFile = normalizeSourcePath(inheritedMetadata?.file);
  if (inheritedFile) {
    return { ...inheritedMetadata, file: inheritedFile };
  }

  // Strategy A.2: Vue component __file
  const vueComp = getVueComponent(element);
  if (vueComp && vueComp.instance) {
    const rawFile =
      vueComp.instance.type?.__file ||
      vueComp.instance.$options?.__file ||
      vueComp.instance.type?.name;

    if (rawFile && rawFile.includes('.')) {
      return {
        file: normalizeSourcePath(rawFile),
        line: null,
        column: null,
        componentName: vueComp.instance.type?.__name || vueComp.instance.type?.name || null,
        strategy: 'vue-file',
        verified: true,
        confidence: 'partial',
      };
    }
  }

  // Strategy C: Source Map / Script investigation fallback
  const scriptTag = document.querySelector('script[src*=".jsx"], script[src*=".tsx"], script[src*="main."]');
  if (scriptTag && scriptTag.src) {
    // Only return as unverified approximate fallback if requested
    if (options.includeApproximate) {
      return {
        file: normalizeSourcePath(scriptTag.src),
        line: null,
        column: null,
        componentName: null,
        strategy: 'source-map',
        verified: false,
        confidence: 'low',
      };
    }
  }

  // No source location available
  return createEmptySourceResult();
}

/**
 * Helper to create an empty, unverified source result.
 */
function createEmptySourceResult() {
  return {
    file: null,
    line: null,
    column: null,
    componentName: null,
    strategy: 'none',
    verified: false,
    confidence: 'low',
  };
}

