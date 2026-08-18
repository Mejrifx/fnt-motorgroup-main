import { PDFDocument, StandardFonts, type PDFImage } from 'pdf-lib';
import {
  COLOR,
  COL_RIGHT_X,
  COL_WIDTH,
  CONTENT_WIDTH,
  MARGIN,
  PAGE,
  TYPE,
  formatMoney,
  type Brand,
} from './invoiceTheme';
import { FOOTER_RULE_Y } from './invoiceChrome';
import {
  ROW_HEIGHT,
  drawText,
  labelValueRow,
  rule,
  sectionHeading,
  signatureLine,
  textBlock,
  type Ctx,
} from './pdfKit';

export interface InvoiceAssets {
  /** PNG bytes for the brand logo. Layout tolerates null so tests can skip it. */
  logo?: ArrayBuffer | Uint8Array | null;
}

export const BASE_SECTION_GAP = 22;
/**
 * Sparse invoices would otherwise leave a void above the signatures, so spare
 * vertical space is shared between the sections instead of pooling at the bottom.
 */
export const MAX_SECTION_GAP_BONUS = 34;
/** Dense invoices tighten instead of running into the signatures and footer. */
export const MIN_SECTION_GAP = 12;
/**
 * The lowest the signature block can sit and still clear the footer rule. Short
 * invoices float their signatures above this, so lowering it only buys room for
 * the dense ones.
 */
export const SIGNATURES_TOP = MARGIN.bottom + 90;
/** Row height for the paired vehicle columns, which run six rows deep. */
export const PAIR_ROW_HEIGHT = 16;
/** Used when a part exchange plus long addresses would otherwise not fit. */
export const PAIR_ROW_HEIGHT_TIGHT = 14;

export async function createCtx(doc: PDFDocument, brand: Brand): Promise<Ctx> {
  return {
    page: doc.addPage([PAGE.width, PAGE.height]),
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    brand,
  };
}

export async function embedLogo(doc: PDFDocument, assets: InvoiceAssets): Promise<PDFImage | null> {
  if (!assets.logo) return null;
  try {
    return await doc.embedPng(assets.logo);
  } catch {
    return null;
  }
}

/**
 * Fetches a brand's logo from /public. A missing or unreadable logo degrades to a
 * logo-less header rather than failing the whole invoice.
 */
export async function loadBrandLogo(brand: Brand): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(brand.logoPath);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export function splitAddress(value?: string): string[] {
  return (value || '')
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function upper(value?: string): string {
  return (value || '').trim().toUpperCase();
}

export function formatMileage(value?: string): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  const numeric = parseFloat(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) return raw;
  return `${Math.round(numeric).toLocaleString('en-GB')} miles`;
}

/** Lays out label/value pairs two per line across the full content width. */
export function twoUpRows(ctx: Ctx, pairs: Array<[string, string]>, top: number): number {
  let y = top;
  for (let i = 0; i < pairs.length; i += 2) {
    labelValueRow(ctx, pairs[i][0], pairs[i][1], MARGIN.left, y, COL_WIDTH);
    if (pairs[i + 1]) {
      labelValueRow(ctx, pairs[i + 1][0], pairs[i + 1][1], COL_RIGHT_X, y, COL_WIDTH);
    }
    y -= ROW_HEIGHT;
  }
  return y;
}

export interface Party {
  heading: string;
  name: string;
  addressLines?: string[];
  phone?: string;
  email?: string;
}

/** The brand's own details, for the "Sold By" / "Purchased By" side. */
export function brandParty(brand: Brand, heading: string): Party {
  return {
    heading,
    name: brand.legalName,
    addressLines: brand.tagline ? [brand.tagline, ...brand.addressLines] : brand.addressLines,
    phone: brand.phone,
    email: brand.email,
  };
}

function drawParty(ctx: Ctx, party: Party, x: number, top: number): number {
  const contentTop = sectionHeading(ctx, party.heading, x, top, COL_WIDTH);
  let bottom = textBlock(ctx, [party.name || '\u2014', ...(party.addressLines ?? [])], x, contentTop, COL_WIDTH, {
    firstLineBold: true,
  });

  const contact = [party.phone ? `Tel: ${party.phone}` : '', party.email || ''].filter(Boolean);
  if (contact.length) {
    bottom = textBlock(ctx, contact, x, bottom - 3, COL_WIDTH, { size: TYPE.small });
  }
  return bottom;
}

/** Two party blocks side by side. Returns the y below the taller of the two. */
export function drawPartyPair(ctx: Ctx, left: Party, right: Party, top: number, gap: number): number {
  const leftBottom = drawParty(ctx, left, MARGIN.left, top);
  const rightBottom = drawParty(ctx, right, COL_RIGHT_X, top);
  return Math.min(leftBottom, rightBottom) - gap;
}

export interface VehicleFields {
  make?: string;
  model?: string;
  reg?: string;
  colour?: string;
  vin?: string;
  mileage?: string;
}

function vehicleRows(vehicle: VehicleFields): Array<[string, string]> {
  return [
    ['Make', vehicle.make || ''],
    ['Model', vehicle.model || ''],
    ['Registration', upper(vehicle.reg)],
    ['Colour', vehicle.colour || ''],
    ['VIN', upper(vehicle.vin)],
    ['Mileage', formatMileage(vehicle.mileage)],
  ];
}

export function drawVehicleSection(
  ctx: Ctx,
  heading: string,
  vehicle: VehicleFields,
  top: number,
  gap: number,
): number {
  const contentTop = sectionHeading(ctx, heading, MARGIN.left, top, CONTENT_WIDTH);
  return twoUpRows(ctx, vehicleRows(vehicle), contentTop) - gap;
}

/**
 * Two vehicles side by side, one per column, each field on its own line. Taller
 * per vehicle than drawVehicleSection but shorter than two of them stacked, which
 * is what keeps a part exchange on the same page as everything else.
 */
export function drawVehiclePair(
  ctx: Ctx,
  left: { heading: string; vehicle: VehicleFields },
  right: { heading: string; vehicle: VehicleFields },
  top: number,
  gap: number,
  options: { rowHeight?: number } = {},
): number {
  const rowHeight = options.rowHeight ?? PAIR_ROW_HEIGHT;

  const column = (heading: string, vehicle: VehicleFields, x: number): number => {
    let y = sectionHeading(ctx, heading, x, top, COL_WIDTH);
    const rows = vehicleRows(vehicle);
    rows.forEach(([label, value], index) => {
      y = labelValueRow(ctx, label, value, x, y, COL_WIDTH, {
        showRule: index < rows.length - 1,
        rowHeight,
      });
    });
    return y;
  };

  const leftBottom = column(left.heading, left.vehicle, MARGIN.left);
  const rightBottom = column(right.heading, right.vehicle, COL_RIGHT_X);
  return Math.min(leftBottom, rightBottom) - gap;
}

export interface SummaryRow {
  label: string;
  value: string;
  sublabel?: string;
}

/**
 * Right-hand money column: rows, a heavier rule, then the total in the brand
 * accent. Returns the y below the total.
 */
export function drawSummary(
  ctx: Ctx,
  heading: string,
  rows: SummaryRow[],
  total: { label: string; value: string },
  top: number,
  x: number = COL_RIGHT_X,
  width: number = COL_WIDTH,
): number {
  let y = sectionHeading(ctx, heading, x, top, width);
  for (const row of rows) {
    y = labelValueRow(ctx, row.label, row.value, x, y, width, { sublabel: row.sublabel });
  }

  rule(ctx, x, y + 3, width, 1.2, COLOR.rule);

  const totalBaseline = y - 13;
  drawText(ctx, total.label.toUpperCase(), {
    x,
    y: totalBaseline,
    size: 10,
    font: ctx.bold,
    color: COLOR.heading,
    tracking: 0.8,
  });
  drawText(ctx, total.value || formatMoney(0), {
    x,
    y: totalBaseline,
    size: TYPE.total,
    font: ctx.bold,
    color: ctx.brand.accent,
    align: 'right',
    width,
  });

  return totalBaseline - 10;
}

/** The brand's bank details, for invoices where the brand is being paid. */
export function drawBankDetails(ctx: Ctx, top: number, x: number = MARGIN.left): number {
  const bank = ctx.brand.bank;
  if (!bank) return top;

  let y = sectionHeading(ctx, 'Payment Details', x, top, COL_WIDTH);
  y = labelValueRow(ctx, 'Account Name', bank.accountName, x, y, COL_WIDTH);
  y = labelValueRow(ctx, 'Sort Code', bank.sortCode, x, y, COL_WIDTH);
  y = labelValueRow(ctx, 'Account Number', bank.accountNumber, x, y, COL_WIDTH);
  return labelValueRow(ctx, 'Payment Reference', bank.reference, x, y, COL_WIDTH, { showRule: false });
}

/** A bulleted block, used for on-page terms and declarations. */
export function drawBulletedBlock(
  ctx: Ctx,
  heading: string,
  items: string[],
  x: number,
  top: number,
  width: number,
  options: { size?: number } = {},
): number {
  const size = options.size ?? 8.3;
  const leading = size + 3.4;
  const indent = 10;
  let y = sectionHeading(ctx, heading, x, top, width);

  for (const item of items) {
    const lines = wrap(ctx, item, size, width - indent);
    lines.forEach((line, index) => {
      if (index === 0) {
        drawText(ctx, '\u00B7', {
          x,
          y: y - size,
          size: size + 1.5,
          font: ctx.bold,
          color: ctx.brand.accent,
        });
      }
      drawText(ctx, line, { x: x + indent, y: y - size, size, font: ctx.regular, color: COLOR.body });
      y -= leading;
    });
    y -= 2;
  }

  return y;
}

function wrap(ctx: Ctx, value: string, size: number, maxWidth: number): string[] {
  // Kept local so drawBulletedBlock does not need the wrapText import at call sites.
  const words = value.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.regular.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Seller and buyer signature lines, pinned above the footer. */
export function drawSignaturePair(
  ctx: Ctx,
  left: { caption: string; signed?: string },
  right: { caption: string; signed?: string },
  top: number = SIGNATURES_TOP,
): void {
  signatureLine(ctx, left.caption, left.signed || '', MARGIN.left, top, COL_WIDTH);
  signatureLine(ctx, right.caption, right.signed || '', COL_RIGHT_X, top, COL_WIDTH);
}

export interface BalancedLayout {
  /** The gap to use between sections. */
  gap: number;
  /** Where the signature block should sit, given that gap. */
  signaturesTop: number;
  /**
   * How far past the floor the body runs once the gaps have tightened as far as
   * they go. Zero or less means it fits; positive means the caller needs to give
   * up some height of its own.
   */
  overflow: number;
}

/**
 * Lays a body out on throwaway documents to work out how to fill the page: first
 * at the base gap to measure the natural height, then at the chosen gap to find
 * where the content actually ends. The scratch documents are discarded, so
 * nothing extra reaches the delivered PDF.
 *
 * Spare space is spread between the sections up to a limit. Anything still left
 * over after that stays below the signatures rather than opening a void above
 * them, so a sparse invoice reads as short rather than broken. A body that runs
 * long tightens its gaps instead, down to MIN_SECTION_GAP.
 */
export async function balanceLayout(options: {
  brand: Brand;
  assets: InvoiceAssets;
  /** How many inter-section gaps the body uses. */
  gapCount: number;
  /** The y the body should not drop below. */
  floorY?: number;
  render: (ctx: Ctx, logo: PDFImage | null, gap: number) => number;
}): Promise<BalancedLayout> {
  const measure = async (gap: number) => {
    const scratch = await PDFDocument.create();
    const ctx = await createCtx(scratch, options.brand);
    const logo = await embedLogo(scratch, options.assets);
    return options.render(ctx, logo, gap);
  };

  const floor = options.floorY ?? SIGNATURES_TOP;
  const naturalBottom = await measure(BASE_SECTION_GAP);
  const slackPerGap = (naturalBottom - floor) / options.gapCount;
  const bonus = Math.min(
    MAX_SECTION_GAP_BONUS,
    Math.max(MIN_SECTION_GAP - BASE_SECTION_GAP, slackPerGap),
  );
  const gap = BASE_SECTION_GAP + bonus;

  const bodyBottom = bonus === 0 ? naturalBottom : await measure(gap);

  return {
    gap,
    signaturesTop: Math.max(SIGNATURES_TOP, bodyBottom),
    overflow: floor - bodyBottom,
  };
}

export { FOOTER_RULE_Y };
