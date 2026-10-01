import type { Invoice } from './invoiceUtils';
import { FNT_BRAND } from './pdf/invoiceTheme';
import { loadBrandLogo } from './pdf/invoiceSections';
import { buildPdiChecklist, type PdiChecklistInput } from './pdf/pdiChecklist';

/** Only sales get a PDI; a finance invoice is the same sale billed to the lender. */
export function invoiceHasPdi(invoice: Pick<Invoice, 'invoice_type'>): boolean {
  return invoice.invoice_type === 'fnt_sale' || invoice.invoice_type === 'fnt_finance';
}

export function pdiInputFromInvoice(invoice: Invoice): PdiChecklistInput {
  const meta = invoice.metadata ?? {};
  // On a finance invoice the billed party is the lender, so the person taking
  // the car is the end customer, whose phone number is not recorded.
  const isFinance = invoice.invoice_type === 'fnt_finance';

  return {
    invoiceNumber: invoice.invoice_number,
    date: invoice.invoice_date,
    customerName: isFinance ? meta.end_customer_name : invoice.customer_name,
    customerPhone: isFinance ? undefined : invoice.customer_phone,
    vehMake: invoice.vehicle_make,
    vehModel: invoice.vehicle_model,
    vehReg: invoice.vehicle_reg,
    vehColour: meta.vehicle_colour,
    vehVin: meta.vehicle_vin,
    vehMileage: meta.vehicle_mileage,
  };
}

/**
 * Opens the checklist in a new tab, ready to print from the browser's PDF
 * viewer. Must be called straight from a click: the tab is claimed before the
 * PDF is built so the browser does not treat it as an unsolicited popup.
 */
export async function openPdiChecklist(input: PdiChecklistInput = {}): Promise<void> {
  const tab = window.open('', '_blank');
  try {
    const bytes = await buildPdiChecklist(input, { logo: await loadBrandLogo(FNT_BRAND) });
    const url = URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }));
    if (tab) {
      tab.location.href = url;
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}
