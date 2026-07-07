import { useEffect } from 'react';

const SITE_URL = 'https://fntmotorgroup.co.uk';
const SITE_NAME = 'FNT Motor Group';
const DEFAULT_IMAGE = `${SITE_URL}/fnt-logo.png`;

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
  /** Set true for pages that should not be indexed (e.g. admin). */
  noindex?: boolean;
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
 * Twitter Card tags, and per-page JSON-LD structured data in sync with the
 * current route. This is a client-side-only implementation (no SSR), but
 * Googlebot renders JS before indexing, so this still gives each page its
 * own crawlable title/description/schema instead of one static index.html
 * shared across every route.
 */
export function usePageMeta({ title, description, path, image, type = 'website', jsonLd, noindex }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const ogImage = image ?? DEFAULT_IMAGE;

    document.title = fullTitle;
    upsertMetaByName('description', description);
    upsertMetaByName('robots', noindex ? 'noindex, nofollow' : 'index, follow');
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

    const scriptId = 'page-jsonld';
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, noindex, JSON.stringify(jsonLd)]);
}
