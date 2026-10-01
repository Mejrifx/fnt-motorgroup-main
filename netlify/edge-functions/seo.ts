/**
 * Per-URL HTML <head> rendering for the React SPA.
 *
 * The site is a client-rendered Vite app, so without this every route would
 * return the same index.html (homepage title/description/canonical) and only
 * fix itself after JavaScript runs. This edge function sits in front of the
 * SPA rewrite and, for the public routes below, rewrites the shell so the
 * FIRST response already carries the right <title>, meta description,
 * canonical, robots, Open Graph/Twitter tags, JSON-LD and a small block of
 * crawlable fallback markup.
 *
 *   /car/:id             -> looks the car up in Supabase (REST, anon key),
 *                           renders vehicle meta + Product/Car JSON-LD,
 *                           embeds the row as window.__FNT_CAR__ so React
 *                           renders instantly. Unknown/sold car -> 404 + noindex.
 *   /warranty-financing  -> static meta from src/lib/seo.ts STATIC_PAGES
 *   /terms-conditions, /privacy-policy, /cookie-policy
 *
 * Failure mode: any thrown error bypasses the function (onError: "bypass")
 * and Netlify serves the untouched SPA shell, exactly as before.
 */
import type { Config, Context } from '@netlify/edge-functions';
import {
  NOT_FOUND_META,
  SEO_CAR_COLUMNS,
  STATIC_PAGES,
  buildBreadcrumbJsonLd,
  buildVehicleJsonLd,
  resolveCarImages,
  vehicleMeta,
  vehicleNotFoundMeta,
  type SeoCar,
} from '../../src/lib/seo.ts';
import {
  applyMetaToHtml,
  renderNotFoundFallback,
  renderStaticFallback,
  renderVehicleFallback,
} from '../../src/lib/seoHtml.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUPABASE_TIMEOUT_MS = 4000;

const BROWSER_CACHE = 'public, max-age=0, must-revalidate';
const CDN_CACHE_VEHICLE = 'public, s-maxage=60, stale-while-revalidate=300';
const CDN_CACHE_STATIC = 'public, s-maxage=3600, stale-while-revalidate=86400';
const CDN_CACHE_NOT_FOUND = 'public, s-maxage=60';

type CarLookup = { status: 'ok'; car: SeoCar } | { status: 'missing' } | { status: 'error' };

/** Works in Netlify's Deno runtime (Netlify.env) and in Node for local tests. */
function readEnv(key: string): string | undefined {
  const g = globalThis as unknown as {
    Netlify?: { env?: { get(k: string): string | undefined } };
    process?: { env?: Record<string, string | undefined> };
  };
  return g.Netlify?.env?.get(key) ?? g.process?.env?.[key];
}

function supabaseConfig() {
  const url = (readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL') || '').replace(/\/$/, '');
  const key = readEnv('SUPABASE_ANON_KEY') || readEnv('VITE_SUPABASE_ANON_KEY') || '';
  return url && key ? { url, key } : null;
}

async function fetchCar(id: string): Promise<CarLookup> {
  if (!UUID_RE.test(id)) return { status: 'missing' };
  const cfg = supabaseConfig();
  if (!cfg) {
    console.error('seo edge: Supabase env vars missing');
    return { status: 'error' };
  }

  const endpoint = `${cfg.url}/rest/v1/cars?select=${SEO_CAR_COLUMNS}&id=eq.${id}&is_available=eq.true&limit=1`;
  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error('seo edge: Supabase responded', res.status);
      return { status: 'error' };
    }
    const rows = (await res.json()) as SeoCar[];
    return rows.length ? { status: 'ok', car: rows[0] } : { status: 'missing' };
  } catch (err) {
    console.error('seo edge: Supabase fetch failed', err);
    return { status: 'error' };
  }
}

/** Get the built SPA shell. Prefer the normal chain; fall back to /index.html. */
async function loadShell(request: Request, context: Context): Promise<Response> {
  const viaChain = await context.next();
  const type = viaChain.headers.get('content-type') || '';
  if (viaChain.ok && type.includes('text/html')) return viaChain;
  return fetch(new URL('/index.html', request.url).toString(), { headers: { accept: 'text/html' } });
}

function htmlResponse(shell: Response, body: string, status: number, cdnCache: string): Response {
  const headers = new Headers(shell.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', BROWSER_CACHE);
  headers.set('netlify-cdn-cache-control', cdnCache);
  headers.set('x-fnt-seo', 'edge');
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  return new Response(body, { status, headers });
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Canonical URLs have no trailing slash.
  if (pathname.length > 1 && pathname.endsWith('/')) {
    url.pathname = pathname.replace(/\/+$/, '');
    return Response.redirect(url.toString(), 301);
  }

  const shell = await loadShell(request, context);
  if (!shell.ok) return shell;
  const html = await shell.text();

  // ---- /car/:id ----------------------------------------------------------
  const carMatch = pathname.match(/^\/car\/([^/]+)$/);
  if (carMatch) {
    const id = decodeURIComponent(carMatch[1]);
    const lookup = await fetchCar(id);

    if (lookup.status === 'ok') {
      const car = lookup.car;
      const cfg = supabaseConfig();
      const images = resolveCarImages(car, (path) => `${cfg?.url}/storage/v1/object/public/car-images/${path}`);
      const body = applyMetaToHtml(html, vehicleMeta(car, images), {
        jsonLd: [buildVehicleJsonLd(car, images), buildBreadcrumbJsonLd(car)],
        fallbackHtml: renderVehicleFallback(car, images),
        preload: { id: car.id, car },
      });
      return htmlResponse(shell, body, 200, CDN_CACHE_VEHICLE);
    }

    if (lookup.status === 'missing') {
      const body = applyMetaToHtml(html, vehicleNotFoundMeta(id), {
        fallbackHtml: renderNotFoundFallback('This vehicle is no longer available'),
      });
      return htmlResponse(shell, body, 404, CDN_CACHE_NOT_FOUND);
    }

    // Supabase unreachable: serve a generic, still-indexable shell rather than
    // a false 404 that could get a live listing dropped from the index.
    const body = applyMetaToHtml(
      html,
      { title: 'Used Car for Sale in Manchester', description: STATIC_PAGES['/'].description, path: `/car/${id}`, type: 'product' },
      {}
    );
    return htmlResponse(shell, body, 200, 'no-store');
  }

  // ---- Static marketing / legal pages -------------------------------------
  const page = STATIC_PAGES[pathname];
  if (page && pathname !== '/') {
    const body = applyMetaToHtml(html, page, { fallbackHtml: renderStaticFallback(page) });
    return htmlResponse(shell, body, 200, CDN_CACHE_STATIC);
  }

  // Not a route we template (shouldn't happen given `config.path`).
  if (pathname === '/') return htmlResponse(shell, html, 200, CDN_CACHE_STATIC);
  const body = applyMetaToHtml(html, { ...NOT_FOUND_META, path: pathname }, {
    fallbackHtml: renderNotFoundFallback('Page not found'),
  });
  return htmlResponse(shell, body, 404, CDN_CACHE_NOT_FOUND);
}

export const config: Config = {
  path: [
    '/car/*',
    '/warranty-financing',
    '/warranty-financing/',
    '/terms-conditions',
    '/terms-conditions/',
    '/privacy-policy',
    '/privacy-policy/',
    '/cookie-policy',
    '/cookie-policy/',
  ],
  cache: 'manual',
  onError: 'bypass',
};
