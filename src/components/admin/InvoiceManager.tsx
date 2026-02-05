import React, { useState, useEffect } from 'react';
import { Plus, FileText, ExternalLink, Eye, Trash2, Calendar, DollarSign, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase, type Car } from '../../lib/supabase';

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
import CreateInvoiceModal from './CreateInvoiceModal';

interface Invoice {
  id: string;
  invoice_number: string;
  car_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  sale_price: number;
  deposit: number;
  balance: number;
  invoice_date: string;
  payment_terms: string | null;
  notes: string | null;
  simplepdf_url: string | null;
  simplepdf_submission_id: string | null;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
}

const InvoiceManager = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSimplePDFEditor, setShowSimplePDFEditor] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchCars();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.filter(invoice => invoice.id !== id));
      alert('Invoice deleted successfully!');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice. Please try again.');
    }
  };

  const handleUpdateStatus = async (id: string, status: Invoice['status']) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status } : inv
      ));
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { icon: Clock, color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      sent: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', text: 'Sent' },
      paid: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: 'Paid' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        <StatusIcon className="w-3 h-3" />
        <span>{config.text}</span>
      </span>
    );
  };

  const openSimplePDFEditor = () => {
    // Simply open SimplePDF editor - no pre-filled data needed
    if (window.simplePDF) {
      window.simplePDF.openEditor({
        href: 'https://qiml3vqj.simplepdf.com/documents/3c391e33-e224-4de5-962f-62b625820c65'
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
    // Optionally refresh invoice list if using webhooks
    fetchInvoices();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red"></div>
      </div>
    );
  }

  return (
    <div>
      {/* SimplePDF Editor - Full Screen */}
      {showSimplePDFEditor && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold">Create Invoice</h3>
                <p className="text-sm text-purple-100">Fill out your invoice template directly</p>
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
              src="https://qiml3vqj.simplepdf.com/documents/3c391e33-e224-4de5-962f-62b625820c65"
              className="w-full h-full border-0"
              title="SimplePDF Invoice Editor"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      )}

      {/* Header with SimplePDF Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
              Invoice Management with SimplePDF
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                ✓ Connected
              </span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click "Create Invoice" to fill out your invoice template directly on this website. No forms to fill - just your SimplePDF template!
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://qiml3vqj.simplepdf.com/documents/3c391e33-e224-4de5-962f-62b625820c65"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Template</span>
              </a>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openSimplePDFEditorInline}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create Invoice</span>
            </button>
            
            <button
              onClick={openSimplePDFEditor}
              className="flex items-center justify-center space-x-2 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open in Popup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No invoices yet.</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Completed invoices will appear here (requires webhook setup)
                    </p>
                    <button
                      onClick={openSimplePDFEditorInline}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create your first invoice</span>
                    </button>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.customer_name}
                          </div>
                          {invoice.customer_email && (
                            <div className="text-xs text-gray-500">
                              {invoice.customer_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div className="text-sm text-gray-900">
                          <div className="font-semibold">£{invoice.sale_price.toLocaleString()}</div>
                          {invoice.deposit > 0 && (
                            <div className="text-xs text-gray-500">
                              Balance: £{invoice.balance.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleUpdateStatus(invoice.id, e.target.value as Invoice['status'])}
                        className="text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-fnt-red cursor-pointer"
                        style={{
                          backgroundColor: invoice.status === 'paid' ? '#dcfce7' : 
                                         invoice.status === 'sent' ? '#dbeafe' : 
                                         invoice.status === 'cancelled' ? '#fee2e2' : '#f3f4f6',
                          color: invoice.status === 'paid' ? '#166534' : 
                                invoice.status === 'sent' ? '#1e40af' : 
                                invoice.status === 'cancelled' ? '#991b1b' : '#374151'
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {invoice.simplepdf_url && (
                          <a
                            href={invoice.simplepdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md transition-colors"
                            title="View completed PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View PDF</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                £{invoices.reduce((sum, inv) => sum + inv.sale_price, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.filter(inv => inv.status === 'paid').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.filter(inv => inv.status === 'draft' || inv.status === 'sent').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceManager;
