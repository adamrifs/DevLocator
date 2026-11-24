import { DEVLOCATOR_ROOT_ID, DEVLOCATOR_ATTRIBUTE, queryMainWorldFramework } from './element-details.js';
import { DEFAULT_SETTINGS } from '../../utils/storage.js';

/**
 * ElementHighlighter creates and manages an isolated visual overlay
 * that outlines hovered DOM elements and displays an informative tooltip.
 */
export class ElementHighlighter {
  constructor(options = {}) {
    this.highlightColor = options.highlightColor || DEFAULT_SETTINGS.highlightColor;
    this.showTooltip = options.showTooltip !== false;
    this.fillOpacity = typeof options.fillOpacity === 'number' ? options.fillOpacity : 0.15;
    this.container = null;
    this.highlightBox = null;
    this.marginBox = null;
    this.paddingBox = null;
    this.tooltip = null;
    this.currentTarget = null;
    this.componentName = null;
    this.hoverRequest = 0;
  }

  /**
   * Updates configuration settings (e.g. highlight color or tooltip visibility).
   * @param {object} options
   */
  updateConfig(options = {}) {
    if (options.highlightColor) {
      this.highlightColor = options.highlightColor;
    }
    if (typeof options.showTooltip === 'boolean') {
      this.showTooltip = options.showTooltip;
    }
    if (typeof options.fillOpacity === 'number') {
      this.fillOpacity = options.fillOpacity;
    }
  }

  /**
   * Creates the overlay DOM nodes and attaches them to the document.
   */
  mount() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = DEVLOCATOR_ROOT_ID;
    this.container.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
    this.container.style.cssText = `
      all: initial;
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483646;
      overflow: visible;
      display: none;
    `;

    // Highlight bounding box
    this.highlightBox = document.createElement('div');
    this.highlightBox.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
    this.highlightBox.style.cssText = `
      all: initial;
      position: fixed;
      pointer-events: none;
      box-sizing: border-box;
      border: 1px solid ${this.highlightColor};
      border-radius: 2px;
      transition: all 40ms cubic-bezier(0.4, 0, 0.2, 1);
      display: none;
    `;

    this.marginBox = document.createElement('div');
    this.paddingBox = document.createElement('div');
    for (const [box, color] of [[this.marginBox, 'rgba(246, 178, 107, 0.5)'], [this.paddingBox, 'rgba(131, 219, 158, 0.5)']]) {
      box.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
      box.style.cssText = `all: initial; position: fixed; pointer-events: none; box-sizing: border-box; border-style: solid; border-color: ${color}; display: none;`;
    }

    // Keep the selection label legible over both light and dark pages.
    this.tooltip = document.createElement('div');
    this.tooltip.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
    this.tooltip.style.cssText = `
      all: initial;
      position: fixed;
      pointer-events: none;
      box-sizing: border-box;
      display: none;
      align-items: center;
      padding: 7px 12px;
      border-radius: 8px;
      font-family: 'DevLocator Poppins', Arial, sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.3;
      color: #ffffff;
      background: #a855f7;
      border: 0;
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.24);
      white-space: nowrap;
      z-index: 2147483647;
      max-width: calc(100vw - 16px);
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    this.container.appendChild(this.marginBox);
    this.container.appendChild(this.highlightBox);
    this.container.appendChild(this.paddingBox);
    this.container.appendChild(this.tooltip);

    // Attach to document body or documentElement
    document.documentElement.appendChild(this.container);
  }

  /**
   * Helper to convert hex color to rgba fill.
   * @param {string} hex
   * @param {number} alpha
   * @returns {string}
   */
  getFillColor(hex, alpha = 0.15) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Highlights a target DOM element.
   * @param {Element} element
   */
  highlight(element) {
    if (!element || !(element instanceof Element)) {
      this.clear();
      return;
    }

    if (!this.container) {
      this.mount();
    }

    const targetChanged = this.currentTarget !== element;
    this.currentTarget = element;
    if (targetChanged) {
      this.componentName = null;
      const request = ++this.hoverRequest;
      if (this.showTooltip) {
        queryMainWorldFramework(element).then((result) => {
          if (request !== this.hoverRequest || this.currentTarget !== element || !this.tooltip || !this.showTooltip) return;
          const info = result?.frameworkInfo;
          const name = info?.componentName;
          if (!name || name === 'ReactRoot' || name === 'NextPage') return;
          this.componentName = name;
          this.renderTooltip(element, element.getBoundingClientRect());
        }).catch(() => {});
      }
    }
    const rect = element.getBoundingClientRect();

    // Ignore elements with zero size
    if (rect.width === 0 && rect.height === 0) {
      this.clear();
      return;
    }

    this.container.style.display = 'block';

    // Position and style highlight box
    this.highlightBox.style.display = 'block';
    this.highlightBox.style.top = `${rect.top}px`;
    this.highlightBox.style.left = `${rect.left}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;
    this.highlightBox.style.borderColor = this.highlightColor;
    this.highlightBox.style.backgroundColor = this.getFillColor(this.highlightColor, this.fillOpacity);

    // Box-model overlays use computed CSS sizes scaled to the rendered rectangle.
    const computed = window.getComputedStyle(element);
    const scaleX = element.offsetWidth ? rect.width / element.offsetWidth : 1;
    const scaleY = element.offsetHeight ? rect.height / element.offsetHeight : 1;
    const sides = (prefix) => ['Top', 'Right', 'Bottom', 'Left'].map((side, index) => {
      const value = parseFloat(computed[`${prefix}${side}${prefix === 'border' ? 'Width' : ''}`]) || 0;
      return Math.max(0, value) * (index % 2 ? scaleX : scaleY);
    });
    const [mt, mr, mb, ml] = sides('margin');
    const [pt, pr, pb, pl] = sides('padding');
    const [bt, br, bb, bl] = sides('border');
    const setBox = (box, top, left, width, height, widths) => {
      box.style.display = widths.some((value) => value > 0) ? 'block' : 'none';
      box.style.top = `${top}px`;
      box.style.left = `${left}px`;
      box.style.width = `${Math.max(0, width)}px`;
      box.style.height = `${Math.max(0, height)}px`;
      box.style.borderWidth = widths.map((value) => `${value}px`).join(' ');
    };
    setBox(this.marginBox, rect.top - mt, rect.left - ml, rect.width + ml + mr, rect.height + mt + mb, [mt, mr, mb, ml]);
    setBox(this.paddingBox, rect.top + bt, rect.left + bl, rect.width - bl - br, rect.height - bt - bb, [pt, pr, pb, pl]);

    // Build and position tooltip
    if (this.showTooltip) {
      this.renderTooltip(element, rect);
    } else {
      this.tooltip.style.display = 'none';
    }
  }

  /**
   * Formats and positions the tooltip near the highlighted element.
   * @param {Element} element
   * @param {DOMRect} rect
   */
  renderTooltip(element, rect) {
    const tagName = element.tagName.toLowerCase();
    const selector = `${tagName}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${element.classList[0]}` : ''}`;
    this.tooltip.replaceChildren();
    const label = document.createElement('span');
    label.style.cssText = 'all: unset; display: block; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;';

    if (this.componentName) {
      const component = document.createElement('span');
      component.textContent = this.componentName;
      component.style.cssText = 'all: unset; color: #ffffff; font-weight: 600; margin-right: 9px;';
      label.appendChild(component);
    }
    const elementLabel = document.createElement('span');
    elementLabel.textContent = selector;
    elementLabel.style.cssText = this.componentName ? 'all: unset; color: #ffffff;' : 'all: unset; color: #ffffff; font-weight: 600;';
    label.appendChild(elementLabel);

    this.tooltip.appendChild(label);

    this.tooltip.style.display = 'inline-flex';

    // Measure tooltip dimensions
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 8;

    // Center the label above the selected element, within the viewport.
    let top = rect.top - tooltipRect.height - 6;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;

    // If near top of viewport, flip to bottom of element
    if (top < padding) {
      top = rect.bottom + 6;
    }

    // Keep within horizontal bounds of screen
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (left < padding) {
      left = padding;
    }

    this.tooltip.style.top = `${Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))}px`;
    this.tooltip.style.left = `${left}px`;
  }

  /**
   * Refreshes the highlight position (e.g. on window resize or scroll).
   */
  refresh() {
    if (this.currentTarget && document.contains(this.currentTarget)) {
      this.highlight(this.currentTarget);
    } else {
      this.clear();
    }
  }

  /**
   * Clears the current highlight and hides the overlay.
   */
  clear() {
    this.hoverRequest++;
    this.componentName = null;
    this.currentTarget = null;
    if (this.highlightBox) {
      this.highlightBox.style.display = 'none';
    }
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Destroys and completely removes the overlay from the DOM.
   */
  destroy() {
    this.clear();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.highlightBox = null;
    this.marginBox = null;
    this.paddingBox = null;
    this.tooltip = null;
    this.currentTarget = null;
  }
}

