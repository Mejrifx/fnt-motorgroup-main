import React, { useState } from 'react';
import { Download, FileText, XCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface LineItem {
  description: string;
  qty: string;
  labour: string;
  parts: string;
  lineTotal: string;
}

interface TNTInvoiceFormProps {
  onClose: () => void;
}

const TNTInvoiceForm: React.FC<TNTInvoiceFormProps> = ({ onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    vehicleReg: '',
    mileage: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    subtotal: '',
    vat: '',
    discount: '',
    grandTotal: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: '', labour: '', parts: '', lineTotal: '' },
    { description: '', qty: '', labour: '', parts: '', lineTotal: '' },
    { description: '', qty: '', labour: '', parts: '', lineTotal: '' },
    { description: '', qty: '', labour: '', parts: '', lineTotal: '' },
    { description: '', qty: '', labour: '', parts: '', lineTotal: '' }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Auto-calculate line total if qty, labour, or parts changes
    if (field === 'qty' || field === 'labour' || field === 'parts') {
      const qty = parseFloat(field === 'qty' ? value : updatedItems[index].qty) || 1;
      const labour = parseFloat(field === 'labour' ? value : updatedItems[index].labour) || 0;
      const parts = parseFloat(field === 'parts' ? value : updatedItems[index].parts) || 0;
      const lineTotal = (labour + parts) * qty;
      updatedItems[index].lineTotal = lineTotal.toFixed(2);
    }

    setLineItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.lineTotal) || 0);
    }, 0);

    const discount = parseFloat(formData.discount) || 0;
    const subtotalAfterDiscount = subtotal - discount;
    const vat = subtotalAfterDiscount * 0.20; // 20% VAT
    const grandTotal = subtotalAfterDiscount + vat;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      vat: vat.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    }));
  };

  const handleDiscountChange = (value: string) => {
    setFormData(prev => ({ ...prev, discount: value }));
    calculateTotals(lineItems);
  };

  const fillPDFForm = async () => {
    setIsGenerating(true);
    try {
      // Fetch the PDF template
      const existingPdfBytes = await fetch('/TNT Services Invoice Template.pdf').then(res => res.arrayBuffer());
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      
      // Get all field names (for debugging)
      const fields = form.getFields();
      console.log('Available PDF fields:', fields.map(f => f.getName()));
      
      // Fill the form fields with correct field names
      try {
        // Invoice/Vehicle Details
        const invoiceFields: { [key: string]: string } = {
          'invoice_no': formData.invoiceNumber,
          'invoice_date': formData.invoiceDate,
          'vehicle_reg': formData.vehicleReg,
          'mileage': formData.mileage
        };

        // Customer Details (Bill To)
        const customerFields: { [key: string]: string } = {
          'bill_0': formData.customerName,
          'bill_1': formData.customerPhone,
          'bill_2': formData.customerEmail
        };

        // Fill invoice and customer fields
        Object.entries({ ...invoiceFields, ...customerFields }).forEach(([fieldName, value]) => {
          if (value) {
            try {
              const field = form.getTextField(fieldName);
              field.setText(value);
            } catch (err) {
              console.warn(`Field "${fieldName}" not found or not a text field`);
            }
          }
        });

        // Fill line items (rows 0-4)
        lineItems.forEach((item, rowIndex) => {
          if (item.description || item.qty || item.labour || item.parts) {
            try {
              if (item.description) {
                const descField = form.getTextField(`row${rowIndex}_0`);
                descField.setText(item.description);
              }
              if (item.qty) {
                const qtyField = form.getTextField(`row${rowIndex}_1`);
                qtyField.setText(item.qty);
              }
              if (item.labour) {
                const labourField = form.getTextField(`row${rowIndex}_2`);
                labourField.setText(item.labour);
              }
              if (item.parts) {
                const partsField = form.getTextField(`row${rowIndex}_3`);
                partsField.setText(item.parts);
              }
              if (item.lineTotal) {
                const totalField = form.getTextField(`row${rowIndex}_4`);
                totalField.setText(item.lineTotal);
              }
            } catch (err) {
              console.warn(`Error filling row ${rowIndex}:`, err);
            }
          }
        });

        // Fill totals
        const totalFields: { [key: string]: string } = {
          'total_0': formData.subtotal,
          'total_1': formData.vat,
          'total_2': formData.discount,
          'total_3': formData.grandTotal
        };

        Object.entries(totalFields).forEach(([fieldName, value]) => {
          if (value) {
            try {
              const field = form.getTextField(fieldName);
              field.setText(value);
            } catch (err) {
              console.warn(`Field "${fieldName}" not found or not a text field`);
            }
          }
        });

        console.log('PDF fields filled successfully!');
      } catch (err) {
        console.error('Error filling form fields:', err);
      }

      // Flatten the form to make it non-editable
      form.flatten();

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();

      // Create a blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TNT-Invoice-${formData.invoiceNumber || 'Draft'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      alert('Invoice generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating invoice. Please check the console for details.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-fnt-red text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-bold">TNT Services Invoice</h3>
            <p className="text-sm text-red-100">Fill in the details and generate your invoice</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          <XCircle className="w-5 h-5" />
          <span>Close</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Invoice & Vehicle Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Invoice & Vehicle Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice No *
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="INV-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle Reg
                  </label>
                  <input
                    type="text"
                    name="vehicleReg"
                    value={formData.vehicleReg}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="AB12 CDE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mileage
                  </label>
                  <input
                    type="text"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>

            {/* Customer Details (Bill To) */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Customer Details (Bill To)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="07123 456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Work/Service Details</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description of Work</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-20">Qty</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-28">Labour (£)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-28">Parts (£)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-28">Line Total (£)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-fnt-red rounded"
                            placeholder={`Work item ${index + 1}`}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleLineItemChange(index, 'qty', e.target.value)}
                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-fnt-red rounded"
                            placeholder="1"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={item.labour}
                            onChange={(e) => handleLineItemChange(index, 'labour', e.target.value)}
                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-fnt-red rounded"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={item.parts}
                            onChange={(e) => handleLineItemChange(index, 'parts', e.target.value)}
                            className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-fnt-red rounded"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={item.lineTotal}
                            readOnly
                            className="w-full px-2 py-1 bg-gray-50 border-0 rounded font-semibold"
                            placeholder="0.00"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Totals</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl ml-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subtotal (£)
                  </label>
                  <input
                    type="text"
                    value={formData.subtotal}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    VAT (20%) (£)
                  </label>
                  <input
                    type="text"
                    value={formData.vat}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount (£)
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grand Total (£)
                  </label>
                  <input
                    type="text"
                    value={formData.grandTotal}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-green-50 font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-between pt-6 border-t">
              <p className="text-sm text-gray-600">
                * Required fields
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={fillPDFForm}
                  disabled={isGenerating || !formData.invoiceNumber || !formData.customerName}
                  className="flex items-center space-x-2 px-6 py-3 bg-fnt-red hover:bg-red-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Generate & Download Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TNTInvoiceForm;
