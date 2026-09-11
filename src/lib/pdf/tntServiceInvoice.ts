import { PDFDocument, type PDFImage } from 'pdf-lib';
import { TNT_BRAND, TYPE, formatInvoiceDate, formatMoney, hasAmount } from './invoiceTheme';
import { createCtx, embedLogo, formatMileage, upper, type InvoiceAssets } from './invoiceSections';
import { drawText, wrapText, type Ctx } from './pdfKit';
import {
  TAB_HEIGHT,
  TNT_CONTENT_WIDTH,
  TNT_FOOTER_TOP,
  TNT_GRID,
  TNT_GUTTER,
  TNT_INK,
  TNT_MARGIN,
  TNT_MUTED,
  TNT_PANEL,
  TNT_TEXT,
  TNT_WHITE,
  drawFooterBand,
  drawMasthead,
  drawPanel,
  drawPlate,
} from './tntChrome';
import {
  MAX_PROOF_PHOTOS,
  appendProofOfWorkPages,
  proofPageCount,
  proofReference,
  type ProofPhoto,
} from './proofOfWork';

/**
 * TNT Services invoice, laid out as a workshop job sheet rather than a sales
 * document: boxed customer and vehicle panels with the registration as a number
 * plate, a gridded work table, and labour and parts totalled separately before
 * the amount due. See tntChrome.ts for why it looks nothing like an FNT invoice.
 */

export interface TNTLineItem {
  description: string;
  qty: string;
  labour: string;
  parts: string;
  lineTotal: string;
}

export interface TNTInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  vehicleReg?: string;
  mileage?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  lineItems: TNTLineItem[];
  subtotal: string;
  discount?: string;
  grandTotal: string;
  /** Photographs of the work, appended as proof-of-work pages. */
  proofPhotos?: ProofPhoto[];
}

/** Carried over verbatim from the original TNT Services template. */
export const TNT_TERMS = [
  '30 days parts warranty only, unless otherwise specified.',
  'No warranty on parts not purchased through us.',
  'Labour charges are non-refundable.',
  'No refunds on completed work.',
  'All parts remain the property of TNT Services until paid in full.',
];

const FOOTER_NOTE = 'Payment due on completion unless agreed otherwise. Thank you for your business.';

const PANEL_HEIGHT = 82;
const SECTION_GAP = 18;
const TOTALS_WIDTH = 210;

/**
 * A printed job sheet has ruled space for work, so the table never looks bare:
 * at least this many rows, plus a few more when the page has room to spare.
 */
const MIN_TABLE_ROWS = 6;
const MAX_FILLER_ROWS = 3;
const ACKNOWLEDGEMENT_HEIGHT = 72;
const ACKNOWLEDGEMENT_TOP = TNT_FOOTER_TOP + 16 + ACKNOWLEDGEMENT_HEIGHT;
const TABLE_HEADER_HEIGHT = 20;
const ROW_MIN_HEIGHT = 22;
const ROW_LEADING = 11.5;
const CELL_PAD = 6;

const COLUMNS = [
  { label: '#', width: 24, align: 'center' as const },
  { label: 'Description of work', width: 253.28, align: 'left' as const },
  { label: 'Qty', width: 38, align: 'right' as const },
  { label: 'Labour', width: 66, align: 'right' as const },
  { label: 'Parts', width: 66, align: 'right' as const },
  { label: 'Total', width: 68, align: 'right' as const },
];

function columnX(index: number): number {
  return TNT_MARGIN + COLUMNS.slice(0, index).reduce((sum, column) => sum + column.width, 0);
}

function hasContent(item: TNTLineItem): boolean {
  return Boolean(item.description?.trim() || hasAmount(item.labour) || hasAmount(item.parts) || hasAmount(item.lineTotal));
}

function proofPhotos(input: TNTInvoiceInput): ProofPhoto[] {
  return (input.proofPhotos ?? []).slice(0, MAX_PROOF_PHOTOS);
}

function toNumber(value?: string): number {
  const numeric = parseFloat((value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

/** Labour and parts are shown as separate totals, as a garage customer expects. */
function workTotals(items: TNTLineItem[]): { labour: number; parts: number } {
  return items.filter(hasContent).reduce(
    (sum, item) => {
      const qty = item.qty?.trim() ? toNumber(item.qty) : 1;
      return { labour: sum.labour + toNumber(item.labour) * qty, parts: sum.parts + toNumber(item.parts) * qty };
    },
    { labour: 0, parts: 0 },
  );
}

function hline(ctx: Ctx, x: number, y: number, width: number, thickness = 0.6): void {
  ctx.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness, color: TNT_GRID });
}

function vline(ctx: Ctx, x: number, y: number, height: number, thickness = 0.6): void {
  ctx.page.drawLine({ start: { x, y }, end: { x, y: y + height }, thickness, color: TNT_GRID });
}

/** Customer and vehicle side by side in tabbed panels. Returns the y beneath them. */
function drawPanels(ctx: Ctx, input: TNTInvoiceInput, top: number): number {
  const width = (TNT_CONTENT_WIDTH - TNT_GUTTER) / 2;
  const rightX = TNT_MARGIN + width + TNT_GUTTER;

  let y = drawPanel(ctx, 'Customer', TNT_MARGIN, top, width, PANEL_HEIGHT);
  const lines: Array<[string, boolean]> = [
    [input.customerName || '\u2014', true],
    [input.customerPhone ? `Tel ${input.customerPhone}` : '', false],
    [input.customerEmail || '', false],
  ];
  for (const [line, emphasise] of lines) {
    if (!line) continue;
    drawText(ctx, line, {
      x: TNT_MARGIN + 10,
      y: y - (emphasise ? 10.5 : 9),
      size: emphasise ? 10.5 : TYPE.body,
      font: emphasise ? ctx.bold : ctx.regular,
      color: emphasise ? TNT_INK : TNT_TEXT,
    });
    y -= emphasise ? 16 : 13;
  }

  const vehicleTop = drawPanel(ctx, 'Vehicle', rightX, top, width, PANEL_HEIGHT);
  const reg = upper(input.vehicleReg);
  let cursorX = rightX + 10;
  if (reg) {
    const plate = drawPlate(ctx, reg, cursorX, vehicleTop + 2);
    cursorX += plate.width + 16;
  }

  drawText(ctx, 'MILEAGE', {
    x: cursorX,
    y: vehicleTop - 7,
    size: 7,
    font: ctx.regular,
    color: TNT_MUTED,
    tracking: 0.7,
  });
  drawText(ctx, formatMileage(input.mileage) || '\u2014', {
    x: cursorX,
    y: vehicleTop - 20,
    size: 10.5,
    font: ctx.bold,
    color: TNT_INK,
  });

  if (!reg) {
    drawText(ctx, 'Registration not recorded', {
      x: rightX + 10,
      y: vehicleTop - 42,
      size: TYPE.small,
      font: ctx.regular,
      color: TNT_MUTED,
    });
  }

  return top - PANEL_HEIGHT;
}

/**
 * Gridded work table with a black header row. Rows are numbered, and the table
 * is padded to a minimum depth so a one-line job still looks like a job sheet.
 */
function drawWorkTable(ctx: Ctx, items: TNTLineItem[], top: number, proofNote: string, minRows: number): number {
  const rows = items.filter(hasContent);
  const blanks = Math.max(0, minRows - rows.length);

  // A light header with a heavy rule beneath reads as a table header without
  // laying down a bar of solid ink on every printed copy.
  ctx.page.drawRectangle({
    x: TNT_MARGIN,
    y: top - TABLE_HEADER_HEIGHT,
    width: TNT_CONTENT_WIDTH,
    height: TABLE_HEADER_HEIGHT,
    color: TNT_PANEL,
  });
  ctx.page.drawLine({
    start: { x: TNT_MARGIN, y: top - TABLE_HEADER_HEIGHT },
    end: { x: TNT_MARGIN + TNT_CONTENT_WIDTH, y: top - TABLE_HEADER_HEIGHT },
    thickness: 1.2,
    color: TNT_INK,
  });
  COLUMNS.forEach((column, index) => {
    drawText(ctx, column.label.toUpperCase(), {
      x: columnX(index) + (column.align === 'left' ? CELL_PAD : 0),
      y: top - TABLE_HEADER_HEIGHT + 6.5,
      size: 7,
      font: ctx.bold,
      color: TNT_INK,
      tracking: 0.7,
      align: column.align,
      width: column.align === 'left' ? undefined : column.width - (column.align === 'right' ? CELL_PAD : 0),
    });
  });

  let y = top - TABLE_HEADER_HEIGHT;
  const tableTop = y;

  rows.forEach((item, index) => {
    const descriptionLines = wrapText(ctx.regular, item.description || '\u2014', TYPE.body, COLUMNS[1].width - CELL_PAD * 2);
    const rowHeight = Math.max(ROW_MIN_HEIGHT, descriptionLines.length * ROW_LEADING + 10);
    const baseline = y - 14.5;

    drawText(ctx, `${index + 1}`, {
      x: columnX(0),
      y: baseline,
      size: TYPE.body,
      font: ctx.regular,
      color: TNT_MUTED,
      align: 'center',
      width: COLUMNS[0].width,
    });

    descriptionLines.forEach((line, lineIndex) => {
      drawText(ctx, line, {
        x: columnX(1) + CELL_PAD,
        y: baseline - lineIndex * ROW_LEADING,
        size: TYPE.body,
        font: ctx.regular,
        color: TNT_TEXT,
      });
    });

    const values = [item.qty?.trim() || '1', formatMoney(item.labour), formatMoney(item.parts), formatMoney(item.lineTotal)];
    values.forEach((value, offset) => {
      const index = offset + 2;
      const last = index === COLUMNS.length - 1;
      drawText(ctx, value || '\u2014', {
        x: columnX(index),
        y: baseline,
        size: TYPE.body,
        font: last ? ctx.bold : ctx.regular,
        color: last ? TNT_INK : TNT_TEXT,
        align: 'right',
        width: COLUMNS[index].width - CELL_PAD,
      });
    });

    y -= rowHeight;
    hline(ctx, TNT_MARGIN, y, TNT_CONTENT_WIDTH);
  });

  for (let blank = 0; blank < blanks; blank++) {
    y -= ROW_MIN_HEIGHT;
    hline(ctx, TNT_MARGIN, y, TNT_CONTENT_WIDTH);
  }

  // Column rules and the outer frame.
  for (let index = 1; index < COLUMNS.length; index++) {
    vline(ctx, columnX(index), y, tableTop - y);
  }
  ctx.page.drawRectangle({
    x: TNT_MARGIN,
    y,
    width: TNT_CONTENT_WIDTH,
    height: top - y,
    borderColor: TNT_GRID,
    borderWidth: 0.8,
  });

  if (proofNote) {
    drawText(ctx, proofNote, {
      x: TNT_MARGIN,
      y: y - TYPE.small - 6,
      size: TYPE.small,
      font: ctx.bold,
      color: ctx.brand.accent,
    });
    y -= TYPE.small + 8;
  }

  return y;
}

/** Terms on the left; labour, parts and the amount due boxed on the right. */
function drawSettlement(ctx: Ctx, input: TNTInvoiceInput, top: number): number {
  const totalsX = TNT_MARGIN + TNT_CONTENT_WIDTH - TOTALS_WIDTH;
  const termsWidth = TNT_CONTENT_WIDTH - TOTALS_WIDTH - TNT_GUTTER;

  const totals = workTotals(input.lineItems);
  const rows: Array<[string, string]> = [
    ['Labour', formatMoney(totals.labour)],
    ['Parts', formatMoney(totals.parts)],
    ['Subtotal', formatMoney(input.subtotal) || formatMoney(0)],
  ];
  if (hasAmount(input.discount)) rows.push(['Discount', `-${formatMoney(input.discount)}`]);

  const rowHeight = 19;
  const totalRowHeight = 30;
  const totalsHeight = rows.length * rowHeight + totalRowHeight;

  // Totals block: light rows in a frame, then the amount due on a black bar.
  let y = top;
  ctx.page.drawRectangle({
    x: totalsX,
    y: top - totalsHeight,
    width: TOTALS_WIDTH,
    height: totalsHeight,
    color: TNT_PANEL,
    borderColor: TNT_GRID,
    borderWidth: 0.8,
  });
  rows.forEach(([label, value], index) => {
    const baseline = y - 13;
    drawText(ctx, label, { x: totalsX + 10, y: baseline, size: TYPE.body, font: ctx.regular, color: TNT_MUTED });
    drawText(ctx, value, {
      x: totalsX,
      y: baseline,
      size: TYPE.value,
      font: label === 'Subtotal' ? ctx.bold : ctx.regular,
      color: TNT_TEXT,
      align: 'right',
      width: TOTALS_WIDTH - 10,
    });
    y -= rowHeight;
    if (index < rows.length - 1) hline(ctx, totalsX, y, TOTALS_WIDTH);
  });

  ctx.page.drawRectangle({ x: totalsX, y: y - totalRowHeight, width: TOTALS_WIDTH, height: totalRowHeight, color: TNT_INK });
  drawText(ctx, 'TOTAL DUE', {
    x: totalsX + 10,
    y: y - totalRowHeight + 11,
    size: 8.5,
    font: ctx.bold,
    color: TNT_WHITE,
    tracking: 1,
  });
  drawText(ctx, formatMoney(input.grandTotal) || formatMoney(0), {
    x: totalsX,
    y: y - totalRowHeight + 9.5,
    size: 15,
    font: ctx.bold,
    color: ctx.brand.accent,
    align: 'right',
    width: TOTALS_WIDTH - 10,
  });

  // Terms panel, sized to the taller of the two blocks so the bottoms line up.
  const termSize = 7.8;
  const termLeading = termSize + 3.2;
  const wrapped = TNT_TERMS.map((term) => wrapText(ctx.regular, term, termSize, termsWidth - 28));
  const termsTextHeight = wrapped.reduce((sum, lines) => sum + lines.length * termLeading + 2, 0);
  const termsHeight = Math.max(totalsHeight, TAB_HEIGHT + 12 + termsTextHeight + 6);

  let termY = drawPanel(ctx, 'Terms of Service', TNT_MARGIN, top, termsWidth, termsHeight);
  wrapped.forEach((lines) => {
    lines.forEach((line, index) => {
      if (index === 0) {
        ctx.page.drawRectangle({
          x: TNT_MARGIN + 10,
          y: termY - termSize + 2.2,
          width: 3,
          height: 3,
          color: ctx.brand.accent,
        });
      }
      drawText(ctx, line, { x: TNT_MARGIN + 18, y: termY - termSize, size: termSize, font: ctx.regular, color: TNT_TEXT });
      termY -= termLeading;
    });
    termY -= 2;
  });

  return top - Math.max(totalsHeight, termsHeight);
}

/**
 * Collection sign-off pinned above the footer, as on a workshop job sheet. Left
 * off only when the body has run down far enough to collide with it.
 */
function drawAcknowledgement(ctx: Ctx, bodyBottom: number): void {
  const top = ACKNOWLEDGEMENT_TOP;
  if (bodyBottom - 16 < top) return;

  const textTop = drawPanel(ctx, 'Customer Acknowledgement', TNT_MARGIN, top, TNT_CONTENT_WIDTH, ACKNOWLEDGEMENT_HEIGHT);
  drawText(
    ctx,
    'I confirm that the work listed above has been carried out to my satisfaction and that the vehicle has been collected.',
    { x: TNT_MARGIN + 10, y: textTop - TYPE.body, size: TYPE.body, font: ctx.regular, color: TNT_TEXT },
  );

  const lineY = top - ACKNOWLEDGEMENT_HEIGHT + 20;
  const signatureWidth = 250;
  const dateX = TNT_MARGIN + TNT_CONTENT_WIDTH - 10 - 130;
  ctx.page.drawLine({ start: { x: TNT_MARGIN + 10, y: lineY }, end: { x: TNT_MARGIN + 10 + signatureWidth, y: lineY }, thickness: 0.8, color: TNT_INK });
  ctx.page.drawLine({ start: { x: dateX, y: lineY }, end: { x: dateX + 130, y: lineY }, thickness: 0.8, color: TNT_INK });

  for (const [label, x] of [['Customer signature', TNT_MARGIN + 10], ['Date', dateX]] as Array<[string, number]>) {
    drawText(ctx, label.toUpperCase(), { x, y: lineY - 9.5, size: 6.5, font: ctx.regular, color: TNT_MUTED, tracking: 0.7 });
  }
}

function proofNote(input: TNTInvoiceInput): string {
  const count = proofPhotos(input).length;
  if (count === 0) return '';
  const photographs = count === 1 ? '1 photograph' : `${count} photographs`;
  return `Proof of work attached \u2014 ${photographs} from this job, see page 2.`;
}

function drawBody(ctx: Ctx, input: TNTInvoiceInput, logo: PDFImage | null, tableRows: number): number {
  let y = drawMasthead(ctx, {
    title: 'Invoice',
    logo,
    rows: [
      ['Invoice No', input.invoiceNumber],
      ['Date', formatInvoiceDate(input.invoiceDate)],
    ],
  });

  y = drawPanels(ctx, input, y) - SECTION_GAP;
  y = drawWorkTable(ctx, input.lineItems, y, proofNote(input), tableRows) - SECTION_GAP;
  return drawSettlement(ctx, input, y);
}

/**
 * Decides how deep the work table should be. The body is laid out on a scratch
 * page with no blank rows to see how much room is left above the acknowledgement;
 * blank rows are then added only as far as they fit, up to the job-sheet depth.
 * A dense invoice therefore gives up its ruled padding before it gives up the
 * customer sign-off.
 */
async function tableRows(input: TNTInvoiceInput, brand: typeof TNT_BRAND, assets: InvoiceAssets): Promise<number> {
  const filled = input.lineItems.filter(hasContent).length;

  const scratch = await PDFDocument.create();
  const ctx = await createCtx(scratch, brand);
  const logo = await embedLogo(scratch, assets);
  const bottom = drawBody(ctx, input, logo, filled);

  const spare = bottom - (ACKNOWLEDGEMENT_TOP + SECTION_GAP);
  const fit = Math.max(0, Math.floor(spare / ROW_MIN_HEIGHT));
  return Math.max(filled, Math.min(MIN_TABLE_ROWS + MAX_FILLER_ROWS, filled + fit));
}

export async function buildTNTServiceInvoice(
  input: TNTInvoiceInput,
  assets: InvoiceAssets = {},
): Promise<Uint8Array> {
  const brand = TNT_BRAND;
  const photos = proofPhotos(input);
  const totalPages = 1 + proofPageCount(photos.length);

  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${input.invoiceNumber}`);
  doc.setAuthor(brand.legalName);
  doc.setSubject(photos.length ? 'Vehicle Service Invoice with Proof of Work' : 'Vehicle Service Invoice');
  doc.setCreator(brand.name);
  doc.setProducer(brand.name);
  doc.setCreationDate(new Date());

  const ctx = await createCtx(doc, brand);
  const logo = await embedLogo(doc, assets);

  const bottom = drawBody(ctx, input, logo, await tableRows(input, brand, assets));
  if (bottom < TNT_FOOTER_TOP) {
    // The form caps the work table at five lines, so this is a safety net for
    // unusually long descriptions rather than something expected in practice.
    console.warn(`TNT invoice ${input.invoiceNumber} runs ${Math.round(TNT_FOOTER_TOP - bottom)}pt into the footer.`);
  }
  drawAcknowledgement(ctx, bottom);
  drawFooterBand(ctx, { note: FOOTER_NOTE, pageLabel: `Page 1 of ${totalPages}` });

  if (photos.length) {
    const reference = await proofReference(input.invoiceNumber, input.invoiceDate, photos);
    doc.setKeywords([`Proof of work reference ${reference}`]);
    await appendProofOfWorkPages(
      doc,
      ctx,
      logo,
      {
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        vehicleReg: input.vehicleReg,
        photos,
        reference,
      },
      { firstPageNumber: 2, totalPages },
    );
  }

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
