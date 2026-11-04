import { DEVLOCATOR_ROOT_ID, DEVLOCATOR_ATTRIBUTE } from './element-details.js';

/**
 * ElementHighlighter creates and manages an isolated visual overlay
 * that outlines hovered DOM elements and displays an informative tooltip.
 */
export class ElementHighlighter {
  constructor(options = {}) {
    this.highlightColor = options.highlightColor || '#38bdf8';
    this.showTooltip = options.showTooltip !== false;
    this.container = null;
    this.highlightBox = null;
    this.tooltip = null;
    this.currentTarget = null;
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
      position: fixed;
      pointer-events: none;
      box-sizing: border-box;
      border: 2px solid ${this.highlightColor};
      background-color: ${this.getFillColor(this.highlightColor)};
      box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 2px;
      transition: all 40ms cubic-bezier(0.4, 0, 0.2, 1);
      display: none;
    `;

    // Informational Tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
    this.tooltip.style.cssText = `
      position: fixed;
      pointer-events: none;
      box-sizing: border-box;
      display: none;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.2;
      color: #f8fafc;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(4px);
      white-space: nowrap;
      z-index: 2147483647;
      max-width: 90vw;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    this.container.appendChild(this.highlightBox);
    this.container.appendChild(this.tooltip);

    // Attach to document body or documentElement
    (document.body || document.documentElement).appendChild(this.container);
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

    this.currentTarget = element;
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
    this.highlightBox.style.backgroundColor = this.getFillColor(this.highlightColor);

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
    const id = element.id ? `#${element.id}` : '';
    const firstClass = element.classList.length ? `.${element.classList[0]}` : '';
    const dim = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;

    // Build tooltip HTML
    this.tooltip.innerHTML = `
      <span style="color: #38bdf8; font-weight: 700;">${tagName}</span>
      ${id ? `<span style="color: #fbbf24;">${id}</span>` : ''}
      ${firstClass ? `<span style="color: #94a3b8;">${firstClass}</span>` : ''}
      <span style="color: #10b981; font-size: 10px; margin-left: 2px; padding: 1px 4px; background: rgba(16, 185, 129, 0.15); border-radius: 3px;">${dim}</span>
    `;

    this.tooltip.style.display = 'inline-flex';

    // Measure tooltip dimensions
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 8;

    // Default: position directly above the element
    let top = rect.top - tooltipRect.height - 6;
    let left = rect.left;

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

    this.tooltip.style.top = `${top}px`;
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
    this.tooltip = null;
    this.currentTarget = null;
  }
}

