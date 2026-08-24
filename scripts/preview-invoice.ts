/**
 * Renders every redesigned invoice to /tmp/invoice-preview so the layouts can be
 * reviewed without going through the admin UI. Run via scripts/preview.sh.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { buildFNTSaleInvoice, type SaleInvoiceInput } from '../src/lib/pdf/fntSaleInvoice';
import { buildFNTPurchaseInvoice, type PurchaseInvoiceInput } from '../src/lib/pdf/fntPurchaseInvoice';
import { buildFNTFinanceInvoice, type FinanceInvoiceInput } from '../src/lib/pdf/fntFinanceInvoice';
import { buildTNTServiceInvoice, type TNTInvoiceInput } from '../src/lib/pdf/tntServiceInvoice';
import { buildFNTLetter, type LetterInput } from '../src/lib/pdf/fntLetter';
import { letterTemplate } from '../src/lib/pdf/letterTemplates';

const OUT_DIR = '/tmp/invoice-preview';

const saleWithPartExchange: SaleInvoiceInput = {
  invoiceNumber: 'FNT-S-042',
  invoiceDate: '2026-08-14',
  buyerName: 'Christopher Gelder',
  buyerPhone: '07123 456789',
  buyerEmail: 'c.gelder@example.com',
  buyerAddress: '170 Lockbridge Way, Huddersfield, HD3 4NJ',
  vehMake: 'BMW',
  vehModel: '3 Series 320d M Sport Touring',
  vehReg: 'FD17CCO',
  vehColour: 'Mineral Grey Metallic',
  vehVin: 'WBADT43452G123456',
  vehMileage: '88500',
  hasPartExchange: true,
  pxMake: 'Audi',
  pxModel: 'A4 2.0 TDI S Line',
  pxReg: 'XY34ZAB',
  pxColour: 'Silver',
  pxVin: 'WAUZZZ8E8AA123456',
  pxMileage: '75320',
  pxPrice: '5000',
  retailPrice: '18995',
  deliveryCost: '250',
  warranty: '499',
  warrantyType: '12 Month Extended Warranty',
  depositPaid: '1000',
  totalDue: '13744',
};

const saleMinimal: SaleInvoiceInput = {
  invoiceNumber: 'FNT-S-043',
  invoiceDate: '2026-08-14',
  buyerName: 'Sarah Whitfield',
  buyerPhone: '07998 112233',
  buyerEmail: 'sarah.whitfield@example.com',
  buyerAddress: '12 Ashfield Road, Manchester, M14 6LT',
  vehMake: 'Volkswagen',
  vehModel: 'Golf 1.5 TSI Life',
  vehReg: 'LM21XKD',
  vehColour: 'Pure White',
  vehVin: 'WVWZZZAUZMP012345',
  vehMileage: '24100',
  hasPartExchange: false,
  retailPrice: '16450',
  totalDue: '16450',
};

const purchase: PurchaseInvoiceInput = {
  invoiceNumber: 'FNT-P-018',
  invoiceDate: '2026-08-14',
  sellerName: 'Daniel Okafor',
  sellerPhone: '07456 778899',
  sellerEmail: 'd.okafor@example.com',
  sellerAddress: '48 Broadstone Hall Road, Stockport, SK4 5JT',
  vehMake: 'Mercedes-Benz',
  vehModel: 'C220d AMG Line Premium',
  vehReg: 'MA19RTX',
  vehColour: 'Obsidian Black',
  vehVin: 'WDD2050141R123456',
  vehMileage: '61240',
  retailPrice: '13250',
  deliveryCost: '150',
  depositPaid: '500',
  totalDue: '12900',
};

const finance: FinanceInvoiceInput = {
  invoiceNumber: 'FNT-F-027',
  invoiceDate: '2026-08-14',
  financeCompanyName: 'Car Finance 247 Limited',
  financeCompanyPhone: '0161 805 2237',
  financeCompanyEmail: 'dealerrelations@carfinance247.co.uk',
  financeCompanyAddress: 'Universal Square, Devonshire Street North, Manchester, M12 6JH',
  endCustomerName: 'Christopher Gelder',
  endCustomerAddress: '170 Lockbridge Way, Huddersfield, HD3 4NJ',
  vehMake: 'Seat',
  vehModel: 'Ateca SE Tech Ecomotive TDI',
  vehReg: 'FD17CCO',
  vehColour: 'Nevada White',
  vehVin: 'VSSZZZ5FZH6507609',
  vehMileage: '88500',
  hasPartExchange: false,
  retailPrice: '8090',
  totalDue: '8090',
};

/** The densest finance case: every optional block and row present. */
const financeWithPartExchange: FinanceInvoiceInput = {
  invoiceNumber: 'FNT-F-028',
  invoiceDate: '2026-08-14',
  financeCompanyName: 'Blue Motor Finance Limited',
  financeCompanyPhone: '0203 005 5555',
  financeCompanyEmail: 'payouts@bluemotorfinance.co.uk',
  financeCompanyAddress: 'Cantium House, Railway Approach, Wallington, Surrey, SM6 0DZ',
  endCustomerName: 'Priya Raghunathan',
  endCustomerAddress: 'Flat 9, Corporation Mill, 21 Bengal Street, Manchester, M4 6LN',
  vehMake: 'Land Rover',
  vehModel: 'Discovery Sport HSE Black Edition',
  vehReg: 'YE19WKL',
  vehColour: 'Santorini Black Metallic',
  vehVin: 'SALCA2BN8KH123456',
  vehMileage: '42780',
  hasPartExchange: true,
  pxMake: 'Nissan',
  pxModel: 'Qashqai 1.5 dCi Tekna',
  pxReg: 'PO16HRV',
  pxColour: 'Gun Metallic',
  pxVin: 'SJNFAAJ11U1234567',
  pxMileage: '96410',
  pxPrice: '4750',
  retailPrice: '24995',
  deliveryCost: '199',
  warranty: '699',
  warrantyType: '24 Month Extended Warranty',
  depositPaid: '2000',
  totalDue: '19143',
};

const tnt: TNTInvoiceInput = {
  invoiceNumber: 'TNT-114',
  invoiceDate: '2026-08-14',
  vehicleReg: 'LM21XKD',
  mileage: '54320',
  customerName: 'Adam Prescott',
  customerPhone: '07711 445566',
  customerEmail: 'adam.prescott@example.com',
  lineItems: [
    { description: 'Full valet - interior and exterior, machine polish', qty: '1', labour: '65', parts: '0', lineTotal: '65' },
    { description: 'Two front tyres supplied and fitted (225/45 R17)', qty: '2', labour: '20', parts: '96', lineTotal: '232' },
    { description: 'Front brake pads and discs replaced', qty: '1', labour: '90', parts: '148', lineTotal: '238' },
    { description: 'Wheel alignment and balance', qty: '1', labour: '45', parts: '0', lineTotal: '45' },
    { description: '', qty: '', labour: '', parts: '', lineTotal: '' },
  ],
  subtotal: '580',
  discount: '30',
  grandTotal: '550',
};

const agreedWorks = letterTemplate('agreed_works');

const letter: LetterInput = {
  letterNumber: 'FNT-L-007',
  letterDate: '2026-08-22',
  recipientName: 'Christopher Gelder',
  recipientAddress: '170 Lockbridge Way, Huddersfield, HD3 4NJ',
  subject: agreedWorks.subject,
  vehMake: 'BMW',
  vehModel: '3 Series 320d M Sport Touring',
  vehReg: 'FD17CCO',
  body: agreedWorks.body,
  itemsHeading: agreedWorks.itemsHeading,
  items: agreedWorks.items,
  closing: agreedWorks.closing,
  signedByName: 'Faisal Mejri',
  signedByRole: 'FNT Motor Group',
  requireCustomerSignature: true,
};

/** A letter long enough to need a second page, to check the break and the sign-off. */
const letterLong: LetterInput = {
  ...letter,
  letterNumber: 'FNT-L-008',
  subject: 'Confirmation of Agreed Rectification Work and Contribution Towards Repair Costs',
  body: Array.from({ length: 6 })
    .map(
      (_, index) =>
        `Paragraph ${index + 1}. Thank you for taking the time to speak with us about the vehicle detailed above. We want to be certain that everything we discussed is recorded properly, so this letter sets out the position in full and confirms what happens next, including who is responsible for each item and the timescales we expect to work to.`,
    )
    .join('\n\n'),
  items: [
    "Replace the driver's side wing mirror, including the indicator lens and the painted cover",
    'Supply a spare tyre of the correct size, together with a jack and wheel brace',
    'Investigate and rectify the intermittent noise reported from the front suspension',
    'Carry out a full service, including oil, filters and a brake fluid change',
    'Provide a courtesy vehicle for the duration of the work where one is available',
  ],
};

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const fntLogo = readFileSync('public/FNT Invoice Logo.png');
  const tntLogo = readFileSync('public/TNT Logo.png');

  const jobs: Array<[string, () => Promise<Uint8Array>]> = [
    ['sale-with-part-exchange', () => buildFNTSaleInvoice(saleWithPartExchange, { logo: fntLogo })],
    ['sale-minimal', () => buildFNTSaleInvoice(saleMinimal, { logo: fntLogo })],
    ['purchase', () => buildFNTPurchaseInvoice(purchase, { logo: fntLogo })],
    ['finance', () => buildFNTFinanceInvoice(finance, { logo: fntLogo })],
    ['finance-with-part-exchange', () => buildFNTFinanceInvoice(financeWithPartExchange, { logo: fntLogo })],
    ['tnt-service', () => buildTNTServiceInvoice(tnt, { logo: tntLogo })],
    ['letter-agreed-works', () => buildFNTLetter(letter, { logo: fntLogo })],
    ['letter-two-page', () => buildFNTLetter(letterLong, { logo: fntLogo })],
  ];

  for (const [name, build] of jobs) {
    const bytes = await build();
    writeFileSync(`${OUT_DIR}/${name}.pdf`, bytes);
    console.log(`wrote ${OUT_DIR}/${name}.pdf (${(bytes.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
