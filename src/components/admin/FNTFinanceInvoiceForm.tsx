import React, { useState, useEffect } from 'react';
import { Download, FileText, XCircle } from 'lucide-react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { generateInvoiceNumber, uploadInvoicePDF, saveInvoiceToDatabase, updateInvoiceInDatabase, secureFlattenPDF, type Invoice } from '../../lib/invoiceUtils';
import { useToast } from '../ui/ToastContainer';

interface FNTFinanceInvoiceFormProps {
  onClose: () => void;
  editInvoice?: Invoice | null;
}

const FNTFinanceInvoiceForm: React.FC<FNTFinanceInvoiceFormProps> = ({ onClose, editInvoice }) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(!editInvoice);
  const isEditMode = !!editInvoice;

  // Initialize form data from editInvoice if provided
  const getInitialFormData = () => {
    if (editInvoice && editInvoice.metadata) {
      const meta = editInvoice.metadata;
      return {
        invoiceNumber: editInvoice.invoice_number,
        invoiceDate: editInvoice.invoice_date,
        financeCompanyName: editInvoice.customer_name,
        financeCompanyPhone: editInvoice.customer_phone || '',
        financeCompanyEmail: editInvoice.customer_email || '',
        financeCompanyAddress: meta.finance_company_address || '',
        endCustomerName: meta.end_customer_name || '',
        vehMake: editInvoice.vehicle_make || '',
        vehModel: editInvoice.vehicle_model || '',
        vehReg: editInvoice.vehicle_reg || '',
        vehColour: meta.vehicle_colour || '',
        vehVin: meta.vehicle_vin || '',
        vehMileage: meta.vehicle_mileage || '',
        retailPrice: meta.retail_price || '',
        deliveryCost: meta.delivery_cost || '',
        warranty: meta.warranty || '',
        warrantyType: meta.warranty_type || '',
        depositPaid: meta.deposit_paid || '',
        totalDue: editInvoice.total_amount?.toString() || '',
        buyerSignature: meta.buyer_signature || '',
        paymentMethod: meta.payment_method || ''
      };
    }
    
    return {
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      financeCompanyName: '',
      financeCompanyPhone: '',
      financeCompanyEmail: '',
      financeCompanyAddress: '',
      endCustomerName: '',
      vehMake: '',
      vehModel: '',
      vehReg: '',
      vehColour: '',
      vehVin: '',
      vehMileage: '',
      retailPrice: '',
      deliveryCost: '',
      warranty: '',
      warrantyType: '',
      depositPaid: '',
      totalDue: '',
      buyerSignature: '',
      paymentMethod: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

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
      
      // Total Due = Retail + Delivery + Warranty - Deposit
      const totalDue = retail + delivery + warranty - deposit;

      setFormData(prev => ({
        ...prev,
        totalDue: totalDue.toFixed(2)
      }));
    }
  };

  // Auto-generate invoice number on mount (only if not editing)
  useEffect(() => {
    if (!isEditMode) {
      const loadInvoiceNumber = async () => {
        const invoiceNumber = await generateInvoiceNumber('fnt_finance');
        setFormData(prev => ({
          ...prev,
          invoiceNumber
        }));
        setLoadingInvoiceNumber(false);
      };

      loadInvoiceNumber();
    }
  }, [isEditMode]);

  const fillPDFForm = async () => {
    setIsGenerating(true);
    try {
      // Fetch the PDF template
      const existingPdfBytes = await fetch('/FNT Sales Invoice - FINANCE.pdf').then(res => res.arrayBuffer());
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      
      // Get all field names (for debugging)
      const fields = form.getFields();
      const availableFieldNames = fields.map(f => f.getName());
      console.log('📋 Available PDF fields:', availableFieldNames);
      console.log('📊 Total fields in PDF:', availableFieldNames.length);
      
      // Fill the form fields - matching the exact field names from the PDF
      try {
        const fieldMapping: { [key: string]: string } = {
          // Invoice Details
          'invoice_no': formData.invoiceNumber,
          'invoice_date': formData.invoiceDate,
          
          // Finance Company Details (Bill To)
          'bill_full_name': formData.financeCompanyName,
          'bill_phone': formData.financeCompanyPhone,
          'bill_email': formData.financeCompanyEmail,
          'bill_address': formData.financeCompanyAddress,
          
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
          'seller_signature': 'FNT MOTOR GROUP', // Auto-filled
          'buyer_signature': formData.buyerSignature
        };

        let filledCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Fill fields
        Object.entries(fieldMapping).forEach(([fieldName, value]) => {
          if (value) {
            try {
              const field = form.getTextField(fieldName);
              field.setText(value);
              console.log(`✅ Filled "${fieldName}" with: "${value}"`);
              filledCount++;
            } catch (err) {
              console.warn(`❌ Field "${fieldName}" not found or error:`, err);
              errorCount++;
            }
          } else {
            console.log(`⏭️ Skipped "${fieldName}" (empty value)`);
            skippedCount++;
          }
        });

        console.log(`📝 Summary: ${filledCount} filled, ${skippedCount} skipped (empty), ${errorCount} errors`);
      } catch (err) {
        console.error('Error filling form fields:', err);
      }

      // Securely flatten the PDF to make it completely non-editable
      await secureFlattenPDF(pdfDoc);

      // Serialize the PDF with additional security options
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      // Create a blob
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Upload to Supabase Storage
      console.log('Uploading PDF to Supabase Storage...');
      const pdfUrl = await uploadInvoicePDF(blob, formData.invoiceNumber, 'fnt_finance');

      if (!pdfUrl) {
        alert('Failed to upload invoice to storage. Please try again.');
        setIsGenerating(false);
        return;
      }

      // Save invoice metadata to database
      console.log('Saving invoice metadata to database...');
      const invoiceData = {
        invoice_number: formData.invoiceNumber,
        invoice_type: 'fnt_finance' as const,
        invoice_date: formData.invoiceDate,
        customer_name: formData.financeCompanyName,
        customer_email: formData.financeCompanyEmail,
        customer_phone: formData.financeCompanyPhone,
        vehicle_make: formData.vehMake,
        vehicle_model: formData.vehModel,
        vehicle_reg: formData.vehReg,
        total_amount: parseFloat(formData.totalDue) || 0,
        pdf_url: pdfUrl,
        metadata: {
          finance_company_address: formData.financeCompanyAddress,
          end_customer_name: formData.endCustomerName,
          vehicle_colour: formData.vehColour,
          vehicle_vin: formData.vehVin,
          vehicle_mileage: formData.vehMileage,
          retail_price: formData.retailPrice,
          delivery_cost: formData.deliveryCost,
          warranty: formData.warranty,
          warranty_type: formData.warrantyType,
          deposit_paid: formData.depositPaid,
          buyer_signature: formData.buyerSignature,
          payment_method: formData.paymentMethod
        }
      };

      // Save or update the invoice in database
      let saved;
      if (isEditMode && editInvoice) {
        saved = await updateInvoiceInDatabase(editInvoice.id, invoiceData);
        if (!saved) {
          alert('Failed to update invoice in database. The PDF was uploaded but the record was not updated.');
        }
      } else {
        saved = await saveInvoiceToDatabase(invoiceData);
        if (!saved) {
          alert('Failed to save invoice to database. The PDF was uploaded but the record was not saved.');
        }
      }

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      showToast(
        `Invoice ${formData.invoiceNumber} ${isEditMode ? 'updated' : 'generated and saved'} successfully!`, 
        'success'
      );
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
            <h3 className="text-lg font-bold">
              {isEditMode ? 'Edit FNT Finance Invoice' : 'FNT Finance Invoice'}
            </h3>
            <p className="text-sm text-red-100">
              {isEditMode ? `Editing invoice ${formData.invoiceNumber}` : 'For billing finance companies'}
            </p>
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
          <div className="admin-glass-card !rounded-xl p-8">
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method <span className="text-xs text-gray-500">(Internal Only)</span>
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Finance">Finance</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">For internal tracking only (not shown on invoice)</p>
                </div>
              </div>
            </div>

            {/* Finance Company Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Finance Company Details (Bill To)</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Enter the finance company's details here (e.g., Santander, Black Horse, etc.)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="financeCompanyName"
                    value={formData.financeCompanyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="e.g., Santander Consumer Finance"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="financeCompanyPhone"
                    value={formData.financeCompanyPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="0800 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="financeCompanyEmail"
                    value={formData.financeCompanyEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="settlements@financecompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="financeCompanyAddress"
                    value={formData.financeCompanyAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="Finance House, London"
                  />
                </div>
              </div>
            </div>

            {/* End Customer Reference (Optional) */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">End Customer (Optional)</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Optional:</strong> Enter the end customer's name for your internal reference. This won't appear on the invoice.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Customer Name
                </label>
                <input
                  type="text"
                  name="endCustomerName"
                  value={formData.endCustomerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="John Smith (for your reference only)"
                />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Vehicle Being Financed</h4>
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
                    Retail Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="retailPrice"
                      value={formData.retailPrice}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
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
                      type="text"
                      inputMode="decimal"
                      name="deliveryCost"
                      value={formData.deliveryCost}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
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
                      type="text"
                      inputMode="decimal"
                      name="warranty"
                      value={formData.warranty}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
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
                    placeholder="e.g., 12 Month Warranty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deposit Paid
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="depositPaid"
                      value={formData.depositPaid}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="0.00"
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
                    Seller Signature
                  </label>
                  <input
                    type="text"
                    value="FNT MOTOR GROUP"
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buyer Signature
                  </label>
                  <input
                    type="text"
                    name="buyerSignature"
                    value={formData.buyerSignature}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="Finance company representative name"
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
                  disabled={isGenerating || !formData.invoiceNumber || !formData.financeCompanyName || !formData.vehMake || !formData.vehModel || !formData.retailPrice}
                  className="flex items-center space-x-2 px-6 py-3 btn-glass-red text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>{isEditMode ? 'Update & Download Invoice' : 'Generate & Download Invoice'}</span>
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

export default FNTFinanceInvoiceForm;
