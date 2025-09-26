import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  onImageUploaded: (imagePath: string) => void;
  onImageRemoved?: () => void;
  currentImagePath?: string;
  currentImageUrl?: string;
  carId?: string;
  multiple?: boolean;
  onMultipleImagesUploaded?: (imagePaths: string[]) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onImageRemoved,
  currentImagePath,
  currentImageUrl,
  carId,
  multiple = false,
  onMultipleImagesUploaded,
  maxImages = 5
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Generate unique filename
  const generateFileName = (file: File): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    return `cars/${carId || 'temp'}/${timestamp}_${randomId}.${extension}`;
  };

  // Upload single image
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = generateFileName(file);
    
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return data.path;
  };

  // Upload multiple images
  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadImage(file));
    return Promise.all(uploadPromises);
  };

  // Handle file selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);

    try {
      // Validate files
      const validFiles = Array.from(files).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
        
        if (!isValidType) {
          setError('Please select only image files (JPG, PNG, GIF, etc.)');
          return false;
        }
        
        if (!isValidSize) {
          setError('Image size must be less than 10MB');
          return false;
        }
        
        return true;
      });

      if (validFiles.length === 0) return;

      // Check max images limit
      if (multiple && validFiles.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Create preview URLs
      const previewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewImages(previewUrls);

      if (multiple) {
        const imagePaths = await uploadMultipleImages(validFiles);
        onMultipleImagesUploaded?.(imagePaths);
      } else {
        const imagePath = await uploadImage(validFiles[0]);
        onImageUploaded(imagePath);
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Handle camera input change
  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Remove current image
  const removeImage = async () => {
    if (!currentImagePath) return;

    try {
      const { error } = await supabase.storage
        .from('car-images')
        .remove([currentImagePath]);

      if (error) {
        console.error('Error removing image:', error);
      }

      onImageRemoved?.();
    } catch (err) {
      console.error('Error removing image:', err);
    }
  };

  // Get image URL from Supabase Storage
  const getImageUrl = (path: string): string => {
    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {(currentImagePath || currentImageUrl) && (
        <div className="relative">
          <div className="relative inline-block">
            <img
              src={currentImageUrl || (currentImagePath ? getImageUrl(currentImagePath) : '')}
              alt="Current car image"
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-fnt-red bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fnt-red"></div>
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploading ? 'Uploading...' : 'Upload Car Images'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop images here, or click to select
            </p>
            {multiple && (
              <p className="text-xs text-gray-400 mt-1">
                Maximum {maxImages} images • Up to 10MB each
              </p>
            )}
          </div>

          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-fnt-red text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Choose Files</span>
            </button>
            
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </button>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple={multiple}
          onChange={handleCameraInputChange}
          className="hidden"
        />
      </div>

      {/* Preview Images */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previewImages.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
