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
  const viteMeta = readDevLocatorMetadata(element);
  if (viteMeta && viteMeta.file) {
    return {
      file: normalizeSourcePath(viteMeta.file),
      line: viteMeta.line,
      column: viteMeta.column,
      componentName: viteMeta.componentName || null,
      strategy: 'vite-plugin',
      verified: true,
      confidence: 'high',
    };
  }

  // Strategy A.1: React development _debugSource
  const fiber = getReactFiber(element);
  if (fiber) {
    let current = fiber;
    while (current) {
      const debugSource = current._debugSource || current._debugOwner?._debugSource;
      if (debugSource && debugSource.fileName) {
        return {
          file: normalizeSourcePath(debugSource.fileName),
          line: typeof debugSource.lineNumber === 'number' ? debugSource.lineNumber : null,
          column: typeof debugSource.columnNumber === 'number' ? debugSource.columnNumber : null,
          componentName: current.type?.displayName || current.type?.name || null,
          strategy: 'react-debug-source',
          verified: true,
          confidence: 'high',
        };
      }
      current = current.return;
    }
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

