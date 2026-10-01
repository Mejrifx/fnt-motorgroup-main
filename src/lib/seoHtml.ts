/**
 * Pure string transforms that turn the built `index.html` shell into a
 * URL-specific document: <title>, description, canonical, robots, Open Graph,
 * Twitter, JSON-LD and a small block of crawlable fallback markup inside
 * #root (replaced by React as soon as the bundle runs).
 *
 * Runs inside the Netlify edge function (Deno). Kept dependency-free so it can
 * also be unit-tested under Node.
 */
import { ADDRESS_LINES, BUSINESS } from '../config/business.ts';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_ROBOTS,
  PRELOAD_GLOBAL,
  SITE_NAME,
  absoluteUrl,
  formatMileage,
  formatPrice,
  vehicleName,
  withSiteName,
  type PageMeta,
  type SeoCar,
  type StaticPage,
} from './seo.ts';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON that is safe to inline inside a <script> element. */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace `content` of a <meta name|property="..."> or append it if missing. */
function upsertMeta(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const re = new RegExp(`(<meta\\s+${attr}="${escapeRegExp(key)}"\\s+content=")[^"]*(")`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, `$1${escapeHtml(content)}$2`);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertCanonical(html: string, href: string): string {
  const re = /(<link\s+rel="canonical"\s+href=")[^"]*(")/i;
  if (re.test(html)) return html.replace(re, `$1${escapeHtml(href)}$2`);
  return html.replace('</head>', `    <link rel="canonical" href="${escapeHtml(href)}" />\n  </head>`);
}

function setTitle(html: string, title: string): string {
  const tag = `<title>${escapeHtml(title)}</title>`;
  if (/<title>[\s\S]*?<\/title>/i.test(html)) return html.replace(/<title>[\s\S]*?<\/title>/i, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

export interface ApplyMetaOptions {
  /** Extra JSON-LD blocks for this page (the site-wide business block is already in the shell). */
  jsonLd?: object[];
  /** Markup injected inside <div id="root"> for crawlers / no-JS clients. */
  fallbackHtml?: string;
  /** Data exposed as window[PRELOAD_GLOBAL] so React can render without re-fetching. */
  preload?: unknown;
}

/**
 * Rewrite the shell's head (and optionally body) for one URL. Idempotent –
 * running it twice with the same meta yields the same document.
 */
export function applyMetaToHtml(html: string, meta: PageMeta, opts: ApplyMetaOptions = {}): string {
  const title = withSiteName(meta.title);
  // An empty path (e.g. the generic 404 document) has no canonical URL.
  const url = meta.path ? absoluteUrl(meta.path) : '';
  const image = meta.image || DEFAULT_OG_IMAGE;
  const robots = meta.robots || DEFAULT_ROBOTS;

  let out = setTitle(html, title);
  out = upsertMeta(out, 'name', 'description', meta.description);
  out = upsertMeta(out, 'name', 'robots', robots);
  out = url ? upsertCanonical(out, url) : out.replace(/\s*<link\s+rel="canonical"[^>]*>/i, '');

  out = upsertMeta(out, 'property', 'og:type', meta.type || 'website');
  out = upsertMeta(out, 'property', 'og:site_name', SITE_NAME);
  out = upsertMeta(out, 'property', 'og:title', title);
  out = upsertMeta(out, 'property', 'og:description', meta.description);
  out = url ? upsertMeta(out, 'property', 'og:url', url) : out.replace(/\s*<meta\s+property="og:url"[^>]*>/i, '');
  out = upsertMeta(out, 'property', 'og:image', image);
  out = upsertMeta(out, 'property', 'og:locale', 'en_GB');

  out = upsertMeta(out, 'name', 'twitter:card', 'summary_large_image');
  out = upsertMeta(out, 'name', 'twitter:title', title);
  out = upsertMeta(out, 'name', 'twitter:description', meta.description);
  out = upsertMeta(out, 'name', 'twitter:image', image);

  // Per-page JSON-LD. Same element id the client hook uses, so React simply
  // replaces it instead of duplicating.
  out = out.replace(/<script[^>]*id="page-jsonld"[^>]*>[\s\S]*?<\/script>\s*/gi, '');
  if (opts.jsonLd && opts.jsonLd.length) {
    const scripts = opts.jsonLd
      .map((block) => `    <script type="application/ld+json" id="page-jsonld">${safeJsonForScript(block)}</script>`)
      .join('\n');
    out = out.replace('</head>', `${scripts}\n  </head>`);
  }

  if (opts.preload !== undefined) {
    const script = `    <script>window.${PRELOAD_GLOBAL}=${safeJsonForScript(opts.preload)};</script>\n`;
    out = out.includes('<script type="module"')
      ? out.replace('<script type="module"', `${script}    <script type="module"`)
      : out.replace('</body>', `${script}</body>`);
  }

  if (opts.fallbackHtml) {
    out = out.replace(/<div id="root"><\/div>/, `<div id="root">${opts.fallbackHtml}</div>`);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Fallback markup (what a crawler or no-JS client sees inside #root)
// ---------------------------------------------------------------------------

const FALLBACK_STYLE =
  'max-width:1100px;margin:0 auto;padding:48px 20px 64px;color:#f5f5f7;font-family:Inter,system-ui,sans-serif;line-height:1.6';
const HEADING_STYLE = "font-family:Outfit,Inter,system-ui,sans-serif;letter-spacing:-0.02em;font-weight:800;margin:0 0 12px";
const LINK_STYLE = 'color:#ff4943;text-decoration:none';
const MUTED_STYLE = 'color:#a1a1aa';

/** Crawlable site navigation. Rendered on every server-templated page. */
function renderNav(): string {
  const links: [string, string][] = [
    ['/', 'Home'],
    ['/#inventory', 'Used Cars'],
    ['/warranty-financing', 'Warranty & Finance'],
    ['/#contact', 'Sell Your Car'],
    ['/#contact', 'Contact'],
  ];
  return `<nav aria-label="Main" style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:32px;font-size:14px">${links
    .map(([href, label]) => `<a href="${href}" style="color:#f5f5f7;text-decoration:none">${escapeHtml(label)}</a>`)
    .join('')}</nav>`;
}

function renderContactBlock(): string {
  return `<address style="font-style:normal;margin-top:32px;${MUTED_STYLE}">
<strong style="color:#f5f5f7">${escapeHtml(BUSINESS.name)}</strong><br />
${ADDRESS_LINES.map(escapeHtml).join('<br />')}<br />
<a href="${BUSINESS.phone.href}" style="${LINK_STYLE}">${escapeHtml(BUSINESS.phone.display)}</a> ·
<a href="mailto:${BUSINESS.email}" style="${LINK_STYLE}">${escapeHtml(BUSINESS.email)}</a><br />
${BUSINESS.openingHoursDisplay.map(escapeHtml).join('<br />')}
</address>`;
}

export function renderStaticFallback(page: StaticPage): string {
  return `<main style="${FALLBACK_STYLE}">${renderNav()}
<h1 style="${HEADING_STYLE};font-size:40px">${escapeHtml(page.h1)}</h1>
<p style="font-size:18px;${MUTED_STYLE}">${escapeHtml(page.intro)}</p>
${renderContactBlock()}
</main>`;
}

export function renderVehicleFallback(car: SeoCar, images: string[]): string {
  const name = vehicleName(car);
  const specs: [string, string | number | null | undefined][] = [
    ['Price', formatPrice(car.price)],
    ['Mileage', formatMileage(car.mileage)],
    ['Fuel', car.fuel_type],
    ['Gearbox', car.transmission],
    ['Colour', car.colour],
    ['Engine', car.engine],
    ['Body / trim', car.style],
    ['Doors', car.doors],
  ];
  const specRows = specs
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(
      ([k, v]) =>
        `<div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1)"><dt style="${MUTED_STYLE}">${escapeHtml(k)}</dt><dd style="margin:0;font-weight:500">${escapeHtml(v)}</dd></div>`
    )
    .join('');

  const hero = images[0]
    ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(name)}" width="800" height="500" style="width:100%;max-width:800px;height:auto;border-radius:24px;display:block;margin:0 0 24px" />`
    : '';

  const description = car.description
    ? `<section style="margin-top:32px"><h2 style="${HEADING_STYLE};font-size:24px">Description</h2><p style="white-space:pre-line;${MUTED_STYLE}">${escapeHtml(
        car.description.replace(/^✨\s*/, '')
      )}</p></section>`
    : '';

  return `<main style="${FALLBACK_STYLE}">${renderNav()}
<p style="margin:0 0 8px;font-size:14px"><a href="/#inventory" style="${LINK_STYLE}">&larr; Back to used cars</a></p>
<h1 style="${HEADING_STYLE};font-size:36px">${escapeHtml(name)} for sale in ${escapeHtml(BUSINESS.address.locality)}</h1>
<p style="font-size:32px;font-weight:700;color:#ff4943;margin:0 0 24px;font-variant-numeric:tabular-nums">${escapeHtml(formatPrice(car.price))}</p>
${hero}
<dl style="margin:0;max-width:520px">${specRows}</dl>
<p style="margin-top:24px;${MUTED_STYLE}">${escapeHtml(BUSINESS.warranty.shortClaim)}. Flexible finance available – see <a href="/warranty-financing" style="${LINK_STYLE}">warranty &amp; finance</a>.</p>
<p><a href="${BUSINESS.phone.href}" style="${LINK_STYLE};font-weight:600">Call ${escapeHtml(BUSINESS.phone.display)}</a> ·
<a href="mailto:${BUSINESS.email}?subject=${encodeURIComponent(`Enquiry about ${name}`)}" style="${LINK_STYLE};font-weight:600">Email enquiry</a></p>
${description}
${renderContactBlock()}
</main>`;
}

export function renderNotFoundFallback(message: string): string {
  return `<main style="${FALLBACK_STYLE}">${renderNav()}
<h1 style="${HEADING_STYLE};font-size:40px">${escapeHtml(message)}</h1>
<p style="font-size:18px;${MUTED_STYLE}">Browse our current <a href="/#inventory" style="${LINK_STYLE}">used cars for sale in Manchester</a> or <a href="/#contact" style="${LINK_STYLE}">get in touch</a>.</p>
${renderContactBlock()}
</main>`;
}
