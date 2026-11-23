# DevLocator — Chrome Developer Extension

> A high-performance Chrome Developer Extension (Manifest V3) for inspecting UI elements, identifying framework components (React, Vue, Angular, Vanilla HTML), and jumping directly into your source code in **Antigravity IDE**, **VS Code**, or **Cursor**.

---

## Features

- **Element Inspector**: Hover over any DOM element with an isolated highlight overlay, tag names, class badges, and dimensions.
- **Keyboard DOM Traversal**:
  - `↑` Up Arrow: Navigate up to parent element.
  - `↓` Down Arrow: Navigate into child element.
  - `←` / `→` Left/Right Arrow: Traverse sibling elements.
  - `Enter`: Select currently highlighted element.
  - `Esc`: Cancel inspection.
- **In-Page Floating Inspector Panel**: Rendered inside an open `ShadowRoot` with isolated CSS so page styles never interfere:
  - **Overview**: Tag, class list, CSS selector, XPath, interactive box model, direct children chips, and DOM hierarchy breadcrumb.
  - **Styles**: Filterable computed CSS properties grouped by category (Layout, Typography, Background, Border).
  - **HTML**: Formatted outerHTML snippet with copy action.
  - **Component**: Detected framework badge, component name (`<ComponentName />`), and component tree hierarchy.
  - **Source**: Verified file path, line number, column number, and **1-Click Open in IDE** button.
- **Framework Detection**:
  - **React 18 & 17**: Main-world Fiber inspection (`__reactFiber$...`), functional & class component naming, and React `_debugSource`.
  - **Vue 3 & 2**: Vue component instances (`__vueParentComponent`), SFC file tracking (`__file`), and scoped CSS heuristics.
  - **Angular 2+**: Custom host tags, emulated view encapsulation (`_nghost`, `_ngcontent`), and Angular version tracking.
  - **Vanilla HTML**: Clean fallback for non-framework DOM elements.
- **1-Click IDE Navigation**:
  - Supports **Antigravity IDE**, **Visual Studio Code**, and **Cursor** on Linux.
  - High-performance, secure Linux Native Messaging host companion (`com.devlocator.companion`).
  - Automatic clipboard fallback if IDE is not actively running.
- **Themes & Customization**:
  - Full **Dark** and **Light** theme support.
  - Customizable highlight colors (palette + custom hex input).
  - Adjustable overlay fill opacity slider (5% to 45%).
  - Live configuration sync across all open browser tabs without page reloads.

---

## Architecture & Security

```
Webpage (Main World)  <-- postMessage -->  DevLocator Content Script (Isolated World)
  - React Fibers                               - ElementPicker & Highlighter
  - Vue Instances                              - InspectorPanel (Shadow DOM)
  - Angular objects                                       |
                                                          | chrome.runtime.sendMessage
                                                          v
                                               Background Service Worker
                                                          |
                                                          | Chrome Native Messaging
                                                          v
                                               Linux Native Companion Host
                                               (devlocator_host.py)
                                                          |
                                                          v
                                               Antigravity IDE / VS Code / Cursor
```

- **CSS & DOM Isolation**: All in-page UI (highlighter, banners, inspector panel) mounts into an open `ShadowRoot` or root container with unique attributes, preventing styling contamination and host page interference.
- **Inter-World Bridge**: React Fibers and Vue instances reside exclusively in the webpage's main execution heap; DevLocator uses a secure asynchronous postMessage bridge between isolated and main worlds.
- **Strict Security & Minimum Permissions**:
  - Permissions strictly limited to: `storage`, `activeTab`, `scripting`, `nativeMessaging`.
  - Native companion strictly validates inputs (`shell=False`, forbidden character rejection, IDE whitelist) to completely prevent command injection.

---

## Installation Guide

### 1. Build the Extension
```bash
# Install dependencies
npm install

# Build extension
npm run build
```
The production extension bundle is output to `dist/chrome-mv3`.

### 2. Load Extension in Google Chrome / Chromium
1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the directory:
   ```
   /home/adam/Documents/DevLocator/dist/chrome-mv3
   ```
5. DevLocator is now active and its icon will appear in the Chrome toolbar.

### 3. Install the Linux Native Companion (For 1-Click IDE Jump)
To allow Chrome to launch Antigravity IDE, VS Code, or Cursor directly to the file and line:
```bash
cd native-companion
./install.sh
```
This registers the native messaging host manifest `com.devlocator.companion.json` for Chrome, Chromium, and Brave.

---

## Source Jump Across Web Stacks

Open your development site in Chrome, then open **DevLocator → Settings → Local project folder**. Enter the absolute path to the project's source folder and click **Save**. DevLocator remembers the folder for that site's origin, including its port. The Linux native companion is required to search local files and open the result in your editor.

**Shift-click** an element to open an exact source location or a unique best match from your local project in the editor. You can also inspect an element and choose **Open in** from the source card. DevLocator uses explicit source metadata and framework debug information when available. For other elements, it looks for matching tags, IDs, classes, attributes, or text in your local source. This works with static HTML, PHP and Laravel Blade, Django templates, Angular templates, Vue, Svelte, JSX, and common JavaScript DOM creation patterns. The source card labels project search results as likely matches. For a local HTML file opened directly in Chrome, enable **Allow access to file URLs** on the extension's details page to search that file without mapping a folder.

For generated markup or elements with several possible matches, add explicit metadata to the rendered element during development. A project-relative path uses the folder configured above. An absolute path also works with the Linux companion.

Open **Settings → Source jump setup** to choose your stack and see connection steps and an exact-line example. The inspector also shows the guide in its **Source** tab when it has an approximate location, has no location, or the editor fails to open.

```html
<button data-devlocator-file="resources/views/cart.blade.php"
        data-devlocator-line="42" data-devlocator-column="5">Checkout</button>
```

### Vite Plugin for JSX and TSX

To enable 1-click source jump with exact file and line numbers in your own Vite projects during development:

1. Copy or link `integrations/vite-plugin` into your project.
2. In your project's `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devlocatorPlugin from './integrations/vite-plugin/index.js';

export default defineConfig({
  plugins: [
    react(),
    devlocatorPlugin(), // Active during 'serve' mode only, zero production bundle impact
  ],
});
```

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Alt+Shift+X`** | Toggle Inspector | Start or stop inspection mode on the current page |
| **`↑` Up Arrow** | Step to Parent | Navigate to the parent element of the hovered element |
| **`↓` Down Arrow** | Step to Child | Navigate into the first child element |
| **`←` Left Arrow** | Previous Sibling | Step to the previous sibling DOM element |
| **`→` Right Arrow** | Next Sibling | Step to the next sibling DOM element |
| **`Enter`** | Select Element | Confirm selection and open the Inspector Panel |
| **`Esc`** | Exit Inspection | Cancel inspection mode |

---

## Testing & Validation

### Automated Test Suite
Run unit and integration tests covering framework adapters, source locators, and security validation:
```bash
npm test
```

### Interactive Test Ground
Open the test suite in your browser to test live detection:
```bash
# Open framework test suite in Chrome
google-chrome samples/index.html
```
Includes dedicated test applications:
- **`samples/react-app/index.html`**: React 18 Fibers, nested components, and source locator.
- **`samples/vue-app/index.html`**: Vue 3 setup, scoped CSS, and component instances.
- **`samples/angular-app/index.html`**: Angular 17 view encapsulation and host element naming.
- **`samples/vanilla-app/index.html`**: Standard HTML5 semantic elements.

---

## Production Packaging

Generate a compressed, store-ready ZIP archive:
```bash
npm run zip
```
Produces `dist/devlocator-0.1.0-chrome.zip` ready for Chrome Web Store distribution.
