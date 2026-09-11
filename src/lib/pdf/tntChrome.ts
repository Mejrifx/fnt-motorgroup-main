import { rgb, type PDFImage } from 'pdf-lib';
import { PAGE, TYPE } from './invoiceTheme';
import { drawText, measure, type Ctx } from './pdfKit';

/**
 * Page furniture for TNT Services documents.
 *
 * TNT is a garage, not a dealership, and its paperwork should look like it. Where
 * the FNT invoices are open and editorial, the TNT pages are built the way a
 * workshop job card is: a masthead and footer closed off with heavy rules, boxed
 * panels with tab labels, and gridded tables. The two businesses share nothing
 * visually beyond the paper size.
 *
 * These invoices are printed in the workshop, so large fills are avoided: the
 * only solid black is the small tab labels and the amount-due bar. Everything
 * sits inside the printable area rather than bleeding to the paper edge.
 */

export const TNT_MARGIN = 40;
export const TNT_CONTENT_WIDTH = PAGE.width - TNT_MARGIN * 2;
export const TNT_GUTTER = 16;

/** Matches the black of the logo's own background, so the mark sits flush. */
export const TNT_INK = rgb(0.008, 0.008, 0.008);
export const TNT_WHITE = rgb(1, 1, 1);
export const TNT_GRID = rgb(0.72, 0.74, 0.77);
export const TNT_PANEL = rgb(0.955, 0.96, 0.966);
export const TNT_TEXT = rgb(0.1, 0.11, 0.13);
export const TNT_MUTED = rgb(0.43, 0.45, 0.49);

/** Clear of the edge a typical office printer cannot reach. */
const TOP_MARGIN = 32;
const MASTHEAD_MIN_HEIGHT = 74;
const LOGO_SIZE = 62;
/** Height of the footer rule and the two text lines beneath it. */
const FOOTER_RULE_Y = 40;
/** Where body content must stop. */
export const TNT_FOOTER_TOP = FOOTER_RULE_Y + 22;

/** Height of the label tab that sits in a panel's top-left corner. */
export const TAB_HEIGHT = 14;

interface MastheadOptions {
  title: string;
  logo: PDFImage | null;
  /** Label/value pairs stacked under the title on the right. */
  rows: Array<[string, string]>;
}

/**
 * Masthead: logo and business identity on the left, document title and its
 * reference rows on the right, closed off with a single heavy rule.
 * Returns the y where body content should start.
 */
export function drawMasthead(ctx: Ctx, options: MastheadOptions): number {
  const { brand } = ctx;
  const height = Math.max(MASTHEAD_MIN_HEIGHT, 30 + options.rows.length * 13 + 14);
  const top = PAGE.height - TOP_MARGIN;
  const bandBottom = top - height;

  ctx.page.drawLine({
    start: { x: TNT_MARGIN, y: bandBottom },
    end: { x: TNT_MARGIN + TNT_CONTENT_WIDTH, y: bandBottom },
    thickness: 1.4,
    color: TNT_INK,
  });

  const logoTop = top;
  if (options.logo) {
    const scale = LOGO_SIZE / Math.max(options.logo.width, options.logo.height);
    ctx.page.drawImage(options.logo, {
      x: TNT_MARGIN,
      y: logoTop - options.logo.height * scale,
      width: options.logo.width * scale,
      height: options.logo.height * scale,
    });
  }

  const textX = TNT_MARGIN + (options.logo ? LOGO_SIZE + 14 : 0);
  let baseline = logoTop - 14;
  drawText(ctx, brand.name.toUpperCase(), {
    x: textX,
    y: baseline,
    size: 15,
    font: ctx.bold,
    color: TNT_INK,
    tracking: 1.4,
  });

  if (brand.tagline) {
    baseline -= 13;
    drawText(ctx, brand.tagline.toUpperCase(), {
      x: textX,
      y: baseline,
      size: 7.5,
      font: ctx.bold,
      color: brand.accent,
      tracking: 1,
    });
  }

  baseline -= 14;
  drawText(ctx, brand.addressLines.join(', '), {
    x: textX,
    y: baseline,
    size: TYPE.footer,
    font: ctx.regular,
    color: TNT_MUTED,
  });
  baseline -= 10.5;
  drawText(ctx, `Tel ${brand.phone}   \u00B7   ${brand.email}   \u00B7   ${brand.website}`, {
    x: textX,
    y: baseline,
    size: TYPE.footer,
    font: ctx.regular,
    color: TNT_MUTED,
  });

  const right = PAGE.width - TNT_MARGIN;
  drawText(ctx, options.title.toUpperCase(), {
    x: TNT_MARGIN,
    y: top - 22,
    size: 24,
    font: ctx.bold,
    color: TNT_INK,
    tracking: 2,
    align: 'right',
    width: TNT_CONTENT_WIDTH,
  });

  // Values are right-aligned to the margin; labels sit a fixed distance left of
  // the widest value so the pairs read as a small table.
  const valueWidth = Math.max(...options.rows.map(([, value]) => measure(ctx.bold, value, TYPE.value)));
  let rowBaseline = top - 42;
  for (const [label, value] of options.rows) {
    drawText(ctx, label.toUpperCase(), {
      x: right - valueWidth - 10,
      y: rowBaseline,
      size: 7,
      font: ctx.regular,
      color: TNT_MUTED,
      tracking: 0.7,
      align: 'right',
      width: 0,
    });
    drawText(ctx, value, {
      x: TNT_MARGIN,
      y: rowBaseline,
      size: TYPE.value,
      font: ctx.bold,
      color: TNT_INK,
      align: 'right',
      width: TNT_CONTENT_WIDTH,
    });
    rowBaseline -= 13;
  }

  return bandBottom - 24;
}

/**
 * Footer: a heavy rule, then the business identity and page marker with an
 * optional note line beneath. Kept clear of the paper edge for printing.
 */
export function drawFooterBand(ctx: Ctx, options: { note?: string; pageLabel?: string } = {}): void {
  const { brand } = ctx;
  ctx.page.drawLine({
    start: { x: TNT_MARGIN, y: FOOTER_RULE_Y },
    end: { x: TNT_MARGIN + TNT_CONTENT_WIDTH, y: FOOTER_RULE_Y },
    thickness: 1.4,
    color: TNT_INK,
  });

  const identity = `${brand.legalName}  \u00B7  ${brand.addressLines.join(', ')}  \u00B7  Tel ${brand.phone}  \u00B7  ${brand.website}`;
  drawText(ctx, identity, {
    x: TNT_MARGIN,
    y: FOOTER_RULE_Y - 12,
    size: TYPE.footer,
    font: ctx.regular,
    color: TNT_MUTED,
  });

  if (options.pageLabel) {
    drawText(ctx, options.pageLabel, {
      x: TNT_MARGIN,
      y: FOOTER_RULE_Y - 12,
      size: TYPE.footer,
      font: ctx.bold,
      color: TNT_INK,
      align: 'right',
      width: TNT_CONTENT_WIDTH,
    });
  }

  if (options.note) {
    drawText(ctx, options.note, {
      x: TNT_MARGIN,
      y: FOOTER_RULE_Y - 23,
      size: TYPE.footer,
      font: ctx.regular,
      color: TNT_MUTED,
    });
  }
}

/**
 * A bordered panel with a black tab label in its top-left corner, the way a
 * printed job sheet boxes off "Customer" and "Vehicle". Returns the y at which
 * content inside the panel should begin.
 */
export function drawPanel(ctx: Ctx, label: string, x: number, top: number, width: number, height: number): number {
  ctx.page.drawRectangle({
    x,
    y: top - height,
    width,
    height,
    borderColor: TNT_GRID,
    borderWidth: 0.8,
  });

  const tabWidth = measure(ctx.bold, label.toUpperCase(), 7, 0.8) + 16;
  ctx.page.drawRectangle({ x, y: top - TAB_HEIGHT, width: tabWidth, height: TAB_HEIGHT, color: TNT_INK });
  drawText(ctx, label.toUpperCase(), {
    x: x + 8,
    y: top - TAB_HEIGHT + 4.2,
    size: 7,
    font: ctx.bold,
    color: TNT_WHITE,
    tracking: 0.8,
  });

  return top - TAB_HEIGHT - 12;
}

/** The registration drawn as a number plate: bold, tracked, in a heavy frame. */
export function drawPlate(ctx: Ctx, reg: string, x: number, top: number): { width: number; height: number } {
  const size = 14;
  const height = 24;
  const width = measure(ctx.bold, reg, size, 1.8) + 26;

  ctx.page.drawRectangle({
    x,
    y: top - height,
    width,
    height,
    color: TNT_WHITE,
    borderColor: TNT_INK,
    borderWidth: 1.6,
  });
  drawText(ctx, reg, {
    x,
    y: top - height + 7,
    size,
    font: ctx.bold,
    color: TNT_INK,
    tracking: 1.8,
    align: 'center',
    width,
  });

  return { width, height };
}
