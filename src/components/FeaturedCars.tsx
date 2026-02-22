import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, Settings, Calendar } from 'lucide-react';
import { supabase, type Car } from '../lib/supabase';

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
        .order('created_at', { ascending: false });

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
      <section id="inventory" className="py-20" style={{ backgroundColor: '#171819' }}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red mx-auto mb-4"></div>
            <p className="text-white">Loading cars...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="inventory" className="py-20" style={{ backgroundColor: '#171819' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Our Car Collection
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Browse our wide selection of reliable cars in various styles - Saloon, Hatchback, Estate, Van, Coupe, Convertible, and 4x4 vehicles, all inspected and ready for their next adventure
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-fnt-red text-white shadow-lg'
                  : 'bg-white text-fnt-black hover:bg-gray-50 hover:text-fnt-red'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCars.length > 0 ? (
            filteredCars.map((car) => (
              <div
                key={car.id}
                onClick={() => navigate(`/car/${car.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={
                      car.cover_image_path 
                        ? supabase.storage.from('car-images').getPublicUrl(car.cover_image_path).data.publicUrl
                        : car.cover_image_url || 'https://via.placeholder.com/400x250?text=No+Image'
                    }
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // If constructed URL failed but we have a direct URL, try that first
                      if (car.cover_image_path && car.cover_image_url && target.src !== car.cover_image_url) {
                        target.src = car.cover_image_url;
                      } else {
                        target.src = 'https://via.placeholder.com/400x250?text=No+Image';
                      }
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-fnt-red text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {car.year}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-fnt-black mb-1">
                      {car.make} {car.model}
                    </h3>
                    <p className="text-2xl font-bold text-fnt-red">
                      £{car.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span>Available</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-fnt-black mb-2">No Cars Found</h3>
                <p className="text-gray-600 mb-4">
                  Sorry, we don't have any cars matching your search criteria right now.
                </p>
                <p className="text-sm text-gray-500">
                  Try adjusting your filters or check back later for new arrivals.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <button className="bg-fnt-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors duration-300">
            View All Inventory
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCars;