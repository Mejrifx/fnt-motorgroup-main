import { supabase } from './supabase';
import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';

export type InvoiceType = 'fnt_sale' | 'fnt_purchase' | 'fnt_finance' | 'tnt_service';

/**
 * Safely flatten PDF form to make it non-editable
 * Handles PDFs with structural issues that prevent normal flattening
 */
export async function safeFlattenPDF(pdfDoc: PDFDocument): Promise<void> {
  const form = pdfDoc.getForm();
  
  try {
    // Try the standard flatten method first
    console.log('Attempting to flatten PDF form...');
    form.flatten();
    console.log('✅ PDF form flattened successfully using standard method');
  } catch (error) {
    console.warn('⚠️ Standard flatten failed, using alternative method...', error);
    
    try {
      // Alternative method: Make form read-only by removing NeedAppearances
      // and ensuring all fields have proper appearances
      const acroForm = form.acroForm;
      if (acroForm) {
        // Remove NeedAppearances flag (makes fields render their appearances)
        acroForm.dict.delete(PDFName.of('NeedAppearances'));
        
        // Update all field appearances with Helvetica font
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        form.updateFieldAppearances(helveticaFont);
        
        // Make all fields read-only
        const fields = form.getFields();
        fields.forEach(field => {
          try {
            field.enableReadOnly();
          } catch (e) {
            // Some field types might not support this, skip them
          }
        });
        
        console.log('✅ PDF form made read-only using alternative method');
      }
    } catch (fallbackError) {
      console.error('❌ Both flatten methods failed:', fallbackError);
      throw new Error('Failed to secure PDF form. Please contact support.');
    }
  }
}


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

    // Get the public URL
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
    const urlParts = pdfUrl.split('/invoices/');
    if (urlParts.length < 2) {
      console.error('Invalid PDF URL');
      return false;
    }
    const filePath = urlParts[1];

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
