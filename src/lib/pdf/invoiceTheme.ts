import { rgb, type RGB } from 'pdf-lib';

/** A4 at 72dpi. */
export const PAGE = {
  width: 595.28,
  height: 841.89,
};

export const MARGIN = {
  left: 46,
  right: 46,
  top: 44,
  bottom: 44,
};

export const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

/** Two equal columns with a gutter, used for the paired sections. */
export const GUTTER = 26;
export const COL_WIDTH = (CONTENT_WIDTH - GUTTER) / 2;
export const COL_RIGHT_X = MARGIN.left + COL_WIDTH + GUTTER;

/** Neutrals shared by every invoice; the accent comes from the brand. */
export const COLOR = {
  heading: rgb(0.07, 0.075, 0.09),
  body: rgb(0.16, 0.17, 0.2),
  muted: rgb(0.45, 0.47, 0.51),
  hairline: rgb(0.87, 0.88, 0.9),
  rule: rgb(0.22, 0.23, 0.26),
};

export const TYPE = {
  title: 23,
  sectionHeading: 8.5,
  label: 8.5,
  value: 9.5,
  body: 9,
  small: 8,
  footer: 7.5,
  total: 13,
};

export interface BankDetails {
  accountName: string;
  sortCode: string;
  accountNumber: string;
  reference: string;
}

export interface Brand {
  accent: RGB;
  name: string;
  legalName: string;
  tagline?: string;
  addressLines: string[];
  phone: string;
  email: string;
  website: string;
  vatNumber?: string;
  bank?: BankDetails;
  /** Path under /public, fetched by the browser at generation time. */
  logoPath: string;
}

/** FNT Motor Group — vehicle sales. Accent matches tailwind `fnt-red`. */
export const FNT_BRAND: Brand = {
  accent: rgb(1, 0.286, 0.263),
  name: 'FNT Motor Group',
  legalName: 'Mauii Ltd T/A FNT Motor Group',
  addressLines: ['Unit 1, Clayton Court', '5 Welcomb Street', 'Manchester', 'M11 2NB'],
  phone: '+44 773 577 0031',
  email: 'fntgroupltd@gmail.com',
  website: 'fntmotorgroup.co.uk',
  vatNumber: '475084865',
  bank: {
    accountName: 'Mauii LTD',
    sortCode: '04-00-03',
    accountNumber: '96940479',
    reference: 'Vehicle Registration',
  },
  logoPath: '/FNT Invoice Logo.png',
};

/**
 * TNT Services — a separate business (valeting, tyres and mechanical work), so it
 * carries its own identity, address and accent sampled from the TNT logo.
 */
export const TNT_BRAND: Brand = {
  accent: rgb(0.953, 0.447, 0.024),
  name: 'TNT Services',
  legalName: 'TNT Services',
  tagline: 'Valet, Tyres & Mechanics',
  addressLines: ['745 Ashton Old Rd', 'Openshaw', 'Manchester', 'M11 2HB'],
  phone: '+44 745 990 5165',
  email: 'tnttires@outlook.com',
  website: 'tntservices.store',
  logoPath: '/TNT Logo.png',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Renders an ISO date (yyyy-mm-dd) as "14 August 2026". Falls back to the raw
 * string so a malformed date never blanks the field on the invoice.
 */
export function formatInvoiceDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
  if (!match) return iso || '';
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return iso;
  return `${Number(day)} ${monthName} ${year}`;
}

/** Formats a raw numeric string as "£8,090.00". Returns '' for empty input. */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numeric)) return '';
  const [whole, decimals] = numeric.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `\u00A3${grouped}.${decimals}`;
}

/** True when a money-ish string carries a meaningful (non-zero) amount. */
export function hasAmount(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined || value === '') return false;
  const numeric = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) && numeric !== 0;
}
