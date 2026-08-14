import React, { useState, useEffect } from 'react';
import { Download, FileText, XCircle } from 'lucide-react';
import { generateInvoiceNumber, uploadInvoicePDF, saveInvoiceToDatabase, updateInvoiceInDatabase, type Invoice } from '../../lib/invoiceUtils';
import { buildFNTSaleInvoice } from '../../lib/pdf/fntSaleInvoice';
import { loadBrandLogo } from '../../lib/pdf/invoiceSections';
import { FNT_BRAND } from '../../lib/pdf/invoiceTheme';
import { useToast } from '../ui/ToastContainer';

interface FNTSaleInvoiceFormProps {
  onClose: () => void;
  editInvoice?: Invoice | null;
}

const FNTSaleInvoiceForm: React.FC<FNTSaleInvoiceFormProps> = ({ onClose, editInvoice }) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(!editInvoice); // Skip loading if editing
  const isEditMode = !!editInvoice;

  // Initialize form data from editInvoice if provided
  const getInitialFormData = () => {
    if (editInvoice && editInvoice.metadata) {
      const meta = editInvoice.metadata;
      return {
        invoiceNumber: editInvoice.invoice_number,
        invoiceDate: editInvoice.invoice_date,
        buyerName: editInvoice.customer_name,
        buyerPhone: editInvoice.customer_phone || '',
        buyerEmail: editInvoice.customer_email || '',
        buyerAddress: meta.buyer_address || '',
        vehMake: editInvoice.vehicle_make || '',
        vehModel: editInvoice.vehicle_model || '',
        vehReg: editInvoice.vehicle_reg || '',
        vehColour: meta.vehicle_colour || '',
        vehVin: meta.vehicle_vin || '',
        vehMileage: meta.vehicle_mileage || '',
        // Records created before the toggle existed are inferred from their fields.
        hasPartExchange: meta.has_part_exchange ?? Boolean(meta.px_vehicle),
        pxMake: meta.px_vehicle?.make || '',
        pxModel: meta.px_vehicle?.model || '',
        pxReg: meta.px_vehicle?.reg || '',
        pxColour: meta.px_vehicle?.colour || '',
        pxVin: meta.px_vehicle?.vin || '',
        pxMileage: meta.px_vehicle?.mileage || '',
        pxPrice: meta.px_price || meta.px_vehicle?.price || '',
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
      buyerName: '',
      buyerPhone: '',
      buyerEmail: '',
      buyerAddress: '',
      vehMake: '',
      vehModel: '',
      vehReg: '',
      vehColour: '',
      vehVin: '',
      vehMileage: '',
      hasPartExchange: false,
      pxMake: '',
      pxModel: '',
      pxReg: '',
      pxColour: '',
      pxVin: '',
      pxMileage: '',
      pxPrice: '',
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

  type SaleFormData = ReturnType<typeof getInitialFormData>;

  const FINANCIAL_FIELDS = ['retailPrice', 'deliveryCost', 'warranty', 'depositPaid', 'pxPrice'];

  /** Total Due = Retail + Delivery + Warranty - Deposit - Part Exchange. */
  const recalculateTotal = (data: SaleFormData) => {
    const retail = parseFloat(data.retailPrice) || 0;
    const delivery = parseFloat(data.deliveryCost) || 0;
    const warranty = parseFloat(data.warranty) || 0;
    const deposit = parseFloat(data.depositPaid) || 0;
    const partExchange = data.hasPartExchange ? parseFloat(data.pxPrice) || 0 : 0;

    return (retail + delivery + warranty - deposit - partExchange).toFixed(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (FINANCIAL_FIELDS.includes(name)) {
        next.totalDue = recalculateTotal(next);
      }
      return next;
    });
  };

  const setPartExchange = (enabled: boolean) => {
    setFormData(prev => {
      const next = { ...prev, hasPartExchange: enabled };
      next.totalDue = recalculateTotal(next);
      return next;
    });
  };

  // Auto-generate invoice number on mount (only if not editing)
  useEffect(() => {
    if (!isEditMode) {
      const loadInvoiceNumber = async () => {
        const invoiceNumber = await generateInvoiceNumber('fnt_sale');
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
      // The invoice is drawn from scratch rather than filled into a template, so
      // the output carries no form fields and cannot be edited or come out blank.
      const logo = await loadBrandLogo(FNT_BRAND);
      const pdfBytes = await buildFNTSaleInvoice(
        {
          invoiceNumber: formData.invoiceNumber,
          invoiceDate: formData.invoiceDate,
          buyerName: formData.buyerName,
          buyerPhone: formData.buyerPhone,
          buyerEmail: formData.buyerEmail,
          buyerAddress: formData.buyerAddress,
          vehMake: formData.vehMake,
          vehModel: formData.vehModel,
          vehReg: formData.vehReg,
          vehColour: formData.vehColour,
          vehVin: formData.vehVin,
          vehMileage: formData.vehMileage,
          hasPartExchange: formData.hasPartExchange,
          pxMake: formData.pxMake,
          pxModel: formData.pxModel,
          pxReg: formData.pxReg,
          pxColour: formData.pxColour,
          pxVin: formData.pxVin,
          pxMileage: formData.pxMileage,
          pxPrice: formData.pxPrice,
          retailPrice: formData.retailPrice,
          deliveryCost: formData.deliveryCost,
          warranty: formData.warranty,
          warrantyType: formData.warrantyType,
          depositPaid: formData.depositPaid,
          totalDue: formData.totalDue,
          buyerSignature: formData.buyerSignature,
        },
        { logo },
      );

      // Create a blob
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Upload to Supabase Storage
      console.log('Uploading PDF to Supabase Storage...');
      const pdfUrl = await uploadInvoicePDF(blob, formData.invoiceNumber, 'fnt_sale');

      if (!pdfUrl) {
        alert('Failed to upload invoice to storage. Please try again.');
        setIsGenerating(false);
        return;
      }

      // Save invoice metadata to database
      console.log('Saving invoice metadata to database...');
      const invoiceData = {
        invoice_number: formData.invoiceNumber,
        invoice_type: 'fnt_sale' as const,
        invoice_date: formData.invoiceDate,
        customer_name: formData.buyerName,
        customer_email: formData.buyerEmail,
        customer_phone: formData.buyerPhone,
        vehicle_make: formData.vehMake,
        vehicle_model: formData.vehModel,
        vehicle_reg: formData.vehReg,
        total_amount: parseFloat(formData.totalDue) || 0,
        pdf_url: pdfUrl,
        metadata: {
          buyer_address: formData.buyerAddress,
          vehicle_colour: formData.vehColour,
          vehicle_vin: formData.vehVin,
          vehicle_mileage: formData.vehMileage,
          has_part_exchange: formData.hasPartExchange,
          px_vehicle: formData.hasPartExchange ? {
            make: formData.pxMake,
            model: formData.pxModel,
            reg: formData.pxReg,
            colour: formData.pxColour,
            vin: formData.pxVin,
            mileage: formData.pxMileage,
            price: formData.pxPrice
          } : null,
          retail_price: formData.retailPrice,
          delivery_cost: formData.deliveryCost,
          warranty: formData.warranty,
          warranty_type: formData.warrantyType,
          deposit_paid: formData.depositPaid,
          px_price: formData.hasPartExchange ? formData.pxPrice : '',
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
              {isEditMode ? 'Edit FNT Sale Invoice' : 'FNT Sale Invoice'}
            </h3>
            <p className="text-sm text-red-100">
              {isEditMode ? `Editing invoice ${formData.invoiceNumber}` : 'For selling vehicles to customers'}
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

            {/* Buyer Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Buyer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="buyerName"
                    value={formData.buyerName}
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
                    name="buyerPhone"
                    value={formData.buyerPhone}
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
                    name="buyerEmail"
                    value={formData.buyerEmail}
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
                    name="buyerAddress"
                    value={formData.buyerAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="123 Main Street, Manchester"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Vehicle Being Sold</h4>
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

            {/* Part Exchange Vehicle */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Part Exchange</h4>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Is the customer trading a vehicle in?
                </p>
                <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setPartExchange(false)}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
                      !formData.hasPartExchange
                        ? 'bg-fnt-red text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    No Part Exchange
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartExchange(true)}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
                      formData.hasPartExchange
                        ? 'bg-fnt-red text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Part Exchange
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.hasPartExchange
                    ? 'The part exchange section will appear on the invoice and the allowance is deducted from the total.'
                    : 'The part exchange section is left off the invoice entirely.'}
                </p>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${formData.hasPartExchange ? '' : 'hidden'}`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Make
                  </label>
                  <input
                    type="text"
                    name="pxMake"
                    value={formData.pxMake}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="Audi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    name="pxModel"
                    value={formData.pxModel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="A4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration
                  </label>
                  <input
                    type="text"
                    name="pxReg"
                    value={formData.pxReg}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="XY34 ZAB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Colour
                  </label>
                  <input
                    type="text"
                    name="pxColour"
                    value={formData.pxColour}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="Silver"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    VIN
                  </label>
                  <input
                    type="text"
                    name="pxVin"
                    value={formData.pxVin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="WAUZZZ8E8AA123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mileage
                  </label>
                  <input
                    type="text"
                    name="pxMileage"
                    value={formData.pxMileage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                    placeholder="75000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Part Exchange Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="pxPrice"
                      value={formData.pxPrice}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                      placeholder="5000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This amount will be deducted from the total due</p>
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
                    placeholder="Signature text or leave blank for manual signing"
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
                  disabled={isGenerating || !formData.invoiceNumber || !formData.buyerName || !formData.vehMake || !formData.vehModel || !formData.retailPrice}
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

export default FNTSaleInvoiceForm;
