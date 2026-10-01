# SEO technical foundations – what changed and how to verify

Scope of this pass: crawl/index foundations for the Vite + React SPA on Netlify
(per-URL HTML metadata, sitemap, 404 handling, NAP/schema consistency). No
marketing copy, no new pages.

## 1. Root cause of the audit findings

* `public/_redirects` contained `/* /index.html 200`. Netlify processes
  `_redirects` **before** `netlify.toml`, so it swallowed the
  `/sitemap.xml -> function` rule in `netlify.toml` (sitemap returned the React
  shell) and turned every unknown URL into a 200 copy of the homepage.
* All metadata was only set client-side (`usePageMeta`), so the first HTML
  response for `/car/:id`, `/warranty-financing`, etc. was the homepage shell.

## 2. Architecture now

| URL | First HTML response comes from | Status |
| --- | --- | --- |
| `/` | `dist/index.html`, filled at build time by the Vite plugin in `vite.config.ts` from `STATIC_PAGES['/']` + site-wide AutoDealer JSON-LD | 200 |
| `/car/:id` | **Edge function** `netlify/edge-functions/seo.ts` – looks the car up in Supabase REST, rewrites title/description/canonical/robots/OG/Twitter, injects `Product`+`Car` JSON-LD with GBP `Offer`, `BreadcrumbList`, crawlable fallback markup (H1, price, specs, photo, links) and `window.__FNT_CAR__` so React renders instantly | 200 |
| `/car/:id` (sold / unknown id) | Edge function, noindex meta + "no longer available" markup | **404** |
| `/warranty-financing`, `/terms-conditions`, `/privacy-policy`, `/cookie-policy` | Edge function, static meta from `STATIC_PAGES` + H1/intro fallback | 200 |
| `/sitemap.xml` | Netlify Function `netlify/functions/sitemap.ts` (Supabase-backed, image extension) | 200, `application/xml` |
| `/admin/*` | SPA shell + `X-Robots-Tag: noindex` header (also `Disallow` in robots.txt) | 200 |
| anything else | `dist/404.html` (second Vite entry; boots the app → `<NotFound />`) | **404** |
| trailing-slash variants of templated routes | 301 to the canonical no-slash URL | 301 |

Why edge functions rather than build-time prerender: stock changes via
AutoTrader webhooks between deploys, so prerendered car pages would go stale
and sold cars would keep returning 200. The edge function reads live data,
costs one REST call per uncached hit (CDN caches it for 60 s), and fails open
(`onError: "bypass"` → the untouched shell is served exactly as before).

### Shared source of truth

* `src/config/business.ts` – NAP: name, legal name, address (Clayton Compound, City Works, Openshaw, M11 2NB),
  phone (`+447735770031` / `07735770031`), WhatsApp, email, opening hours,
  socials, Google Maps link, warranty claim. Also builds the site-wide
  `AutoDealer` JSON-LD and the `Offer.seller` block.
* `src/lib/seo.ts` – `STATIC_PAGES` (title, description, H1, sitemap
  priority per route), vehicle title/description builders, image resolution,
  `Product`/`Car`/`Offer` and `BreadcrumbList` JSON-LD builders.
* `src/lib/seoHtml.ts` – pure string transforms applied to the built shell
  (used by the edge function and the Vite plugin).

The React components (`usePageMeta`, `CarDetails`, `Footer`, `Contact`, `Hero`,
`WarrantyFinancing`, legal pages, `NotFound`) import from the same modules, so
what the crawler sees in the first response and what React renders after
hydration are identical.

### Files touched

* New: `404.html`, `netlify/edge-functions/seo.ts`, `src/config/business.ts`,
  `src/lib/seo.ts`, `src/lib/seoHtml.ts`, `src/components/NotFound.tsx`.
* Changed: `index.html` (viewport fix, JSON-LD now injected from config),
  `vite.config.ts` (SEO HTML plugin, 404 entry), `netlify.toml` (explicit
  routes, 404 fallback, admin noindex), `netlify/functions/sitemap.ts`,
  `src/App.tsx` (`*` → `NotFound`, hash-scroll helper), `src/hooks/usePageMeta.ts`,
  `src/components/{CarDetails,Footer,Contact,Hero,WarrantyFinancing,TermsAndConditions,PrivacyPolicy,CookiePolicy}.tsx`.
* Deleted: `public/_redirects` (see §1).
* `package.json`: `@netlify/edge-functions` added as a dev dependency (types only).

### Requirement checklist

1. Unique title/description/canonical/robots/OG in the first response – yes for
   every public route (table above).
2. Vehicle pages – title `"{Year} {Make} {Model} for sale in Manchester | FNT Motor Group"`,
   description with price, mileage, fuel, gearbox, colour and the 6-month
   warranty/breakdown claim (true per Terms §Warranty), canonical = exact PDP
   URL, `og:image` = primary car photo, `og:type=product`.
3. Sitemap – real XML at `/sitemap.xml`, static pages + every `is_available`
   car with `<lastmod>` and `<image:image>`. Submit `https://fntmotorgroup.co.uk/sitemap.xml`
   in Search Console.
4. `robots.txt` – unchanged (allow all, `Disallow: /admin/`, sitemap pointer).
5. Unknown routes return a real 404 (`404.html`), not the homepage. Sold/unknown
   car IDs also 404 with `noindex`.
6. Viewport – `user-scalable=no` / `maximum-scale=1` removed.
7. NAP unified in `src/config/business.ts` (see flagged conflicts below).
8. JSON-LD – site-wide `AutoDealer` (LocalBusiness subtype) on every page;
   `Product`+`Car` with `Offer{priceCurrency: GBP, availability: InStock}` and
   `BreadcrumbList` on PDPs. No FAQ schema (no FAQ is visible on any page).
9. Crawlable links – homepage nav is now `<a href="#section">` (smooth scroll
   kept), footer links are absolute `/#inventory`, `/#contact`, and the
   "Back" buttons on car/warranty/legal pages are `<Link>`s. Sell-your-car /
   trade-in links point to `/#contact` (the Sell Your Car form). Every templated
   response also carries a plain-HTML nav (Home, Used Cars, Warranty & Finance,
   Sell Your Car, Contact).

## 3. NAP conflicts / things to confirm

* **Opening hours.** Old JSON-LD said Mon–Sun 09:00–17:00; the Contact section
  said "Sunday 9–5 (No car viewings)". Config keeps 09:00–17:00 seven days for
  schema (the phone line is answered) and shows the Sunday caveat as text.
  Make sure Google Business Profile matches.
* **Legal name.** Sales invoices (`src/lib/pdf/invoiceTheme.ts`) print
  "Mauii Ltd T/A FNT Motor Group", so `legalName: "Mauii Ltd"` is now in the
  schema. The Privacy Policy still says the data controller is "FNT Motor
  Group (trading as FNT Motor Group)" – worth correcting in a copy pass.
* **Address.** The live site was updated (commit `eccb2d6`) to
  "Clayton Compound, Clayton Court, City Works, Openshaw, Manchester, M11 2NB"
  with a Google Maps search link; `business.ts` now carries that version and
  every surface (UI, JSON-LD, edge-rendered HTML) reads from it. Sales
  invoices (`src/lib/pdf/invoiceTheme.ts`) were updated upstream too.
* **WhatsApp.** No WhatsApp link existed anywhere. `BUSINESS.whatsapp` is
  defined (assumes the sales mobile 07735 770031 is on WhatsApp) but is
  **not rendered** yet – confirm the number before adding a button.
* **TNT Services** (`745 Ashton Old Rd, Openshaw, M11 2HB`, 07459 905165) is a
  separate business used only on service invoices – not a conflict, but don't
  reuse its details for FNT.
* Email `fntgroupltd@gmail.com` and phone `07735770031` were consistent everywhere.
* `src/components/Header.tsx` is unused (the nav lives in `Hero.tsx`) and
  still has button-based navigation; safe to delete in a cleanup.
* `public/` contains `stock_inventory_database.csv`, `FNT Motor Group(Car Details).csv`
  and invoice PDFs that are publicly fetchable. Not an SEO issue, but consider
  moving them out of the publish directory.

## 4. Netlify deploy notes

* Env vars already used by the sitemap function (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`) are reused by the edge function via
  `Netlify.env.get` – no new variables needed. (`SUPABASE_URL` /
  `SUPABASE_ANON_KEY` are also honoured if you prefer non-`VITE_` names.)
* Edge functions deploy automatically from `netlify/edge-functions/`; the route
  list lives in the function's exported `config.path`.
* `npm run build` now emits `dist/404.html` alongside `dist/index.html`.
* Rollback: deleting `netlify/edge-functions/seo.ts` restores the previous
  behaviour for SPA routes without touching anything else.

## 5. Verification (after deploy)

```bash
# Distinct titles in the FIRST response (no JS)
curl -sL https://fntmotorgroup.co.uk/ | grep -o '<title>[^<]*</title>'
curl -sL https://fntmotorgroup.co.uk/warranty-financing | grep -o '<title>[^<]*</title>'
curl -sL https://fntmotorgroup.co.uk/car/34296749-73d7-4e7e-a9b6-343d9b475bd5 | grep -o '<title>[^<]*</title>'
#  -> Used Cars for Sale in Manchester | FNT Motor Group
#  -> Used Car Warranty &amp; Finance in Manchester | FNT Motor Group
#  -> 2012 Land Rover Range Rover Evoque for sale in Manchester | FNT Motor Group

# Canonical / OG / JSON-LD on a car page
curl -sL https://fntmotorgroup.co.uk/car/34296749-73d7-4e7e-a9b6-343d9b475bd5 \
  | grep -oE '<link rel="canonical"[^>]*>|<meta property="og:image"[^>]*>|"@type":\["Product","Car"\]'
curl -sI https://fntmotorgroup.co.uk/car/34296749-73d7-4e7e-a9b6-343d9b475bd5 | grep -i x-fnt-seo   # x-fnt-seo: edge

# Sitemap is XML and lists URLs
curl -sL https://fntmotorgroup.co.uk/sitemap.xml | head -3        # starts with <?xml
curl -sL https://fntmotorgroup.co.uk/sitemap.xml | grep -c '<loc>'
curl -sI https://fntmotorgroup.co.uk/sitemap.xml | grep -i content-type   # application/xml

# Unknown paths and sold cars return 404
curl -s -o /dev/null -w '%{http_code}\n' https://fntmotorgroup.co.uk/this-does-not-exist          # 404
curl -s -o /dev/null -w '%{http_code}\n' https://fntmotorgroup.co.uk/car/00000000-0000-4000-8000-000000000000  # 404

# Trailing slash -> 301 to canonical
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://fntmotorgroup.co.uk/warranty-financing/

# Admin is noindex
curl -sI https://fntmotorgroup.co.uk/admin/login | grep -i x-robots-tag

# Viewport is zoomable
curl -sL https://fntmotorgroup.co.uk/ | grep -o '<meta name="viewport"[^>]*>'
```

Then: Search Console → Sitemaps → submit `sitemap.xml`; URL Inspection on one
`/car/:id` to confirm "Page is indexable" and the Product rich-result detection;
Rich Results Test on a PDP and the homepage.

The same checks were run locally before deploy against the built `dist/` with
the edge handler executed under Node (real Supabase data): car title, 404 for
unknown/sold ids, 301 for trailing slashes, 33-URL well-formed sitemap with 28
images, and React hydrating from `window.__FNT_CAR__` without a loading spinner.
