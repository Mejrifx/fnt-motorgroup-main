/**
 * Dynamic sitemap.xml  (served at /sitemap.xml via netlify.toml)
 *
 * Lists the indexable static pages from src/lib/seo.ts plus every currently
 * available car, so Google can discover /car/:id listing pages without
 * executing JS. Vehicle entries include <lastmod> and the primary photo as an
 * image sitemap extension. Read-only — does not touch the AutoTrader sync.
 */
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL, STATIC_PAGES, carPath, resolveCarImages, vehicleName, type SeoCar } from '../../src/lib/seo';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().split('T')[0];
}

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Netlify-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  };

  const urls: string[] = Object.values(STATIC_PAGES).map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  );

  try {
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, make, model, year, price, mileage, fuel_type, transmission, cover_image_url, cover_image_path, updated_at')
      .eq('is_available', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    for (const car of (cars || []) as SeoCar[]) {
      const lastmod = isoDate(car.updated_at);
      const image = resolveCarImages(car, (path) => `${supabaseUrl}/storage/v1/object/public/car-images/${path}`)[0];
      urls.push(`  <url>
    <loc>${SITE_URL}${carPath(escapeXml(car.id))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${
      image
        ? `\n    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n      <image:title>${escapeXml(vehicleName(car))}</image:title>\n    </image:image>`
        : ''
    }
  </url>`);
    }
  } catch (err) {
    // If Supabase is unreachable, still serve the static pages rather than a 500
    // so the sitemap remains available to crawlers.
    console.error('sitemap: failed to load cars from Supabase', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  return {
    statusCode: 200,
    headers,
    body: xml,
  };
};
