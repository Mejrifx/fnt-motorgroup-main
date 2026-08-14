import { PDFDocument, type PDFImage } from 'pdf-lib';
import { FNT_BRAND, PAGE, formatMoney, hasAmount } from './invoiceTheme';
import { drawFooter, drawHeader, invoiceMeta } from './invoiceChrome';
import {
  balanceLayout,
  brandParty,
  createCtx,
  drawBankDetails,
  drawPartyPair,
  drawSignaturePair,
  drawSummary,
  drawVehicleSection,
  embedLogo,
  splitAddress,
  type InvoiceAssets,
  type SummaryRow,
} from './invoiceSections';
import { drawTermsOfSalePage } from './termsOfSale';
import type { Ctx } from './pdfKit';

export interface SaleInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerAddress?: string;
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

function includesPartExchange(input: SaleInvoiceInput): boolean {
  if (input.hasPartExchange === false) return false;
  if (input.hasPartExchange === true) return true;
  // Older records predate the explicit toggle, so fall back to the fields.
  return Boolean(input.pxMake || input.pxModel || input.pxReg || input.pxVin || hasAmount(input.pxPrice));
}

function summaryRows(input: SaleInvoiceInput, withPartExchange: boolean): SummaryRow[] {
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

/** Draws everything above the signature block. Returns the y it finished at. */
function drawBody(ctx: Ctx, input: SaleInvoiceInput, logo: PDFImage | null, gap: number): number {
  let y = drawHeader(ctx, {
    title: 'Sale Invoice',
    logo,
    meta: invoiceMeta(input.invoiceNumber, input.invoiceDate),
  });

  y = drawPartyPair(
    ctx,
    {
      heading: 'Invoice To',
      name: input.buyerName,
      addressLines: splitAddress(input.buyerAddress),
      phone: input.buyerPhone,
      email: input.buyerEmail,
    },
    brandParty(ctx.brand, 'Sold By'),
    y,
    gap,
  );

  y = drawVehicleSection(ctx, 'Vehicle Details', {
    make: input.vehMake,
    model: input.vehModel,
    reg: input.vehReg,
    colour: input.vehColour,
    vin: input.vehVin,
    mileage: input.vehMileage,
  }, y, gap);

  const withPartExchange = includesPartExchange(input);
  if (withPartExchange) {
    // The allowance is not repeated here; it appears in the payment summary where
    // it forms part of the arithmetic.
    y = drawVehicleSection(ctx, 'Part Exchange', {
      make: input.pxMake,
      model: input.pxModel,
      reg: input.pxReg,
      colour: input.pxColour,
      vin: input.pxVin,
      mileage: input.pxMileage,
    }, y, gap);
  }

  const bankBottom = drawBankDetails(ctx, y);
  const summaryBottom = drawSummary(
    ctx,
    'Payment Summary',
    summaryRows(input, withPartExchange),
    { label: 'Total Due', value: formatMoney(input.totalDue) },
    y,
  );

  return Math.min(bankBottom, summaryBottom) - gap;
}

export async function buildFNTSaleInvoice(
  input: SaleInvoiceInput,
  assets: InvoiceAssets = {},
): Promise<Uint8Array> {
  const brand = FNT_BRAND;
  const layout = await balanceLayout({
    brand,
    assets,
    gapCount: includesPartExchange(input) ? 4 : 3,
    render: (ctx, logo, gap) => drawBody(ctx, input, logo, gap),
  });

  const doc = await PDFDocument.create();
  doc.setTitle(`Sale Invoice ${input.invoiceNumber}`);
  doc.setAuthor(brand.legalName);
  doc.setSubject('Vehicle Sale Invoice');
  doc.setCreator(brand.name);
  doc.setProducer(brand.name);
  doc.setCreationDate(new Date());

  const ctx = await createCtx(doc, brand);
  const logo = await embedLogo(doc, assets);

  drawBody(ctx, input, logo, layout.gap);
  drawSignaturePair(
    ctx,
    { caption: `Seller \u00B7 On behalf of ${brand.name}`, signed: brand.name },
    { caption: 'Buyer', signed: input.buyerSignature },
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
    buyerName: input.buyerName,
  });

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
