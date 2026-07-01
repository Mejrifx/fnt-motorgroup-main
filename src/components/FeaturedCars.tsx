import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Settings, Calendar } from 'lucide-react';
import { supabase, type Car } from '../lib/supabase';

// AutoTrader CDN URLs contain a {resize} template that must be substituted.
// e.g. https://m-qa.atcdn.co.uk/a/media/{resize}/abc123.jpg → w800
const resolveImageUrl = (car: Car): string => {
  const raw = car.cover_image_path
    ? supabase.storage.from('car-images').getPublicUrl(car.cover_image_path).data.publicUrl
    : car.cover_image_url || '';
  return raw.replace('{resize}', 'w800') || 'https://via.placeholder.com/400x250?text=No+Image';
};

interface FeaturedCarsProps {
  searchFilters?: {
    make: string;
    model: string;
    priceFrom: string;
    priceTo: string;
    fuelType: string;
  } | null;
}

const FeaturedCars: React.FC<FeaturedCarsProps> = ({ searchFilters }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('is_available', true)
        .order('price', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  // Legacy cars array for fallback (keeping original data structure)
  const fallbackCars = [
    {
      id: 1,
      name: "AMG GT 63S",
      brand: "Mercedes-Benz",
      year: 2023,
      price: "£159,900",
      mileage: "12K miles",
      transmission: "Automatic",
      fuelType: "Gasoline",
      image: "https://images.pexels.com/photos/544542/pexels-photo-544542.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Saloon"
    },
    {
      id: 2,
      name: "911 Turbo S",
      brand: "Porsche",
      year: 2023,
      price: "£203,500",
      mileage: "8K miles",
      transmission: "Automatic",
      fuelType: "Gasoline",
      image: "https://images.pexels.com/photos/3802508/pexels-photo-3802508.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Coupe"
    },
    {
      id: 3,
      name: "X7 M50i",
      brand: "BMW",
      year: 2023,
      price: "£98,900",
      mileage: "15K miles",
      transmission: "Automatic",
      fuelType: "Gasoline",
      image: "https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Van"
    },
    {
      id: 4,
      name: "Continental GT",
      brand: "Bentley",
      year: 2022,
      price: "£231,800",
      mileage: "18K miles",
      transmission: "Automatic",
      fuelType: "Gasoline",
      image: "https://images.pexels.com/photos/3849168/pexels-photo-3849168.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Coupe"
    },
    {
      id: 5,
      name: "Model S Plaid",
      brand: "Tesla",
      year: 2023,
      price: "£129,990",
      mileage: "5K miles",
      transmission: "Single Speed",
      fuelType: "Electric",
      image: "https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "Saloon"
    },
    {
      id: 6,
      name: "F8 Tributo",
      brand: "Ferrari",
      year: 2022,
      price: "£329,000",
      mileage: "3K miles",
      transmission: "Automatic",
      fuelType: "Gasoline",
      image: "https://images.pexels.com/photos/1805053/pexels-photo-1805053.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "4x4"
    }
  ];

  const filters = ['All', 'Saloon', 'Hatchback', 'Estate', 'Van', 'Coupe', 'Convertible', '4x4'];

  // Apply search filters if they exist
  const applySearchFilters = (carList: Car[]) => {
    if (!searchFilters) return carList;
    
    return carList.filter(car => {
      // Check make (only if not "Any Make")
      if (searchFilters.make && searchFilters.make.trim() !== '' && !car.make.toLowerCase().includes(searchFilters.make.toLowerCase())) {
        return false;
      }
      
      // Check model (only if not "Any Model")
      if (searchFilters.model && searchFilters.model.trim() !== '' && !car.model.toLowerCase().includes(searchFilters.model.toLowerCase())) {
        return false;
      }
      
      // Check price range
      if (searchFilters.priceFrom || searchFilters.priceTo) {
        const carPrice = car.price;
        const priceFrom = searchFilters.priceFrom ? parseInt(searchFilters.priceFrom) : 0;
        const priceTo = searchFilters.priceTo ? parseInt(searchFilters.priceTo) : Infinity;
        
        if (carPrice < priceFrom || carPrice > priceTo) {
          return false;
        }
      }
      
      // Check fuel type (only if not "Any Fuel Type")
      if (searchFilters.fuelType && searchFilters.fuelType.trim() !== '' && !car.fuel_type.toLowerCase().includes(searchFilters.fuelType.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  const filteredCars = activeFilter === 'All' 
    ? applySearchFilters(cars)
    : applySearchFilters(cars.filter(car => car.category === activeFilter));

  if (loading) {
    return (
      <section id="inventory" className="py-20 glass-scene">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-3xl overflow-hidden animate-pulse">
                <div className="h-64 bg-white/5"></div>
                <div className="p-6 space-y-3">
                  <div className="h-5 w-2/3 bg-white/10 rounded-full"></div>
                  <div className="h-7 w-1/3 bg-white/10 rounded-full"></div>
                  <div className="h-4 w-full bg-white/5 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="inventory" className="py-24 glass-scene">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="section-eyebrow mb-5">Showroom</span>
          <h2 className="section-title text-5xl md:text-6xl font-black text-white mb-6">
            Our Car Collection
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Browse our wide selection of reliable cars in various styles - Saloon, Hatchback, Estate, Van, Coupe, Convertible, and 4x4 vehicles, all inspected and ready for their next adventure
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 ${
                activeFilter === filter
                  ? 'btn-glass-red text-white'
                  : 'glass-chip text-white/80 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="car-grid">
          {filteredCars.length > 0 ? (
            filteredCars.map((car) => (
              <div
                key={car.id}
                onClick={() => navigate(`/car/${car.id}`)}
                className="glass-card overflow-hidden group cursor-pointer"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={resolveImageUrl(car)}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-64 object-cover transition-transform duration-700 ease-spring group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                  <div className="absolute top-4 right-4 glass-subtle text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {car.year}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-white leading-snug" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {car.make} {car.model}
                    </h3>
                    <p className="text-2xl font-bold text-fnt-red whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      £{car.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-fnt-red" />
                      <span>{formatMileage(car.mileage)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-fnt-red" />
                      <span>{car.transmission}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Fuel className="w-4 h-4 text-fnt-red" />
                      <span>{car.fuel_type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.7)]"></span>
                      <span>Available</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="glass rounded-3xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 glass-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No cars found</h3>
                <p className="text-gray-400 mb-4">
                  Sorry, we don't have any cars matching your search criteria right now.
                </p>
                <p className="text-sm text-gray-500">
                  Try adjusting your filters or check back later for new arrivals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCars;