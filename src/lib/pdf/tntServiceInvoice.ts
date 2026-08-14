import { PDFDocument, type PDFImage } from 'pdf-lib';
import {
  COLOR,
  COL_WIDTH,
  CONTENT_WIDTH,
  MARGIN,
  TNT_BRAND,
  TYPE,
  formatMoney,
  hasAmount,
} from './invoiceTheme';
import { FOOTER_RULE_Y, drawFooter, drawHeader, invoiceMeta } from './invoiceChrome';
import {
  balanceLayout,
  brandParty,
  createCtx,
  drawBulletedBlock,
  drawPartyPair,
  drawSummary,
  embedLogo,
  formatMileage,
  twoUpRows,
  upper,
  type InvoiceAssets,
  type SummaryRow,
} from './invoiceSections';
import { drawText, rule, sectionHeading, wrapText, type Ctx } from './pdfKit';

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

const COLUMNS = [
  { key: 'description', label: 'Description of Work', width: 227, align: 'left' as const },
  { key: 'qty', label: 'Qty', width: 40, align: 'right' as const },
  { key: 'labour', label: 'Labour', width: 74, align: 'right' as const },
  { key: 'parts', label: 'Parts', width: 74, align: 'right' as const },
  { key: 'lineTotal', label: 'Line Total', width: 88.28, align: 'right' as const },
];

function columnX(index: number): number {
  return MARGIN.left + COLUMNS.slice(0, index).reduce((sum, column) => sum + column.width, 0);
}

function hasContent(item: TNTLineItem): boolean {
  return Boolean(item.description?.trim() || hasAmount(item.labour) || hasAmount(item.parts) || hasAmount(item.lineTotal));
}

/**
 * Work table: a ruled header then one row per completed line item. Blank rows from
 * the form are dropped rather than printed as empty boxes.
 */
function drawLineItems(ctx: Ctx, items: TNTLineItem[], top: number, gap: number): number {
  const contentTop = sectionHeading(ctx, 'Work Carried Out', MARGIN.left, top, CONTENT_WIDTH);

  COLUMNS.forEach((column, index) => {
    drawText(ctx, column.label.toUpperCase(), {
      x: columnX(index),
      y: contentTop - TYPE.small,
      size: TYPE.small,
      font: ctx.bold,
      color: COLOR.muted,
      tracking: 0.5,
      align: column.align,
      width: column.width,
    });
  });

  let y = contentTop - TYPE.small - 7;
  rule(ctx, MARGIN.left, y, CONTENT_WIDTH, 0.9, COLOR.rule);
  y -= 6;

  const rows = items.filter(hasContent);
  const printable = rows.length > 0 ? rows : [{ description: 'No chargeable work recorded', qty: '', labour: '', parts: '', lineTotal: '' }];

  for (const item of printable) {
    const descriptionLines = wrapText(ctx.regular, item.description || '\u2014', TYPE.value, COLUMNS[0].width - 8);
    const rowHeight = Math.max(19, descriptionLines.length * 12 + 8);
    const baseline = y - TYPE.value - 3;

    descriptionLines.forEach((line, index) => {
      drawText(ctx, line, {
        x: columnX(0),
        y: baseline - index * 12,
        size: TYPE.value,
        font: ctx.regular,
        color: COLOR.body,
      });
    });

    const values = [
      item.qty?.trim() || '',
      formatMoney(item.labour),
      formatMoney(item.parts),
      formatMoney(item.lineTotal),
    ];

    values.forEach((value, offset) => {
      const index = offset + 1;
      drawText(ctx, value || '\u2014', {
        x: columnX(index),
        y: baseline,
        size: TYPE.value,
        font: index === COLUMNS.length - 1 ? ctx.bold : ctx.regular,
        color: index === COLUMNS.length - 1 ? COLOR.heading : COLOR.body,
        align: COLUMNS[index].align,
        width: COLUMNS[index].width,
      });
    });

    y -= rowHeight;
    rule(ctx, MARGIN.left, y + 5, CONTENT_WIDTH, 0.6, COLOR.hairline);
  }

  return y - gap;
}

function summaryRows(input: TNTInvoiceInput): SummaryRow[] {
  const rows: SummaryRow[] = [{ label: 'Subtotal', value: formatMoney(input.subtotal) || formatMoney(0) }];
  if (hasAmount(input.discount)) {
    rows.push({ label: 'Discount', value: `-${formatMoney(input.discount)}` });
  }
  return rows;
}

function drawBody(ctx: Ctx, input: TNTInvoiceInput, logo: PDFImage | null, gap: number): number {
  let y = drawHeader(ctx, {
    title: 'Service Invoice',
    logo,
    meta: invoiceMeta(input.invoiceNumber, input.invoiceDate),
  });

  y = drawPartyPair(
    ctx,
    {
      heading: 'Bill To',
      name: input.customerName,
      phone: input.customerPhone,
      email: input.customerEmail,
    },
    brandParty(ctx.brand, 'Invoiced By'),
    y,
    gap,
  );

  const vehicleTop = sectionHeading(ctx, 'Vehicle', MARGIN.left, y, CONTENT_WIDTH);
  y = twoUpRows(ctx, [
    ['Registration', upper(input.vehicleReg)],
    ['Mileage', formatMileage(input.mileage)],
  ], vehicleTop) - gap;

  y = drawLineItems(ctx, input.lineItems, y, gap);

  const termsBottom = drawBulletedBlock(ctx, 'Terms of Service', TNT_TERMS, MARGIN.left, y, COL_WIDTH);
  const summaryBottom = drawSummary(
    ctx,
    'Invoice Summary',
    summaryRows(input),
    { label: 'Grand Total', value: formatMoney(input.grandTotal) },
    y,
  );

  return Math.min(termsBottom, summaryBottom) - gap;
}

export async function buildTNTServiceInvoice(
  input: TNTInvoiceInput,
  assets: InvoiceAssets = {},
): Promise<Uint8Array> {
  const brand = TNT_BRAND;
  const layout = await balanceLayout({
    brand,
    assets,
    gapCount: 4,
    // No signature block on this invoice, so the body may run closer to the footer.
    floorY: FOOTER_RULE_Y + 26,
    render: (ctx, logo, gap) => drawBody(ctx, input, logo, gap),
  });

  const doc = await PDFDocument.create();
  doc.setTitle(`Service Invoice ${input.invoiceNumber}`);
  doc.setAuthor(brand.legalName);
  doc.setSubject('Vehicle Service Invoice');
  doc.setCreator(brand.name);
  doc.setProducer(brand.name);
  doc.setCreationDate(new Date());

  const ctx = await createCtx(doc, brand);
  const logo = await embedLogo(doc, assets);

  drawBody(ctx, input, logo, layout.gap);
  drawFooter(ctx, { note: FOOTER_NOTE, pageLabel: 'Page 1 of 1' });

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
