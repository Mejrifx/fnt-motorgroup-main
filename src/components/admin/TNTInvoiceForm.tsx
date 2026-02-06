import React, { useState } from 'react';
import { Download, FileText, XCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface TNTInvoiceFormProps {
  onClose: () => void;
}

const TNTInvoiceForm: React.FC<TNTInvoiceFormProps> = ({ onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    customerEmail: '',
    serviceDescription: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    vatAmount: '',
    grandTotal: '',
    paymentTerms: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate totals if unit price or quantity changes
    if (name === 'unitPrice' || name === 'quantity') {
      const qty = parseFloat(name === 'quantity' ? value : formData.quantity) || 0;
      const price = parseFloat(name === 'unitPrice' ? value : formData.unitPrice) || 0;
      const total = qty * price;
      const vat = total * 0.20; // 20% VAT
      const grand = total + vat;

      setFormData(prev => ({
        ...prev,
        totalAmount: total.toFixed(2),
        vatAmount: vat.toFixed(2),
        grandTotal: grand.toFixed(2)
      }));
    }
  };

  const fillPDFForm = async () => {
    setIsGenerating(true);
    try {
      // Fetch the PDF template
      const existingPdfBytes = await fetch('/TNT Services Invoice Template.pdf').then(res => res.arrayBuffer());
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      
      // Get all field names (for debugging - you can see what fields are available)
      const fields = form.getFields();
      console.log('Available PDF fields:', fields.map(f => f.getName()));
      
      // Fill the form fields (adjust field names based on your PDF)
      // You may need to check the console to see the exact field names in your PDF
      try {
        const fieldMapping: { [key: string]: string } = {
          'Invoice Number': formData.invoiceNumber,
          'Invoice Date': formData.invoiceDate,
          'Customer Name': formData.customerName,
          'Customer Address': formData.customerAddress,
          'Customer Phone': formData.customerPhone,
          'Customer Email': formData.customerEmail,
          'Service Description': formData.serviceDescription,
          'Quantity': formData.quantity,
          'Unit Price': formData.unitPrice,
          'Total Amount': formData.totalAmount,
          'VAT Amount': formData.vatAmount,
          'Grand Total': formData.grandTotal,
          'Payment Terms': formData.paymentTerms,
          'Notes': formData.notes
        };

        // Attempt to fill each field
        Object.entries(fieldMapping).forEach(([fieldName, value]) => {
          if (value) {
            try {
              const field = form.getTextField(fieldName);
              field.setText(value);
            } catch (err) {
              console.warn(`Field "${fieldName}" not found or not a text field`);
            }
          }
        });
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Invoice Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Invoice Number *
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

              {/* Customer Details */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Customer Details</h4>
              </div>

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
                  Customer Phone
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
                  Customer Email
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Address
                </label>
                <input
                  type="text"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="123 Main Street, Manchester"
                />
              </div>

              {/* Service Details */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Service Details</h4>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Description *
                </label>
                <textarea
                  name="serviceDescription"
                  value={formData.serviceDescription}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="Describe the service provided..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="1"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit Price (£)
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Financial Details */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Financial Details</h4>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Amount (£)
                </label>
                <input
                  type="text"
                  name="totalAmount"
                  value={formData.totalAmount}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  VAT (20%) (£)
                </label>
                <input
                  type="text"
                  name="vatAmount"
                  value={formData.vatAmount}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grand Total (£)
                </label>
                <input
                  type="text"
                  name="grandTotal"
                  value={formData.grandTotal}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="Due on receipt"
                />
              </div>

              {/* Additional Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="Any additional information..."
                  rows={3}
                />
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
                  disabled={isGenerating || !formData.invoiceNumber || !formData.customerName || !formData.serviceDescription}
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
