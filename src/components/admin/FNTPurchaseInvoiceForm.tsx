import React, { useState, useEffect } from 'react';
import { Download, FileText, XCircle } from 'lucide-react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { generateInvoiceNumber, uploadInvoicePDF, saveInvoiceToDatabase } from '../../lib/invoiceUtils';
import { useToast } from '../ui/ToastContainer';

interface FNTPurchaseInvoiceFormProps {
  onClose: () => void;
}

const FNTPurchaseInvoiceForm: React.FC<FNTPurchaseInvoiceFormProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(true);
  const [formData, setFormData] = useState({
    // Invoice Details
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    
    // Seller Details (bill_) - The customer selling to us
    sellerName: '',
    sellerPhone: '',
    sellerEmail: '',
    sellerAddress: '',
    
    // Vehicle Details (veh_)
    vehMake: '',
    vehModel: '',
    vehReg: '',
    vehColour: '',
    vehVin: '',
    vehMileage: '',
    
    // Financial Details
    retailPrice: '',
    deliveryCost: '',
    warranty: '',
    warrantyType: '',
    depositPaid: '',
    totalDue: '',
    
    // Signatures
    sellerSignature: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate totals if financial fields change
    if (['retailPrice', 'deliveryCost', 'warranty', 'depositPaid'].includes(name)) {
      const retail = parseFloat(name === 'retailPrice' ? value : formData.retailPrice) || 0;
      const delivery = parseFloat(name === 'deliveryCost' ? value : formData.deliveryCost) || 0;
      const warranty = parseFloat(name === 'warranty' ? value : formData.warranty) || 0;
      const deposit = parseFloat(name === 'depositPaid' ? value : formData.depositPaid) || 0;
      
      const totalDue = retail + delivery + warranty - deposit;

      setFormData(prev => ({
        ...prev,
        totalDue: totalDue.toFixed(2)
      }));
    }
  };

  // Auto-generate invoice number on mount
  useEffect(() => {
    const loadInvoiceNumber = async () => {
      const invoiceNumber = await generateInvoiceNumber('fnt_purchase');
      setFormData(prev => ({
        ...prev,
        invoiceNumber
      }));
      setLoadingInvoiceNumber(false);
    };

    loadInvoiceNumber();
  }, []);

  const fillPDFForm = async () => {
    setIsGenerating(true);
    try {
      // Fetch the PDF template
      const existingPdfBytes = await fetch('/FNT Purchase Invoice Template.pdf').then(res => res.arrayBuffer());
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      
      // Get all field names (for debugging)
      const fields = form.getFields();
      console.log('Available PDF fields:', fields.map(f => f.getName()));
      
      // Fill the form fields - matching the exact field names from the PDF
      try {
        const fieldMapping: { [key: string]: string } = {
          // Invoice Details
          'invoice_no': formData.invoiceNumber,
          'invoice_date': formData.invoiceDate,
          
          // Seller Details (customer selling to us)
          'bill_full_name': formData.sellerName,
          'bill_phone': formData.sellerPhone,
          'bill_email': formData.sellerEmail,
          'bill_address': formData.sellerAddress,
          
          // Vehicle Details
          'veh_make': formData.vehMake,
          'veh_model': formData.vehModel,
          'veh_reg': formData.vehReg,
          'veh_colour': formData.vehColour,
          'veh_vin': formData.vehVin,
          'veh_mileage': formData.vehMileage,
          
          // Financial Details (with £ symbol)
          'retail_price': formData.retailPrice ? `£${formData.retailPrice}` : '',
          'delivery_cost': formData.deliveryCost ? `£${formData.deliveryCost}` : '',
          'warranty': formData.warranty ? `£${formData.warranty}` : '',
          'warranty_type': formData.warrantyType,
          'deposit_paid': formData.depositPaid ? `£${formData.depositPaid}` : '',
          'total_due': formData.totalDue ? `£${formData.totalDue}` : '',
          
          // Signatures
          'seller_signature': formData.sellerSignature,
          'buyer_signature': 'FNT MOTOR GROUP' // Auto-filled (we're buying)
        };

        // Fill fields - exact same approach as TNT invoice
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

        console.log('PDF fields filled successfully!');
      } catch (err) {
        console.error('Error filling form fields:', err);
      }

      // Load Helvetica font and update field appearances
      try {
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        form.updateFieldAppearances(helveticaFont);
        console.log('Field appearances updated with Helvetica font');
      } catch (appearanceErr) {
        console.warn('Could not update field appearances:', appearanceErr);
      }

      // Flatten the form to make it non-editable
      form.flatten();

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();

      // Create a blob
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Upload to Supabase Storage
      console.log('Uploading PDF to Supabase Storage...');
      const pdfUrl = await uploadInvoicePDF(blob, formData.invoiceNumber, 'fnt_purchase');

      if (!pdfUrl) {
        alert('Failed to upload invoice to storage. Please try again.');
        setIsGenerating(false);
        return;
      }

      // Save invoice metadata to database
      console.log('Saving invoice metadata to database...');
      const invoiceData = {
        invoice_number: formData.invoiceNumber,
        invoice_type: 'fnt_purchase' as const,
        invoice_date: formData.invoiceDate,
        customer_name: formData.sellerName,
        customer_email: formData.sellerEmail,
        customer_phone: formData.sellerPhone,
        vehicle_make: formData.vehMake,
        vehicle_model: formData.vehModel,
        vehicle_reg: formData.vehReg,
        total_amount: parseFloat(formData.totalDue) || 0,
        pdf_url: pdfUrl,
        metadata: {
          seller_address: formData.sellerAddress,
          vehicle_colour: formData.vehColour,
          vehicle_vin: formData.vehVin,
          vehicle_mileage: formData.vehMileage,
          retail_price: formData.retailPrice,
          delivery_cost: formData.deliveryCost,
          warranty: formData.warranty,
          warranty_type: formData.warrantyType,
          deposit_paid: formData.depositPaid,
          seller_signature: formData.sellerSignature
        }
      };

      const saved = await saveInvoiceToDatabase(invoiceData);

      if (!saved) {
        alert('Failed to save invoice to database. The PDF was uploaded but the record was not saved.');
      }

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`Invoice ${formData.invoiceNumber} generated and saved successfully!`, 'success');
      setIsGenerating(false);

      // Close the form after successful generation
      setTimeout(() => {
        onClose();
      }, 500);
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
            <h3 className="text-lg font-bold">FNT Purchase Invoice</h3>
            <p className="text-sm text-red-100">For purchasing vehicles from customers</p>
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
            {/* Invoice Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Invoice Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice No *
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={loadingInvoiceNumber ? 'Generating...' : formData.invoiceNumber}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                    placeholder="Auto-generated"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
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
              </div>
            </div>

            {/* Seller Details (Customer) */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Seller Details (Customer)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
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
                    name="sellerPhone"
                    value={formData.sellerPhone}
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
                    name="sellerEmail"
                    value={formData.sellerEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="sellerAddress"
                    value={formData.sellerAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="123 Main Street, Manchester"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Vehicle Being Purchased</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Make *
                  </label>
                  <input
                    type="text"
                    name="vehMake"
                    value={formData.vehMake}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="BMW"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="vehModel"
                    value={formData.vehModel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="3 Series"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration
                  </label>
                  <input
                    type="text"
                    name="vehReg"
                    value={formData.vehReg}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="AB12 CDE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Colour
                  </label>
                  <input
                    type="text"
                    name="vehColour"
                    value={formData.vehColour}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="Black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    VIN
                  </label>
                  <input
                    type="text"
                    name="vehVin"
                    value={formData.vehVin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="WBADT43452G123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mileage
                  </label>
                  <input
                    type="text"
                    name="vehMileage"
                    value={formData.vehMileage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Financial Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">£</span>
                    <input
                      type="number"
                      name="retailPrice"
                      value={formData.retailPrice}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">£</span>
                    <input
                      type="number"
                      name="deliveryCost"
                      value={formData.deliveryCost}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Warranty
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">£</span>
                    <input
                      type="number"
                      name="warranty"
                      value={formData.warranty}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Warranty Type
                  </label>
                  <input
                    type="text"
                    name="warrantyType"
                    value={formData.warrantyType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="e.g., 12 Month Warranty, Extended Warranty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deposit Paid
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">£</span>
                    <input
                      type="number"
                      name="depositPaid"
                      value={formData.depositPaid}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Due
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700 font-bold text-lg">£</span>
                    <input
                      type="text"
                      name="totalDue"
                      value={formData.totalDue}
                      readOnly
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-green-50 font-bold text-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Signatures</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seller Signature (Customer)
                  </label>
                  <input
                    type="text"
                    name="sellerSignature"
                    value={formData.sellerSignature}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="Signature text or leave blank for manual signing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buyer Signature (FNT Motor Group)
                  </label>
                  <input
                    type="text"
                    value="FNT MOTOR GROUP"
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled</p>
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
                  disabled={isGenerating || !formData.invoiceNumber || !formData.sellerName || !formData.vehMake || !formData.vehModel || !formData.retailPrice}
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

export default FNTPurchaseInvoiceForm;
