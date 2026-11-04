/**
 * React framework adapter.
 * Detects React components, inspects the Fiber tree, extracts component hierarchies,
 * and investigates React development source metadata (_debugSource).
 */

/**
 * Checks if React is present on the page or element.
 * @param {Element} element
 * @returns {boolean}
 */
export function isReactElement(element) {
  if (!element || !(element instanceof Element)) return false;

  // 1. Direct Fiber node check on element or ancestors
  if (getReactFiber(element)) {
    return true;
  }

  // 2. React DOM markers in DOM
  if (
    element.hasAttribute('data-reactroot') ||
    element.hasAttribute('data-reactid') ||
    element.closest('[data-reactroot], [data-reactid]')
  ) {
    return true;
  }

  // 3. Next.js and typical React root containers
  if (
    document.getElementById('__next') ||
    document.querySelector('script#__NEXT_DATA__') ||
    document.querySelector('[data-reactroot]') ||
    document.querySelector('#root[_reactRootContainer]')
  ) {
    return true;
  }

  // 4. React DevTools hook present in window
  if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook.renderers && (hook.renderers.size > 0 || Object.keys(hook.renderers).length > 0)) {
      return true;
    }
  }

  return false;
}

/**
 * Retrieves the React Fiber node attached to a DOM element or its ancestors.
 * @param {Element} element
 * @returns {object|null}
 */
export function getReactFiber(element) {
  if (!element || !(element instanceof Element)) return null;

  let current = element;
  let depth = 0;

  while (current && depth < 15) {
    const keys = Object.keys(current);
    const fiberKey = keys.find(
      (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
    );

    if (fiberKey && current[fiberKey]) {
      return current[fiberKey];
    }

    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Resolves a human-readable name from a React Fiber type.
 * @param {object} fiber
 * @returns {string|null}
 */
export function getComponentNameFromFiber(fiber) {
  if (!fiber) return null;

  const { type, elementType } = fiber;

  // String types are native HTML elements ('div', 'button', etc.)
  if (typeof type === 'string') {
    return null;
  }

  // Standard Function or Class Component
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }

  // React.memo or React.forwardRef or Special Types
  if (typeof type === 'object' && type !== null) {
    if (type.displayName) return type.displayName;
    if (type.name) return type.name;

    // React.forwardRef: type.render is the inner function
    if (type.render && typeof type.render === 'function') {
      return type.render.displayName || type.render.name || 'ForwardRef';
    }

    // React.memo: type.type is the wrapped component
    if (type.type) {
      if (typeof type.type === 'function') {
        return type.type.displayName || type.type.name || 'Memo';
      }
      if (typeof type.type === 'object' && (type.type.displayName || type.type.name)) {
        return type.type.displayName || type.type.name;
      }
    }
  }

  // Check elementType fallback
  if (typeof elementType === 'function') {
    return elementType.displayName || elementType.name || null;
  }

  return null;
}

/**
 * Traverses up the Fiber return chain to find the nearest component
 * and construct the component hierarchy.
 * @param {object} initialFiber
 * @returns {{ componentName: string|null, hierarchy: string[], debugSource: object|null }}
 */
export function getComponentInfoFromFiber(initialFiber) {
  if (!initialFiber) {
    return { componentName: null, hierarchy: [], debugSource: null };
  }

  const hierarchy = [];
  let current = initialFiber;
  let nearestComponentName = null;
  let debugSource = null;

  while (current) {
    const name = getComponentNameFromFiber(current);

    if (name && !['Fragment', 'Suspense', 'Provider', 'Consumer', 'Context'].includes(name)) {
      if (!nearestComponentName) {
        nearestComponentName = name;
        // In React dev mode, _debugSource contains { fileName, lineNumber, columnNumber }
        if (current._debugSource) {
          debugSource = current._debugSource;
        } else if (current._debugOwner?._debugSource) {
          debugSource = current._debugOwner._debugSource;
        }
      }

      if (!hierarchy.includes(name)) {
        hierarchy.unshift(name);
      }
    }

    current = current.return;
  }

  return {
    componentName: nearestComponentName,
    hierarchy,
    debugSource,
  };
}

/**
 * React Adapter main detection method.
 * @param {Element} element
 * @returns {object|null} Standardized framework result or null if not React
 */
export function detectReact(element) {
  const isReact = isReactElement(element);
  if (!isReact) return null;

  const isNextJs = Boolean(
    document.getElementById('__next') ||
    document.querySelector('script[id="__NEXT_DATA__"]')
  );

  const fiber = getReactFiber(element);
  const { componentName, hierarchy, debugSource } = getComponentInfoFromFiber(fiber);

  let finalComponentName = componentName;
  if (!finalComponentName && hierarchy.length > 0) {
    finalComponentName = hierarchy[hierarchy.length - 1];
  } else if (!finalComponentName) {
    finalComponentName = isNextJs ? 'NextPage' : 'ReactRoot';
  }

  let confidence = 'partial';
  if (debugSource?.fileName) {
    confidence = 'high';
  } else if (!componentName) {
    confidence = 'partial';
  }

  return {
    framework: isNextJs ? 'Next.js (React)' : 'React',
    componentName: finalComponentName,
    componentHierarchy: hierarchy.length > 0 ? hierarchy : null,
    sourceFile: debugSource?.fileName || null,
    lineNumber: debugSource?.lineNumber || null,
    columnNumber: debugSource?.columnNumber || null,
    confidence,
    details: {
      isNextJs,
      hasFiber: Boolean(fiber),
      fiberType: fiber ? typeof fiber.type : null,
    },
  };
}
