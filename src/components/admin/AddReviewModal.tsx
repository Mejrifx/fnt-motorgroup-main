import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddReviewModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    review_text: '',
    rating: 5,
    vehicle_purchased: '',
    review_date: '',
    is_featured: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([formData]);

      if (error) throw error;

      alert('Review added successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding review:', error);
      alert(`Error adding review: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add New Review</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              placeholder="John Smith"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
            >
              <option value={5}>5 Stars - Excellent</option>
              <option value={4}>4 Stars - Very Good</option>
              <option value={3}>3 Stars - Good</option>
              <option value={2}>2 Stars - Fair</option>
              <option value={1}>1 Star - Poor</option>
            </select>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Text *
            </label>
            <textarea
              name="review_text"
              value={formData.review_text}
              onChange={handleInputChange}
              required
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              placeholder="Enter the customer's review..."
            />
          </div>

          {/* Vehicle Purchased */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Purchased (Optional)
            </label>
            <input
              type="text"
              name="vehicle_purchased"
              value={formData.vehicle_purchased}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              placeholder="e.g., BMW 3 Series, Audi A4"
            />
          </div>

          {/* Review Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Date *
            </label>
            <input
              type="text"
              name="review_date"
              value={formData.review_date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              placeholder="e.g., October 2024, September 2024"
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleInputChange}
              className="w-4 h-4 text-fnt-red focus:ring-fnt-red border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">
              Show on website (featured)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-fnt-red text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReviewModal;

