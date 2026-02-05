import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, Phone, Mail, MapPin, FileText, Car as CarIcon } from 'lucide-react';
import { supabase, type Car } from '../../lib/supabase';

interface CreateInvoiceModalProps {
  cars: Car[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ cars, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Generate invoice number
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    car_id: '',
    sale_price: '',
    deposit: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_terms: 'Full payment due within 30 days',
    notes: '',
  });

  // Generate invoice number on mount
  useEffect(() => {
    generateInvoiceNumber();
  }, []);

  const generateInvoiceNumber = async () => {
    try {
      // Get count of existing invoices to generate sequential number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      const year = new Date().getFullYear();
      const number = (count || 0) + 1;
      const invoiceNum = `INV-${year}-${String(number).padStart(4, '0')}`;
      setInvoiceNumber(invoiceNum);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setInvoiceNumber(`INV-${new Date().getFullYear()}-0001`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateBalance = () => {
    const price = parseFloat(formData.sale_price) || 0;
    const deposit = parseFloat(formData.deposit) || 0;
    return price - deposit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.customer_name || !formData.sale_price) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const balance = calculateBalance();

      // Insert invoice
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          car_id: formData.car_id || null,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email || null,
          customer_phone: formData.customer_phone || null,
          customer_address: formData.customer_address || null,
          sale_price: parseFloat(formData.sale_price),
          deposit: parseFloat(formData.deposit) || 0,
          balance: balance,
          invoice_date: formData.invoice_date,
          payment_terms: formData.payment_terms || null,
          notes: formData.notes || null,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      alert('Invoice created successfully! You can now edit it in SimplePDF.');
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Invoice</h2>
            <p className="text-sm text-gray-600">Invoice Number: <span className="font-semibold text-fnt-red">{invoiceNumber}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-fnt-red" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                  placeholder="07123 456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                  placeholder="123 Main St, Manchester"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CarIcon className="w-5 h-5 mr-2 text-fnt-red" />
              Vehicle Details
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vehicle (Optional)
              </label>
              <select
                name="car_id"
                value={formData.car_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
              >
                <option value="">-- No vehicle selected --</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.year} {car.make} {car.model} - £{car.price.toLocaleString()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a vehicle from your inventory or leave blank for custom invoice
              </p>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-fnt-red" />
              Financial Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                  <input
                    type="number"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                    placeholder="15000.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Paid
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                  <input
                    type="number"
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Due
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                  <input
                    type="text"
                    value={calculateBalance().toFixed(2)}
                    disabled
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-fnt-red" />
              Additional Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                  placeholder="Full payment due within 30 days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-fnt-red focus:border-fnt-red"
                  placeholder="Additional notes or special terms..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-fnt-red hover:bg-red-600 text-white rounded-lg transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
