import React, { useState } from 'react';
import { X, Upload, Car } from 'lucide-react';
import { supabase, type Car } from '../../lib/supabase';
import ImageUpload from './ImageUpload';

interface AddCarModalProps {
  onClose: () => void;
  onCarAdded: (car: Car) => void;
}

const AddCarModal: React.FC<AddCarModalProps> = ({ onClose, onCarAdded }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    category: 'Saloon',
    description: '',
    cover_image_path: '',
    gallery_image_paths: [] as string[],
    colour: '',
    engine: '',
    style: '',
    doors: '',
    road_tax: '',
    is_available: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate that at least one image is provided
      if (!formData.cover_image_path) {
        setError('Please upload a cover image.');
        return;
      }

      const { data, error } = await supabase
        .from('cars')
        .insert([{
          make: formData.make,
          model: formData.model,
          year: formData.year,
          price: parseFloat(formData.price),
          mileage: formData.mileage,
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          category: formData.category,
          description: formData.description,
          cover_image_path: formData.cover_image_path || null,
          gallery_image_paths: formData.gallery_image_paths,
          colour: formData.colour || null,
          engine: formData.engine || null,
          style: formData.style || null,
          doors: formData.doors ? parseInt(formData.doors) : null,
          road_tax: formData.road_tax || null,
          is_available: formData.is_available
        }])
        .select()
        .single();

      if (error) throw error;

      onCarAdded(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the car.');
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

  // Car makes and models data
  const carMakes = [
    'Audi', 'BMW', 'Mercedes-Benz', 'Porsche', 'Ferrari', 'Lamborghini', 
    'Bentley', 'Rolls-Royce', 'Maserati', 'Aston Martin', 'McLaren', 'Jaguar',
    'Land Rover', 'Range Rover', 'Lexus', 'Tesla', 'Volkswagen', 'Ford', 'Toyota', 'Honda'
  ];

  const carModels: { [key: string]: string[] } = {
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'e-tron'],
    'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX'],
    'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class', 'SL', 'SLC', 'AMG GT', 'EQC', 'EQS'],
    'Porsche': ['911', '718 Boxster', '718 Cayman', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
    'Ferrari': ['488', 'F8 Tributo', 'SF90 Stradale', 'Roma', 'Portofino', '812 Superfast', 'LaFerrari'],
    'Lamborghini': ['Huracán', 'Aventador', 'Urus', 'Gallardo'],
    'Bentley': ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne'],
    'Rolls-Royce': ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan'],
    'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover Evoque', 'Range Rover Velar', 'Range Rover Sport', 'Range Rover'],
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y'],
    'Jaguar': ['XE', 'XF', 'XJ', 'F-PACE', 'E-PACE', 'I-PACE', 'F-TYPE'],
    'Lexus': ['IS', 'ES', 'GS', 'LS', 'NX', 'RX', 'GX', 'LX', 'LC', 'UX'],
    'Toyota': ['Corolla', 'Camry', 'Prius', 'RAV4', 'Highlander', 'Land Cruiser', 'Supra'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Ridgeline', 'HR-V', 'Passport'],
    'Ford': ['Fiesta', 'Focus', 'Mustang', 'Explorer', 'F-150', 'Escape', 'Edge'],
    'Volkswagen': ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Atlas', 'Beetle', 'Arteon']
  };

  const colours = [
    'White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Gold', 'Purple'
  ];

  // Handle cover image upload
  const handleCoverImageUploaded = (imagePath: string) => {
    setFormData(prev => ({
      ...prev,
      cover_image_path: imagePath
    }));
  };

  const handleCoverImageRemoved = () => {
    setFormData(prev => ({
      ...prev,
      cover_image_path: ''
    }));
  };

  // Handle gallery images upload
  const handleGalleryImagesUploaded = (imagePaths: string[]) => {
    setFormData(prev => ({
      ...prev,
      gallery_image_paths: imagePaths
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-fnt-red" />
            <h2 className="text-xl font-bold text-gray-900">Add New Car</h2>
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
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <select
                name="make"
                value={formData.make}
                onChange={(e) => {
                  handleInputChange(e);
                  // Reset model when make changes
                  setFormData(prev => ({ ...prev, model: '' }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                required
              >
                <option value="">Select Make</option>
                {carMakes.map((make) => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                required
                disabled={!formData.make}
              >
                <option value="">Select Model</option>
                {formData.make && carModels[formData.make]?.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              {!formData.make && (
                <p className="text-xs text-gray-500 mt-1">Select a make first</p>
              )}
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
                placeholder="25000"
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
                placeholder="25,000 miles"
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

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
            <ImageUpload
              onImageUploaded={handleCoverImageUploaded}
              onImageRemoved={handleCoverImageRemoved}
              currentImagePath={formData.cover_image_path}
              carId="new-car"
            />
            
          </div>

          {/* Gallery Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Optional)</label>
            <ImageUpload
              onMultipleImagesUploaded={handleGalleryImagesUploaded}
              carId="new-car"
              multiple={true}
              maxImages={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload additional photos to showcase the car (up to 50 images)
            </p>
          </div>

          {/* Additional Car Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
              <select
                name="colour"
                value={formData.colour}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              >
                <option value="">Select Colour</option>
                {colours.map((colour) => (
                  <option key={colour} value={colour}>{colour}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
              <input
                type="text"
                name="engine"
                value={formData.engine}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                placeholder="e.g., 3.0L V6, 2.0L Turbo, Electric Motor"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doors</label>
              <select
                name="doors"
                value={formData.doors}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
              >
                <option value="">Select Doors</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Owners</label>
              <input
                type="text"
                name="road_tax"
                value={formData.road_tax}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fnt-red"
                placeholder="e.g., 1, 2, 3"
              />
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
              {loading ? 'Adding...' : 'Add Car'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCarModal;
