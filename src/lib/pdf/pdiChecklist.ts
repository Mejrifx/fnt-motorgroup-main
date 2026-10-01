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
import { drawText, rule, sectionHeading, signatureLine, wrapText, type Ctx } from './pdfKit';

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
 * FNT's own handover checklist, with Under the Bonnet and the MOT check added.
 * Each item should appear once: before adding one, check it is not already
 * covered by an item in another section.
 */
const DOCUMENTS: PdiSection = {
  title: 'Documents & Handover',
  items: [
    'Customer name and vehicle details checked',
    'Sales invoice / order form signed',
    'Finance agreement completed, if applicable',
    'Payment / finance cleared and confirmed',
    'V5C / registration process explained',
    'Warranty paperwork provided / explained',
    'MOT certificate valid, if required',
    'Customer has received all relevant documentation',
    'Full diagnostic report saved and printed',
  ],
};

const KEYS_AND_EQUIPMENT: PdiSection = {
  title: 'Keys & Equipment',
  items: [
    'All available keys handed over',
    'Locking wheel nut / key provided, if applicable',
    'Spare wheel / tyre repair kit present',
    'Jack / tools present, if applicable',
    'Parcel shelf / boot cover present',
    'Owner\u2019s manual / service book or digital equivalent explained',
  ],
};

const VEHICLE_PREPARATION: PdiSection = {
  title: 'Vehicle Preparation',
  items: [
    'Vehicle professionally cleaned inside and out',
    'Fuelled so the fuel warning light is off',
    'Tyres checked and correctly inflated',
    'Windscreen / washer fluid checked',
    'Warning lights checked',
  ],
};

const UNDER_THE_BONNET: PdiSection = {
  title: 'Under the Bonnet',
  items: [
    'Engine oil level',
    'Coolant level',
    'Brake fluid level',
    'Battery and terminals',
    'No visible fluid leaks',
  ],
};

const FINAL_CHECKS: PdiSection = {
  title: 'Final Checks Before Departure',
  items: [
    'Customer has inspected the vehicle',
    'Any pre-existing damage has been documented and acknowledged',
    'Mileage recorded',
    'Customer contact details confirmed',
    'Salesperson has completed / signs the handover checklist',
    'Customer signs to confirm vehicle received and handover completed',
  ],
};

/**
 * Read down the left column, then the right. The left runs shorter, and the
 * notes take up the rest of it.
 */
export const PDI_COLUMNS: PdiSection[][] = [
  [DOCUMENTS, KEYS_AND_EQUIPMENT],
  [VEHICLE_PREPARATION, UNDER_THE_BONNET, FINAL_CHECKS],
];

const BOX_SIZE = 8;
const BOX_COLUMN_WIDTH = 16;
const ITEM_SIZE = 8;
/** Line spacing within an item whose label runs onto a second line. */
const ITEM_LEADING = 9.6;
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

const NOTE_LINE_SPACING = 17;

const DECLARATION =
  'I confirm that I have inspected the vehicle, that any pre-existing damage has been documented ' +
  'and acknowledged, and that I have received the vehicle, its keys and the documentation listed above. ' +
  'The handover has been completed.';
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
}

function drawCell(ctx: Ctx, cell: Cell, x: number, top: number, width: number): void {
  drawText(ctx, cell.label.toUpperCase(), {
    x,
    y: top - CELL_LABEL_SIZE,
    size: CELL_LABEL_SIZE,
    font: ctx.regular,
    color: COLOR.muted,
    tracking: 0.6,
  });

  if (cell.value) {
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

/**
 * Cell widths for each row of details. The first column takes the long make and
 * model or name; Salesperson spans the last two columns of the row above, so
 * there is room to write a name in full.
 */
const DETAIL_COLUMNS = [152, 100, 110];
const DETAIL_ROW_WIDTHS = (() => {
  const fourth = CONTENT_WIDTH - CELL_GUTTER * 3 - DETAIL_COLUMNS.reduce((sum, width) => sum + width, 0);
  return {
    vehicle: [...DETAIL_COLUMNS, fourth],
    customer: [DETAIL_COLUMNS[0], DETAIL_COLUMNS[1], DETAIL_COLUMNS[2] + CELL_GUTTER + fourth],
  };
})();

function drawCellRow(ctx: Ctx, cells: Cell[], widths: number[], top: number): number {
  let x = MARGIN.left;
  cells.forEach((cell, index) => {
    drawCell(ctx, cell, x, top, widths[index]);
    x += widths[index] + CELL_GUTTER;
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
  ], DETAIL_ROW_WIDTHS.vehicle, y);
  return drawCellRow(ctx, [
    { label: 'Customer', value: input.customerName },
    { label: 'Telephone', value: input.customerPhone },
    { label: 'Salesperson' },
  ], DETAIL_ROW_WIDTHS.customer, y);
}

function itemLines(ctx: Ctx, item: string): string[] {
  const labelWidth = COL_WIDTH - ITEM_INDENT - BOX_COLUMN_WIDTH - 4;
  return wrapText(ctx.regular, item, ITEM_SIZE, labelWidth);
}

/** Number, title and a dark rule; shared by the checklist sections and the notes. */
function drawColumnHeading(ctx: Ctx, title: string, number: number | null, x: number, top: number): void {
  const baseline = top - 8;
  if (number !== null) {
    drawText(ctx, String(number).padStart(2, '0'), {
      x,
      y: baseline,
      size: 8,
      font: ctx.bold,
      color: ctx.brand.accent,
    });
  }
  drawText(ctx, title.toUpperCase(), {
    x: number !== null ? x + ITEM_INDENT : x,
    y: baseline,
    size: 8,
    font: ctx.bold,
    color: COLOR.heading,
    tracking: 0.8,
  });
  rule(ctx, x, baseline - 5, COL_WIDTH, 0.8, COLOR.rule);
}

function drawChecklistSection(
  ctx: Ctx,
  number: number,
  section: PdiSection,
  x: number,
  top: number,
  rowHeight: number,
): number {
  drawColumnHeading(ctx, section.title, number, x, top);

  const boxX = x + COL_WIDTH - BOX_COLUMN_WIDTH + (BOX_COLUMN_WIDTH - BOX_SIZE) / 2;
  let rowTop = top - SECTION_HEAD_HEIGHT;

  section.items.forEach((item, index) => {
    const lines = itemLines(ctx, item);
    const height = rowHeight + (lines.length - 1) * ITEM_LEADING;
    const firstMiddle = rowTop - rowHeight / 2;

    drawText(ctx, `${number}.${index + 1}`, {
      x,
      y: firstMiddle - 2.4,
      size: 6.5,
      font: ctx.regular,
      color: COLOR.muted,
    });
    lines.forEach((line, lineIndex) => {
      drawText(ctx, line, {
        x: x + ITEM_INDENT,
        y: firstMiddle - ITEM_SIZE * 0.34 - lineIndex * ITEM_LEADING,
        size: ITEM_SIZE,
        font: ctx.regular,
        color: COLOR.body,
      });
    });
    box(ctx, boxX, firstMiddle - BOX_SIZE / 2, BOX_SIZE);

    rowTop -= height;
    if (index < section.items.length - 1) {
      rule(ctx, x, rowTop, COL_WIDTH, 0.5, COLOR.hairline);
    }
  });

  return rowTop;
}

/** Height a column of sections takes at a given row height. */
function columnHeight(ctx: Ctx, sections: PdiSection[], rowHeight: number): number {
  let height = (sections.length - 1) * SECTION_GAP;
  for (const section of sections) {
    height += SECTION_HEAD_HEIGHT;
    for (const item of section.items) {
      height += rowHeight + (itemLines(ctx, item).length - 1) * ITEM_LEADING;
    }
  }
  return height;
}

/** The tallest row height at which every column still fits the space. */
function fitRowHeight(ctx: Ctx, space: number): number {
  const fitting = PDI_COLUMNS.map((sections) => {
    const fixed = columnHeight(ctx, sections, 0);
    const rows = sections.reduce((count, section) => count + section.items.length, 0);
    return (space - fixed) / rows;
  });
  return Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, Math.min(...fitting)));
}

/**
 * Ruled lines from `top` down to `bottom`, for pre-existing damage shown to the
 * customer and anything else agreed at handover.
 */
function drawNotes(ctx: Ctx, x: number, top: number, bottom: number): void {
  drawColumnHeading(ctx, 'Notes & Pre-Existing Damage', null, x, top);

  let y = top - SECTION_HEAD_HEIGHT;
  while (y - NOTE_LINE_SPACING >= bottom - 0.5) {
    y -= NOTE_LINE_SPACING;
    rule(ctx, x, y, COL_WIDTH, 0.6, COLOR.writeIn);
  }
}

function drawChecklist(ctx: Ctx, top: number, rowHeight: number): void {
  const columnX = [MARGIN.left, COL_RIGHT_X];
  const bottoms: number[] = [];
  let number = 1;

  PDI_COLUMNS.forEach((sections, column) => {
    let y = top;
    sections.forEach((section, index) => {
      if (index > 0) y -= SECTION_GAP;
      y = drawChecklistSection(ctx, number++, section, columnX[column], y, rowHeight);
    });
    bottoms.push(y);
  });

  const end = Math.min(...bottoms);
  bottoms.forEach((bottom, column) => {
    if (bottom - end >= SECTION_GAP + SECTION_HEAD_HEIGHT + NOTE_LINE_SPACING) {
      drawNotes(ctx, columnX[column], bottom - SECTION_GAP, end);
    }
  });
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
  const rowHeight = fitRowHeight(ctx, detailsBottom - signOff - BLOCK_GAP);

  drawChecklist(ctx, detailsBottom, rowHeight);
  drawSignOff(ctx, signOff);

  drawFooter(ctx, {
    note: 'Completed by the salesperson before every sale. Keep the signed copy with the sale invoice.',
  });

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
