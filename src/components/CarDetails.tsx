import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, Mail, MapPin, Calendar, Fuel, Settings, Palette, Car as CarIcon, DoorOpen, Banknote } from 'lucide-react';
import { supabase, type Car } from '../lib/supabase';

const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCar(id);
    }
  }, [id]);

  const fetchCar = async (carId: string) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .eq('is_available', true)
        .single();

      if (error) throw error;
      setCar(data);
    } catch (err: any) {
      console.error('Error fetching car:', err);
      setError('Car not found or no longer available.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string): string => {
    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const getAllImages = (): string[] => {
    if (!car) return [];
    
    const images: string[] = [];
    
    // Add cover image
    if (car.cover_image_path) {
      images.push(getImageUrl(car.cover_image_path));
    } else if (car.cover_image_url) {
      images.push(car.cover_image_url);
    }
    
    // Add gallery images
    if (car.gallery_image_paths && car.gallery_image_paths.length > 0) {
      car.gallery_image_paths.forEach(path => {
        images.push(getImageUrl(path));
      });
    }
    
    return images;
  };

  const nextImage = () => {
    const images = getAllImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    const images = getAllImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price: number): string => {
    return `£${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red mx-auto mb-4"></div>
          <p className="text-white">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Car Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-fnt-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  const images = getAllImages();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-white hover:text-fnt-red transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Cars</span>
            </button>
            <div className="text-white">
              <h1 className="text-lg font-bold">{car.make} {car.model}</h1>
              <p className="text-sm text-gray-400">{car.year}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-96 lg:h-[500px] object-cover cursor-pointer"
                    onClick={() => setShowFullscreenGallery(true)}
                  />
                  
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-96 lg:h-[500px] flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <CarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-fnt-red' : 'border-gray-700'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description Section */}
            {car.description && (
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Description</h3>
                <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">{car.description}</div>
              </div>
            )}
          </div>

          {/* Right Column - Car Details */}
          <div className="space-y-6">
            {/* Price & Title */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-3xl font-bold text-white mb-2">{car.make} {car.model}</h2>
              <p className="text-4xl font-bold text-fnt-red mb-4">{formatPrice(car.price)}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Available
              </div>
            </div>

            {/* Car Specifications */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Make:</span>
                  <span className="text-white font-medium">{car.make}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white font-medium">{car.model}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Fuel className="w-4 h-4" />
                    Fuel:
                  </span>
                  <span className="text-white font-medium">{car.fuel_type}</span>
                </div>
                {car.colour && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Colour:
                    </span>
                    <span className="text-white font-medium">{car.colour}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Year:
                  </span>
                  <span className="text-white font-medium">{car.year}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Gearbox:
                  </span>
                  <span className="text-white font-medium">{car.transmission}</span>
                </div>
                {car.engine && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400">Engine:</span>
                    <span className="text-white font-medium">{car.engine}</span>
                  </div>
                )}
                {car.style && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400 flex items-center gap-2">
                      <CarIcon className="w-4 h-4" />
                      Style:
                    </span>
                    <span className="text-white font-medium">{car.style}</span>
                  </div>
                )}
                {car.doors && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-400 flex items-center gap-2">
                      <DoorOpen className="w-4 h-4" />
                      Doors:
                    </span>
                    <span className="text-white font-medium">{car.doors}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Mileage:</span>
                  <span className="text-white font-medium">{car.mileage}</span>
                </div>
                {car.road_tax && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Road Tax:
                    </span>
                    <span className="text-white font-medium">{car.road_tax}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Actions */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Interested?</h3>
              <div className="space-y-3">
                <a
                  href="tel:07735770031"
                  className="flex items-center justify-center space-x-2 w-full bg-fnt-red text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Now</span>
                </a>
                <a
                  href="mailto:fntgroupltd@gmail.com?subject=Inquiry about ${car.make} ${car.model}"
                  className="flex items-center justify-center space-x-2 w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email Inquiry</span>
                </a>
                <a
                  href="https://maps.app.goo.gl/BzPwtnE6sKif93Rm7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Visit Showroom</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      {showFullscreenGallery && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowFullscreenGallery(false)}
            className="absolute top-4 right-4 text-white hover:text-fnt-red transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={images[currentImageIndex]}
              alt={`${car.make} ${car.model}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDetails;
