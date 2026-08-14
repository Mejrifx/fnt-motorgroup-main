import { supabase } from './supabase';

export type InvoiceType = 'fnt_sale' | 'fnt_purchase' | 'fnt_finance' | 'tnt_service';

export interface InvoiceData {
  invoice_number: string;
  invoice_type: InvoiceType;
  invoice_date: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;
  total_amount?: number;
  pdf_url: string;
  metadata?: any;
}

export interface Invoice extends InvoiceData {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Generate the next invoice number for a given type
 */
export async function generateInvoiceNumber(type: InvoiceType): Promise<string> {
  try {
    // Get the prefix based on type
    const prefix = type === 'fnt_sale' ? 'FNT-S-' : 
                   type === 'fnt_purchase' ? 'FNT-P-' : 
                   type === 'fnt_finance' ? 'FNT-F-' :
                   'TNT-';

    // Query the last invoice of this type
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('invoice_type', type)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last invoice:', error);
      return `${prefix}001`;
    }

    // If no invoices exist, start with 001
    if (!data || data.length === 0) {
      return `${prefix}001`;
    }

    // Extract the number from the last invoice
    const lastNumber = data[0].invoice_number;
    const numberPart = lastNumber.replace(prefix, '');
    const nextNumber = parseInt(numberPart, 10) + 1;

    // Pad with zeros to 3 digits
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return type === 'fnt_sale' ? 'FNT-S-001' : 
           type === 'fnt_purchase' ? 'FNT-P-001' : 
           type === 'fnt_finance' ? 'FNT-F-001' :
           'TNT-001';
  }
}

/** How long a signed invoice link stays valid, in seconds. */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Resolve the storage path for an invoice PDF from whatever is stored in
 * invoices.pdf_url.
 *
 * Rows written while the bucket was public hold a full URL
 * (.../object/public/invoices/fnt-sales/FNT-S-001.pdf), so the path is taken
 * from everything after the bucket name. A bare path is also accepted so the
 * stored format can change later without needing a data migration.
 */
function resolveInvoiceStoragePath(pdfUrl: string): string | null {
  if (!pdfUrl) return null;

  if (pdfUrl.includes('/invoices/')) {
    // Drop any query string (e.g. an already-signed URL's ?token=...)
    const path = pdfUrl.split('/invoices/')[1].split('?')[0];
    return path || null;
  }

  // Not a storage URL we recognise — only usable if it's already a bare path
  return pdfUrl.startsWith('http') ? null : pdfUrl;
}

/**
 * Create a short-lived signed URL for an invoice PDF.
 *
 * The invoices bucket is private, so this is the only way to read a stored
 * invoice. Signing goes through Supabase Storage, which enforces RLS, so it
 * only succeeds for a signed-in admin.
 *
 * @param downloadAs when set, the link is served as an attachment with this filename
 */
export async function getSignedInvoiceUrl(
  pdfUrl: string,
  downloadAs?: string
): Promise<string | null> {
  const filePath = resolveInvoiceStoragePath(pdfUrl);

  if (!filePath) {
    console.error('Could not resolve an invoice storage path from:', pdfUrl);
    return null;
  }

  const { data, error } = await supabase.storage
    .from('invoices')
    .createSignedUrl(
      filePath,
      SIGNED_URL_TTL_SECONDS,
      downloadAs ? { download: downloadAs } : undefined
    );

  if (error || !data?.signedUrl) {
    console.error('Failed to create signed invoice URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadInvoicePDF(
  pdfBlob: Blob,
  invoiceNumber: string,
  type: InvoiceType
): Promise<string | null> {
  try {
    // Determine the folder based on type
    const folder = type === 'fnt_sale' ? 'fnt-sales' : 
                   type === 'fnt_purchase' ? 'fnt-purchases' : 
                   type === 'fnt_finance' ? 'fnt-finance' :
                   'tnt-services';

    const fileName = `${invoiceNumber}.pdf`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true // Overwrite if exists
      });

    if (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }

    // The bucket is private, so this URL is not directly fetchable — it is kept
    // purely so pdf_url stays in one consistent format across every row, old and
    // new. Reads go through getSignedInvoiceUrl(), which derives the path back
    // out of it.
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading invoice PDF:', error);
    return null;
  }
}

/**
 * Save invoice metadata to database
 */
export async function saveInvoiceToDatabase(invoiceData: InvoiceData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invoices')
      .insert([invoiceData]);

    if (error) {
      console.error('Error saving invoice to database:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving invoice:', error);
    return false;
  }
}

/**
 * Update existing invoice in database
 */
export async function updateInvoiceInDatabase(
  invoiceId: string, 
  invoiceData: Partial<InvoiceData>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', invoiceId);

    if (error) {
      console.error('Error updating invoice in database:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating invoice:', error);
    return false;
  }
}

/**
 * Get all invoices by type
 */
export async function getInvoicesByType(type: InvoiceType) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

/**
 * Search invoices across all types
 */
export async function searchInvoices(searchTerm: string, type?: InvoiceType) {
  try {
    let query = supabase
      .from('invoices')
      .select('*');

    // Filter by type if specified
    if (type) {
      query = query.eq('invoice_type', type);
    }

    // Search in multiple fields
    query = query.or(`invoice_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,vehicle_reg.ilike.%${searchTerm}%`);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching invoices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error searching invoices:', error);
    return [];
  }
}

/**
 * Delete an invoice (both from database and storage)
 */
export async function deleteInvoice(id: string, pdfUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const filePath = resolveInvoiceStoragePath(pdfUrl);
    if (!filePath) {
      console.error('Invalid PDF URL');
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('invoices')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting PDF from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting invoice from database:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return false;
  }
}
