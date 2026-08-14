import type { PDFImage } from 'pdf-lib';
import {
  COLOR,
  CONTENT_WIDTH,
  MARGIN,
  PAGE,
  TYPE,
  formatInvoiceDate,
} from './invoiceTheme';
import { drawText, rule, type Ctx } from './pdfKit';

const ACCENT_BAR_HEIGHT = 5;
const LOGO_WIDTH = 116;
/** Square marks (the TNT logo) are held back so they don't dominate the header. */
const SQUARE_LOGO_WIDTH = 74;

/** Full-bleed brand bar along the very top of every page. */
export function drawAccentBar(ctx: Ctx): void {
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE.height - ACCENT_BAR_HEIGHT,
    width: PAGE.width,
    height: ACCENT_BAR_HEIGHT,
    color: ctx.brand.accent,
  });
}

/** Logo top-right, aligned with the document title. Returns its bottom edge. */
function drawLogo(ctx: Ctx, logo: PDFImage | null, top: number): number {
  if (!logo) return top;
  const isSquarish = logo.width / logo.height < 1.2;
  const targetWidth = isSquarish ? SQUARE_LOGO_WIDTH : LOGO_WIDTH;
  const scale = targetWidth / logo.width;
  const height = logo.height * scale;
  ctx.page.drawImage(logo, {
    x: PAGE.width - MARGIN.right - targetWidth,
    y: top - height,
    width: targetWidth,
    height,
  });
  return top - height;
}

interface HeaderOptions {
  title: string;
  logo: PDFImage | null;
  /** Rendered as small uppercase label / bold value pairs under the title. */
  meta?: Array<[string, string]>;
}

/**
 * Document title on the left, logo on the right, meta pairs beneath, closed off
 * with a hairline. Returns the y where body content should start.
 */
export function drawHeader(ctx: Ctx, options: HeaderOptions): number {
  drawAccentBar(ctx);

  const top = PAGE.height - ACCENT_BAR_HEIGHT - MARGIN.top;
  const logoBottom = drawLogo(ctx, options.logo, top);

  const titleBaseline = top - TYPE.title;
  drawText(ctx, options.title.toUpperCase(), {
    x: MARGIN.left,
    y: titleBaseline,
    size: TYPE.title,
    font: ctx.bold,
    color: COLOR.heading,
    tracking: 1.1,
  });

  let metaBaseline = titleBaseline - 18;
  for (const [label, value] of options.meta ?? []) {
    drawText(ctx, label.toUpperCase(), {
      x: MARGIN.left,
      y: metaBaseline,
      size: TYPE.small,
      font: ctx.regular,
      color: COLOR.muted,
      tracking: 0.6,
    });
    drawText(ctx, value, {
      x: MARGIN.left + 66,
      y: metaBaseline,
      size: TYPE.value,
      font: ctx.bold,
      color: COLOR.heading,
    });
    metaBaseline -= 14;
  }

  const ruleY = Math.min(metaBaseline + 14 - 8, logoBottom - 10);
  rule(ctx, MARGIN.left, ruleY, CONTENT_WIDTH, 0.7, COLOR.hairline);
  return ruleY - 22;
}

export function invoiceMeta(invoiceNumber: string, invoiceDate: string): Array<[string, string]> {
  return [
    ['Invoice No', invoiceNumber],
    ['Date', formatInvoiceDate(invoiceDate)],
  ];
}

/** Where drawFooter puts its dividing rule; layouts keep clear of it. */
export const FOOTER_RULE_Y = MARGIN.bottom + 34;

/**
 * Brand identity strip pinned to the bottom of the page, with an optional note
 * line on the left and a page marker on the right.
 */
export function drawFooter(ctx: Ctx, options: { note?: string; pageLabel?: string } = {}): void {
  const { brand } = ctx;
  rule(ctx, MARGIN.left, FOOTER_RULE_Y, CONTENT_WIDTH, 0.7, COLOR.hairline);

  const identity = brand.tagline
    ? `${brand.legalName}  \u00B7  ${brand.tagline}  \u00B7  ${brand.addressLines.join(', ')}`
    : `${brand.legalName}  \u00B7  ${brand.addressLines.join(', ')}`;
  const contact = [
    `Tel: ${brand.phone}`,
    brand.email,
    brand.website,
    brand.vatNumber ? `VAT No: ${brand.vatNumber}` : '',
  ]
    .filter(Boolean)
    .join('  \u00B7  ');

  let baseline = FOOTER_RULE_Y - 12;
  for (const line of [identity, contact]) {
    drawText(ctx, line, {
      x: MARGIN.left,
      y: baseline,
      size: TYPE.footer,
      font: ctx.regular,
      color: COLOR.muted,
    });
    baseline -= 10.5;
  }

  if (options.note) {
    drawText(ctx, options.note, {
      x: MARGIN.left,
      y: baseline,
      size: TYPE.footer,
      font: ctx.regular,
      color: COLOR.muted,
    });
  }

  if (options.pageLabel) {
    drawText(ctx, options.pageLabel, {
      x: MARGIN.left,
      y: FOOTER_RULE_Y - 12,
      size: TYPE.footer,
      font: ctx.bold,
      color: COLOR.muted,
      align: 'right',
      width: CONTENT_WIDTH,
    });
  }
}
