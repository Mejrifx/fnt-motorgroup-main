import { FNT_BRAND, TNT_BRAND } from './invoiceTheme';
import { loadBrandLogo } from './invoiceSections';
import { buildFNTSaleInvoice } from './fntSaleInvoice';
import { buildFNTPurchaseInvoice } from './fntPurchaseInvoice';
import { buildFNTFinanceInvoice } from './fntFinanceInvoice';
import { buildTNTServiceInvoice } from './tntServiceInvoice';

export type SampleInvoiceType = 'selling' | 'purchase' | 'finance' | 'tnt';

/**
 * Samples are built by the same functions that produce real invoices, so the
 * layout shown here cannot drift from what customers receive. Values are
 * obviously fictional to keep a sample from being mistaken for a real invoice.
 */
const SAMPLE_VEHICLE = {
  vehMake: 'BMW',
  vehModel: '3 Series 320d M Sport',
  vehReg: 'AB12 CDE',
  vehColour: 'Mineral Grey',
  vehVin: 'SAMPLEVIN0000000',
  vehMileage: '45000',
};

const SAMPLE_DATE = '2026-01-01';

async function buildSelling(): Promise<Uint8Array> {
  return buildFNTSaleInvoice(
    {
      invoiceNumber: 'FNT-S-SAMPLE',
      invoiceDate: SAMPLE_DATE,
      buyerName: 'Sample Customer',
      buyerPhone: '07000 000000',
      buyerEmail: 'customer@example.com',
      buyerAddress: '1 Sample Street, Manchester, M1 1AA',
      ...SAMPLE_VEHICLE,
      hasPartExchange: true,
      pxMake: 'Audi',
      pxModel: 'A4 2.0 TDI S Line',
      pxReg: 'XY34 ZAB',
      pxColour: 'Silver',
      pxVin: 'SAMPLEPXVIN00000',
      pxMileage: '75000',
      pxPrice: '5000',
      retailPrice: '18995',
      deliveryCost: '250',
      warranty: '499',
      warrantyType: '12 Month Extended Warranty',
      depositPaid: '1000',
      totalDue: '13744',
    },
    { logo: await loadBrandLogo(FNT_BRAND) },
  );
}

async function buildPurchase(): Promise<Uint8Array> {
  return buildFNTPurchaseInvoice(
    {
      invoiceNumber: 'FNT-P-SAMPLE',
      invoiceDate: SAMPLE_DATE,
      sellerName: 'Sample Seller',
      sellerPhone: '07000 000000',
      sellerEmail: 'seller@example.com',
      sellerAddress: '1 Sample Street, Manchester, M1 1AA',
      ...SAMPLE_VEHICLE,
      retailPrice: '13250',
      deliveryCost: '150',
      depositPaid: '500',
      totalDue: '12900',
    },
    { logo: await loadBrandLogo(FNT_BRAND) },
  );
}

async function buildFinance(): Promise<Uint8Array> {
  return buildFNTFinanceInvoice(
    {
      invoiceNumber: 'FNT-F-SAMPLE',
      invoiceDate: SAMPLE_DATE,
      financeCompanyName: 'Sample Finance Limited',
      financeCompanyPhone: '0161 000 0000',
      financeCompanyEmail: 'payouts@example.com',
      financeCompanyAddress: 'Finance House, Sample Road, Manchester, M2 2BB',
      endCustomerName: 'Sample Customer',
      endCustomerAddress: '1 Sample Street, Manchester, M1 1AA',
      ...SAMPLE_VEHICLE,
      hasPartExchange: true,
      pxMake: 'Audi',
      pxModel: 'A4 2.0 TDI S Line',
      pxReg: 'XY34 ZAB',
      pxColour: 'Silver',
      pxVin: 'SAMPLEPXVIN00000',
      pxMileage: '75000',
      pxPrice: '3000',
      retailPrice: '16450',
      warrantyType: '12 Month Warranty',
      depositPaid: '1500',
      totalDue: '11950',
    },
    { logo: await loadBrandLogo(FNT_BRAND) },
  );
}

async function buildTNT(): Promise<Uint8Array> {
  return buildTNTServiceInvoice(
    {
      invoiceNumber: 'TNT-SAMPLE',
      invoiceDate: SAMPLE_DATE,
      customerName: 'Sample Customer',
      customerPhone: '07000 000000',
      customerEmail: 'customer@example.com',
      vehicleReg: 'AB12 CDE',
      mileage: '54320',
      lineItems: [
        {
          description: 'Full valet - interior and exterior, machine polish',
          qty: '1',
          labour: '65',
          parts: '0',
          lineTotal: '65',
        },
        {
          description: 'Two front tyres supplied and fitted (225/45 R17)',
          qty: '2',
          labour: '20',
          parts: '96',
          lineTotal: '232',
        },
        {
          description: 'Front brake pads and discs replaced',
          qty: '1',
          labour: '90',
          parts: '148',
          lineTotal: '238',
        },
      ],
      subtotal: '535',
      discount: '35',
      grandTotal: '500',
    },
    { logo: await loadBrandLogo(TNT_BRAND) },
  );
}

const BUILDERS: Record<SampleInvoiceType, () => Promise<Uint8Array>> = {
  selling: buildSelling,
  purchase: buildPurchase,
  finance: buildFinance,
  tnt: buildTNT,
};

/** A blob URL for a sample of the given invoice type. Callers must revoke it. */
export async function createSampleInvoiceURL(type: SampleInvoiceType): Promise<string> {
  const bytes = await BUILDERS[type]();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
