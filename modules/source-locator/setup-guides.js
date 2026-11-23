export const SOURCE_SETUP_GUIDES = {
  static: {
    label: 'Static HTML / CSS',
    steps: [
      'Save the folder containing your HTML files. With Live Server, use the folder you opened in VS Code.',
      'If you open the HTML file directly, enable Allow access to file URLs in Chrome’s DevLocator extension details.',
    ],
    file: 'index.html',
  },
  javascript: {
    label: 'JavaScript / Web Components',
    steps: [
      'Save the folder containing the JavaScript source.',
      'For an element created by JavaScript, set these attributes on the DOM node before it is rendered.',
    ],
    example: `button.setAttribute('data-devlocator-file', 'src/main.js');
button.setAttribute('data-devlocator-line', '42');`,
  },
  'react-vite': {
    label: 'React / JSX with Vite',
    steps: [
      'Save the folder containing vite.config.js or vite.config.ts.',
      'Copy DevLocator’s integrations/vite-plugin folder into your project and run npm install -D @babel/parser magic-string from the project folder.',
      'Add the DevLocator plugin to your existing Vite plugins array and restart the development server.',
    ],
    plugin: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devlocator from './integrations/vite-plugin/index.js';

export default defineConfig({
  plugins: [react(), devlocator()],
});`,
    file: 'src/App.tsx',
  },
  react: {
    label: 'React / Next.js',
    steps: [
      'Run the development server and save the folder containing the app’s package.json.',
      'If development metadata is missing, add the attributes to the actual JSX host element, such as a button or div.',
    ],
    file: 'app/page.tsx',
  },
  vue: {
    label: 'Vue / Nuxt',
    steps: [
      'Run the development server and save the project folder containing your .vue files.',
      'For an exact jump, add the attributes to the HTML element in the component’s <template>.',
    ],
    file: 'src/components/CheckoutButton.vue',
  },
  angular: {
    label: 'Angular',
    steps: [
      'Save the folder containing angular.json and run the development server.',
      'Add the attributes in the component HTML file or inline template. Use the .ts path for an inline template.',
    ],
    file: 'src/app/checkout.component.html',
  },
  svelte: {
    label: 'Svelte / SvelteKit',
    steps: [
      'Save the folder containing the Svelte project’s package.json.',
      'Add the attributes to the element inside its .svelte component or route.',
    ],
    file: 'src/routes/+page.svelte',
  },
  laravel: {
    label: 'Laravel Blade',
    steps: [
      'Open the development site and save the Laravel root containing artisan.',
      'Add the attributes to the rendered HTML tag in the original Blade template under resources/views.',
    ],
    file: 'resources/views/checkout.blade.php',
  },
  django: {
    label: 'Django',
    steps: [
      'Open the development site and save the project folder containing manage.py.',
      'Add the attributes to the HTML tag in the original project or app template.',
    ],
    file: 'shop/templates/shop/checkout.html',
  },
  php: {
    label: 'PHP / WordPress',
    steps: [
      'Save the folder that contains the PHP templates or active theme source.',
      'Add the attributes to the actual HTML tag emitted by the PHP template.',
    ],
    file: 'templates/checkout.php',
  },
  other: {
    label: 'Other web frameworks',
    steps: [
      'Save the folder containing the original templates or components.',
      'Emit these attributes on the selected HTML element in your development build. For example, the file can be a Razor, JSP, Astro, or Rails template.',
    ],
    file: 'path/to/template.html',
  },
};

export function getSourceSetupGuide(framework, file = '') {
  const name = (framework || '').toLowerCase();
  const path = file?.toLowerCase() || '';
  if (name.includes('react') || name.includes('next.js')) return 'react';
  if (name.includes('vue') || path.endsWith('.vue')) return 'vue';
  if (name.includes('angular') || path.endsWith('.component.html')) return 'angular';
  if (name.includes('svelte') || path.endsWith('.svelte')) return 'svelte';
  if (path.endsWith('.blade.php')) return 'laravel';
  if (path.endsWith('.php')) return 'php';
  if (path.endsWith('.jsx') || path.endsWith('.tsx')) return 'react';
  if (/\.(?:js|mjs|ts|mts)$/.test(path)) return 'javascript';
  return 'static';
}
