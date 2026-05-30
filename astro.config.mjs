import { defineConfig } from 'astro/config';

export default defineConfig({
  // Keep static (HTML files), perfect for Firebase Hosting
  output: 'static',
  // Build to dist/ — Firebase will deploy from here
  outDir: 'dist',
  // Trailing slashes off — matches firebase.json `trailingSlash: false`
  trailingSlash: 'never',
  build: {
    format: 'file', // produce /menu.html instead of /menu/index.html
  },
});
