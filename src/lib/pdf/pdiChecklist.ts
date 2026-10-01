import { PDFDocument, type PDFFont } from 'pdf-lib';
import {
  COLOR,
  COL_RIGHT_X,
  COL_WIDTH,
  CONTENT_WIDTH,
  FNT_BRAND,
  MARGIN,
  TYPE,
  formatInvoiceDate,
} from './invoiceTheme';
import { FOOTER_RULE_Y, drawFooter, drawHeader } from './invoiceChrome';
import { createCtx, embedLogo, formatMileage, upper, type InvoiceAssets } from './invoiceSections';
import { drawText, measure, rule, sectionHeading, signatureLine, wrapText, type Ctx } from './pdfKit';

/**
 * Anything left out prints as a write-in line, so the same builder produces both
 * the blank form and one pre-filled from an invoice.
 */
export interface PdiChecklistInput {
  invoiceNumber?: string;
  /** ISO date (yyyy-mm-dd). */
  date?: string;
  customerName?: string;
  customerPhone?: string;
  vehMake?: string;
  vehModel?: string;
  vehReg?: string;
  vehColour?: string;
  vehVin?: string;
  vehMileage?: string;
}

interface PdiSection {
  title: string;
  items: string[];
}

/**
 * Six sections of six, so the two columns end level. Labels have to fit beside
 * the tick boxes at the item size; the layout shrinks any that do not, but a
 * shorter label reads better than a smaller one.
 */
export const PDI_SECTIONS: PdiSection[] = [
  {
    title: 'Exterior & Bodywork',
    items: [
      'Paintwork and panels, no new damage',
      'Windscreen and glass free of chips',
      'Wipers and washers operate',
      'Mirrors intact and adjust correctly',
      'Exterior lights and indicators',
      'Number plates legal and secure',
    ],
  },
  {
    title: 'Wheels & Tyres',
    items: [
      'Tread depth above legal minimum',
      'Sidewalls free of cuts and bulges',
      'Tyre pressures set to specification',
      'Wheels and trims condition',
      'Spare wheel or inflation kit',
      'Locking wheel nut key present',
    ],
  },
  {
    title: 'Under the Bonnet',
    items: [
      'Engine oil level',
      'Coolant level',
      'Brake fluid level',
      'Screenwash topped up',
      'Battery and terminals',
      'No visible fluid leaks',
    ],
  },
  {
    title: 'Interior & Controls',
    items: [
      'Seats, trim and upholstery',
      'Seat belts latch and retract',
      'No dashboard warning lights',
      'Heating and air conditioning',
      'Electric windows and central locking',
      'Infotainment, radio and Bluetooth',
    ],
  },
  {
    title: 'Road Test',
    items: [
      'Starts and idles smoothly',
      'Clutch and gearbox operation',
      'Footbrake and handbrake',
      'Steering and suspension',
      'No unusual noises or vibration',
      'Horn, parking sensors and camera',
    ],
  },
  {
    title: 'Documents & Handover',
    items: [
      'V5C / V62 processed for the buyer',
      'MOT certificate valid (if required)',
      'Service history provided',
      'Handbook and all keys supplied',
      'Warranty explained to the customer',
      'Valeted and presented for handover',
    ],
  },
];

const CHECK_COLUMNS = ['Pass', 'Fail', 'N/A'];
const BOX_COLUMN_WIDTH = 25;
const BOX_SIZE = 7.6;
const ITEM_SIZE = 8;
const ITEM_INDENT = 17;
const SECTION_HEAD_HEIGHT = 15;
const SECTION_GAP = 9;
/** Rows stretch to fill the page between these, so a short page does not look sparse. */
const MIN_ROW_HEIGHT = 11.5;
const MAX_ROW_HEIGHT = 15;

const BLOCK_GAP = 13;
const CELL_GUTTER = 12;
const CELL_HEIGHT = 27;
const CELL_LABEL_SIZE = 6.3;

const NOTE_LINES = 2;
const NOTE_LINE_SPACING = 17;

const DECLARATION =
  'I confirm that the vehicle described above has been inspected and the results explained to me. ' +
  'I accept the vehicle in the condition recorded on this checklist, including any advisories noted, ' +
  'and have received the documents and keys listed.';
const DECLARATION_SIZE = 8.3;
const DECLARATION_LEADING = 11.2;
/** Room between two signature rows for an actual signature. */
const SIGNATURE_ROW_SPACING = 44;

/** Shrinks a value to fit its box, then truncates, so a long model name never overruns. */
function fitText(font: PDFFont, value: string, size: number, maxWidth: number, minSize = 6.8) {
  let fitted = size;
  while (fitted > minSize && font.widthOfTextAtSize(value, fitted) > maxWidth) {
    fitted -= 0.2;
  }
  if (font.widthOfTextAtSize(value, fitted) <= maxWidth) return { text: value, size: fitted };

  let text = value;
  while (text.length > 1 && font.widthOfTextAtSize(`${text}\u2026`, fitted) > maxWidth) {
    text = text.slice(0, -1);
  }
  return { text: `${text.trimEnd()}\u2026`, size: fitted };
}

function box(ctx: Ctx, x: number, y: number, size: number): void {
  ctx.page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    borderColor: COLOR.muted,
    borderWidth: 0.7,
  });
}

interface Cell {
  label: string;
  value?: string;
  fuel?: boolean;
}

const FUEL_OPTIONS = ['E', '\u00BC', '\u00BD', '\u00BE', 'F'];

function drawCell(ctx: Ctx, cell: Cell, x: number, top: number, width: number): void {
  drawText(ctx, cell.label.toUpperCase(), {
    x,
    y: top - CELL_LABEL_SIZE,
    size: CELL_LABEL_SIZE,
    font: ctx.regular,
    color: COLOR.muted,
    tracking: 0.6,
  });

  if (cell.fuel) {
    const slot = width / FUEL_OPTIONS.length;
    FUEL_OPTIONS.forEach((option, index) => {
      const slotX = x + index * slot;
      box(ctx, slotX, top - 19.5, 7);
      drawText(ctx, option, {
        x: slotX + 9.5,
        y: top - 18.8,
        size: 7.5,
        font: ctx.bold,
        color: COLOR.body,
      });
    });
  } else if (cell.value) {
    const fitted = fitText(ctx.bold, cell.value, TYPE.value, width);
    drawText(ctx, fitted.text, {
      x,
      y: top - 19,
      size: fitted.size,
      font: ctx.bold,
      color: COLOR.heading,
    });
  }

  rule(ctx, x, top - 23, width, 0.6, COLOR.writeIn);
}

/** Widths for a row of four cells; the first takes the long make and model or name. */
const CELL_WIDTHS = (() => {
  const fixed = [152, 100, 110];
  const last = CONTENT_WIDTH - CELL_GUTTER * 3 - fixed.reduce((sum, width) => sum + width, 0);
  return [...fixed, last];
})();

function drawCellRow(ctx: Ctx, cells: Cell[], top: number): number {
  let x = MARGIN.left;
  cells.forEach((cell, index) => {
    drawCell(ctx, cell, x, top, CELL_WIDTHS[index]);
    x += CELL_WIDTHS[index] + CELL_GUTTER;
  });
  return top - CELL_HEIGHT;
}

function drawDetails(ctx: Ctx, input: PdiChecklistInput, top: number): number {
  const makeModel = [input.vehMake, input.vehModel].map((part) => (part || '').trim()).filter(Boolean).join(' ');

  let y = sectionHeading(ctx, 'Vehicle & Customer', MARGIN.left, top, CONTENT_WIDTH);
  y = drawCellRow(ctx, [
    { label: 'Make & Model', value: makeModel },
    { label: 'Colour', value: input.vehColour },
    { label: 'VIN', value: upper(input.vehVin) },
    { label: 'Mileage', value: formatMileage(input.vehMileage) },
  ], y);
  return drawCellRow(ctx, [
    { label: 'Customer', value: input.customerName },
    { label: 'Telephone', value: input.customerPhone },
    { label: 'Salesperson' },
    { label: 'Fuel Level', fuel: true },
  ], y);
}

function drawChecklistSection(
  ctx: Ctx,
  number: number,
  section: PdiSection,
  x: number,
  top: number,
  width: number,
  rowHeight: number,
): number {
  const baseline = top - 8;
  const boxesLeft = x + width - BOX_COLUMN_WIDTH * CHECK_COLUMNS.length;

  drawText(ctx, String(number).padStart(2, '0'), {
    x,
    y: baseline,
    size: 8,
    font: ctx.bold,
    color: ctx.brand.accent,
  });
  drawText(ctx, section.title.toUpperCase(), {
    x: x + ITEM_INDENT,
    y: baseline,
    size: 8,
    font: ctx.bold,
    color: COLOR.heading,
    tracking: 0.8,
  });
  CHECK_COLUMNS.forEach((label, index) => {
    drawText(ctx, label.toUpperCase(), {
      x: boxesLeft + index * BOX_COLUMN_WIDTH,
      y: baseline,
      size: 6,
      font: ctx.bold,
      color: COLOR.muted,
      align: 'center',
      width: BOX_COLUMN_WIDTH,
      tracking: 0.4,
    });
  });
  rule(ctx, x, baseline - 5, width, 0.8, COLOR.rule);

  const labelWidth = boxesLeft - (x + ITEM_INDENT) - 4;
  let rowTop = top - SECTION_HEAD_HEIGHT;

  section.items.forEach((item, index) => {
    const middle = rowTop - rowHeight / 2;
    const fitted = fitText(ctx.regular, item, ITEM_SIZE, labelWidth);

    drawText(ctx, `${number}.${index + 1}`, {
      x,
      y: middle - 2.4,
      size: 6.5,
      font: ctx.regular,
      color: COLOR.muted,
    });
    drawText(ctx, fitted.text, {
      x: x + ITEM_INDENT,
      y: middle - fitted.size * 0.34,
      size: fitted.size,
      font: ctx.regular,
      color: COLOR.body,
    });
    CHECK_COLUMNS.forEach((_, column) => {
      box(
        ctx,
        boxesLeft + column * BOX_COLUMN_WIDTH + (BOX_COLUMN_WIDTH - BOX_SIZE) / 2,
        middle - BOX_SIZE / 2,
        BOX_SIZE,
      );
    });

    rowTop -= rowHeight;
    if (index < section.items.length - 1) {
      rule(ctx, x, rowTop, width, 0.5, COLOR.hairline);
    }
  });

  return rowTop;
}

function drawChecklist(ctx: Ctx, top: number, rowHeight: number): number {
  const perColumn = Math.ceil(PDI_SECTIONS.length / 2);
  let left = top;
  let right = top;

  PDI_SECTIONS.forEach((section, index) => {
    if (index < perColumn) {
      left = drawChecklistSection(ctx, index + 1, section, MARGIN.left, left, COL_WIDTH, rowHeight) - SECTION_GAP;
    } else {
      right = drawChecklistSection(ctx, index + 1, section, COL_RIGHT_X, right, COL_WIDTH, rowHeight) - SECTION_GAP;
    }
  });

  return Math.min(left, right) + SECTION_GAP;
}

function notesHeight(): number {
  return 8 + NOTE_LINES * NOTE_LINE_SPACING;
}

/** Ruled lines for anything marked Fail, or advisories the customer is told about. */
function drawNotes(ctx: Ctx, top: number): number {
  drawText(ctx, 'ADVISORIES & NOTES', {
    x: MARGIN.left,
    y: top - 7,
    size: 7,
    font: ctx.bold,
    color: COLOR.heading,
    tracking: 0.8,
  });
  drawText(ctx, 'Record anything marked Fail and how it was resolved, or any advisory given to the customer.', {
    x: MARGIN.left + measure(ctx.bold, 'ADVISORIES & NOTES', 7, 0.8) + 10,
    y: top - 7,
    size: 7,
    font: ctx.regular,
    color: COLOR.muted,
  });

  let y = top - 8;
  for (let line = 0; line < NOTE_LINES; line++) {
    y -= NOTE_LINE_SPACING;
    rule(ctx, MARGIN.left, y, CONTENT_WIDTH, 0.6, COLOR.writeIn);
  }
  return y;
}

const SIGNATURE_COLUMNS = (() => {
  const gutter = 18;
  const signature = 206;
  const printName = 176;
  return [
    { x: MARGIN.left, width: signature },
    { x: MARGIN.left + signature + gutter, width: printName },
    {
      x: MARGIN.left + signature + printName + gutter * 2,
      width: CONTENT_WIDTH - signature - printName - gutter * 2,
    },
  ];
})();

function declarationLines(ctx: Ctx): string[] {
  return wrapText(ctx.regular, DECLARATION, DECLARATION_SIZE, CONTENT_WIDTH);
}

/** Pinned to the foot of the page, so the customer always signs in the same place. */
function signOffTop(ctx: Ctx): number {
  const lastCaptionBaseline = FOOTER_RULE_Y + 16;
  const lastRowTop = lastCaptionBaseline + 41;
  const declarationHeight = declarationLines(ctx).length * DECLARATION_LEADING;
  return lastRowTop + SIGNATURE_ROW_SPACING + 2 + declarationHeight + 29;
}

function drawSignOff(ctx: Ctx, top: number): void {
  let y = sectionHeading(ctx, 'Declaration & Sign-Off', MARGIN.left, top, CONTENT_WIDTH);

  for (const line of declarationLines(ctx)) {
    drawText(ctx, line, {
      x: MARGIN.left,
      y: y - DECLARATION_SIZE,
      size: DECLARATION_SIZE,
      font: ctx.regular,
      color: COLOR.body,
    });
    y -= DECLARATION_LEADING;
  }
  y -= 2;

  const rows = [
    ['Salesperson Signature', 'Print Name', 'Date'],
    ['Customer Signature', 'Print Name', 'Date'],
  ];
  rows.forEach((captions, row) => {
    const rowTop = y - row * SIGNATURE_ROW_SPACING;
    captions.forEach((caption, column) => {
      const { x, width } = SIGNATURE_COLUMNS[column];
      signatureLine(ctx, caption, '', x, rowTop, width);
    });
  });
}

/**
 * The single-page vehicle Pre-Delivery Inspection, completed by the salesperson
 * before every sale and countersigned by the customer at handover. Printed,
 * filled in by hand, then scanned back against the invoice.
 */
export async function buildPdiChecklist(
  input: PdiChecklistInput = {},
  assets: InvoiceAssets = {},
): Promise<Uint8Array> {
  const brand = FNT_BRAND;
  const doc = await PDFDocument.create();
  doc.setTitle(input.invoiceNumber ? `PDI Checklist ${input.invoiceNumber}` : 'PDI Checklist');
  doc.setAuthor(brand.legalName);
  doc.setSubject('Vehicle Pre-Delivery Inspection');
  doc.setCreator(brand.name);
  doc.setProducer(brand.name);
  doc.setCreationDate(new Date());

  const ctx = await createCtx(doc, brand);
  const logo = await embedLogo(doc, assets);

  const bodyTop = drawHeader(ctx, {
    title: 'PDI Checklist',
    subtitle: 'Vehicle Pre-Delivery Inspection',
    logo,
    meta: [
      ['Invoice No', input.invoiceNumber || ''],
      ['Registration', upper(input.vehReg)],
      ['Date', formatInvoiceDate(input.date || '')],
    ],
    blankValueWidth: 120,
  });

  const signOff = signOffTop(ctx);
  const detailsBottom = drawDetails(ctx, input, bodyTop) - BLOCK_GAP;

  const checklistSpace = detailsBottom - (signOff + BLOCK_GAP * 2 + notesHeight());
  const perColumn = Math.ceil(PDI_SECTIONS.length / 2);
  const rowsPerColumn = Math.max(
    ...[PDI_SECTIONS.slice(0, perColumn), PDI_SECTIONS.slice(perColumn)].map((column) =>
      column.reduce((rows, section) => rows + section.items.length, 0),
    ),
  );
  const fixed = perColumn * SECTION_HEAD_HEIGHT + (perColumn - 1) * SECTION_GAP;
  const rowHeight = Math.min(
    MAX_ROW_HEIGHT,
    Math.max(MIN_ROW_HEIGHT, (checklistSpace - fixed) / rowsPerColumn),
  );
  const checklistBottom = drawChecklist(ctx, detailsBottom, rowHeight);

  drawNotes(ctx, checklistBottom - BLOCK_GAP);
  drawSignOff(ctx, signOff);

  drawFooter(ctx, {
    note: 'Completed by the salesperson before every sale. Keep the signed copy with the sale invoice.',
  });

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
