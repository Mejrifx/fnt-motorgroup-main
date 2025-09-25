import React, { useState, useEffect } from 'react';
import { Fuel, Settings, Calendar, Eye } from 'lucide-react';
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
      category: "Luxury"
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
      category: "Sports"
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
      category: "SUV"
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
      category: "Luxury"
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
      category: "Electric"
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
      category: "Sports"
    }
  ];

  const filters = ['All', 'Luxury', 'Sports', 'SUV', 'Electric'];

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
            Browse our wide selection of reliable cars, all inspected and ready for their next adventure
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
          {filteredCars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={car.cover_image_url || 'https://via.placeholder.com/400x250?text=No+Image'}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <button className="w-full bg-fnt-red text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
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
                    <span>{car.mileage}</span>
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
          ))}
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