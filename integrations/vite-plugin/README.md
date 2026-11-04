# vite-plugin-devlocator

A dev-only Vite plugin that enables 1-click source navigation in DevLocator for React, JSX, and TSX projects.

## Installation

```bash
npm install --save-dev @babel/parser magic-string
```

## Setup

Add `devlocatorPlugin` to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devlocatorPlugin from './path/to/devlocator/integrations/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    devlocatorPlugin(),
  ],
});
```

## How It Works

- Operates **only during development** (`apply: 'serve'`).
- Does **not** run in production builds (`vite build`), ensuring zero bundle impact.
- Injects `data-devlocator-file`, `data-devlocator-line`, and `data-devlocator-column` attributes into JSX elements.
- DevLocator reads these attributes to open the exact source file and line in your configured IDE (Antigravity, VS Code, Cursor).

