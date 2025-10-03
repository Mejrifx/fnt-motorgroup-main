import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface CarFilterProps {
  onFilterChange?: (filters: CarFilters) => void;
}

interface CarFilters {
  make: string;
  model: string;
  priceFrom: string;
  priceTo: string;
  fuelType: string;
}

const CarFilter: React.FC<CarFilterProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<CarFilters>({
    make: '',
    model: '',
    priceFrom: '',
    priceTo: '',
    fuelType: ''
  });

  const [isMakeOpen, setIsMakeOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const priceFromRef = useRef<HTMLInputElement>(null);

  // Set placeholder based on screen size
  useEffect(() => {
    const updatePlaceholder = () => {
      if (priceFromRef.current) {
        if (window.innerWidth >= 1024) {
          priceFromRef.current.placeholder = 'Min';
        } else {
          priceFromRef.current.placeholder = 'Min Price';
        }
      }
    };

    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);
    return () => window.removeEventListener('resize', updatePlaceholder);
  }, []);

  const carMakes = ['BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce', 'Tesla', 'Land Rover', 'Range Rover', 'Jaguar', 'Maserati', 'McLaren', 'Aston Martin'];
  const carModels = ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'C-Class', 'E-Class', 'S-Class', 'GLE', 'GLS', 'A4', 'A6', 'A8', 'Q5', 'Q7', '911', 'Cayenne', 'Panamera', 'Macan'];
  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

  const handleFilterChange = (key: keyof CarFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
    
    // Scroll to the inventory section with offset to center the results
    const inventorySection = document.getElementById('inventory');
    if (inventorySection) {
      // Calculate offset to scroll further down and center the results
      const offset = window.innerHeight * 0.1; // Scroll much further down to center results
      const elementPosition = inventorySection.offsetTop;
      const offsetPosition = elementPosition + offset; // ADD offset to go DOWN
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    
    // Trigger filter change to pass data to parent
    onFilterChange?.(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      make: '',
      model: '',
      priceFrom: '',
      priceTo: '',
      fuelType: ''
    };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.make || filters.model || filters.priceFrom || filters.priceTo || filters.fuelType;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 relative z-[99999999]">
      <div className="bg-white/90 lg:bg-white backdrop-blur-xl shadow-2xl border border-white/30 rounded-2xl lg:rounded-full overflow-visible relative z-[99999999]">
        {/* Desktop Layout */}
        <div className="hidden lg:block px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            {/* Make Filter */}
            <div className="relative">
              <button
                onClick={() => setIsMakeOpen(!isMakeOpen)}
                className="px-3 py-2 text-sm font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center gap-2 min-w-0 flex-shrink"
              >
                <span>{filters.make || 'Any Make'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMakeOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMakeOpen && (
                <div className="absolute z-[99999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleFilterChange('make', '');
                        setIsMakeOpen(false);
                      }}
                      className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 rounded-t-2xl"
                    >
                      Any Make
                    </button>
                    {carMakes.map((make) => (
                      <button
                        key={make}
                        onClick={() => {
                          handleFilterChange('make', make);
                          setIsMakeOpen(false);
                        }}
                        className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 last:rounded-b-2xl"
                      >
                        {make}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-fnt-red mx-2"></div>

            {/* Model Filter */}
            <div className="relative">
              <button
                onClick={() => setIsModelOpen(!isModelOpen)}
                className="px-3 py-2 text-sm font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center gap-2 min-w-0 flex-shrink"
              >
                <span>{filters.model || 'Any Model'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isModelOpen && (
                <div className="absolute z-[99999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleFilterChange('model', '');
                        setIsModelOpen(false);
                      }}
                      className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 rounded-t-2xl"
                    >
                      Any Model
                    </button>
                    {carModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          handleFilterChange('model', model);
                          setIsModelOpen(false);
                        }}
                        className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 last:rounded-b-2xl"
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-fnt-red mx-2"></div>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  ref={priceFromRef}
                  type="text"
                  placeholder="Min"
                  value={filters.priceFrom}
                  onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                  className="w-20 pl-6 pr-2 py-2 text-sm text-center border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                />
              </div>
              <span className="text-gray-500 text-sm">to</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  type="text"
                  placeholder="Max"
                  value={filters.priceTo}
                  onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                  className="w-20 pl-6 pr-2 py-2 text-sm text-center border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            <div className="h-6 w-px bg-fnt-red mx-2"></div>

            {/* Fuel Type */}
            <div className="relative">
              <button
                onClick={() => setIsFuelOpen(!isFuelOpen)}
                className="px-3 py-2 text-sm font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center gap-2 min-w-0 flex-shrink"
              >
                <span>{filters.fuelType || 'Any Fuel Type'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFuelOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFuelOpen && (
                <div className="absolute z-[99999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleFilterChange('fuelType', '');
                        setIsFuelOpen(false);
                      }}
                      className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 rounded-t-2xl"
                    >
                      Any Fuel Type
                    </button>
                    {fuelTypes.map((fuel) => (
                      <button
                        key={fuel}
                        onClick={() => {
                          handleFilterChange('fuelType', fuel);
                          setIsFuelOpen(false);
                        }}
                        className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 last:rounded-b-2xl"
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-fnt-red mx-2"></div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="bg-fnt-black text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </button>

            {/* Clear Button - Only show when filters are active */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-fnt-red text-sm font-medium transition-colors duration-300 underline flex-shrink-0 ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden px-3 py-3 space-y-3">
          <div className="flex flex-wrap gap-3">
            {/* Make Filter */}
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setIsMakeOpen(!isMakeOpen)}
                className="w-full px-3 py-2 text-sm font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center justify-center gap-2 rounded-xl"
              >
                <span>{filters.make || 'Any Make'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMakeOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMakeOpen && (
                <div className="absolute z-[99999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleFilterChange('make', '');
                        setIsMakeOpen(false);
                      }}
                      className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 rounded-t-2xl"
                    >
                      Any Make
                    </button>
                    {carMakes.map((make) => (
                      <button
                        key={make}
                        onClick={() => {
                          handleFilterChange('make', make);
                          setIsMakeOpen(false);
                        }}
                        className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 last:rounded-b-2xl"
                      >
                        {make}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Model Filter */}
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setIsModelOpen(!isModelOpen)}
                className="w-full px-3 py-2 text-sm font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center justify-center gap-2 rounded-xl"
              >
                <span>{filters.model || 'Any Model'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isModelOpen && (
                <div className="absolute z-[99999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleFilterChange('model', '');
                        setIsModelOpen(false);
                      }}
                      className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 rounded-t-2xl"
                    >
                      Any Model
                    </button>
                    {carModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          handleFilterChange('model', model);
                          setIsModelOpen(false);
                        }}
                        className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 last:rounded-b-2xl"
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Price Range */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  ref={priceFromRef}
                  type="text"
                  placeholder="Min Price"
                  value={filters.priceFrom}
                  onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                  className="w-32 pl-6 pr-2 py-2 text-sm text-center border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                />
              </div>
              <span className="text-gray-500 text-sm">to</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  type="text"
                  placeholder="Max Price"
                  value={filters.priceTo}
                  onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                  className="w-32 pl-6 pr-2 py-2 text-sm text-center border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Fuel Type */}
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setIsFuelOpen(!isFuelOpen)}
                className="w-full px-3 py-2 text-sm font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center justify-center gap-2 rounded-xl"
              >
                <span>{filters.fuelType || 'Any Fuel Type'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFuelOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFuelOpen && (
                <div className="absolute z-[99999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleFilterChange('fuelType', '');
                        setIsFuelOpen(false);
                      }}
                      className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 rounded-t-2xl"
                    >
                      Any Fuel Type
                    </button>
                    {fuelTypes.map((fuel) => (
                      <button
                        key={fuel}
                        onClick={() => {
                          handleFilterChange('fuelType', fuel);
                          setIsFuelOpen(false);
                        }}
                        className="w-full px-6 py-3 text-left text-sm font-medium text-fnt-black hover:bg-fnt-red/5 hover:text-fnt-red transition-colors duration-200 last:rounded-b-2xl"
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Clear Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="flex-1 bg-fnt-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-gray-500 hover:text-fnt-red text-sm font-medium transition-colors duration-300 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarFilter;