/**
 * Vue framework adapter.
 * Detects Vue 2 and Vue 3 applications, inspects vnodes/component instances,
 * and extracts component names, hierarchies, and Vue dev __file metadata.
 */

/**
 * Checks if Vue is present on the element or webpage.
 * @param {Element} element
 * @returns {boolean}
 */
export function isVueElement(element) {
  if (!element || !(element instanceof Element)) return false;

  const pageFw = document.documentElement.getAttribute('data-devlocator-page-framework');
  if (pageFw && pageFw.includes('Vue')) {
    return true;
  }

  // Direct element properties (Vue 3: __vueParentComponent, __vue_app__; Vue 2: __vue__)
  if (element.__vueParentComponent || element.__vue_app__ || element.__vue__ || element._vnode) {
    return true;
  }

  // Check for Vue scoped CSS attributes (data-v-xxxxxxxx)
  const hasScopedAttr = Array.from(element.attributes).some((attr) =>
    attr.name.startsWith('data-v-')
  );
  if (hasScopedAttr) return true;

  // Check ancestor elements for Vue properties or scoped CSS
  let current = element.parentElement;
  let depth = 0;
  while (current && depth < 4) {
    if (current.__vueParentComponent || current.__vue_app__ || current.__vue__ || current._vnode) {
      return true;
    }
    if (Array.from(current.attributes).some((a) => a.name.startsWith('data-v-'))) {
      return true;
    }
    current = current.parentElement;
    depth++;
  }

  // Check root Vue markers on document
  if (document.querySelector('[data-v-app], #app[data-v-]')) {
    return true;
  }

  return false;
}

/**
 * Retrieves the nearest Vue component instance from a DOM element.
 * @param {Element} element
 * @returns {object|null}
 */
export function getVueComponent(element) {
  let current = element;
  let depth = 0;

  while (current && depth < 6) {
    // Vue 3 component instance
    if (current.__vueParentComponent) {
      return { instance: current.__vueParentComponent, version: 3 };
    }

    // Vue 3 vnode
    if (current._vnode?.component) {
      return { instance: current._vnode.component, version: 3 };
    }

    // Vue 2 instance
    if (current.__vue__) {
      return { instance: current.__vue__, version: 2 };
    }

    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Extracts component name, hierarchy, and __file metadata from a Vue component instance.
 * @param {object} compData
 * @returns {{ componentName: string|null, hierarchy: string[], sourceFile: string|null }}
 */
export function extractVueComponentInfo(compData) {
  if (!compData || !compData.instance) {
    return { componentName: null, hierarchy: [], sourceFile: null };
  }

  const { instance, version } = compData;
  const hierarchy = [];
  let current = instance;
  let nearestName = null;
  let sourceFile = null;

  while (current) {
    let name = null;

    if (version === 3) {
      const type = current.type || {};
      name = type.__name || type.name || current.name || null;

      // In Vue dev mode, type.__file contains the source file path
      if (!sourceFile && type.__file) {
        sourceFile = type.__file;
      }
    } else if (version === 2) {
      const options = current.$options || {};
      name = options.name || options._componentTag || null;
      if (!sourceFile && options.__file) {
        sourceFile = options.__file;
      }
    }

    if (name) {
      if (!nearestName) {
        nearestName = name;
      }
      if (!hierarchy.includes(name)) {
        hierarchy.unshift(name);
      }
    }

    current = version === 3 ? current.parent : current.$parent;
  }

  return {
    componentName: nearestName,
    hierarchy,
    sourceFile,
  };
}

/**
 * Vue Adapter main detection method.
 * @param {Element} element
 * @returns {object|null} Standardized framework result or null if not Vue
 */
export function detectVue(element) {
  const isVue = isVueElement(element);
  if (!isVue) return null;

  const compData = getVueComponent(element);
  const { componentName, hierarchy, sourceFile } = extractVueComponentInfo(compData);

  // If no internal component name was found via JS properties, inspect scoped CSS or app root
  let fallbackName = componentName;
  if (!fallbackName) {
    const scopedAttr = Array.from(element.attributes).find((a) => a.name.startsWith('data-v-'));
    if (scopedAttr) {
      fallbackName = `VueComponent (${scopedAttr.name})`;
    }
  }

  let confidence = 'partial';
  if (componentName && sourceFile) {
    confidence = 'high';
  } else if (!fallbackName) {
    confidence = 'low';
  }

  return {
    framework: compData?.version === 3 ? 'Vue 3' : (compData?.version === 2 ? 'Vue 2' : 'Vue'),
    componentName: fallbackName || null,
    componentHierarchy: hierarchy.length > 0 ? hierarchy : null,
    sourceFile: sourceFile || null,
    lineNumber: null,
    columnNumber: null,
    confidence,
    details: {
      version: compData ? `Vue ${compData.version}` : 'Vue (DOM detected)',
      hasComponentInstance: Boolean(compData),
    },
  };
}

