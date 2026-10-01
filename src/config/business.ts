/**
 * Single source of truth for FNT Motor Group's NAP (Name / Address / Phone)
 * and related business identity data.
 *
 * Used by the React UI, the per-page JSON-LD, the Netlify edge function that
 * renders per-URL <head> tags, and the sitemap function. Change it here and
 * every surface stays consistent (Google cross-checks NAP across the web, so
 * a mismatch between the footer, schema and Google Business Profile hurts
 * local rankings).
 *
 * This module must stay dependency-free and environment-agnostic: it is
 * imported from browser code (Vite), Node (Netlify Functions) and Deno
 * (Netlify Edge Functions).
 */

export const SITE_URL = 'https://fntmotorgroup.co.uk';

export const BUSINESS = {
  name: 'FNT Motor Group',
  /** Registered company, as printed on sales invoices (src/lib/pdf/invoiceTheme.ts). */
  legalName: 'Mauii Ltd',
  /** Short descriptor used in titles/descriptions. */
  tagline: 'Used car dealer in Manchester',
  email: 'fntgroupltd@gmail.com',

  /**
   * Primary sales line. `e164` is the machine format for JSON-LD / tel: links,
   * `display` is what humans see on the site.
   */
  phone: {
    e164: '+447735770031',
    display: '07735770031',
    href: 'tel:+447735770031',
  },

  /**
   * WhatsApp. Assumed to be the same handset as the primary sales line – if
   * the showroom uses a different WhatsApp number, change it here only.
   * Not rendered in the UI yet (see SEO_TECHNICAL_NOTES.md).
   */
  whatsapp: {
    number: '447735770031',
    href: 'https://wa.me/447735770031',
  },

  address: {
    /** Showroom location within the City Works estate (updated Sept 2026). */
    streetAddress: 'Clayton Compound, Clayton Court, City Works',
    /** Local district; M11 2NB is in Openshaw, east Manchester. */
    district: 'Openshaw',
    locality: 'Manchester',
    region: 'Greater Manchester',
    postcode: 'M11 2NB',
    country: 'GB',
    countryName: 'United Kingdom',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Clayton%20Compound%2C%20Clayton%20Court%2C%20City%20Works%2C%20Openshaw%2C%20Manchester%2C%20M11%202NB',
  },

  /**
   * Opening hours. The showroom answers the phone and is open 7 days,
   * 09:00–17:00, but does not do car viewings on Sundays. The structured
   * data advertises the hours the business is reachable; the Sunday caveat is
   * shown as text in the Contact section.
   */
  openingHours: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '17:00',
    },
  ],
  openingHoursDisplay: [
    'Monday - Saturday: 9:00 AM - 5:00 PM',
    'Sunday: 9:00 AM - 5:00 PM (No car viewings)',
  ],

  social: {
    instagram: 'https://www.instagram.com/fnt_motorgroup/',
    tiktok: 'https://www.tiktok.com/@fntmotorgroup',
    autotrader: 'https://www.autotrader.co.uk/dealers/lancashire/manchester/fnt-motor-group-10042804',
  },

  logoUrl: `${SITE_URL}/fnt-logo.png`,
  priceRange: '££',

  /** Marketing claims that are true for every vehicle (see Terms §Warranty). */
  warranty: {
    months: 6,
    breakdownCoverMonths: 6,
    /** Short phrase safe to use in meta descriptions. */
    shortClaim: '6-month warranty & breakdown cover included',
  },
} as const;

/** Human-readable address lines, used by Footer / Contact / legal pages. */
export const ADDRESS_LINES: readonly string[] = [
  BUSINESS.address.streetAddress,
  `${BUSINESS.address.district}, ${BUSINESS.address.locality} ${BUSINESS.address.postcode}`,
  BUSINESS.address.countryName,
];

/** Single-line address, e.g. for legal "contact us" blocks. */
export const ADDRESS_ONE_LINE = `${BUSINESS.address.streetAddress}, ${BUSINESS.address.district}, ${BUSINESS.address.locality}, ${BUSINESS.address.postcode}`;

export const BUSINESS_SCHEMA_ID = `${SITE_URL}/#business`;

/**
 * Site-wide LocalBusiness (AutoDealer) JSON-LD. Injected into every HTML
 * document at build time (see vite.config.ts) so Google sees identical NAP
 * data whichever page it crawls.
 */
export function buildBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': BUSINESS_SCHEMA_ID,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description:
      'Independent used car dealer in Openshaw, Manchester. Every car comes with a 6-month warranty and breakdown cover, with flexible finance available.',
    url: `${SITE_URL}/`,
    logo: BUSINESS.logoUrl,
    image: BUSINESS.logoUrl,
    telephone: BUSINESS.phone.e164,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: 'GBP',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postcode,
      addressCountry: BUSINESS.address.country,
    },
    hasMap: BUSINESS.address.googleMapsUrl,
    areaServed: [
      { '@type': 'City', name: 'Manchester' },
      { '@type': 'AdministrativeArea', name: 'Greater Manchester' },
    ],
    openingHoursSpecification: BUSINESS.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [...h.days],
      opens: h.opens,
      closes: h.closes,
    })),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: BUSINESS.phone.e164,
        email: BUSINESS.email,
        areaServed: 'GB',
        availableLanguage: 'en',
      },
    ],
    sameAs: [BUSINESS.social.instagram, BUSINESS.social.tiktok, BUSINESS.social.autotrader],
  };
}

/**
 * Compact seller reference for Offer.seller on vehicle pages. Carries the
 * same @id as the site-wide block so Google merges the two.
 */
export function buildSellerJsonLd() {
  return {
    '@type': 'AutoDealer',
    '@id': BUSINESS_SCHEMA_ID,
    name: BUSINESS.name,
    telephone: BUSINESS.phone.e164,
    url: `${SITE_URL}/`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postcode,
      addressCountry: BUSINESS.address.country,
    },
  };
}
