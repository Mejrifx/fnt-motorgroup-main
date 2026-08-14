import type { PDFFont, PDFPage, RGB } from 'pdf-lib';
import { COLOR, TYPE, type Brand } from './invoiceTheme';

export interface Ctx {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  brand: Brand;
}

export type Align = 'left' | 'right' | 'center';

interface TextOptions {
  x: number;
  /** Baseline y. */
  y: number;
  size?: number;
  font?: PDFFont;
  color?: RGB;
  align?: Align;
  /** Width of the box the text is aligned within. Required for right/center. */
  width?: number;
  /** Extra space between characters, in points. */
  tracking?: number;
}

/**
 * pdf-lib has no character-spacing option on drawText, so tracked text is laid
 * out one glyph at a time.
 */
function drawTracked(page: PDFPage, value: string, font: PDFFont, size: number, x: number, y: number, color: RGB, tracking: number) {
  let cursor = x;
  for (const char of value) {
    page.drawText(char, { x: cursor, y, size, font, color });
    cursor += font.widthOfTextAtSize(char, size) + tracking;
  }
}

export function measure(font: PDFFont, value: string, size: number, tracking = 0): number {
  const base = font.widthOfTextAtSize(value, size);
  return tracking ? base + tracking * Math.max(0, value.length - 1) : base;
}

export function drawText(ctx: Ctx, value: string, options: TextOptions): void {
  if (!value) return;

  const size = options.size ?? TYPE.body;
  const font = options.font ?? ctx.regular;
  const color = options.color ?? COLOR.body;
  const tracking = options.tracking ?? 0;
  const align = options.align ?? 'left';

  let x = options.x;
  if (align !== 'left') {
    const boxWidth = options.width ?? 0;
    const textWidth = measure(font, value, size, tracking);
    x = align === 'right' ? options.x + boxWidth - textWidth : options.x + (boxWidth - textWidth) / 2;
  }

  if (tracking) {
    drawTracked(ctx.page, value, font, size, x, options.y, color, tracking);
  } else {
    ctx.page.drawText(value, { x, y: options.y, size, font, color });
  }
}

/** Greedy word wrap. Long unbreakable tokens (VINs) are hard-split. */
export function wrapText(font: PDFFont, value: string, size: number, maxWidth: number): string[] {
  const words = (value || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
    } else {
      let chunk = '';
      for (const char of word) {
        if (font.widthOfTextAtSize(chunk + char, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      current = chunk;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export function rule(ctx: Ctx, x: number, y: number, width: number, thickness = 0.7, color: RGB = COLOR.hairline): void {
  ctx.page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness,
    color,
  });
}

/**
 * Uppercase tracked section label in the brand accent with a hairline beneath it.
 * Takes the top of the block and returns the y where content should begin.
 */
export function sectionHeading(ctx: Ctx, label: string, x: number, top: number, width: number): number {
  const size = TYPE.sectionHeading;
  const baseline = top - size;
  drawText(ctx, label.toUpperCase(), {
    x,
    y: baseline,
    size,
    font: ctx.bold,
    color: ctx.brand.accent,
    tracking: 0.9,
  });
  rule(ctx, x, baseline - 6.5, width, 0.7, COLOR.hairline);
  return baseline - 6.5 - 14;
}

export const ROW_HEIGHT = 19;

/**
 * One "Label ................ Value" row: muted label left, bold value right,
 * hairline along the bottom. A sublabel adds a second, smaller line of context
 * under the label and grows the row. Returns the y at the bottom of the row.
 */
export function labelValueRow(
  ctx: Ctx,
  label: string,
  value: string,
  x: number,
  top: number,
  width: number,
  options: { emphasise?: boolean; showRule?: boolean; sublabel?: string } = {},
): number {
  const baseline = top - TYPE.value;

  drawText(ctx, label, {
    x,
    y: baseline,
    size: TYPE.label,
    font: ctx.regular,
    color: COLOR.muted,
  });

  drawText(ctx, value || '\u2014', {
    x,
    y: baseline,
    size: TYPE.value,
    font: ctx.bold,
    color: options.emphasise ? ctx.brand.accent : COLOR.heading,
    align: 'right',
    width,
  });

  let extra = 0;
  if (options.sublabel) {
    extra = 11;
    drawText(ctx, options.sublabel, {
      x,
      y: baseline - extra,
      size: TYPE.footer,
      font: ctx.regular,
      color: COLOR.muted,
    });
  }

  const bottom = top - ROW_HEIGHT - extra;
  if (options.showRule !== false) {
    rule(ctx, x, bottom + 5.5, width, 0.6, COLOR.hairline);
  }
  return bottom;
}

/**
 * A stack of plain lines (address blocks). The first line can be emphasised.
 * Returns the y at the bottom of the stack.
 */
export function textBlock(
  ctx: Ctx,
  lines: string[],
  x: number,
  top: number,
  width: number,
  options: { leading?: number; size?: number; firstLineBold?: boolean } = {},
): number {
  const size = options.size ?? TYPE.body;
  const leading = options.leading ?? size + 4.4;
  let cursor = top;

  lines.forEach((line, index) => {
    const font = options.firstLineBold && index === 0 ? ctx.bold : ctx.regular;
    const color = options.firstLineBold && index === 0 ? COLOR.heading : COLOR.body;
    for (const wrapped of wrapText(font, line, size, width)) {
      drawText(ctx, wrapped, { x, y: cursor - size, size, font, color });
      cursor -= leading;
    }
  });

  return cursor;
}

/** Signature rule with a caption beneath, used for the seller/buyer blocks. */
export function signatureLine(ctx: Ctx, caption: string, signed: string, x: number, top: number, width: number): number {
  if (signed) {
    drawText(ctx, signed, {
      x,
      y: top - 20,
      size: 11,
      font: ctx.bold,
      color: COLOR.heading,
    });
  }

  const lineY = top - 30;
  rule(ctx, x, lineY, width, 0.8, COLOR.rule);

  drawText(ctx, caption.toUpperCase(), {
    x,
    y: lineY - 11,
    size: TYPE.small,
    font: ctx.regular,
    color: COLOR.muted,
    tracking: 0.6,
  });

  return lineY - 11 - 6;
}
