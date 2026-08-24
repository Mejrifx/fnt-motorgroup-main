import { PDFDocument, StandardFonts, type PDFFont, type PDFImage, type RGB } from 'pdf-lib';
import {
  COLOR,
  COL_RIGHT_X,
  COL_WIDTH,
  CONTENT_WIDTH,
  FNT_BRAND,
  MARGIN,
  PAGE,
  TYPE,
  formatInvoiceDate,
} from './invoiceTheme';
import { ACCENT_BAR_HEIGHT, FOOTER_RULE_Y, drawAccentBar, drawBrandMark, drawFooter } from './invoiceChrome';
import { drawText, rule, sectionHeading, signatureLine, textBlock, wrapText, type Ctx } from './pdfKit';
import { embedLogo, splitAddress, upper, type InvoiceAssets } from './invoiceSections';

/**
 * Letters to customers: confirming what was agreed at the point of sale, work
 * that will follow, and anything else that needs to be put in writing.
 *
 * Unlike the invoices, which are fixed-shape documents balanced to fill one
 * page, a letter is free prose of unknown length. The body is therefore wrapped
 * into lines and flowed onto as many pages as it needs, with the sign-off kept
 * whole rather than being split across a page break.
 */

export interface LetterInput {
  letterNumber: string;
  letterDate: string;
  recipientName: string;
  recipientAddress?: string;
  /** Overrides the greeting derived from the recipient's first name. */
  salutation?: string;
  subject: string;
  vehMake?: string;
  vehModel?: string;
  vehReg?: string;
  /** Prose. Blank lines separate paragraphs. */
  body: string;
  /** Bulleted points, used for what has been agreed. */
  items?: string[];
  itemsHeading?: string;
  /** Prose that follows the bulleted points. */
  closing?: string;
  signOff?: string;
  signedByName: string;
  signedByRole?: string;
  /** Adds a block for both parties to sign, for letters recording an agreement. */
  requireCustomerSignature?: boolean;
}

/** Wider than the invoices' type and narrower in measure, so it reads as a letter. */
const BODY_SIZE = 10.5;
const BODY_LEADING = 15.2;
const BODY_WIDTH = 462;
const PARAGRAPH_GAP = 9;
const BULLET_INDENT = 15;
const SECTION_GAP = 18;
/** Content stops here so it never collides with the footer. */
const FLOOR_Y = FOOTER_RULE_Y + 16;

type FontKind = 'regular' | 'bold';

interface Line {
  text: string;
  font: FontKind;
  size: number;
  leading: number;
  indent: number;
  bullet: boolean;
  color: RGB;
}

interface Block {
  lines: Line[];
  spaceAfter: number;
  /** Short blocks that read badly when split, such as a single bullet. */
  keepTogether: boolean;
}

function paragraphs(value: string): string[] {
  return (value || '')
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

function firstName(name: string): string {
  return (name || '').trim().split(/\s+/)[0] || '';
}

function vehicleReference(input: LetterInput): string {
  const description = [input.vehMake, input.vehModel].filter(Boolean).join(' ').trim();
  const reg = upper(input.vehReg);
  if (description && reg) return `${description}  \u00B7  ${reg}`;
  return description || reg;
}

function textLines(
  font: PDFFont,
  value: string,
  options: {
    kind: FontKind;
    size?: number;
    leading?: number;
    indent?: number;
    bullet?: boolean;
    color?: RGB;
    width?: number;
  },
): Line[] {
  const size = options.size ?? BODY_SIZE;
  const leading = options.leading ?? BODY_LEADING;
  const indent = options.indent ?? 0;
  const width = (options.width ?? BODY_WIDTH) - indent;

  return wrapText(font, value, size, width).map((text, index) => ({
    text,
    font: options.kind,
    size,
    leading,
    indent,
    bullet: Boolean(options.bullet) && index === 0,
    color: options.color ?? COLOR.body,
  }));
}

/** The prose of the letter, as blocks that can be flowed onto pages. */
function bodyBlocks(ctx: Ctx, input: LetterInput): Block[] {
  const blocks: Block[] = [];

  const salutation = input.salutation?.trim() || `Dear ${firstName(input.recipientName) || 'Sir or Madam'},`;
  blocks.push({
    lines: textLines(ctx.regular, salutation, { kind: 'regular' }),
    spaceAfter: PARAGRAPH_GAP + 2,
    keepTogether: true,
  });

  for (const paragraph of paragraphs(input.body)) {
    blocks.push({
      lines: textLines(ctx.regular, paragraph, { kind: 'regular' }),
      spaceAfter: PARAGRAPH_GAP,
      keepTogether: false,
    });
  }

  const items = (input.items ?? []).map((item) => item.trim()).filter(Boolean);
  if (items.length) {
    blocks.push({
      lines: textLines(ctx.bold, input.itemsHeading?.trim() || 'What We Have Agreed', {
        kind: 'bold',
        size: 10,
        color: COLOR.heading,
      }),
      spaceAfter: 6,
      keepTogether: true,
    });

    items.forEach((item, index) => {
      blocks.push({
        lines: textLines(ctx.regular, item, {
          kind: 'regular',
          size: 10,
          leading: 14.4,
          indent: BULLET_INDENT,
          bullet: true,
        }),
        spaceAfter: index === items.length - 1 ? PARAGRAPH_GAP + 3 : 5,
        keepTogether: true,
      });
    });
  }

  for (const paragraph of paragraphs(input.closing || '')) {
    blocks.push({
      lines: textLines(ctx.regular, paragraph, { kind: 'regular' }),
      spaceAfter: PARAGRAPH_GAP,
      keepTogether: false,
    });
  }

  return blocks;
}

function blockHeight(block: Block): number {
  return block.lines.reduce((total, line) => total + line.leading, 0);
}

function drawLine(ctx: Ctx, line: Line, top: number): number {
  const x = MARGIN.left + line.indent;
  const baseline = top - line.size;

  if (line.bullet) {
    // Drawn rather than typed: a bullet glyph in the accent is too light to read
    // at body size, and a disc gives exact control over weight and alignment.
    ctx.page.drawCircle({
      x: MARGIN.left + 4,
      y: baseline + line.size * 0.3,
      size: 1.7,
      color: ctx.brand.accent,
    });
  }

  drawText(ctx, line.text, {
    x,
    y: baseline,
    size: line.size,
    font: line.font === 'bold' ? ctx.bold : ctx.regular,
    color: line.color,
  });

  return top - line.leading;
}

/** Sender identity, logo and rule. Returns the y where the letter proper starts. */
function drawLetterhead(ctx: Ctx, logo: PDFImage | null): number {
  drawAccentBar(ctx);
  const { brand } = ctx;
  const top = PAGE.height - ACCENT_BAR_HEIGHT - MARGIN.top;
  const logoBottom = drawBrandMark(ctx, logo, top);

  let y = top - 11;
  drawText(ctx, brand.legalName, {
    x: MARGIN.left,
    y,
    size: 11,
    font: ctx.bold,
    color: COLOR.heading,
  });

  y -= 13;
  drawText(ctx, brand.addressLines.join(', '), {
    x: MARGIN.left,
    y,
    size: TYPE.small,
    font: ctx.regular,
    color: COLOR.muted,
  });

  y -= 11;
  drawText(ctx, [`Tel: ${brand.phone}`, brand.email, brand.website].filter(Boolean).join('  \u00B7  '), {
    x: MARGIN.left,
    y,
    size: TYPE.small,
    font: ctx.regular,
    color: COLOR.muted,
  });

  const ruleY = Math.min(y - 12, logoBottom - 12);
  rule(ctx, MARGIN.left, ruleY, CONTENT_WIDTH, 0.7, COLOR.hairline);
  return ruleY - 26;
}

/** Recipient on the left, reference and date on the right. */
function drawRecipient(ctx: Ctx, input: LetterInput, top: number): number {
  const recipientBottom = textBlock(
    ctx,
    [input.recipientName || '\u2014', ...splitAddress(input.recipientAddress)],
    MARGIN.left,
    top,
    COL_WIDTH,
    { firstLineBold: true, size: BODY_SIZE, leading: 14 },
  );

  let metaY = top;
  for (const [label, value] of [
    ['Ref', input.letterNumber],
    ['Date', formatInvoiceDate(input.letterDate)],
  ]) {
    if (!value) continue;
    drawText(ctx, `${label}: ${value}`, {
      x: COL_RIGHT_X,
      y: metaY - BODY_SIZE,
      size: TYPE.value,
      font: ctx.bold,
      color: COLOR.heading,
      align: 'right',
      width: COL_WIDTH,
    });
    metaY -= 14;
  }

  return Math.min(recipientBottom, metaY) - SECTION_GAP;
}

/** Subject and the vehicle it concerns. */
function drawSubject(ctx: Ctx, input: LetterInput, top: number): number {
  let y = top;
  for (const line of wrapText(ctx.bold, `Re: ${input.subject}`, 11.5, BODY_WIDTH)) {
    drawText(ctx, line, { x: MARGIN.left, y: y - 11.5, size: 11.5, font: ctx.bold, color: COLOR.heading });
    y -= 15.5;
  }

  rule(ctx, MARGIN.left, y - 1, CONTENT_WIDTH, 0.7, COLOR.hairline);
  y -= 14;

  const reference = vehicleReference(input);
  if (reference) {
    drawText(ctx, `Vehicle: ${reference}`, {
      x: MARGIN.left,
      y: y - TYPE.small,
      size: TYPE.small,
      font: ctx.regular,
      color: COLOR.muted,
    });
    y -= 16;
  }

  return y - 8;
}

const SIGN_OFF_SPACE = 34;

function signOffHeight(ctx: Ctx, input: LetterInput): number {
  let height = BODY_LEADING + SIGN_OFF_SPACE + 13;
  if (input.signedByRole) height += 12;
  if (input.requireCustomerSignature) {
    const intro = wrapText(ctx.regular, ACKNOWLEDGEMENT_TEXT, TYPE.small, BODY_WIDTH).length;
    height += 26 + 29 + intro * 11.5 + 47;
  }
  return height;
}

const ACKNOWLEDGEMENT_TEXT =
  'By signing below, both parties confirm that the points set out in this letter are agreed.';

/** Sign-off, and for agreements a block for both parties to sign. */
function drawSignOff(ctx: Ctx, input: LetterInput, top: number): number {
  let y = top;

  drawText(ctx, input.signOff?.trim() || 'Yours sincerely,', {
    x: MARGIN.left,
    y: y - BODY_SIZE,
    size: BODY_SIZE,
    font: ctx.regular,
    color: COLOR.body,
  });
  y -= BODY_LEADING + SIGN_OFF_SPACE;

  drawText(ctx, input.signedByName || ctx.brand.name, {
    x: MARGIN.left,
    y: y - 11,
    size: 11,
    font: ctx.bold,
    color: COLOR.heading,
  });
  y -= 13;

  if (input.signedByRole) {
    drawText(ctx, input.signedByRole, {
      x: MARGIN.left,
      y: y - TYPE.small,
      size: TYPE.small,
      font: ctx.regular,
      color: COLOR.muted,
    });
    y -= 12;
  }

  if (!input.requireCustomerSignature) return y;

  y -= 26;
  y = sectionHeading(ctx, 'Acknowledgement', MARGIN.left, y, CONTENT_WIDTH);
  for (const line of wrapText(ctx.regular, ACKNOWLEDGEMENT_TEXT, TYPE.small, BODY_WIDTH)) {
    drawText(ctx, line, { x: MARGIN.left, y: y - TYPE.small, size: TYPE.small, font: ctx.regular, color: COLOR.body });
    y -= 11.5;
  }

  // Left blank for a wet signature, since the signatory is already named above.
  signatureLine(ctx, `On behalf of ${ctx.brand.name}`, '', MARGIN.left, y, COL_WIDTH);
  return signatureLine(ctx, 'Customer', '', COL_RIGHT_X, y, COL_WIDTH);
}

/** Slim marker at the top of continuation pages. */
function drawContinuationHead(ctx: Ctx, input: LetterInput, logo: PDFImage | null): number {
  drawAccentBar(ctx);
  const top = PAGE.height - ACCENT_BAR_HEIGHT - MARGIN.top;
  const logoBottom = drawBrandMark(ctx, logo, top);

  drawText(ctx, `${input.letterNumber}  \u00B7  continued`, {
    x: MARGIN.left,
    y: top - 10,
    size: TYPE.small,
    font: ctx.regular,
    color: COLOR.muted,
    tracking: 0.5,
  });

  const ruleY = Math.min(top - 22, logoBottom - 12);
  rule(ctx, MARGIN.left, ruleY, CONTENT_WIDTH, 0.7, COLOR.hairline);
  return ruleY - 24;
}

export async function buildFNTLetter(
  input: LetterInput,
  assets: InvoiceAssets = {},
): Promise<Uint8Array> {
  const brand = FNT_BRAND;
  const doc = await PDFDocument.create();
  doc.setTitle(`Letter ${input.letterNumber}`);
  doc.setAuthor(brand.legalName);
  doc.setSubject(input.subject || 'Customer Letter');
  doc.setCreator(brand.name);
  doc.setProducer(brand.name);
  doc.setCreationDate(new Date());

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(doc, assets);

  const pages: Ctx[] = [];
  const addPage = (): Ctx => {
    const ctx: Ctx = { page: doc.addPage([PAGE.width, PAGE.height]), regular, bold, brand };
    pages.push(ctx);
    return ctx;
  };

  let ctx = addPage();
  let y = drawLetterhead(ctx, logo);
  y = drawRecipient(ctx, input, y);
  y = drawSubject(ctx, input, y);

  const nextPage = (): number => {
    ctx = addPage();
    return drawContinuationHead(ctx, input, logo);
  };

  for (const block of bodyBlocks(ctx, input)) {
    if (block.keepTogether && y - blockHeight(block) < FLOOR_Y) {
      y = nextPage();
    }

    for (const line of block.lines) {
      if (y - line.leading < FLOOR_Y) y = nextPage();
      y = drawLine(ctx, line, y);
    }

    y -= block.spaceAfter;
  }

  if (y - signOffHeight(ctx, input) < FLOOR_Y) {
    y = nextPage();
  }
  drawSignOff(ctx, input, y);

  pages.forEach((pageCtx, index) => {
    drawFooter(pageCtx, {
      pageLabel: pages.length > 1 ? `Page ${index + 1} of ${pages.length}` : undefined,
    });
  });

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
