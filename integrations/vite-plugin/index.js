import { parse } from '@babel/parser';
import MagicString from 'magic-string';
import path from 'path';

/**
 * DevLocator Vite Development Plugin.
 * Automatically injects source location metadata (data-devlocator-file, line, column)
 * into JSX elements during development compilation.
 *
 * @param {object} [options]
 * @param {string[]} [options.include] - File extensions to include.
 * @param {string[]} [options.exclude] - File patterns to exclude.
 * @returns {import('vite').Plugin}
 */
export default function devlocatorPlugin(options = {}) {
  const includeExts = options.include || ['.jsx', '.tsx', '.js'];
  const rootDir = process.cwd();

  return {
    name: 'vite-plugin-devlocator',
    // Apply ONLY during development server ('serve'), never for production builds
    apply: 'serve',
    enforce: 'pre',

    transform(code, id) {
      // Ignore node_modules, virtual modules, or files outside project
      if (!id || id.includes('node_modules') || id.startsWith('\0') || id.includes('?')) {
        return null;
      }

      const ext = path.extname(id.split('?')[0]);
      if (!includeExts.includes(ext)) {
        return null;
      }

      // Check if code contains JSX syntax before parsing
      if (!code.includes('<') || !code.includes('>')) {
        return null;
      }

      // Compute project-relative path to avoid leaking absolute filesystem paths
      const relativePath = path.relative(rootDir, id.split('?')[0]).replace(/\\/g, '/');

      try {
        const ast = parse(code, {
          sourceType: 'module',
          plugins: [
            'jsx',
            'typescript',
            'classProperties',
            'dynamicImport',
            'exportDefaultFrom',
          ],
        });

        const ms = new MagicString(code);
        let transformed = false;

        function walk(node) {
          if (!node || typeof node !== 'object') return;

          if (node.type === 'JSXOpeningElement') {
            // Find insertion position right after tag name (e.g. <button | >)
            const nameNode = node.name;
            if (nameNode && nameNode.end) {
              const line = node.loc?.start?.line || 1;
              const column = (node.loc?.start?.column || 0) + 1;
              const componentName =
                nameNode.type === 'JSXIdentifier'
                  ? nameNode.name
                  : nameNode.type === 'JSXMemberExpression'
                  ? `${nameNode.object.name}.${nameNode.property.name}`
                  : '';

              const metadata = ` data-devlocator-file="${relativePath}" data-devlocator-line="${line}" data-devlocator-column="${column}"${
                componentName ? ` data-devlocator-component="${componentName}"` : ''
              }`;

              ms.appendRight(nameNode.end, metadata);
              transformed = true;
            }
          }

          for (const key of Object.keys(node)) {
            const child = node[key];
            if (Array.isArray(child)) {
              for (const item of child) {
                walk(item);
              }
            } else if (child && typeof child === 'object') {
              walk(child);
            }
          }
        }

        walk(ast);

        if (!transformed) {
          return null;
        }

        return {
          code: ms.toString(),
          map: ms.generateMap({ hires: true }),
        };
      } catch (err) {
        // Silently skip files that cannot be parsed as JSX
        return null;
      }
    },
  };
}

export { devlocatorPlugin };
