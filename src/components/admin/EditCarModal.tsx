import React, { useState } from 'react';
import { X, Car } from 'lucide-react';
import { supabase, type Car } from '../../lib/supabase';
import ImageUpload from './ImageUpload';

interface EditCarModalProps {
  car: Car;
  onClose: () => void;
  onCarUpdated: (car: Car) => void;
}

const EditCarModal: React.FC<EditCarModalProps> = ({ car, onClose, onCarUpdated }) => {
  const [formData, setFormData] = useState({
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price.toString(),
    mileage: car.mileage,
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    category: car.category,
    description: car.description || '',
    cover_image_url: car.cover_image_url || '',
    cover_image_path: car.cover_image_path || '',
    gallery_image_paths: car.gallery_image_paths || [],
    is_available: car.is_available
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('cars')
        .update({
          make: formData.make,
          model: formData.model,
          year: formData.year,
          price: parseFloat(formData.price),
          mileage: formData.mileage,
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          category: formData.category,
          description: formData.description,
          cover_image_url: formData.cover_image_url || null,
          cover_image_path: formData.cover_image_path || null,
          gallery_image_paths: formData.gallery_image_paths,
          is_available: formData.is_available,
          updated_at: new Date().toISOString()
        })
        .eq('id', car.id)
        .select()
        .single();

      if (error) throw error;

      onCarUpdated(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the car.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle cover image upload
  const handleCoverImageUploaded = (imagePath: string) => {
    setFormData(prev => ({
      ...prev,
      cover_image_path: imagePath,
      cover_image_url: '' // Clear URL if image is uploaded
    }));
  };

  const handleCoverImageRemoved = () => {
    setFormData(prev => ({
      ...prev,
      cover_image_path: '',
      cover_image_url: ''
    }));
  };

  // Handle gallery images upload
  const handleGalleryImagesUploaded = (imagePaths: string[]) => {
    setFormData(prev => ({
      ...prev,
      gallery_image_paths: imagePaths
    }));
  };

  // Get current image URL for display
  const getCurrentImageUrl = (): string => {
    if (formData.cover_image_path) {
      return supabase.storage.from('car-images').getPublicUrl(formData.cover_image_path).data.publicUrl;
    }
    return formData.cover_image_url || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-fnt-red" />
            <h2 className="text-xl font-bold text-gray-900">Edit Car</h2>
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
          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
            <ImageUpload
              onImageUploaded={handleCoverImageUploaded}
              onImageRemoved={handleCoverImageRemoved}
              currentImagePath={formData.cover_image_path}
              currentImageUrl={getCurrentImageUrl()}
              carId={car.id}
            />
            
            {/* Fallback URL input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Or paste image URL</label>
              <input
                type="url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                placeholder="https://example.com/car-image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use this if you have a direct link to an image
              </p>
            </div>
          </div>

          {/* Gallery Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Optional)</label>
            <ImageUpload
              onMultipleImagesUploaded={handleGalleryImagesUploaded}
              carId={car.id}
              multiple={true}
              maxImages={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload additional photos to showcase the car (up to 50 images)
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
              <input
                type="text"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
                <option value="Plug-in Hybrid">Plug-in Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="Semi-Automatic">Semi-Automatic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              >
                <option value="Saloon">Saloon</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Estate">Estate</option>
                <option value="Van">Van</option>
                <option value="Coupe">Coupe</option>
                <option value="Convertible">Convertible</option>
                <option value="4x4">4x4</option>
              </select>
            </div>
          </div>


          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              placeholder="Describe the car's features, condition, and highlights..."
            />
          </div>

          {/* Availability */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleInputChange}
              className="h-4 w-4 text-fnt-red focus:ring-fnt-red border-gray-300 rounded"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Available for sale
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-fnt-red text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Update Car'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCarModal;
