import React, { useState } from 'react';
import { Plus, FileText, ExternalLink, XCircle } from 'lucide-react';
import TNTInvoiceForm from './TNTInvoiceForm';
import FNTSaleInvoiceForm from './FNTSaleInvoiceForm';

// SimplePDF type declaration
declare global {
  interface Window {
    simplePDF?: {
      openEditor: (options: {
        href: string;
        context?: Record<string, any>;
      }) => void;
      closeEditor: () => void;
      setConfig: (config: Record<string, any>) => void;
    };
  }
}

const InvoiceManager = () => {
  const [showSimplePDFEditor, setShowSimplePDFEditor] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<'selling' | 'purchase' | 'tnt' | null>(null);
  const [showTNTForm, setShowTNTForm] = useState(false);
  const [showFNTSaleForm, setShowFNTSaleForm] = useState(false);

  // Template URLs
  const TEMPLATES = {
    selling: 'https://qiml3vqj.simplepdf.com/documents/e3001c49-d97d-408b-8662-b73b7bbce355',
    purchase: 'https://qiml3vqj.simplepdf.com/documents/1ae46b5b-569c-400d-a40c-5780aaee6287',
    tnt: '' // Placeholder - will be updated with actual template URL
  };

  const openSimplePDFEditor = (type: 'selling' | 'purchase' | 'tnt') => {
    // Open SimplePDF editor with selected template
    if (window.simplePDF) {
      window.simplePDF.openEditor({
        href: TEMPLATES[type]
      });
    } else {
      alert('SimplePDF is loading... Please try again in a moment.');
    }
  };

  const openSimplePDFEditorInline = (type: 'selling' | 'purchase' | 'tnt') => {
    if (type === 'tnt') {
      setShowTNTForm(true);
    } else if (type === 'selling') {
      setShowFNTSaleForm(true);
    } else {
      setCurrentTemplate(type);
      setShowSimplePDFEditor(true);
    }
  };

  const closeSimplePDFEditor = () => {
    setShowSimplePDFEditor(false);
    setCurrentTemplate(null);
  };

  return (
    <div>
      {/* TNT Invoice Form */}
      {showTNTForm && (
        <TNTInvoiceForm onClose={() => setShowTNTForm(false)} />
      )}

      {/* FNT Sale Invoice Form */}
      {showFNTSaleForm && (
        <FNTSaleInvoiceForm onClose={() => setShowFNTSaleForm(false)} />
      )}

      {/* SimplePDF Editor - Full Screen */}
      {showSimplePDFEditor && currentTemplate && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-fnt-red text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold">
                  Create {currentTemplate === 'selling' ? 'Selling' : currentTemplate === 'purchase' ? 'Purchase' : 'TNT Services'} Invoice
                </h3>
                <p className="text-sm text-red-100">
                  {currentTemplate === 'selling' 
                    ? 'For selling vehicles to customers' 
                    : currentTemplate === 'purchase'
                    ? 'For purchasing vehicles from customers'
                    : 'For TNT Services business operations'}
                </p>
              </div>
            </div>
            <button
              onClick={closeSimplePDFEditor}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>
          
          {/* SimplePDF Iframe */}
          <div className="flex-1 bg-gray-100">
            <iframe
              src={TEMPLATES[currentTemplate]}
              className="w-full h-full border-0"
              title="SimplePDF Invoice Editor"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      )}

      {/* Header with SimplePDF Info */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
              Invoice Management
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                ✓ Connected
              </span>
            </h3>
            <p className="text-sm text-gray-600">
              Create professional invoices using your custom templates. Choose between FNT Motor Group invoices or TNT Services invoices.
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Selling Invoice Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-fnt-red transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-4 bg-green-100 rounded-lg">
                <img 
                  src="/fnt-logo.png" 
                  alt="FNT Motor Group" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Selling Invoice</h4>
                <p className="text-sm text-gray-500">For selling vehicles to customers</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Customer details</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Vehicle information</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sale price & payment terms</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => openSimplePDFEditorInline('selling')}
              className="flex-1 flex items-center justify-center space-x-2 bg-fnt-red hover:bg-red-600 text-white px-4 py-2.5 rounded-lg transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
            
            <a
              href="/FNT_Sale_Invoice_v26_IntegrationSafe_FontFixed.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>View Template</span>
            </a>
          </div>
        </div>

        {/* Purchase Invoice Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-fnt-red transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-4 bg-blue-100 rounded-lg">
                <img 
                  src="/fnt-logo.png" 
                  alt="FNT Motor Group" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Purchase Invoice</h4>
                <p className="text-sm text-gray-500">For purchasing vehicles from customers</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Customer details</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Vehicle information</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Purchase price & terms</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => openSimplePDFEditorInline('purchase')}
              className="flex-1 flex items-center justify-center space-x-2 bg-fnt-red hover:bg-red-600 text-white px-4 py-2.5 rounded-lg transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
            
            <button
              onClick={() => openSimplePDFEditor('purchase')}
              className="flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Popup</span>
            </button>

            <a
              href={TEMPLATES.purchase}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>View</span>
            </a>
          </div>
        </div>

        {/* TNT Services Invoice Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-fnt-red transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <img 
                  src="/TNT Logo.png" 
                  alt="TNT Services" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">TNT Services Invoice</h4>
                <p className="text-sm text-gray-500">For TNT Services business</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Customer details</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Service information</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Service price & terms</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => openSimplePDFEditorInline('tnt')}
              className="flex-1 flex items-center justify-center space-x-2 bg-fnt-red hover:bg-red-600 text-white px-4 py-2.5 rounded-lg transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
            
            <a
              href="/TNT Services Invoice Template.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>View Template</span>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Invoice Templates</h4>
            <p className="text-sm text-blue-700">
              <strong>Selling Invoice:</strong> Use when selling vehicles to customers. Includes customer details, sale price, and payment terms.
              <br />
              <strong>Purchase Invoice:</strong> Use when purchasing vehicles from customers. Includes customer details, purchase price, and terms.
              <br />
              <strong>TNT Services Invoice:</strong> Use for TNT Services business operations. Includes service details and pricing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;
