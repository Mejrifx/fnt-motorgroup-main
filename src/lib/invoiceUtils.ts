import { supabase } from './supabase';
import { PDFDocument, PDFName, PDFFont, StandardFonts, rgb } from 'pdf-lib';

export type InvoiceType = 'fnt_sale' | 'fnt_purchase' | 'fnt_finance' | 'tnt_service';

/**
 * Completely flatten PDF by removing ALL form fields and converting to static content
 * This is the most secure approach - no form fields = no editability
 */
export async function secureFlattenPDF(pdfDoc: PDFDocument): Promise<void> {
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();
  
  console.log('🔒 Starting secure PDF flattening process...');
  
  try {
    // Step 1: Embed font for rendering
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Step 2: Update all field appearances first
    form.updateFieldAppearances(helveticaFont);
    console.log('✓ Field appearances updated');
    
    // Step 3: Get all form fields and their data
    const fields = form.getFields();
    const fieldData: Array<{
      name: string;
      value: string;
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    
    fields.forEach(field => {
      try {
        const fieldName = field.getName();
        let value = '';
        
        // Get field value based on type
        if (field.constructor.name === 'PDFTextField') {
          value = (field as any).getText() || '';
        } else if (field.constructor.name === 'PDFCheckBox') {
          value = (field as any).isChecked() ? '✓' : '';
        } else if (field.constructor.name === 'PDFDropdown') {
          const selected = (field as any).getSelected();
          value = selected ? selected[0] : '';
        }
        
        // Get field position (if available through widgets)
        const widgets = (field as any).acroField?.getWidgets();
        if (widgets && widgets.length > 0) {
          const widget = widgets[0];
          const rect = widget.getRectangle();
          const pageRef = widget.P();
          
          if (rect && pageRef) {
            const pageIndex = pages.findIndex(p => p.ref === pageRef);
            if (pageIndex >= 0 && value) {
              fieldData.push({
                name: fieldName,
                value: value,
                page: pageIndex,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Could not process field:', e);
      }
    });
    
    console.log(`✓ Extracted ${fieldData.length} field values`);
    
    // Step 4: Draw field values as static text on pages
    fieldData.forEach(field => {
      try {
        const page = pages[field.page];
        const fontSize = Math.min(field.height * 0.65, 12); // Estimate font size
        
        page.drawText(field.value, {
          x: field.x + 2,
          y: field.y + (field.height * 0.25),
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      } catch (e) {
        console.warn(`Could not draw field ${field.name}:`, e);
      }
    });
    
    console.log('✓ Drew static text on pages');
    
    // Step 5: REMOVE ALL FORM FIELDS COMPLETELY
    // This is the critical step - delete the entire AcroForm
    const catalog = pdfDoc.catalog;
    catalog.delete(PDFName.of('AcroForm'));
    
    console.log('✓ Removed all form fields from PDF');
    console.log('✅ PDF is now completely static and non-editable');
    
  } catch (error) {
    console.error('❌ Secure flattening failed:', error);
    
    // Fallback: Try standard flatten
    try {
      console.warn('⚠️ Attempting standard flatten as fallback...');
      form.flatten();
      console.log('✓ Standard flatten completed');
    } catch (flattenError) {
      console.error('❌ Both flattening methods failed');
      throw new Error('Failed to secure PDF. Please contact support.');
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
