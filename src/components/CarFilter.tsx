import React, { useState } from 'react';
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

  const carMakes = [
    'Audi', 'BMW', 'Mercedes-Benz', 'Porsche', 'Ferrari', 'Lamborghini', 
    'Bentley', 'Rolls-Royce', 'Maserati', 'Aston Martin', 'McLaren', 'Jaguar'
  ];

  const carModels: { [key: string]: string[] } = {
    'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7'],
    'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i8'],
    'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class', 'SL', 'SLC', 'AMG GT', 'EQC'],
    'Porsche': ['911', '718 Boxster', '718 Cayman', 'Cayenne', 'Macan', 'Panamera', 'Taycan', '718 Spyder'],
    'Ferrari': ['488', 'F8 Tributo', 'SF90 Stradale', 'Roma', 'Portofino', '812 Superfast', 'LaFerrari', 'F12 Berlinetta'],
    'Lamborghini': ['Huracán', 'Aventador', 'Urus', 'Gallardo', 'Murciélago', 'Countach'],
    'Bentley': ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Azure'],
    'Rolls-Royce': ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan'],
    'Maserati': ['Ghibli', 'Quattroporte', 'Levante', 'GranTurismo', 'MC20'],
    'Aston Martin': ['DB11', 'Vantage', 'DBS', 'DBX', 'Valhalla', 'Valkyrie'],
    'McLaren': ['720S', '765LT', 'Artura', 'Senna', 'P1', '650S', '570S'],
    'Jaguar': ['XE', 'XF', 'XJ', 'F-PACE', 'E-PACE', 'I-PACE', 'F-TYPE']
  };

  const fuelTypes = [
    'Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'
  ];

  const handleFilterChange = (key: keyof CarFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
    
    // Scroll to the inventory section
    const inventorySection = document.getElementById('inventory');
    if (inventorySection) {
      inventorySection.scrollIntoView({ behavior: 'smooth' });
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
    <div className="w-full max-w-4xl mx-auto px-4 relative z-[999999]">
      <div className="bg-white/90 lg:bg-white backdrop-blur-xl shadow-2xl border border-white/30 rounded-2xl lg:rounded-full overflow-visible relative z-[999999]">
        <div className="flex flex-col lg:flex-row items-center justify-center px-3 lg:px-6 py-3 lg:py-3 gap-3 lg:gap-0">
          {/* Make Filter */}
          <div className="relative">
            <button
              onClick={() => setIsMakeOpen(!isMakeOpen)}
              className="w-full lg:w-auto px-3 py-2 lg:py-2 text-sm lg:text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center justify-center lg:justify-start gap-2 whitespace-nowrap rounded-xl lg:rounded-none"
            >
              <span>{filters.make || 'Any Make'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMakeOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isMakeOpen && (
              <div className="absolute z-[999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
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

          <div className="hidden lg:block h-6 w-px bg-fnt-red mx-2"></div>

          {/* Model Filter */}
          <div className="relative">
            <button
              onClick={() => setIsModelOpen(!isModelOpen)}
              className="w-full lg:w-auto px-3 py-2 lg:py-2 text-sm lg:text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center justify-center lg:justify-start gap-2 whitespace-nowrap rounded-xl lg:rounded-none"
            >
              <span>{filters.model || 'Any Model'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isModelOpen && (
              <div className="absolute z-[999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
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
                  {filters.make ? (
                    carModels[filters.make]?.map((model) => (
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
                    ))
                  ) : (
                    <div className="px-6 py-3 text-sm text-gray-500">
                      Select a make first
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block h-6 w-px bg-fnt-red mx-2"></div>

          {/* Price From */}
          <div className="w-full lg:w-auto flex items-center justify-center lg:justify-start px-2 py-2 lg:py-0 bg-gray-50 lg:bg-transparent rounded-xl lg:rounded-none">
            <span className="text-sm text-gray-500 mr-2">£</span>
            <input
              type="number"
              placeholder="Min Price"
              value={filters.priceFrom}
              onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
              className="w-20 lg:w-16 px-2 py-2 lg:py-2 text-sm bg-transparent border-none outline-none text-fnt-black placeholder-gray-500 font-bold text-center lg:text-left"
            />
          </div>

          <div className="hidden lg:block h-6 w-px bg-fnt-red mx-2"></div>

          {/* Price To */}
          <div className="w-full lg:w-auto flex items-center justify-center lg:justify-start px-2 py-2 lg:py-0 bg-gray-50 lg:bg-transparent rounded-xl lg:rounded-none">
            <span className="text-sm text-gray-500 mr-2">£</span>
            <input
              type="number"
              placeholder="Max Price"
              value={filters.priceTo}
              onChange={(e) => handleFilterChange('priceTo', e.target.value)}
              className="w-24 lg:w-16 px-2 py-2 lg:py-2 text-sm bg-transparent border-none outline-none text-fnt-black placeholder-gray-500 font-bold text-center lg:text-left"
            />
          </div>

          <div className="hidden lg:block h-6 w-px bg-fnt-red mx-2"></div>

          {/* Fuel Type */}
          <div className="relative">
            <button
              onClick={() => setIsFuelOpen(!isFuelOpen)}
              className="w-full lg:w-auto px-3 py-2 lg:py-2 text-sm lg:text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300 flex items-center justify-center lg:justify-start gap-2 whitespace-nowrap rounded-xl lg:rounded-none"
            >
              <span>{filters.fuelType || 'Any Fuel Type'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFuelOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFuelOpen && (
              <div className="absolute z-[999999] top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto min-w-48">
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

          <div className="hidden lg:block h-6 w-px bg-fnt-red mx-2"></div>

          {/* Search Button */}
              <button
                onClick={handleSearch}
                className="w-full lg:w-auto bg-fnt-black text-white px-4 py-2 lg:py-2 rounded-xl lg:rounded-full text-sm lg:text-base font-bold hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 mt-2 lg:mt-0"
              >
            <Search className="h-4 w-4" />
            Search Cars
          </button>

          {/* Clear Button - Only show when filters are active */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-fnt-red text-sm font-medium transition-colors duration-300 ml-6 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarFilter;
