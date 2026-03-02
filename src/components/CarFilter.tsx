import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [showAllMakes, setShowAllMakes] = useState(false);
  const priceFromRef = useRef<HTMLInputElement>(null);

  // Dynamic filter options from actual inventory
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<{ [key: string]: string[] }>({});
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);

  // Fetch available filter options from current inventory
  useEffect(() => {
    fetchInventoryFilters();
  }, []);

  const fetchInventoryFilters = async () => {
    try {
      const { data: cars, error } = await supabase
        .from('cars')
        .select('make, model, fuel_type')
        .eq('is_available', true);

      if (error) throw error;

      if (cars) {
        // Extract unique makes (sorted alphabetically)
        const makes = [...new Set(cars.map(car => car.make).filter(Boolean))].sort();
        setAvailableMakes(makes);

        // Extract models grouped by make
        const modelsByMake: { [key: string]: string[] } = {};
        makes.forEach(make => {
          const models = [...new Set(
            cars
              .filter(car => car.make === make)
              .map(car => car.model)
              .filter(Boolean)
          )].sort();
          modelsByMake[make] = models;
        });
        setAvailableModels(modelsByMake);

        // Extract unique fuel types (sorted)
        const fuelTypes = [...new Set(cars.map(car => car.fuel_type).filter(Boolean))].sort();
        setAvailableFuelTypes(fuelTypes);
      }
    } catch (error) {
      console.error('Error fetching inventory filters:', error);
    }
  };

  // Lock body scroll when mobile modal is open
  useEffect(() => {
    if (isMakeOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMakeOpen]);

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

  const handleFilterChange = (key: keyof CarFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset model when make changes
    if (key === 'make') {
      newFilters.model = '';
    }
    
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
    <div className="w-full max-w-4xl mx-auto px-4 relative">
      <div className="bg-white/90 lg:bg-white backdrop-blur-xl shadow-2xl border border-white/30 rounded-2xl lg:rounded-full overflow-visible relative">
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
                    {availableMakes.map((make) => (
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
                    {filters.make && availableModels[filters.make]?.map((model) => (
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
                    {!filters.make && (
                      <div className="px-6 py-3 text-sm text-gray-500 text-center">
                        Select a make first
                      </div>
                    )}
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
                    {availableFuelTypes.map((fuel) => (
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

        {/* Mobile Layout - iOS Style Bottom Sheet */}
        <div className="lg:hidden">
          {/* Trigger Button */}
          <button
            onClick={() => setIsMakeOpen(!isMakeOpen)}
            className="w-full px-6 py-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg active:scale-[0.98] transition-transform duration-150 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">
                  {filters.make || filters.model || filters.fuelType ? (
                    <span className="text-fnt-red">
                      {[filters.make, filters.model, filters.fuelType].filter(Boolean).join(' • ')}
                    </span>
                  ) : (
                    'Search Cars'
                  )}
                </div>
                {(filters.priceFrom || filters.priceTo) && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {filters.priceFrom && `£${filters.priceFrom}`}
                    {filters.priceFrom && filters.priceTo && ' - '}
                    {filters.priceTo && `£${filters.priceTo}`}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isMakeOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Bottom Sheet Modal - Portal to body to escape stacking context */}
          {isMakeOpen && createPortal(
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black/40 animate-fade-in"
                style={{ 
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999998
                }}
                onClick={() => setIsMakeOpen(false)}
              />
              
              {/* Bottom Sheet */}
              <div 
                style={{ 
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999999
                }}
                className="animate-slide-up"
              >
                <div className="bg-white rounded-t-[28px] shadow-2xl max-h-[85vh] flex flex-col">
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                  </div>

                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Filter Cars</h3>
                      <div className="flex items-center gap-3">
                        {hasActiveFilters && (
                          <button
                            onClick={handleClearFilters}
                            className="text-sm font-semibold text-fnt-red active:opacity-60 transition-opacity"
                          >
                            Clear All
                          </button>
                        )}
                        <button
                          onClick={() => setIsMakeOpen(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                        >
                          <X className="w-6 h-6 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                    {/* Make Selection */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">Make</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleFilterChange('make', '')}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                            !filters.make
                              ? 'bg-fnt-black text-white shadow-md scale-[1.02]'
                              : 'bg-gray-100 text-gray-700 active:scale-[0.98]'
                          }`}
                        >
                          All Makes
                        </button>
                        {(showAllMakes ? availableMakes : availableMakes.slice(0, 8)).map((make) => (
                          <button
                            key={make}
                            onClick={() => handleFilterChange('make', make)}
                            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                              filters.make === make
                                ? 'bg-fnt-black text-white shadow-md scale-[1.02]'
                                : 'bg-gray-100 text-gray-700 active:scale-[0.98]'
                            }`}
                          >
                            {make}
                          </button>
                        ))}
                      </div>
                      {!showAllMakes && availableMakes.length > 8 && (
                        <button
                          onClick={() => setShowAllMakes(true)}
                          className="mt-3 text-sm font-semibold text-fnt-red active:opacity-60"
                        >
                          View All {availableMakes.length} Makes
                        </button>
                      )}
                      {showAllMakes && (
                        <button
                          onClick={() => setShowAllMakes(false)}
                          className="mt-3 text-sm font-semibold text-gray-600 active:opacity-60"
                        >
                          Show Less
                        </button>
                      )}
                    </div>

                    {/* Model Selection - Only if make is selected */}
                    {filters.make && availableModels[filters.make] && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Model</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleFilterChange('model', '')}
                            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                              !filters.model
                                ? 'bg-fnt-black text-white shadow-md scale-[1.02]'
                                : 'bg-gray-100 text-gray-700 active:scale-[0.98]'
                            }`}
                          >
                            All Models
                          </button>
                          {availableModels[filters.make].map((model) => (
                            <button
                              key={model}
                              onClick={() => handleFilterChange('model', model)}
                              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                filters.model === model
                                  ? 'bg-fnt-black text-white shadow-md scale-[1.02]'
                                  : 'bg-gray-100 text-gray-700 active:scale-[0.98]'
                              }`}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">Price Range</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">£</span>
                            <input
                              type="text"
                              placeholder="Min"
                              value={filters.priceFrom}
                              onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                              className="w-full pl-8 pr-4 py-3.5 text-sm font-medium bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-fnt-black focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div className="w-3 h-0.5 bg-gray-300 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">£</span>
                            <input
                              type="text"
                              placeholder="Max"
                              value={filters.priceTo}
                              onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                              className="w-full pl-8 pr-4 py-3.5 text-sm font-medium bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-fnt-black focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">Fuel Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleFilterChange('fuelType', '')}
                          className={`px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                            !filters.fuelType
                              ? 'bg-fnt-black text-white shadow-md scale-[1.02]'
                              : 'bg-gray-100 text-gray-700 active:scale-[0.98]'
                          }`}
                        >
                          All Types
                        </button>
                        {availableFuelTypes.map((fuel) => (
                          <button
                            key={fuel}
                            onClick={() => handleFilterChange('fuelType', fuel)}
                            className={`px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                              filters.fuelType === fuel
                                ? 'bg-fnt-black text-white shadow-md scale-[1.02]'
                                : 'bg-gray-100 text-gray-700 active:scale-[0.98]'
                            }`}
                          >
                            {fuel}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer - Search Button */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-white/80 backdrop-blur-xl">
                    <button
                      onClick={() => {
                        handleSearch();
                        setIsMakeOpen(false);
                      }}
                      className="w-full bg-fnt-red text-white px-6 py-4 rounded-2xl text-base font-bold shadow-lg active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Search {hasActiveFilters && 'with Filters'}
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
};

export default CarFilter;