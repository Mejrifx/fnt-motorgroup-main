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
    // Step 1: Embed font for rendering field appearances
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Step 2: Update all field appearances with the font
    // This is CRITICAL - it ensures all field values are rendered visually
    form.updateFieldAppearances(helveticaFont);
    console.log('✓ Field appearances updated');
    
    // Step 3: Try the built-in flatten() method first
    try {
      form.flatten();
      console.log('✓ Form fields flattened to static content');
      console.log('✅ PDF is now non-editable and will print correctly');
      return;
    } catch (flattenError: any) {
      // If flatten() fails due to page reference issues, use manual approach
      console.warn('⚠️ Standard flatten failed, using manual flattening:', flattenError.message);
      
      // Manual flattening: Extract field values and draw them as text
      const fields = form.getFields();
      
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
          
          // Only process if we have a value
          if (!value) return;
          
          // Get field position (if available through widgets)
          const widgets = (field as any).acroField?.getWidgets();
          if (widgets && widgets.length > 0) {
            const widget = widgets[0];
            const rect = widget.getRectangle();
            
            if (rect) {
              // Try to find the page for this widget
              // Use a safer approach that doesn't rely on page references
              let targetPage = pages[0]; // Default to first page
              
              // Try to determine the correct page by checking widget position
              try {
                const pageRef = widget.P();
                if (pageRef) {
                  const pageIndex = pages.findIndex(p => p.ref === pageRef);
                  if (pageIndex >= 0) {
                    targetPage = pages[pageIndex];
                  }
                }
              } catch (pageError) {
                // If we can't find the page reference, just use first page
                console.warn(`Using page 0 for field ${fieldName}`);
              }
              
              // Draw the value as static text
              const fontSize = Math.min(rect.height * 0.65, 11);
              
              // Handle multiline text (for addresses, etc.)
              if (value.includes('\n')) {
                const lines = value.split('\n');
                const lineHeight = fontSize * 1.2;
                lines.forEach((line, index) => {
                  if (line.trim()) {
                    try {
                      targetPage.drawText(line.trim(), {
                        x: rect.x + 2,
                        y: rect.y + rect.height - (fontSize * 1.5) - (index * lineHeight),
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                      });
                    } catch (drawError) {
                      console.warn(`Could not draw line for ${fieldName}:`, drawError);
                    }
                  }
                });
              } else {
                // Single line text
                try {
                  targetPage.drawText(value, {
                    x: rect.x + 2,
                    y: rect.y + (rect.height * 0.25),
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                  });
                } catch (drawError) {
                  console.warn(`Could not draw ${fieldName}:`, drawError);
                }
              }
            }
          }
        } catch (fieldError) {
          console.warn(`Could not process field:`, fieldError);
        }
      });
      
      console.log('✓ Manually drew field values as static text');
      
      // Remove the form completely
      try {
        const catalog = pdfDoc.catalog;
        catalog.delete(PDFName.of('AcroForm'));
        console.log('✓ Removed form fields from PDF');
      } catch (removeError) {
        console.warn('Could not remove AcroForm, but fields are drawn');
      }
      
      console.log('✅ PDF flattened using manual method');
    }
    
  } catch (error) {
    console.error('❌ PDF flattening completely failed:', error);
    throw new Error('Failed to flatten PDF. Please try again or contact support.');
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
