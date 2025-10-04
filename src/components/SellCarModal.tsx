import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import Airtable from 'airtable';

interface SellCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SellCarModal: React.FC<SellCarModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    carRegistration: '',
    mileage: '',
    makeModel: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Input validation for specific fields
    let processedValue = value;
    
    if (name === 'phoneNumber') {
      // Only allow numbers, spaces, +, -, (, )
      processedValue = value.replace(/[^0-9\s\+\-\(\)]/g, '');
    } else if (name === 'carRegistration') {
      // Only allow letters, numbers, and spaces (UK registration format)
      processedValue = value.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase();
    } else if (name === 'mileage') {
      // Only allow numbers and commas
      processedValue = value.replace(/[^0-9,]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log('🚀 Form submission started');
    console.log('📝 Form data:', formData);
    console.log('🔑 API Key:', import.meta.env.VITE_AIRTABLE_API_KEY ? 'Present' : 'Missing');
    console.log('🏠 Base ID:', import.meta.env.VITE_AIRTABLE_BASE_ID);
    console.log('📊 Table Name:', import.meta.env.VITE_AIRTABLE_TABLE_NAME);

    try {
      // Initialize Airtable
      const base = new Airtable({ 
        apiKey: import.meta.env.VITE_AIRTABLE_API_KEY 
      }).base(import.meta.env.VITE_AIRTABLE_BASE_ID);

      console.log('✅ Airtable initialized successfully');

      // Create record in Airtable
      const records = await base(import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'Car Sales Leads').create([
        {
          fields: {
            "First Name": formData.firstName,
            "Last Name": formData.lastName,
            "Phone Number": formData.phoneNumber,
            "Car Registration": formData.carRegistration,
            "Mileage": parseInt(formData.mileage.replace(/,/g, '')) || 0,
            "Make & Model": formData.makeModel,
            "Additional Info": formData.additionalInfo,
            "Submission Date": new Date().toISOString().split('T')[0],
            "Status": "New"
          }
        }
      ]);

      console.log('🎉 Record created in Airtable:', records[0].id);
      
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        carRegistration: '',
        mileage: '',
        makeModel: '',
        additionalInfo: ''
      });
    } catch (error) {
      console.error('❌ Error submitting to Airtable:', error);
      alert('Sorry, there was an error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center z-[999999]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-fnt-black mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            We've received your car details and will contact you soon to discuss your vehicle.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-fnt-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[999999]">
        <div className="sticky top-0 bg-white border-b px-8 py-6 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-bold text-fnt-black">Sell Your Car</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Process Explanation */}
          <div className="bg-gradient-to-r from-fnt-red/5 to-amber-500/5 border border-fnt-red/20 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-bold text-fnt-black">How does 'Sell Your Car' Work?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-fnt-red text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold text-fnt-black">Submit Details</p>
                  <p className="text-sm text-gray-600">Fill out the form with your car information</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-fnt-red text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold text-fnt-black">We Review</p>
                  <p className="text-sm text-gray-600">Our team evaluates your vehicle details</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-fnt-red text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold text-fnt-black">Contact You</p>
                  <p className="text-sm text-gray-600">We'll call to discuss your car and arrange viewing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-fnt-red text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-semibold text-fnt-black">Complete Sale</p>
                  <p className="text-sm text-gray-600">If everything checks out, we buy your car</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              maxLength={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
              placeholder="07735770031"
            />
            <p className="text-xs text-gray-500 mt-1">Numbers, spaces, +, -, (, ) only</p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-fnt-black mb-4">Car Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Registration *
                </label>
                <input
                  type="text"
                  name="carRegistration"
                  value={formData.carRegistration}
                  onChange={handleInputChange}
                  required
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                  placeholder="AB12 CDE"
                />
                <p className="text-xs text-gray-500 mt-1">Letters and numbers only (UK format)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage *
                </label>
                <input
                  type="text"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  required
                  maxLength={7}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                  placeholder="50,000"
                />
                <p className="text-xs text-gray-500 mt-1">Numbers and commas only</p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make & Model *
              </label>
              <input
                type="text"
                name="makeModel"
                value={formData.makeModel}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                placeholder="BMW 3 Series"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Car Info
            </label>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
              placeholder="Tell us about your car's condition, service history, or any other relevant details..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-fnt-red text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellCarModal;
