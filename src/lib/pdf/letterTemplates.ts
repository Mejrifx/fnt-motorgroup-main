/**
 * Starting points for the letters FNT writes most often. Every field stays
 * editable in the form, so these only exist to avoid starting from a blank page.
 *
 * The prose is deliberately complete rather than peppered with placeholders, so
 * a letter sent without heavy editing still reads properly.
 */

export interface LetterTemplate {
  id: string;
  label: string;
  /** Shown under the picker to explain when to reach for it. */
  description: string;
  subject: string;
  body: string;
  itemsHeading: string;
  items: string[];
  closing: string;
  requireCustomerSignature: boolean;
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'agreed_works',
    label: 'Agreed Work After Sale',
    description: 'Confirms repairs or extras promised at the point of sale.',
    subject: 'Confirmation of Work Agreed Following Your Purchase',
    body: `Thank you for your recent purchase from FNT Motor Group. We appreciate your business and want to make sure you are completely happy with your vehicle.

I am writing to confirm the additional items we agreed at the point of sale, which we will carry out at no cost to you.`,
    itemsHeading: 'What We Have Agreed',
    items: ["Replace the driver's side wing mirror", 'Supply a spare tyre for the vehicle'],
    closing: `We will contact you as soon as the parts are with us to arrange a time that suits you. This letter confirms our commitment to complete the items listed above.

If anything else needs attention in the meantime, please call us on the number above and we will be happy to help.`,
    requireCustomerSignature: true,
  },
  {
    id: 'goodwill_repair',
    label: 'Goodwill Repair',
    description: 'Confirms a repair being carried out or contributed to as a gesture of goodwill.',
    subject: 'Confirmation of Repair to Be Carried Out',
    body: `Thank you for letting us know about the issue with the vehicle detailed above. We want you to be happy with your purchase, so I am writing to confirm what we have agreed to put things right.`,
    itemsHeading: 'Work to Be Carried Out',
    items: [],
    closing: `Please contact us on the number above to arrange a date that suits you, and let us know in advance if you need the vehicle back by a particular time.

Once the work is complete, please do let us know if you have any remaining concerns so that we can address them.`,
    requireCustomerSignature: true,
  },
  {
    id: 'sale_confirmation',
    label: 'Confirmation of Sale',
    description: 'Confirms the purchase in writing, for the customer, an insurer or a lender.',
    subject: 'Confirmation of Vehicle Purchase',
    body: `I am writing to confirm the purchase of the vehicle detailed above from FNT Motor Group.

This letter confirms that the vehicle has been sold and handed over to the customer named above, and may be used as confirmation of the purchase where required.`,
    itemsHeading: 'Details Confirmed',
    items: [],
    closing: `If you need any further detail for your records, please contact us on the number above and we will provide it.`,
    requireCustomerSignature: false,
  },
  {
    id: 'deposit_received',
    label: 'Deposit Received',
    description: 'Confirms a deposit taken and that the vehicle is being held.',
    subject: 'Confirmation of Deposit and Vehicle Reservation',
    body: `Thank you for the deposit paid towards the vehicle detailed above.

I am writing to confirm that we have received your deposit and that the vehicle is now reserved for you and withdrawn from sale.`,
    itemsHeading: 'Reservation Details',
    items: [],
    closing: `We will be in touch to confirm when the vehicle is ready for collection. If your plans change at any point, please let us know as soon as possible so that we can discuss the options with you.`,
    requireCustomerSignature: false,
  },
  {
    id: 'collection',
    label: 'Collection or Delivery Arrangements',
    description: 'Confirms when and how the customer is getting the vehicle.',
    subject: 'Arrangements for Collection of Your Vehicle',
    body: `I am writing to confirm the arrangements for the vehicle detailed above.`,
    itemsHeading: 'Arrangements',
    items: [],
    closing: `Please bring your driving licence and a means of paying any outstanding balance. If anything changes, call us on the number above and we will rearrange at a time that suits you.`,
    requireCustomerSignature: false,
  },
  {
    id: 'blank',
    label: 'Blank Letter',
    description: 'Start from nothing and write the letter yourself.',
    subject: '',
    body: '',
    itemsHeading: 'What We Have Agreed',
    items: [],
    closing: '',
    requireCustomerSignature: false,
  },
];

export function letterTemplate(id: string): LetterTemplate {
  return LETTER_TEMPLATES.find((template) => template.id === id) ?? LETTER_TEMPLATES[0];
}
