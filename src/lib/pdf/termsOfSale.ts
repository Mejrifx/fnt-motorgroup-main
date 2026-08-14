import type { PDFImage } from 'pdf-lib';
import {
  COLOR,
  COL_RIGHT_X,
  COL_WIDTH,
  CONTENT_WIDTH,
  MARGIN,
  TYPE,
} from './invoiceTheme';
import { drawFooter, drawHeader } from './invoiceChrome';
import { drawText, sectionHeading, signatureLine, wrapText, type Ctx } from './pdfKit';

interface TermsSection {
  title: string;
  clauses: string[];
}

/**
 * Clauses that intentionally depart from the original wording. scripts/verify-terms.ts
 * checks every other clause against the old template and fails on any drift, so
 * deliberate changes have to be listed here with the text they replaced.
 */
export const INTENTIONAL_REWORDINGS = [
  {
    was: 'FNT MOTOR GROUP IS NOT LIABLE FOR FAULTS DISCOVERED AFTER COLLECTION',
    now: 'Any faults discovered after collection should be reported to us as soon as possible and we will arrange repair in line with your statutory rights and any warranty in place',
    why: 'The original read as a blanket disclaimer, which unsettled customers when FNT repair post-collection faults anyway.',
  },
];

/**
 * Wording is carried over verbatim from the original Terms of Sale page except
 * where listed in INTENTIONAL_REWORDINGS; only the letter casing and layout
 * differ. Any change here changes the contract, so edit with care.
 */
export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: 'Vehicle Condition',
    clauses: [
      'All known faults have been disclosed verbally',
      'Any mileage stated is believed to be accurate but not guaranteed',
      'The buyer has test-driven and approved the vehicle condition',
    ],
  },
  {
    title: 'Warranty & Liability',
    clauses: [
      'Vehicles are sold with a statutory warranty as required by law',
      'Extended warranty details (if applicable) are outlined in the invoice',
      INTENTIONAL_REWORDINGS[0].now,
      'Any claims must be made within 14 days of purchase',
    ],
  },
  {
    title: 'Payment Terms',
    clauses: [
      'Full payment must be received before vehicle collection',
      'Accepted payment methods: bank transfer, debit card, cash (up to \u00A38,500)',
      'A deposit secures the vehicle for 7 days maximum',
      'Deposits are non-refundable if the buyer cancels',
    ],
  },
  {
    title: 'Ownership & Collection',
    clauses: [
      'Ownership transfers upon full payment clearance',
      'Vehicle must be collected within 7 days of full payment',
      'Buyer is responsible for insurance from the point of collection',
      'Storage fees may apply for delayed collection (\u00A325/day after 7 days)',
    ],
  },
  {
    title: 'Returns & Cancellations',
    clauses: [
      'Consumer Rights Act 2015 applies to qualifying transactions',
      'Private buyers have a 14-day reflection period for distance sales',
      'Vehicle must be returned in the same condition (wear and tear excepted)',
      '\u00A3500 restocking fee & 0.45p per mile deduction on price',
      'Refunds processed within 14 days of valid return',
    ],
  },
  {
    title: 'Finance & Settlement',
    clauses: [
      'All outstanding finance must be cleared before sale completion',
      'HPI checks are provided upon request',
      'Buyer is responsible for verifying clear title',
    ],
  },
  {
    title: 'Documentation',
    clauses: [
      'V5C (logbook) will be posted to DVLA on your behalf',
      'In rare occasions a V5C may not be available meaning a V62 form will be processed for the buyer',
      'MOT certificate, service history, and spare keys as described',
      'Registration documents sent within 14 days',
    ],
  },
  {
    title: 'Disputes',
    clauses: [
      'Any disputes will be governed by English law',
      'Both parties agree to attempt mediation before legal action',
    ],
  },
];

const CLAUSE_SIZE = 8.8;
const CLAUSE_LEADING = 12.2;
const BULLET_INDENT = 12;

function drawSection(ctx: Ctx, index: number, section: TermsSection, x: number, top: number, width: number): number {
  let cursor = top;

  drawText(ctx, `${index}. ${section.title.toUpperCase()}`, {
    x,
    y: cursor - TYPE.sectionHeading,
    size: TYPE.sectionHeading,
    font: ctx.bold,
    color: ctx.brand.accent,
    tracking: 0.8,
  });
  cursor -= TYPE.sectionHeading + 11;

  for (const clause of section.clauses) {
    const lines = wrapText(ctx.regular, clause, CLAUSE_SIZE, width - BULLET_INDENT);
    lines.forEach((line, lineIndex) => {
      if (lineIndex === 0) {
        drawText(ctx, '\u00B7', {
          x,
          y: cursor - CLAUSE_SIZE,
          size: CLAUSE_SIZE + 1.5,
          font: ctx.bold,
          color: ctx.brand.accent,
        });
      }
      drawText(ctx, line, {
        x: x + BULLET_INDENT,
        y: cursor - CLAUSE_SIZE,
        size: CLAUSE_SIZE,
        font: ctx.regular,
        color: COLOR.body,
      });
      cursor -= CLAUSE_LEADING;
    });
    cursor -= 2.5;
  }

  return cursor - 12;
}

/** Buyer acknowledgement, pinned above the footer so the page reads as finished. */
function drawAcknowledgement(ctx: Ctx): void {
  const contentTop = sectionHeading(ctx, 'Buyer Acknowledgement', MARGIN.left, MARGIN.bottom + 152, CONTENT_WIDTH);

  drawText(ctx, 'I confirm that I have read, understood and accept the Terms of Sale set out above.', {
    x: MARGIN.left,
    y: contentTop - TYPE.body,
    size: TYPE.body,
    font: ctx.regular,
    color: COLOR.body,
  });

  signatureLine(ctx, 'Buyer Signature', '', MARGIN.left, contentTop - 26, COL_WIDTH);
  signatureLine(ctx, 'Date', '', COL_RIGHT_X, contentTop - 26, COL_WIDTH);
}

interface TermsPageOptions {
  logo: PDFImage | null;
  /** Carried in the header so a detached page 2 still maps to its invoice. */
  invoiceNumber?: string;
  buyerName?: string;
}

/** Draws the restyled Terms of Sale onto the page held by `ctx`. */
export function drawTermsOfSalePage(ctx: Ctx, options: TermsPageOptions): void {
  const meta: Array<[string, string]> = [];
  if (options.invoiceNumber) meta.push(['Invoice No', options.invoiceNumber]);
  meta.push(['Buyer', options.buyerName || '\u2014']);

  const bodyTop = drawHeader(ctx, {
    title: 'Terms of Sale',
    logo: options.logo,
    meta,
  });

  const half = Math.ceil(TERMS_SECTIONS.length / 2);
  let leftCursor = bodyTop;
  let rightCursor = bodyTop;

  TERMS_SECTIONS.forEach((section, i) => {
    if (i < half) {
      leftCursor = drawSection(ctx, i + 1, section, MARGIN.left, leftCursor, COL_WIDTH);
    } else {
      rightCursor = drawSection(ctx, i + 1, section, COL_RIGHT_X, rightCursor, COL_WIDTH);
    }
  });

  drawAcknowledgement(ctx);

  drawFooter(ctx, {
    note: 'These terms form part of the sale agreement and should be read alongside the invoice.',
    pageLabel: 'Page 2 of 2',
  });
}
