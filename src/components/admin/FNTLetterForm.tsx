import React, { useEffect, useState } from 'react';
import { Download, Eye, Mail, Plus, Trash2, XCircle } from 'lucide-react';
import {
  generateInvoiceNumber,
  saveInvoiceToDatabase,
  updateInvoiceInDatabase,
  uploadInvoicePDF,
  type Invoice,
} from '../../lib/invoiceUtils';
import { buildFNTLetter, type LetterInput } from '../../lib/pdf/fntLetter';
import { loadBrandLogo } from '../../lib/pdf/invoiceSections';
import { FNT_BRAND } from '../../lib/pdf/invoiceTheme';
import { LETTER_TEMPLATES, letterTemplate } from '../../lib/pdf/letterTemplates';
import { useToast } from '../ui/ToastContainer';

interface FNTLetterFormProps {
  onClose: () => void;
  editInvoice?: Invoice | null;
}

/** The signatory rarely changes, so it is remembered between letters. */
const SIGNER_KEY = 'fnt_letter_signer';

const FNTLetterForm: React.FC<FNTLetterFormProps> = ({ onClose, editInvoice }) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [loadingLetterNumber, setLoadingLetterNumber] = useState(!editInvoice);
  const isEditMode = !!editInvoice;

  const getInitialFormData = () => {
    if (editInvoice && editInvoice.metadata) {
      const meta = editInvoice.metadata;
      return {
        templateId: meta.template_id || 'blank',
        letterNumber: editInvoice.invoice_number,
        letterDate: editInvoice.invoice_date,
        recipientName: editInvoice.customer_name,
        recipientPhone: editInvoice.customer_phone || '',
        recipientEmail: editInvoice.customer_email || '',
        recipientAddress: meta.recipient_address || '',
        vehMake: editInvoice.vehicle_make || '',
        vehModel: editInvoice.vehicle_model || '',
        vehReg: editInvoice.vehicle_reg || '',
        subject: meta.subject || '',
        salutation: meta.salutation || '',
        body: meta.body || '',
        itemsHeading: meta.items_heading || 'What We Have Agreed',
        items: (meta.items as string[] | undefined) ?? [],
        closing: meta.closing || '',
        signedByName: meta.signed_by_name || '',
        signedByRole: meta.signed_by_role || 'FNT Motor Group',
        requireCustomerSignature: Boolean(meta.require_customer_signature),
      };
    }

    const template = letterTemplate('agreed_works');
    return {
      templateId: template.id,
      letterNumber: '',
      letterDate: new Date().toISOString().split('T')[0],
      recipientName: '',
      recipientPhone: '',
      recipientEmail: '',
      recipientAddress: '',
      vehMake: '',
      vehModel: '',
      vehReg: '',
      subject: template.subject,
      salutation: '',
      body: template.body,
      itemsHeading: template.itemsHeading,
      items: [...template.items],
      closing: template.closing,
      signedByName: localStorage.getItem(SIGNER_KEY) || '',
      signedByRole: 'FNT Motor Group',
      requireCustomerSignature: template.requireCustomerSignature,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyTemplate = (id: string) => {
    const template = letterTemplate(id);
    setFormData((prev) => ({
      ...prev,
      templateId: id,
      subject: template.subject,
      body: template.body,
      itemsHeading: template.itemsHeading,
      items: [...template.items],
      closing: template.closing,
      requireCustomerSignature: template.requireCustomerSignature,
    }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, position) => (position === index ? value : item)),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, ''] }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, position) => position !== index),
    }));
  };

  useEffect(() => {
    if (isEditMode) return;

    const loadLetterNumber = async () => {
      const letterNumber = await generateInvoiceNumber('fnt_letter');
      setFormData((prev) => ({ ...prev, letterNumber }));
      setLoadingLetterNumber(false);
    };

    loadLetterNumber();
  }, [isEditMode]);

  const letterInput = (): LetterInput => ({
    letterNumber: formData.letterNumber,
    letterDate: formData.letterDate,
    recipientName: formData.recipientName,
    recipientAddress: formData.recipientAddress,
    salutation: formData.salutation,
    subject: formData.subject,
    vehMake: formData.vehMake,
    vehModel: formData.vehModel,
    vehReg: formData.vehReg,
    body: formData.body,
    items: formData.items,
    itemsHeading: formData.itemsHeading,
    closing: formData.closing,
    signedByName: formData.signedByName,
    signedByRole: formData.signedByRole,
    requireCustomerSignature: formData.requireCustomerSignature,
  });

  const buildPdf = async (): Promise<Uint8Array> => {
    const logo = await loadBrandLogo(FNT_BRAND);
    return buildFNTLetter(letterInput(), { logo });
  };

  /** Opens the letter without saving it, so wording can be checked first. */
  const previewLetter = async () => {
    if (isPreviewing) return;
    setIsPreviewing(true);

    // Claimed before the await so the browser still credits the click.
    const tab = window.open('', '_blank');
    try {
      const bytes = await buildPdf();
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
      console.error('Failed to preview letter:', error);
      showToast('Could not build the preview. Please try again.', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  const generateLetter = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await buildPdf();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

      const pdfUrl = await uploadInvoicePDF(blob, formData.letterNumber, 'fnt_letter');
      if (!pdfUrl) {
        showToast('Failed to upload the letter to storage. Please try again.', 'error');
        setIsGenerating(false);
        return;
      }

      const letterData = {
        invoice_number: formData.letterNumber,
        invoice_type: 'fnt_letter' as const,
        invoice_date: formData.letterDate,
        customer_name: formData.recipientName,
        customer_email: formData.recipientEmail,
        customer_phone: formData.recipientPhone,
        vehicle_make: formData.vehMake,
        vehicle_model: formData.vehModel,
        vehicle_reg: formData.vehReg,
        pdf_url: pdfUrl,
        metadata: {
          template_id: formData.templateId,
          recipient_address: formData.recipientAddress,
          subject: formData.subject,
          salutation: formData.salutation,
          body: formData.body,
          items_heading: formData.itemsHeading,
          items: formData.items.filter((item) => item.trim()),
          closing: formData.closing,
          signed_by_name: formData.signedByName,
          signed_by_role: formData.signedByRole,
          require_customer_signature: formData.requireCustomerSignature,
        },
      };

      const saved = isEditMode && editInvoice
        ? await updateInvoiceInDatabase(editInvoice.id, letterData)
        : await saveInvoiceToDatabase(letterData);

      if (!saved) {
        showToast(
          'The PDF was uploaded but the record was not saved. Please check the letter in history.',
          'error',
        );
      }

      localStorage.setItem(SIGNER_KEY, formData.signedByName);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.letterNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      showToast(
        `Letter ${formData.letterNumber} ${isEditMode ? 'updated' : 'generated and saved'} successfully!`,
        'success',
      );
      setIsGenerating(false);
      setTimeout(onClose, 500);
    } catch (error) {
      console.error('Error generating letter:', error);
      showToast('Error generating the letter. Please check the console for details.', 'error');
      setIsGenerating(false);
    }
  };

  const canGenerate =
    !!formData.letterNumber &&
    !!formData.recipientName.trim() &&
    !!formData.subject.trim() &&
    !!formData.body.trim() &&
    !!formData.signedByName.trim();

  const selectedTemplate = letterTemplate(formData.templateId);
  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent';

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-fnt-red text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-bold">{isEditMode ? 'Edit FNT Letter' : 'FNT Letter'}</h3>
            <p className="text-sm text-red-100">
              {isEditMode
                ? `Editing letter ${formData.letterNumber}`
                : 'For putting agreements and confirmations in writing'}
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
            {/* Template */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Letter Type</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start from a template
                  </label>
                  <select
                    name="templateId"
                    value={formData.templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className={inputClass}
                  >
                    {LETTER_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{selectedTemplate.description}</p>
                </div>
                <div className="flex items-end">
                  <p className="text-xs text-gray-500 pb-2">
                    Choosing a template replaces the subject, message and agreed points below. Every
                    field stays editable afterwards.
                  </p>
                </div>
              </div>
            </div>

            {/* Letter Details */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Letter Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Letter No *</label>
                  <input
                    type="text"
                    value={loadingLetterNumber ? 'Generating...' : formData.letterNumber}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    name="letterDate"
                    value={formData.letterDate}
                    onChange={handleInputChange}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Recipient</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="recipientAddress"
                    value={formData.recipientAddress}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="123 Main Street, Manchester, M1 1AA"
                  />
                  <p className="text-xs text-gray-500 mt-1">Commas start a new line on the letter</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="07123 456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">For your records, not shown on the letter</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="recipientEmail"
                    value={formData.recipientEmail}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">For your records, not shown on the letter</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Greeting
                  </label>
                  <input
                    type="text"
                    name="salutation"
                    value={formData.salutation}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder={`Dear ${formData.recipientName.trim().split(' ')[0] || 'John'},`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use the first name</p>
                </div>
              </div>
            </div>

            {/* Vehicle */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                Vehicle <span className="text-sm font-normal text-gray-500">(optional)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
                  <input
                    type="text"
                    name="vehMake"
                    value={formData.vehMake}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="BMW"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    name="vehModel"
                    value={formData.vehModel}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="3 Series"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration</label>
                  <input
                    type="text"
                    name="vehReg"
                    value={formData.vehReg}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="AB12 CDE"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Message</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Confirmation of Work Agreed Following Your Purchase"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Shown as "Re: ..." at the top of the letter</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                  <textarea
                    name="body"
                    value={formData.body}
                    onChange={handleInputChange}
                    rows={7}
                    className={inputClass}
                    placeholder="Write the letter here. Leave a blank line between paragraphs."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave a blank line between paragraphs. The letter runs onto a second page if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreed points */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                Bulleted Points <span className="text-sm font-normal text-gray-500">(optional)</span>
              </h4>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Heading</label>
                <input
                  type="text"
                  name="itemsHeading"
                  value={formData.itemsHeading}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="What We Have Agreed"
                />
              </div>

              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 text-center text-fnt-red font-bold">&bull;</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                      className={inputClass}
                      placeholder="Replace the driver's side wing mirror"
                    />
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                className="mt-3 flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                Add point
              </button>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Closing paragraphs <span className="text-xs font-normal text-gray-500">(optional)</span>
                </label>
                <textarea
                  name="closing"
                  value={formData.closing}
                  onChange={handleInputChange}
                  rows={4}
                  className={inputClass}
                  placeholder="Anything to say after the bulleted points."
                />
              </div>
            </div>

            {/* Sign-off */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Sign-off</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Signed by *</label>
                  <input
                    type="text"
                    name="signedByName"
                    value={formData.signedByName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    name="signedByRole"
                    value={formData.signedByRole}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="FNT Motor Group"
                  />
                </div>
              </div>

              <label className="mt-4 flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.requireCustomerSignature}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, requireCustomerSignature: e.target.checked }))
                  }
                  className="mt-0.5 w-4 h-4 text-fnt-red focus:ring-fnt-red border-gray-300 rounded"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    Add a signature block for both parties
                  </span>
                  <span className="block text-xs text-gray-500">
                    Use this when the letter records something agreed between you and the customer, so
                    both can sign a copy.
                  </span>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t">
              <p className="text-sm text-gray-600">* Required fields</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={previewLetter}
                  disabled={isPreviewing || isGenerating || !canGenerate}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-5 h-5" />
                  <span>{isPreviewing ? 'Building...' : 'Preview'}</span>
                </button>
                <button
                  onClick={generateLetter}
                  disabled={isGenerating || !canGenerate}
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
                      <span>{isEditMode ? 'Update & Download Letter' : 'Generate & Download Letter'}</span>
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

export default FNTLetterForm;
