import { PDFDocument, type PDFImage } from 'pdf-lib';
import { COL_WIDTH, FNT_BRAND, MARGIN, formatMoney, hasAmount } from './invoiceTheme';
import { drawFooter, drawHeader, invoiceMeta } from './invoiceChrome';
import {
  balanceLayout,
  brandParty,
  createCtx,
  drawBulletedBlock,
  drawPartyPair,
  drawSignaturePair,
  drawSummary,
  drawVehicleSection,
  embedLogo,
  splitAddress,
  type InvoiceAssets,
  type SummaryRow,
} from './invoiceSections';
import type { Ctx } from './pdfKit';

export interface PurchaseInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  sellerPhone?: string;
  sellerEmail?: string;
  sellerAddress?: string;
  vehMake: string;
  vehModel: string;
  vehReg?: string;
  vehColour?: string;
  vehVin?: string;
  vehMileage?: string;
  retailPrice: string;
  deliveryCost?: string;
  warranty?: string;
  warrantyType?: string;
  depositPaid?: string;
  totalDue: string;
  sellerSignature?: string;
}

/**
 * Standard trade-purchase assurances. FNT's own bank details are deliberately not
 * shown: on a purchase FNT is the payer, not the payee.
 */
const SELLER_DECLARATION = [
  'I confirm I am the legal owner of the vehicle and entitled to sell it',
  'The vehicle is free from any outstanding finance or third-party interest',
  'The mileage stated is correct to the best of my knowledge',
  'All known faults have been disclosed',
];

function summaryRows(input: PurchaseInvoiceInput): SummaryRow[] {
  const deduction = (value?: string) => (hasAmount(value) ? `-${formatMoney(value)}` : formatMoney(0));

  return [
    { label: 'Purchase Price', value: formatMoney(input.retailPrice) || formatMoney(0) },
    { label: 'Collection / Delivery', value: formatMoney(input.deliveryCost) || formatMoney(0) },
    {
      label: 'Warranty',
      value: hasAmount(input.warranty)
        ? formatMoney(input.warranty)
        : input.warrantyType
          ? 'Included'
          : formatMoney(0),
      sublabel: input.warrantyType || undefined,
    },
    { label: 'Less Deposit Paid', value: deduction(input.depositPaid) },
  ];
}

function drawBody(ctx: Ctx, input: PurchaseInvoiceInput, logo: PDFImage | null, gap: number): number {
  let y = drawHeader(ctx, {
    title: 'Purchase Invoice',
    logo,
    meta: invoiceMeta(input.invoiceNumber, input.invoiceDate),
  });

  y = drawPartyPair(
    ctx,
    {
      heading: 'Purchased From',
      name: input.sellerName,
      addressLines: splitAddress(input.sellerAddress),
      phone: input.sellerPhone,
      email: input.sellerEmail,
    },
    brandParty(ctx.brand, 'Purchased By'),
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

  const declarationBottom = drawBulletedBlock(
    ctx,
    'Seller Declaration',
    SELLER_DECLARATION,
    MARGIN.left,
    y,
    COL_WIDTH,
  );
  const summaryBottom = drawSummary(
    ctx,
    'Purchase Summary',
    summaryRows(input),
    { label: 'Total Payable', value: formatMoney(input.totalDue) },
    y,
  );

  return Math.min(declarationBottom, summaryBottom) - gap;
}

export async function buildFNTPurchaseInvoice(
  input: PurchaseInvoiceInput,
  assets: InvoiceAssets = {},
): Promise<Uint8Array> {
  const brand = FNT_BRAND;
  const layout = await balanceLayout({
    brand,
    assets,
    gapCount: 3,
    render: (ctx, logo, gap) => drawBody(ctx, input, logo, gap),
  });

  const doc = await PDFDocument.create();
  doc.setTitle(`Purchase Invoice ${input.invoiceNumber}`);
  doc.setAuthor(brand.legalName);
  doc.setSubject('Vehicle Purchase Invoice');
  doc.setCreator(brand.name);
  doc.setProducer(brand.name);
  doc.setCreationDate(new Date());

  const ctx = await createCtx(doc, brand);
  const logo = await embedLogo(doc, assets);

  drawBody(ctx, input, logo, layout.gap);
  drawSignaturePair(
    ctx,
    { caption: 'Seller', signed: input.sellerSignature },
    { caption: `Buyer \u00B7 On behalf of ${brand.name}`, signed: brand.name },
    layout.signaturesTop,
  );
  drawFooter(ctx, { pageLabel: 'Page 1 of 1' });

  return doc.save({ useObjectStreams: false, addDefaultPage: false });
}
