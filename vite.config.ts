import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { buildBusinessJsonLd } from './src/config/business';
import { NOT_FOUND_META, STATIC_PAGES } from './src/lib/seo';
import { applyMetaToHtml, renderNotFoundFallback } from './src/lib/seoHtml';

/**
 * Fills the HTML shells from the shared SEO config at build time:
 *  - index.html gets the homepage title/description/canonical/OG and the
 *    site-wide AutoDealer JSON-LD (NAP) from src/config/business.ts
 *  - 404.html gets noindex meta plus crawlable "page not found" markup
 * Every other route is templated per request by netlify/edge-functions/seo.ts.
 */
function seoHtmlPlugin(): Plugin {
  return {
    name: 'fnt-seo-html',
    transformIndexHtml(html, ctx) {
      const isNotFound = ctx.filename.endsWith('404.html') || ctx.path?.endsWith('404.html');
      const transformed = isNotFound
        ? applyMetaToHtml(html, NOT_FOUND_META, { fallbackHtml: renderNotFoundFallback('Page not found') })
        : applyMetaToHtml(html, STATIC_PAGES['/']);

      return {
        html: transformed,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: JSON.stringify(buildBusinessJsonLd()),
            injectTo: 'head',
          },
        ],
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), seoHtmlPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      // Two HTML entries sharing one bundle: the app shell and the 404 document
      // Netlify serves (with a 404 status) for unknown URLs.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        notFound: fileURLToPath(new URL('./404.html', import.meta.url)),
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
});
