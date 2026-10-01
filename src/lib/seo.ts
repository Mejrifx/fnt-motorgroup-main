/**
 * Shared SEO helpers: per-route titles/descriptions, vehicle meta and
 * JSON-LD builders.
 *
 * Imported by three runtimes, so keep it pure (no DOM, no `import.meta.env`,
 * no node_modules):
 *  - the React app (usePageMeta / CarDetails) – client-side updates
 *  - netlify/edge-functions/seo.ts – writes the same values into the FIRST
 *    HTML response so crawlers don't need to run JS
 *  - netlify/functions/sitemap.ts – list of indexable static routes
 */
import { BUSINESS, SITE_URL, buildSellerJsonLd } from '../config/business.ts';

export { SITE_URL };
export const SITE_NAME = BUSINESS.name;
export const DEFAULT_OG_IMAGE = BUSINESS.logoUrl;
export const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large';
export const NOINDEX_ROBOTS = 'noindex, nofollow';

export interface PageMeta {
  /** Title without the " | FNT Motor Group" suffix. */
  title: string;
  description: string;
  /** Path starting with "/". */
  path: string;
  image?: string;
  type?: 'website' | 'product';
  robots?: string;
}

export interface StaticPage extends PageMeta {
  /** Visible heading rendered into the no-JS fallback markup. */
  h1: string;
  /** One or two sentences for the no-JS fallback. */
  intro: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

/**
 * Every indexable static route. The React components, the edge function and
 * the sitemap all read from this list, so a route can't drift out of sync.
 */
export const STATIC_PAGES: Record<string, StaticPage> = {
  '/': {
    path: '/',
    title: 'Used Cars for Sale in Manchester',
    description:
      'Browse quality used cars for sale at FNT Motor Group in Openshaw, Manchester. Trusted dealer with 6-month warranty, flexible finance and 1,000+ happy customers. Visit our showroom or shop online today.',
    h1: 'Welcome to FNT Motor Group',
    intro: 'Quality used cars for sale in Openshaw, Manchester. Every car comes with a 6-month warranty and breakdown cover.',
    changefreq: 'daily',
    priority: '1.0',
  },
  '/warranty-financing': {
    path: '/warranty-financing',
    title: 'Used Car Warranty & Finance in Manchester',
    description:
      'Every car from FNT Motor Group comes with 6 months warranty and 6 months breakdown cover. Flexible used car finance from 3 to 36 months available on all vehicles at our Manchester showroom.',
    h1: 'Warranty & Financing',
    intro:
      'Comprehensive protection and flexible finance options for your peace of mind. Every vehicle we sell includes 6 months warranty and 6 months breakdown cover.',
    changefreq: 'monthly',
    priority: '0.6',
  },
  '/terms-conditions': {
    path: '/terms-conditions',
    title: 'Terms & Conditions',
    description: 'Terms and conditions for buying a used vehicle from FNT Motor Group, Manchester, including warranty, payment and consumer rights.',
    h1: 'Terms and Conditions',
    intro: 'The terms that apply when you buy a vehicle from FNT Motor Group.',
    changefreq: 'yearly',
    priority: '0.2',
  },
  '/privacy-policy': {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'How FNT Motor Group collects, uses and protects your personal data.',
    h1: 'Privacy Policy',
    intro: 'How we collect, use and protect your personal data.',
    changefreq: 'yearly',
    priority: '0.2',
  },
  '/cookie-policy': {
    path: '/cookie-policy',
    title: 'Cookie Policy',
    description: 'How FNT Motor Group uses cookies on fntmotorgroup.co.uk.',
    h1: 'Cookie Policy',
    intro: 'How this website uses cookies.',
    changefreq: 'yearly',
    priority: '0.2',
  },
};

export const NOT_FOUND_META: PageMeta = {
  path: '',
  title: 'Page Not Found',
  description: 'The page you were looking for does not exist. Browse used cars for sale at FNT Motor Group, Manchester.',
  robots: NOINDEX_ROBOTS,
};

export function withSiteName(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function carPath(id: string): string {
  return `/car/${id}`;
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

/** Minimal car shape needed for SEO – a subset of `Car` from lib/supabase. */
export interface SeoCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string | null;
  fuel_type: string | null;
  transmission: string | null;
  colour?: string | null;
  engine?: string | null;
  doors?: number | null;
  style?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  cover_image_path?: string | null;
  gallery_images?: string[] | null;
  gallery_image_paths?: string[] | null;
  is_available?: boolean | null;
  updated_at?: string | null;
}

/** Columns the edge function and sitemap request from Supabase. */
export const SEO_CAR_COLUMNS =
  'id,make,model,year,price,mileage,fuel_type,transmission,colour,engine,doors,style,description,cover_image_url,cover_image_path,gallery_images,gallery_image_paths,is_available,updated_at';

export function formatPrice(price: number): string {
  const rounded = Math.round(Number(price) || 0);
  return `£${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** "64000" / "64,000 Miles" / "64000 miles" -> "64,000 miles". */
export function formatMileage(mileage: string | null | undefined): string {
  if (!mileage) return '';
  const digits = mileage.replace(/[^\d]/g, '');
  if (!digits) return mileage;
  return `${Number(digits).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} miles`;
}

export function mileageNumber(mileage: string | null | undefined): number | undefined {
  if (!mileage) return undefined;
  const n = parseInt(mileage.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** AutoTrader CDN URLs contain a `{resize}` token. */
export function resolveImageUrl(url: string): string {
  return url.replace('{resize}', 'w800');
}

/**
 * Ordered, de-duplicated image list for a car. `storageUrl` turns a Supabase
 * Storage path into a public URL (the client uses supabase-js, the edge
 * function builds it from the project URL).
 */
export function resolveCarImages(car: SeoCar, storageUrl: (path: string) => string): string[] {
  const images: string[] = [];
  const push = (url: string) => {
    if (url && !images.includes(url)) images.push(url);
  };

  if (car.cover_image_path) push(storageUrl(car.cover_image_path));
  else if (car.cover_image_url) push(resolveImageUrl(car.cover_image_url));

  (car.gallery_image_paths || []).forEach((p) => push(storageUrl(p)));
  (car.gallery_images || []).forEach((u) => push(resolveImageUrl(u)));

  return images;
}

export function vehicleName(car: SeoCar): string {
  return `${car.year} ${car.make} ${car.model}`.trim();
}

/** "{Year} {Make} {Model} for sale in Manchester" (site name appended by withSiteName). */
export function vehicleTitle(car: SeoCar): string {
  return `${vehicleName(car)} for sale in Manchester`;
}

export function vehicleDescription(car: SeoCar): string {
  const specs = [formatPrice(car.price), formatMileage(car.mileage), car.fuel_type, car.transmission, car.colour]
    .filter(Boolean)
    .join(', ');
  return `${vehicleName(car)} for sale at ${SITE_NAME}, ${BUSINESS.address.locality} – ${specs}. ${BUSINESS.warranty.shortClaim}. Call ${BUSINESS.phone.display}.`;
}

export function vehicleMeta(car: SeoCar, images: string[]): PageMeta {
  return {
    title: vehicleTitle(car),
    description: vehicleDescription(car),
    path: carPath(car.id),
    image: images[0],
    type: 'product',
  };
}

/** Meta for /car/:id when the car has been sold/removed – noindex + 404. */
export function vehicleNotFoundMeta(id: string): PageMeta {
  return {
    title: 'Vehicle No Longer Available',
    description: 'This vehicle is no longer available. Browse our current used cars for sale in Manchester.',
    path: carPath(id),
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * Product + Car JSON-LD with a GBP Offer. `Car` is a schema.org subtype of
 * Product, so declaring both keeps Google's Product rich-result parser happy
 * while still exposing vehicle-specific fields.
 */
export function buildVehicleJsonLd(car: SeoCar, images: string[]) {
  const url = absoluteUrl(carPath(car.id));
  const odometer = mileageNumber(car.mileage);
  const description = (car.description || vehicleDescription(car)).replace(/\s+/g, ' ').trim().slice(0, 500);

  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Car'],
    '@id': `${url}#vehicle`,
    name: vehicleName(car),
    description,
    sku: car.id,
    url,
    image: images.slice(0, 8),
    brand: { '@type': 'Brand', name: car.make },
    model: car.model,
    vehicleModelDate: String(car.year),
    productionDate: String(car.year),
    itemCondition: 'https://schema.org/UsedCondition',
    ...(car.fuel_type ? { fuelType: car.fuel_type } : {}),
    ...(car.transmission ? { vehicleTransmission: car.transmission } : {}),
    ...(car.colour ? { color: car.colour } : {}),
    ...(car.doors ? { numberOfDoors: car.doors } : {}),
    ...(car.style ? { vehicleConfiguration: car.style } : {}),
    ...(car.engine ? { vehicleEngine: { '@type': 'EngineSpecification', name: car.engine } } : {}),
    ...(odometer !== undefined
      ? { mileageFromOdometer: { '@type': 'QuantitativeValue', value: odometer, unitCode: 'SMI' } }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      price: Number(car.price),
      priceCurrency: 'GBP',
      availability: car.is_available === false ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      businessFunction: 'http://purl.org/goodrelations/v1#Sell',
      seller: buildSellerJsonLd(),
    },
  };
}

export function buildBreadcrumbJsonLd(car: SeoCar) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Used Cars', item: `${SITE_URL}/#inventory` },
      { '@type': 'ListItem', position: 3, name: vehicleName(car), item: absoluteUrl(carPath(car.id)) },
    ],
  };
}

/**
 * Shape of the data the edge function embeds in the HTML for /car/:id so the
 * React page can render immediately instead of showing a spinner and
 * re-fetching what the server already looked up.
 */
export interface PreloadedCar {
  id: string;
  car: SeoCar & Record<string, unknown>;
}

export const PRELOAD_GLOBAL = '__FNT_CAR__';
