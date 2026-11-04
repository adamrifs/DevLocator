# DevLocator — Chrome Developer Extension

> A professional Chrome Developer Extension for element, component, and source inspection.

## Overview
DevLocator allows developers to inspect web elements, identify the framework component responsible for rendering them (React, Vue, Angular, or Vanilla HTML/CSS), detect source files and line numbers, and jump directly into code editors (Antigravity, Visual Studio Code, Cursor).

## Architecture
- **Framework**: [WXT](https://wxt.dev/) with React + JSX
- **Manifest**: Chrome Extension Manifest V3
- **Styling**: Tailwind CSS
- **Target Editors**: Antigravity, VS Code, Cursor

## Directory Structure
```
DevLocator/
├── entrypoints/
│   ├── popup/            # Extension popup UI (React + Tailwind)
│   ├── background.js     # Background service worker
│   └── content.js        # Content script injected into webpages
├── components/
│   ├── inspector/        # Element inspector components
│   ├── settings/         # IDE and general preference components
│   └── ui/               # Reusable UI primitives (Button, Toggle, etc.)
├── modules/              # Core inspection and adapter logic
│   ├── element-inspector/
│   ├── framework-detector/
│   ├── source-locator/
│   └── ide-integration/
├── utils/                # Message validators, storage API, helpers
├── public/icons/         # Extension icons
├── wxt.config.js         # WXT & Manifest V3 configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json
```

## Development Commands
- `npm run build` — Build extension for production into `.output/chrome-mv3`
- `npm run dev` — Run development build with live reload

## Loading Extension into Chrome
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top right corner.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder inside this directory (`/home/adam/Documents/DevLocator/.output/chrome-mv3`).
5. DevLocator is now active and its icon will appear in the Chrome toolbar.
