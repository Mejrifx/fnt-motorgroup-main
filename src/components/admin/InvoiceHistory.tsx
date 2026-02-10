import React, { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, Search, Trash2, RefreshCw } from 'lucide-react';
import { getInvoicesByType, searchInvoices, deleteInvoice, type InvoiceType } from '../../lib/invoiceUtils';
import { useToast } from '../ui/ToastContainer';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Invoice {
  id: string;
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
  created_at: string;
}

const InvoiceHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InvoiceType>('fnt_sale');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; invoice: Invoice | null }>({
    isOpen: false,
    invoice: null
  });
  const [invoiceCounts, setInvoiceCounts] = useState<Record<InvoiceType, number>>({
    fnt_sale: 0,
    fnt_purchase: 0,
    tnt_service: 0
  });
  const { showToast } = useToast();

  // Load invoices for the active tab
  const loadInvoices = async () => {
    setLoading(true);
    const data = await getInvoicesByType(activeTab);
    setInvoices(data as Invoice[]);
    // Update the count for the active tab
    setInvoiceCounts(prev => ({
      ...prev,
      [activeTab]: data.length
    }));
    setLoading(false);
  };

  // Load counts for all invoice types
  const loadAllCounts = async () => {
    const types: InvoiceType[] = ['fnt_sale', 'fnt_purchase', 'tnt_service'];
    const counts: Record<InvoiceType, number> = {
      fnt_sale: 0,
      fnt_purchase: 0,
      tnt_service: 0
    };

    for (const type of types) {
      const data = await getInvoicesByType(type);
      counts[type] = data.length;
    }

    setInvoiceCounts(counts);
  };

  // Search invoices
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadInvoices();
      return;
    }

    setIsSearching(true);
    const data = await searchInvoices(searchTerm, activeTab);
    setInvoices(data as Invoice[]);
    setIsSearching(false);
  };

  // Delete invoice
  const handleDelete = async (invoice: Invoice) => {
    setDeleteConfirm({ isOpen: true, invoice });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.invoice) return;

    const success = await deleteInvoice(deleteConfirm.invoice.id, deleteConfirm.invoice.pdf_url);
    if (success) {
      showToast(`Invoice ${deleteConfirm.invoice.invoice_number} deleted successfully`, 'success');
      loadInvoices(); // Reload current tab invoices
      loadAllCounts(); // Reload all counts to update all tab badges
    } else {
      showToast('Failed to delete invoice. Please try again.', 'error');
    }
  };

  // Load all counts on mount
  useEffect(() => {
    loadAllCounts();
  }, []);

  // Load invoices when tab changes
  useEffect(() => {
    loadInvoices();
    setSearchTerm(''); // Clear search when switching tabs
  }, [activeTab]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return '—';
    return `£${amount.toFixed(2)}`;
  };

  // Get tab label
  const getTabLabel = (type: InvoiceType) => {
    switch (type) {
      case 'fnt_sale': return 'FNT Sales';
      case 'fnt_purchase': return 'FNT Purchases';
      case 'tnt_service': return 'TNT Services';
    }
  };

  // Get tab color
  const getTabColor = (type: InvoiceType) => {
    switch (type) {
      case 'fnt_sale': return 'bg-green-100 text-green-800 border-green-300';
      case 'fnt_purchase': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'tnt_service': return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Invoice History
            </h3>
            <p className="text-sm text-gray-600">
              View, download, and manage all generated invoices
            </p>
          </div>
          <button
            onClick={() => {
              loadInvoices();
              loadAllCounts();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {(['fnt_sale', 'fnt_purchase', 'tnt_service'] as InvoiceType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === type
                ? 'border-b-2 border-fnt-red text-fnt-red'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {getTabLabel(type)}
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100">
              {invoiceCounts[type]}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by invoice number, customer name, or vehicle reg..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-fnt-red hover:bg-red-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                loadInvoices();
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fnt-red"></div>
            <span className="ml-3 text-gray-600">Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-600 font-semibold">No invoices found</p>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Start by creating your first invoice'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTabColor(invoice.invoice_type)}`}>
                          {invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{invoice.customer_name}</div>
                      {invoice.customer_phone && (
                        <div className="text-xs text-gray-500">{invoice.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {invoice.vehicle_make || invoice.vehicle_model ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.vehicle_make} {invoice.vehicle_model}
                          </div>
                          {invoice.vehicle_reg && (
                            <div className="text-xs text-gray-500">{invoice.vehicle_reg}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Preview */}
                        <a
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview invoice"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        
                        {/* Download */}
                        <a
                          href={invoice.pdf_url}
                          download={`${invoice.invoice_number}.pdf`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download invoice"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(invoice)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {invoices.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing <span className="font-semibold text-gray-900">{invoices.length}</span> invoice{invoices.length !== 1 ? 's' : ''}
            </div>
            <div>
              Total value: <span className="font-semibold text-gray-900">
                {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteConfirm.invoice?.invoice_number}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, invoice: null })}
      />
    </div>
  );
};

export default InvoiceHistory;
