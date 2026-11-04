/**
 * React framework adapter.
 * Detects React components, inspects the Fiber tree, extracts component hierarchies,
 * and investigates React development source metadata (_debugSource).
 */

/**
 * Checks if React is present on the page.
 * @param {Element} element
 * @returns {boolean}
 */
export function isReactElement(element) {
  if (!element || !(element instanceof Element)) return false;

  // Check for React Fiber keys on element
  const keys = Object.keys(element);
  const hasFiberKey = keys.some(
    (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  );
  if (hasFiberKey) return true;

  // Check for React DOM markers
  if (element.hasAttribute('data-reactroot') || element.hasAttribute('data-reactid')) {
    return true;
  }

  // Check root container or Next.js marker
  if (document.querySelector('[data-reactroot], #__next, #root[_reactRootContainer]')) {
    return true;
  }

  // Check if ancestor has fiber key
  let current = element.parentElement;
  let depth = 0;
  while (current && depth < 5) {
    if (Object.keys(current).some((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'))) {
      return true;
    }
    current = current.parentElement;
    depth++;
  }

  return false;
}

/**
 * Retrieves the React Fiber node attached to a DOM element.
 * @param {Element} element
 * @returns {object|null}
 */
export function getReactFiber(element) {
  if (!element) return null;

  const keys = Object.keys(element);
  const fiberKey = keys.find(
    (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  );

  if (fiberKey) {
    return element[fiberKey];
  }

  // Try checking parent elements if this DOM node is a text wrapper or simple child
  let current = element.parentElement;
  let depth = 0;
  while (current && depth < 4) {
    const parentKeys = Object.keys(current);
    const parentFiberKey = parentKeys.find(
      (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
    );
    if (parentFiberKey) {
      return current[parentFiberKey];
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
  if (!fiber || !fiber.type) return null;

  const { type } = fiber;

  // String types are native HTML elements ('div', 'button', etc.)
  if (typeof type === 'string') {
    return null;
  }

  // Standard Function or Class Component
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }

  // React.memo or React.forwardRef or Special Types
  if (typeof type === 'object') {
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

  let confidence = 'partial';
  if (componentName && debugSource?.fileName) {
    confidence = 'high';
  } else if (!componentName) {
    confidence = 'low';
  }

  return {
    framework: isNextJs ? 'Next.js (React)' : 'React',
    componentName: componentName || null,
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
