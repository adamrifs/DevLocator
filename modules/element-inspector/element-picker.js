import { isDevLocatorElement, extractElementDetails, DEVLOCATOR_ATTRIBUTE } from './element-details.js';
import { ElementHighlighter } from './element-highlighter.js';

/**
 * ElementPicker manages element inspection mode, mouse tracking,
 * click-to-select with full click interception, and Escape key cancellation.
 */
export class ElementPicker {
  constructor(options = {}) {
    this.options = options;
    this.isActive = false;
    this.highlighter = new ElementHighlighter(options);
    this.onSelectCallback = null;
    this.onCancelCallback = null;
    this.banner = null;

    // Bound event handlers for clean addition and removal
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleScrollOrResize = this.handleScrollOrResize.bind(this);
  }

  /**
   * Starts element inspection mode.
   * @param {Function} onSelect - Invoked with (element, details) when an element is clicked.
   * @param {Function} onCancel - Invoked when inspection is cancelled.
   */
  start(onSelect, onCancel) {
    if (this.isActive) return;

    this.isActive = true;
    this.onSelectCallback = onSelect;
    this.onCancelCallback = onCancel;

    // Initialize highlighter
    this.highlighter.mount();

    // Create HUD banner
    this.createBanner();

    // Register capture-phase listeners to intercept all mouse and keyboard events
    window.addEventListener('mousemove', this.handleMouseMove, { capture: true, passive: true });
    window.addEventListener('click', this.handleClick, { capture: true });
    window.addEventListener('mousedown', this.preventDefaultOnly, { capture: true });
    window.addEventListener('mouseup', this.preventDefaultOnly, { capture: true });
    window.addEventListener('keydown', this.handleKeyDown, { capture: true });
    window.addEventListener('scroll', this.handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', this.handleScrollOrResize, { passive: true });

    // Apply cursor styling to body
    document.documentElement.style.cursor = 'crosshair';
  }

  /**
   * Stops element inspection mode and restores default behavior.
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;

    // Remove event listeners
    window.removeEventListener('mousemove', this.handleMouseMove, { capture: true });
    window.removeEventListener('click', this.handleClick, { capture: true });
    window.removeEventListener('mousedown', this.preventDefaultOnly, { capture: true });
    window.removeEventListener('mouseup', this.preventDefaultOnly, { capture: true });
    window.removeEventListener('keydown', this.handleKeyDown, { capture: true });
    window.removeEventListener('scroll', this.handleScrollOrResize, { capture: true });
    window.removeEventListener('resize', this.handleScrollOrResize);

    // Remove HUD banner
    this.removeBanner();

    // Clear and remove highlighter overlay
    this.highlighter.destroy();

    // Restore cursor
    document.documentElement.style.cursor = '';
  }

  /**
   * Creates the floating HUD banner at the top of the viewport.
   */
  createBanner() {
    if (this.banner) return;

    this.banner = document.createElement('div');
    this.banner.setAttribute(DEVLOCATOR_ATTRIBUTE, 'true');
    this.banner.style.cssText = `
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 14px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.4);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
      border-radius: 9999px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #f8fafc;
      user-select: none;
      backdrop-filter: blur(8px);
    `;

    this.banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 8px #38bdf8;"></span>
        <strong style="color: #38bdf8; font-weight: 600;">DevLocator</strong>
      </div>
      <span style="color: #94a3b8; font-size: 11px;">Click to select &bull; <kbd style="background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 3px; font-family: monospace;">Esc</kbd> to exit</span>
      <button id="__devlocator-exit-btn__" type="button" style="
        background: rgba(244, 63, 94, 0.2);
        color: #f43f5e;
        border: 1px solid rgba(244, 63, 94, 0.4);
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
      ">Exit</button>
    `;

    (document.body || document.documentElement).appendChild(this.banner);

    const exitBtn = this.banner.querySelector('#__devlocator-exit-btn__');
    if (exitBtn) {
      exitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.cancel();
      });
    }
  }

  removeBanner() {
    if (this.banner && this.banner.parentNode) {
      this.banner.parentNode.removeChild(this.banner);
    }
    this.banner = null;
  }

  /**
   * Helper to prevent mouse events during inspection so page controls don't trigger.
   */
  preventDefaultOnly(event) {
    if (isDevLocatorElement(event.target)) {
      return;
    }
    event.preventDefault();
  }

  /**
   * Traverses deep into accessible Shadow DOM to find the actual target element.
   * @param {number} x
   * @param {number} y
   * @returns {Element|null}
   */
  getElementAtPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    if (!el) return null;

    // Drill down into open shadow roots if present
    while (el && el.shadowRoot && typeof el.shadowRoot.elementFromPoint === 'function') {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }

    return el;
  }

  /**
   * Mouse move event handler to detect and highlight elements.
   */
  handleMouseMove(event) {
    if (!this.isActive) return;

    const target = this.getElementAtPoint(event.clientX, event.clientY);

    // Skip if target is null, root document, or DevLocator's own UI
    if (!target || target === document.documentElement || target === document.body || isDevLocatorElement(target)) {
      return;
    }

    this.highlighter.highlight(target);
  }

  /**
   * Click event handler: prevents original website actions and selects the element.
   */
  async handleClick(event) {
    if (!this.isActive) return;

    const target = event.target;

    // Check if user clicked DevLocator's exit button or own UI
    if (isDevLocatorElement(target)) {
      return;
    }

    // Intercept click completely so website receives no action
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const selectedTarget = this.getElementAtPoint(event.clientX, event.clientY) || target;
    const details = await extractElementDetails(selectedTarget);

    if (this.onSelectCallback) {
      this.onSelectCallback(selectedTarget, details);
    }

    // Stop inspection mode after element is selected
    this.stop();
  }

  /**
   * Escape key handler to cancel inspection.
   */
  handleKeyDown(event) {
    if (!this.isActive) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      event.stopPropagation();
      this.cancel();
    }
  }

  /**
   * Repositions highlight on scroll or resize.
   */
  handleScrollOrResize() {
    if (this.isActive) {
      this.highlighter.refresh();
    }
  }

  /**
   * Cancels inspection and notifies callback.
   */
  cancel() {
    this.stop();
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
  }
}

