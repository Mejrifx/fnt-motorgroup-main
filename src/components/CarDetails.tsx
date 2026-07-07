import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CaretLeft, CaretRight, Phone, EnvelopeSimple, MapPin, Calendar, GasPump, GearSix, Palette, CarProfile as CarIcon, Door, Money } from '@phosphor-icons/react';
import { supabase, type Car } from '../lib/supabase';
import { usePageMeta } from '../hooks/usePageMeta';

// Replace AutoTrader's {resize} placeholder with actual dimensions
const resolveUrl = (url: string) => url.replace('{resize}', 'w800');

const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  // Helper function to format mileage
  const formatMileage = (mileage: string): string => {
    if (!mileage) return '';
    
    // If mileage already contains "miles" or "Miles", return as is
    if (mileage.toLowerCase().includes('miles')) {
      return mileage;
    }
    
    // If it's just a number, add "Miles"
    const numericMileage = mileage.replace(/[^\d]/g, '');
    if (numericMileage) {
      return `${numericMileage} Miles`;
    }
    
    return mileage;
  };

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
    const { data } = supabase.storage.from('car-images').getPublicUrl(path);
    return resolveUrl(data.publicUrl);
  };

  const getAllImages = (): string[] => {
    if (!car) return [];
    
    const images: string[] = [];
    
    // Cover image: prefer Supabase Storage path, then direct URL
    if (car.cover_image_path) {
      images.push(getImageUrl(car.cover_image_path));
    } else if (car.cover_image_url) {
      images.push(resolveUrl(car.cover_image_url));
    }
    
    // Gallery: prefer manually uploaded paths
    if (car.gallery_image_paths && car.gallery_image_paths.length > 0) {
      car.gallery_image_paths.forEach(path => images.push(getImageUrl(path)));
    }
    
    // Gallery: AutoTrader CDN URLs (also resolve {resize})
    if (car.gallery_images && Array.isArray(car.gallery_images) && car.gallery_images.length > 0) {
      car.gallery_images.forEach(url => {
        const resolved = resolveUrl(url);
        if (!images.includes(resolved)) images.push(resolved);
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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      previousImage();
    }
  };

  const formatPrice = (price: number): string => {
    return `£${price.toLocaleString()}`;
  };

  const pageImages = car ? getAllImages() : [];

  usePageMeta({
    title: car ? `${car.year} ${car.make} ${car.model} for Sale` : 'Car Details',
    description: car
      ? `${car.year} ${car.make} ${car.model} — ${formatMileage(car.mileage)}, ${car.fuel_type}, ${car.transmission}. ${formatPrice(car.price)} at FNT Motor Group, Manchester. 6-month warranty included.`
      : 'View this vehicle for sale at FNT Motor Group, Manchester.',
    path: `/car/${id}`,
    image: pageImages[0],
    type: 'product',
    jsonLd: car
      ? {
          '@context': 'https://schema.org',
          '@type': 'Vehicle',
          name: `${car.year} ${car.make} ${car.model}`,
          brand: { '@type': 'Brand', name: car.make },
          model: car.model,
          vehicleModelDate: String(car.year),
          fuelType: car.fuel_type,
          vehicleTransmission: car.transmission,
          ...(car.colour ? { color: car.colour } : {}),
          ...(car.doors ? { numberOfDoors: car.doors } : {}),
          ...(car.mileage
            ? {
                mileageFromOdometer: {
                  '@type': 'QuantitativeValue',
                  value: parseInt(car.mileage.replace(/[^\d]/g, ''), 10) || undefined,
                  unitCode: 'SMI',
                },
              }
            : {}),
          image: pageImages.slice(0, 8),
          url: `https://fntmotorgroup.co.uk/car/${car.id}`,
          offers: {
            '@type': 'Offer',
            price: car.price,
            priceCurrency: 'GBP',
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/UsedCondition',
            url: `https://fntmotorgroup.co.uk/car/${car.id}`,
            seller: {
              '@type': 'AutomotiveBusiness',
              name: 'FNT Motor Group',
              telephone: '+447735770031',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Unit 1, Clayton Court, 5 Welcomb Street',
                addressLocality: 'Manchester',
                postalCode: 'M11 2NB',
                addressCountry: 'GB',
              },
            },
          },
        }
      : undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen glass-scene flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red mx-auto mb-4"></div>
          <p className="text-white">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen glass-scene flex items-center justify-center">
        <div className="glass rounded-3xl p-10 text-center max-w-md mx-4">
          <CarIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Car Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-glass-red text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  const images = getAllImages();

  return (
    <div className="min-h-screen glass-scene grain">
      {/* Header */}
      <div className="border-b border-white/10 sticky top-0 z-40" style={{ background: 'rgba(11, 12, 15, 0.75)', backdropFilter: 'blur(24px) saturate(140%)', WebkitBackdropFilter: 'blur(24px) saturate(140%)' }}>
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
            <div className="relative glass rounded-3xl overflow-hidden">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-96 lg:h-[500px] object-cover cursor-pointer"
                    onClick={() => setShowFullscreenGallery(true)}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  />
                  
                  {images.length > 1 && (
                    <>
                      {/* Desktop Navigation - Overlaid on image */}
                      <button
                        onClick={previousImage}
                        className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <CaretLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <CaretRight className="w-6 h-6" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-96 lg:h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <CarIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <p className="text-gray-400">No images available</p>
                  </div>
                </div>
              )}
              
              {/* Mobile Navigation - Below image */}
              {images.length > 1 && (
                <div className="md:hidden flex items-center justify-center gap-4 py-3">
                  <button
                    onClick={previousImage}
                    className="btn-glass text-white p-3 rounded-full"
                  >
                    <CaretLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="btn-glass text-white p-3 rounded-full"
                  >
                    <CaretRight className="w-6 h-6" />
                  </button>
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
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      index === currentImageIndex ? 'border-fnt-red shadow-glass-red' : 'border-white/15 hover:border-white/40'
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
              <div className="glass rounded-3xl p-6 md:p-8">
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Description</h3>
                <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                  {/* Split description to highlight attention grabber if present */}
                  {car.description.startsWith('✨') ? (
                    <>
                      <div className="text-fnt-red font-bold text-xl mb-4 pb-4 border-b border-white/10">
                        {car.description.split('\n\n')[0].replace('✨ ', '')}
                      </div>
                      <div>{car.description.split('\n\n').slice(1).join('\n\n')}</div>
                    </>
                  ) : (
                    car.description
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Car Details */}
          <div className="space-y-6">
            {/* Price & Title */}
            <div className="glass rounded-3xl p-6">
              <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{car.make} {car.model}</h2>
              <p className="text-4xl font-bold text-fnt-red mb-4" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(car.price)}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-emerald-300" style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.7)]"></span>
                Available
              </div>
            </div>

            {/* Car Specifications */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Make:</span>
                  <span className="text-white font-medium">{car.make}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white font-medium">{car.model}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400 flex items-center gap-2">
                    <GasPump className="w-4 h-4" />
                    Fuel:
                  </span>
                  <span className="text-white font-medium">{car.fuel_type}</span>
                </div>
                {car.colour && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Colour:
                    </span>
                    <span className="text-white font-medium">{car.colour}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Year:
                  </span>
                  <span className="text-white font-medium">{car.year}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400 flex items-center gap-2">
                    <GearSix className="w-4 h-4" />
                    Gearbox:
                  </span>
                  <span className="text-white font-medium">{car.transmission}</span>
                </div>
                {car.engine && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Engine:</span>
                    <span className="text-white font-medium">{car.engine}</span>
                  </div>
                )}
                {car.style && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 flex items-center gap-2">
                      <CarIcon className="w-4 h-4" />
                      Style:
                    </span>
                    <span className="text-white font-medium">{car.style}</span>
                  </div>
                )}
                {car.doors && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Door className="w-4 h-4" />
                      Doors:
                    </span>
                    <span className="text-white font-medium">{car.doors}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Mileage:</span>
                  <span className="text-white font-medium">{formatMileage(car.mileage)}</span>
                </div>
                {car.road_tax && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Money className="w-4 h-4" />
                      Previous Owners:
                    </span>
                    <span className="text-white font-medium">{car.road_tax}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Actions */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Interested?</h3>
              <div className="space-y-3">
                <a
                  href="tel:07735770031"
                  className="btn-glass-red flex items-center justify-center space-x-2 w-full text-white py-3 rounded-xl font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Now</span>
                </a>
                <a
                  href="mailto:fntgroupltd@gmail.com?subject=Inquiry about ${car.make} ${car.model}"
                  className="btn-glass flex items-center justify-center space-x-2 w-full text-white py-3 rounded-xl font-semibold"
                >
                  <EnvelopeSimple className="w-5 h-5" />
                  <span>Email Inquiry</span>
                </a>
                <a
                  href="https://maps.app.goo.gl/BzPwtnE6sKif93Rm7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass flex items-center justify-center space-x-2 w-full text-white py-3 rounded-xl font-semibold"
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
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
          <button
            onClick={() => setShowFullscreenGallery(false)}
            className="absolute top-4 right-4 text-white hover:text-fnt-red transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image Container */}
          <div className="flex-1 w-full flex items-center justify-center px-4 py-20">
            <img
              src={images[currentImageIndex]}
              alt={`${car.make} ${car.model}`}
              className="max-w-full max-h-full object-contain"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          </div>
          
          {/* Navigation - Below image on mobile, overlaid on desktop */}
          {images.length > 1 && (
            <>
              {/* Desktop - Overlaid arrows */}
              <button
                onClick={previousImage}
                className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <CaretLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextImage}
                className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <CaretRight className="w-8 h-8" />
              </button>
              
              {/* Mobile - Bottom navigation bar */}
              <div className="md:hidden absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm py-4 px-4 flex items-center justify-center gap-6 border-t border-white/10">
                <button
                  onClick={previousImage}
                  className="btn-glass text-white p-4 rounded-full"
                >
                  <CaretLeft className="w-6 h-6" />
                </button>
                <div className="text-white text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
                <button
                  onClick={nextImage}
                  className="btn-glass text-white p-4 rounded-full"
                >
                  <CaretRight className="w-6 h-6" />
                </button>
              </div>
              
              {/* Desktop - Image counter */}
              <div className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CarDetails;
