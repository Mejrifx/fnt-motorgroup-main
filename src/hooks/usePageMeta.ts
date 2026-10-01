import { useEffect } from 'react';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_ROBOTS,
  NOINDEX_ROBOTS,
  SITE_NAME,
  SITE_URL,
  withSiteName,
} from '../lib/seo';

interface PageMetaOptions {
  /** Page <title>. The site name is appended automatically unless it's already present. */
  title: string;
  description: string;
  /** Path starting with "/", used to build the canonical + og:url. Defaults to current location. */
  path?: string;
  image?: string;
  /** og:type — 'website' for most pages, 'product' for individual car listings. */
  type?: string;
  /** One or more JSON-LD objects to inject as structured data for this page. */
  jsonLd?: object | object[];
  /** Set true for pages that should not be indexed (e.g. admin, 404). */
  noindex?: boolean;
  /** Explicit robots directive; overrides `noindex`. */
  robots?: string;
}

function upsertMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Keeps document.title, meta description, canonical URL, Open Graph /
 * Twitter Card tags, and per-page JSON-LD in sync with the current route
 * during client-side navigation.
 *
 * The FIRST HTML response for each public URL is already correct: index.html
 * / 404.html are filled at build time and every other route is templated by
 * netlify/edge-functions/seo.ts. This hook makes sure the values stay right
 * once the user navigates within the SPA, using the same shared builders from
 * src/lib/seo.ts so client and server never disagree.
 */
export function usePageMeta({ title, description, path, image, type = 'website', jsonLd, noindex, robots }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = withSiteName(title);
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const ogImage = image ?? DEFAULT_OG_IMAGE;

    document.title = fullTitle;
    upsertMetaByName('description', description);
    upsertMetaByName('robots', robots ?? (noindex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS));
    upsertCanonical(url);

    upsertMetaByProperty('og:title', fullTitle);
    upsertMetaByProperty('og:description', description);
    upsertMetaByProperty('og:url', url);
    upsertMetaByProperty('og:type', type);
    upsertMetaByProperty('og:image', ogImage);
    upsertMetaByProperty('og:site_name', SITE_NAME);

    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', fullTitle);
    upsertMetaByName('twitter:description', description);
    upsertMetaByName('twitter:image', ogImage);

    // Replace any page-level JSON-LD (server-injected or from a previous route).
    document.querySelectorAll('script#page-jsonld').forEach((el) => el.remove());

    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      blocks.forEach((block) => {
        const script = document.createElement('script');
        script.id = 'page-jsonld';
        script.type = 'application/ld+json';
        script.text = JSON.stringify(block);
        document.head.appendChild(script);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, noindex, robots, JSON.stringify(jsonLd)]);
}
