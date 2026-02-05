import React, { useState } from 'react';
import { Plus, FileText, ExternalLink, XCircle } from 'lucide-react';

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

  const openSimplePDFEditor = () => {
    // Simply open SimplePDF editor - no pre-filled data needed
    if (window.simplePDF) {
      window.simplePDF.openEditor({
        href: 'https://qiml3vqj.simplepdf.com/documents/eee3e726-0cb8-42b8-96f4-8c2e40617ea3'
      });
    } else {
      alert('SimplePDF is loading... Please try again in a moment.');
    }
  };

  const openSimplePDFEditorInline = () => {
    setShowSimplePDFEditor(true);
  };

  const closeSimplePDFEditor = () => {
    setShowSimplePDFEditor(false);
  };

  return (
    <div>
      {/* SimplePDF Editor - Full Screen */}
      {showSimplePDFEditor && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-fnt-red text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold">Create Invoice</h3>
                <p className="text-sm text-red-100">Fill out your invoice template directly</p>
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
              src="https://qiml3vqj.simplepdf.com/documents/eee3e726-0cb8-42b8-96f4-8c2e40617ea3"
              className="w-full h-full border-0"
              title="SimplePDF Invoice Editor"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      )}

      {/* Header with SimplePDF Info */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
              Invoice Management
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                ✓ Connected
              </span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create professional invoices using your custom template. Click "Create Invoice" to get started.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://qiml3vqj.simplepdf.com/documents/eee3e726-0cb8-42b8-96f4-8c2e40617ea3"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Template</span>
              </a>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openSimplePDFEditorInline}
              className="flex items-center justify-center space-x-2 bg-fnt-red hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create Invoice</span>
            </button>
            
            <button
              onClick={openSimplePDFEditor}
              className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open in Popup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white shadow rounded-lg p-12">
        <div className="max-w-2xl mx-auto text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Create Professional Invoices
          </h3>
          <p className="text-gray-600 mb-8">
            Use your custom SimplePDF template to generate invoices quickly and easily. 
            Click the button above to open the invoice editor and start creating.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Custom template</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Easy to use</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Instant download</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;
