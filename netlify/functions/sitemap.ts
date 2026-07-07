/**
 * Dynamic sitemap.xml
 *
 * Lists the static marketing pages plus every currently available car,
 * so Google can discover and index individual /car/:id listing pages
 * without needing to execute JS to find them via client-side links.
 * Read-only — does not touch the AutoTrader sync/webhook functions.
 */
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://fntmotorgroup.co.uk';

const STATIC_PATHS: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/warranty-financing', changefreq: 'monthly', priority: '0.6' },
  { path: '/terms-conditions', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
  { path: '/cookie-policy', changefreq: 'yearly', priority: '0.2' },
];

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  };

  const urls: string[] = STATIC_PATHS.map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  );

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    );

    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, updated_at')
      .eq('is_available', true);

    if (error) throw error;

    for (const car of cars || []) {
      const lastmod = car.updated_at ? new Date(car.updated_at).toISOString().split('T')[0] : undefined;
      urls.push(`  <url>
    <loc>${SITE_URL}/car/${escapeXml(car.id)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  } catch (err) {
    // If Supabase is unreachable, still serve the static pages rather than a 500
    // so the sitemap remains available to crawlers.
    console.error('sitemap: failed to load cars from Supabase', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return {
    statusCode: 200,
    headers,
    body: xml,
  };
};
