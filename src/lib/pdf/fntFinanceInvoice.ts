import { PDFDocument, type PDFImage } from 'pdf-lib';
import { COL_WIDTH, FNT_BRAND, MARGIN, PAGE, formatMoney, hasAmount } from './invoiceTheme';
import { drawFooter, drawHeader, invoiceMeta } from './invoiceChrome';
import {
  PAIR_ROW_HEIGHT,
  PAIR_ROW_HEIGHT_TIGHT,
  balanceLayout,
  brandParty,
  createCtx,
  drawBulletedBlock,
  drawPartyPair,
  drawSignaturePair,
  drawSummary,
  drawVehiclePair,
  drawVehicleSection,
  embedLogo,
  splitAddress,
  type InvoiceAssets,
  type SummaryRow,
} from './invoiceSections';
import { drawTermsOfSalePage } from './termsOfSale';
import type { Ctx } from './pdfKit';

export interface FinanceInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  /** The finance company being invoiced. */
  financeCompanyName: string;
  financeCompanyPhone?: string;
  financeCompanyEmail?: string;
  financeCompanyAddress?: string;
  /** The customer taking delivery of the vehicle. */
  endCustomerName?: string;
  endCustomerAddress?: string;
  vehMake: string;
  vehModel: string;
  vehReg?: string;
  vehColour?: string;
  vehVin?: string;
  vehMileage?: string;
  /** When false the part exchange section is omitted regardless of the fields. */
  hasPartExchange?: boolean;
  pxMake?: string;
  pxModel?: string;
  pxReg?: string;
  pxColour?: string;
  pxVin?: string;
  pxMileage?: string;
  pxPrice?: string;
  retailPrice: string;
  deliveryCost?: string;
  warranty?: string;
  warrantyType?: string;
  depositPaid?: string;
  totalDue: string;
  buyerSignature?: string;
}

const INVOICE_NOTES = [
  'Payment is due from the finance company named above',
  'The vehicle remains the property of FNT Motor Group until payment has cleared',
  'Please quote the vehicle registration as the payment reference',
];

function includesPartExchange(input: FinanceInvoiceInput): boolean {
  if (input.hasPartExchange === false) return false;
  if (input.hasPartExchange === true) return true;
  // Older records predate the explicit toggle, so fall back to the fields.
  return Boolean(input.pxMake || input.pxModel || input.pxReg || input.pxVin || hasAmount(input.pxPrice));
}

function summaryRows(input: FinanceInvoiceInput, withPartExchange: boolean): SummaryRow[] {
  const deduction = (value?: string) => (hasAmount(value) ? `-${formatMoney(value)}` : formatMoney(0));

  const rows: SummaryRow[] = [
    { label: 'Vehicle Sale Price', value: formatMoney(input.retailPrice) || formatMoney(0) },
    { label: 'Delivery', value: formatMoney(input.deliveryCost) || formatMoney(0) },
    {
      label: 'Warranty',
      value: hasAmount(input.warranty)
        ? formatMoney(input.warranty)
        : input.warrantyType
          ? 'Included'
          : formatMoney(0),
      sublabel: input.warrantyType || undefined,
    },
  ];

  if (withPartExchange) {
    rows.push({ label: 'Part Exchange Allowance', value: deduction(input.pxPrice) });
  }
  rows.push({ label: 'Less Deposit Paid', value: deduction(input.depositPaid) });

  return rows;
}

function drawBody(
  ctx: Ctx,
  input: FinanceInvoiceInput,
  logo: PDFImage | null,
  gap: number,
  pairRowHeight: number,
): number {
  let y = drawHeader(ctx, {
    title: 'Finance Invoice',
    logo,
    meta: invoiceMeta(input.invoiceNumber, input.invoiceDate),
  });

  y = drawPartyPair(
    ctx,
    {
      heading: 'Invoice To',
      name: input.financeCompanyName,
      addressLines: splitAddress(input.financeCompanyAddress),
      phone: input.financeCompanyPhone,
      email: input.financeCompanyEmail,
    },
    brandParty(ctx.brand, 'Supplied By'),
    y,
    gap,
  );

  // The finance company pays, but the vehicle goes to the end customer, so both
  // are stated. Balanced against the brand block for symmetry.
  y = drawPartyPair(
    ctx,
    {
      heading: 'Deliver To',
      name: input.endCustomerName || '',
      addressLines: splitAddress(input.endCustomerAddress),
    },
    {
      heading: 'Payment Details',
      name: ctx.brand.bank ? ctx.brand.bank.accountName : '',
      addressLines: ctx.brand.bank
        ? [
            `Sort Code: ${ctx.brand.bank.sortCode}`,
            `Account No: ${ctx.brand.bank.accountNumber}`,
            `Reference: ${ctx.brand.bank.reference}`,
          ]
        : [],
    },
    y,
    gap,
  );

  const vehicle = {
    make: input.vehMake,
    model: input.vehModel,
    reg: input.vehReg,
    colour: input.vehColour,
    vin: input.vehVin,
    mileage: input.vehMileage,
  };

  const withPartExchange = includesPartExchange(input);
  if (withPartExchange) {
    // This invoice already carries two party blocks, so a second full-width
    // vehicle section would not fit. Side by side also reads as a comparison.
    // The allowance is not repeated here; it appears in the payment summary
    // where it forms part of the arithmetic.
    y = drawVehiclePair(
      ctx,
      { heading: 'Vehicle Details', vehicle },
      {
        heading: 'Part Exchange',
        vehicle: {
          make: input.pxMake,
          model: input.pxModel,
          reg: input.pxReg,
          colour: input.pxColour,
          vin: input.pxVin,
          mileage: input.pxMileage,
        },
      },
      y,
      gap,
      { rowHeight: pairRowHeight },
    );
  } else {
    y = drawVehicleSection(ctx, 'Vehicle Details', vehicle, y, gap);
  }

  const notesBottom = drawBulletedBlock(ctx, 'Invoice Notes', INVOICE_NOTES, MARGIN.left, y, COL_WIDTH);
  const summaryBottom = drawSummary(
    ctx,
    'Payment Summary',
    summaryRows(input, withPartExchange),
    { label: 'Balance to Finance', value: formatMoney(input.totalDue) },
    y,
  );

  return Math.min(notesBottom, summaryBottom) - gap;
}

export async function buildFNTFinanceInvoice(
  input: FinanceInvoiceInput,
  assets: InvoiceAssets = {},
): Promise<Uint8Array> {
  const brand = FNT_BRAND;
  const balance = (pairRowHeight: number) =>
    balanceLayout({
      brand,
      assets,
      // Part exchange shares the vehicle row rather than adding a band, so the
      // number of gaps does not change with the toggle.
      gapCount: 4,
      render: (ctx, logo, gap) => drawBody(ctx, input, logo, gap, pairRowHeight),
    });

  // A part exchange alongside two long addresses is the one combination that can
  // outgrow the page. The vehicle rows give up the height when that happens,
  // which is enough for the longest addresses seen in practice.
  let pairRowHeight = PAIR_ROW_HEIGHT;
  let layout = await balance(pairRowHeight);
  if (layout.overflow > 0) {
    pairRowHeight = PAIR_ROW_HEIGHT_TIGHT;
    layout = await balance(pairRowHeight);
  }

  const doc = await PDFDocument.create();
  doc.setTitle(`Finance Invoice ${input.invoiceNumber}`);
  doc.setAuthor(brand.legalName);
  doc.setSubject('Vehicle Finance Invoice');
  doc.setCreator(brand.name);
  doc.setProducer(brand.name);
  doc.setCreationDate(new Date());

  const ctx = await createCtx(doc, brand);
  const logo = await embedLogo(doc, assets);

  drawBody(ctx, input, logo, layout.gap, pairRowHeight);
  drawSignaturePair(
    ctx,
    { caption: `Seller \u00B7 On behalf of ${brand.name}`, signed: brand.name },
    { caption: 'Customer', signed: input.buyerSignature },
    layout.signaturesTop,
  );
  drawFooter(ctx, {
    note: 'Terms of Sale are set out on page 2 and form part of this agreement.',
    pageLabel: 'Page 1 of 2',
  });

  const termsCtx: Ctx = {
    page: doc.addPage([PAGE.width, PAGE.height]),
    regular: ctx.regular,
    bold: ctx.bold,
    brand,
  };
  drawTermsOfSalePage(termsCtx, {
    logo,
    invoiceNumber: input.invoiceNumber,
    buyerName: input.endCustomerName || input.financeCompanyName,
  });

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
