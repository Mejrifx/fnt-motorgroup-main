import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, Phone, MapPin } from 'lucide-react';
import fntLogo from '../assets/fnt-logo.png';
import CarFilter from './CarFilter';

interface HeroProps {
  onFilterChange?: (filters: any) => void;
}

const Hero: React.FC<HeroProps> = ({ onFilterChange }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToInventory = () => {
    const element = document.getElementById('inventory');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
    onFilterChange?.(filters);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url("https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: window.innerWidth > 768 ? 'fixed' : 'scroll'
      }}
    >
      {/* Mobile Header - Phone Left, Logo Center, Hamburger Right */}
      <div 
        className={`lg:hidden w-full px-4 py-1 transition-all duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          position: 'fixed',
          top: '-10px',
          left: 0,
          right: 0,
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        <div className="flex justify-between items-center">
          {/* Mobile Phone Button - Top Left */}
          <a 
            href="tel:07735770031"
            className="p-3 text-white hover:text-fnt-red transition-all duration-300 bg-white/10 backdrop-blur-xl rounded-full shadow-lg"
          >
            <Phone className="w-6 h-6" />
          </a>
          
          {/* Mobile FNT Logo - Top Center */}
          <img 
            src={fntLogo} 
            alt="FNT Motor Group" 
            className="h-40 w-auto drop-shadow-lg mx-auto"
          />
          
          {/* Mobile Hamburger Menu - Top Right */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 text-white hover:text-fnt-red transition-all duration-300 bg-white/10 backdrop-blur-xl rounded-full shadow-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="mt-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50">
            <nav className="px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-base font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Home
              </button>
              <button
                onClick={() => {
                  document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-base font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Showroom
              </button>
              <button
                onClick={() => {
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-base font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Sell Your Car
              </button>
              <button
                onClick={() => {
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-base font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Reviews
              </button>
              <button
                onClick={() => {
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-base font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                About Us
              </button>
              <button
                onClick={() => {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-base font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Contact
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Desktop Navigation Bar */}
      <div 
        className={`hidden lg:block w-full px-4 transition-all duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          position: 'fixed',
          top: '1rem',
          left: 0,
          right: 0,
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        {/* Desktop Address Button - Top Left */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2"
          style={{ left: '80px', pointerEvents: 'auto' }}
        >
          <a 
            href="https://maps.app.goo.gl/BzPwtnE6sKif93Rm7" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-fnt-black hover:text-fnt-red transition-all duration-300"
          >
            <MapPin className="w-4 h-4" />
            <span>Manchester M12 4RX</span>
          </a>
        </div>

        {/* Desktop Phone Button - Top Right */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2"
          style={{ right: '120px', pointerEvents: 'auto' }}
        >
          <a 
            href="tel:07735770031"
            className="bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-fnt-black hover:text-fnt-red transition-all duration-300"
          >
            <Phone className="w-4 h-4" />
            <span>07735770031</span>
          </a>
        </div>

        <div className="flex justify-center">
          <div 
            className="bg-white backdrop-blur-xl shadow-2xl border border-gray-200/50 rounded-full overflow-hidden"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center justify-center px-6 py-3">
              {/* Desktop Navigation */}
              <nav className="flex items-center">
                <button
                  onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300"
                >
                  Home
                </button>
                <div className="h-6 w-px bg-fnt-red mx-2"></div>
                <button
                  onClick={() => document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300"
                >
                  Showroom
                </button>
                <div className="h-6 w-px bg-fnt-red mx-2"></div>
                <button
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300"
                >
                  Sell Your Car
                </button>
                <div className="h-6 w-px bg-fnt-red mx-2"></div>
                <button
                  onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300"
                >
                  Reviews
                </button>
                <div className="h-6 w-px bg-fnt-red mx-2"></div>
                <button
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300"
                >
                  About Us
                </button>
                <div className="h-6 w-px bg-fnt-red mx-2"></div>
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-base font-bold text-fnt-black hover:text-fnt-red transition-all duration-300"
                >
                  Contact
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-fnt-black/80 via-fnt-black/60 to-transparent"></div>
      
      <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
        <div className="animate-fade-in-up">
          {/* Desktop FNT Logo - Only show on desktop */}
          <div className="hidden lg:block mb-8 md:mb-12" style={{ marginTop: '-50px' }}>
            <img 
              src={fntLogo} 
              alt="FNT Motor Group" 
              className="w-auto mx-auto mb-6 md:mb-8 drop-shadow-2xl transform hover:scale-105 transition-transform duration-500 h-80 lg:h-96"
              style={{ transform: 'translateY(-80px) scale(1)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-80px) scale(1.05)';
                e.currentTarget.style.transition = 'transform 0.3s ease';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-80px) scale(1)';
              }}
            />
          </div>
          
          {/* Welcome Text - Bigger and more dominant */}
          <div className="lg:-mt-24" style={{ marginTop: window.innerWidth < 768 ? '100px' : '0px' }}>
            <div className="mb-6 md:mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 md:mb-8 leading-tight tracking-tight px-2 lg:glow-effect" style={{ fontFamily: 'Outfit, sans-serif', textShadow: window.innerWidth < 768 ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none' }}>
                <span className="text-white">Welcome to F</span><span className="text-fnt-red">N</span><span className="text-white">T Motor Group</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-4 md:mb-8 px-2" style={{ textShadow: window.innerWidth < 768 ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none' }}>
                Find your dream car
              </p>
            </div>
            
            {/* Car Filter Section */}
            <div className="mb-6 relative z-50">
              <CarFilter onFilterChange={handleFilterChange} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center px-4 pb-8">
              <button
                onClick={scrollToInventory}
                className="bg-fnt-red text-white px-6 sm:px-6 md:px-10 py-3 sm:py-3 md:py-5 rounded-xl font-bold text-sm sm:text-lg md:text-xl hover:bg-red-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center w-full sm:w-auto"
              >
                Explore Collection
              </button>
              <button className="border-2 border-white text-white bg-white/10 backdrop-blur-xl hover:bg-white hover:text-fnt-black px-6 sm:px-6 md:px-10 py-3 sm:py-3 md:py-5 rounded-xl font-bold text-sm sm:text-lg md:text-xl transition-all duration-300 w-full sm:w-auto shadow-lg">
                Schedule Test Drive
              </button>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;