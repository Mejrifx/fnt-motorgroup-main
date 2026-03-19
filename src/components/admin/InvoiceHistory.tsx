import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, ExternalLink, Search, Trash2, RefreshCw, X } from 'lucide-react';
import { getInvoicesByType, deleteInvoice, type InvoiceType } from '../../lib/invoiceUtils';
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

function invoiceMatchesSearch(inv: Invoice, q: string): boolean {
  if (!q) return true;
  const haystack = [
    inv.invoice_number,
    inv.customer_name,
    inv.customer_email,
    inv.customer_phone,
    inv.vehicle_reg,
    inv.vehicle_make,
    inv.vehicle_model,
    inv.total_amount != null ? String(inv.total_amount) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

const InvoiceHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InvoiceType>('fnt_sale');
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    setAllInvoices(data as Invoice[]);
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

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allInvoices;
    return allInvoices.filter((inv) => invoiceMatchesSearch(inv, q));
  }, [allInvoices, searchTerm]);

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
    <div className="space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Invoice History
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View, download, and manage all generated invoices
            </p>
          </div>
          <button
            onClick={() => {
              loadInvoices();
              loadAllCounts();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        {(['fnt_sale', 'fnt_purchase', 'tnt_service'] as InvoiceType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === type
                ? 'border-b-2 border-fnt-red text-fnt-red'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {getTabLabel(type)}
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
              {invoiceCounts[type]}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar — filters as you type (same pattern as Stock tab) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice number, customer, phone, email, or vehicle…"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fnt-red"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading invoices...</span>
          </div>
        ) : allInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-semibold">No invoices found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Start by creating your first invoice
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-semibold">No invoices match your search</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try a different term or clear the search box
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTabColor(invoice.invoice_type)}`}>
                          {invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.customer_name}</div>
                      {invoice.customer_phone && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {invoice.vehicle_make || invoice.vehicle_model ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.vehicle_make} {invoice.vehicle_model}
                          </div>
                          {invoice.vehicle_reg && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.vehicle_reg}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Preview */}
                        <a
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                          title="Preview invoice"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        
                        {/* Download */}
                        <a
                          href={invoice.pdf_url}
                          download={`${invoice.invoice_number}.pdf`}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors"
                          title="Download invoice"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(invoice)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
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
      {allInvoices.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              Showing{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{filteredInvoices.length}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{allInvoices.length}</span>
              {' '}invoice{allInvoices.length !== 1 ? 's' : ''}
              {searchTerm.trim() ? ' (filtered)' : ''}
            </div>
            <div>
              Total value{searchTerm.trim() ? ' (visible)' : ''}:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0))}
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
