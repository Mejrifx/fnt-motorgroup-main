import React, { useState, useEffect } from 'react';
import { List, X, Phone, MapPin } from '@phosphor-icons/react';
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToInventory = () => {
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
  };

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
    onFilterChange?.(filters);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-visible"
      style={{
        backgroundImage: 'url("https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Mobile Header - Phone Left, Logo Center, Hamburger Right */}
      <div 
        className={`lg:hidden w-full px-4 py-1 transition-all duration-300 ${isScrolled && !isMobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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
            className="p-3 text-white hover:text-fnt-red transition-all duration-300 btn-glass rounded-full"
          >
            <Phone size={24} weight="duotone" />
          </a>
          
          {/* Mobile FNT Logo - Top Center */}
          <img 
            src={fntLogo} 
            alt="FNT Motor Group" 
            className="h-48 sm:h-52 w-auto drop-shadow-lg mx-auto"
          />
          
          {/* Mobile Hamburger Menu - Top Right */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 text-white hover:text-fnt-red transition-all duration-300 btn-glass rounded-full"
          >
            {isMobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
        </div>

        {/* Mobile Navigation Menu - Full Screen */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[99999] flex flex-col animate-fade-in" style={{ background: 'rgba(11, 12, 15, 0.88)', backdropFilter: 'blur(32px) saturate(150%)', WebkitBackdropFilter: 'blur(32px) saturate(150%)' }}>
            {/* Header with close button */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <img 
                src={fntLogo} 
                alt="FNT Motor Group" 
                className="h-20 w-auto"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 text-white hover:text-fnt-red btn-glass rounded-full transition-all duration-300"
              >
                <X size={28} weight="bold" />
              </button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 flex flex-col justify-center px-8 space-y-2">
              {[
                { label: 'Home', target: 'home' },
                { label: 'Showroom', target: 'inventory' },
                { label: 'Sell Your Car', target: 'services' },
                { label: 'Reviews', target: 'reviews' },
                { label: 'About Us', target: 'about' },
                { label: 'Contact', target: 'contact' },
              ].map((item) => (
                <button
                  key={item.target}
                  onClick={() => {
                    document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-2xl font-bold text-white hover:text-fnt-red transition-all duration-300 text-left py-4 border-b border-white/10"
                  style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            
            {/* Footer with contact info */}
            <div className="p-8 border-t border-white/10">
              <div className="text-center space-y-3">
                <p className="text-lg font-semibold text-white">FNT Motor Group</p>
                <p className="text-gray-400">Unit 1, Clayton Court, 5 Welcomb Street<br />Manchester M11 2NB</p>
                <a 
                  href="tel:07735770031"
                  className="block text-lg font-bold text-fnt-red hover:text-red-400 transition-colors duration-300"
                >
                  07735770031
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation Bar */}
      <div 
        className={`hidden lg:block w-full px-4 transition-all duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          position: 'fixed',
          top: '1.5rem',
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
            className="btn-glass rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-white hover:text-fnt-red"
          >
            <MapPin size={16} weight="duotone" />
            <span>Manchester M11 2NB</span>
          </a>
        </div>

        {/* Desktop Phone Button - Top Right */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2"
          style={{ right: '120px', pointerEvents: 'auto' }}
        >
          <a 
            href="tel:07735770031"
            className="btn-glass rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-white hover:text-fnt-red"
          >
            <Phone size={16} weight="duotone" />
            <span>07735770031</span>
          </a>
        </div>

        <div className="flex justify-center">
          <div 
            className="glass rounded-full overflow-hidden"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center justify-center px-3 py-2">
              {/* Desktop Navigation */}
              <nav className="flex items-center gap-0.5">
                {[
                  { label: 'Home', target: 'home' },
                  { label: 'Showroom', target: 'inventory' },
                  { label: 'Sell Your Car', target: 'services' },
                  { label: 'Reviews', target: 'reviews' },
                  { label: 'About Us', target: 'about' },
                  { label: 'Contact', target: 'contact' },
                ].map((item) => (
                  <button
                    key={item.target}
                    onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-1.5 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-fnt-black/80 via-fnt-black/60 to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#0b0c0f]"></div>
      
      <div className="relative z-10 text-center max-w-6xl mx-auto px-4 overflow-visible">
        <div className="animate-fade-in-up overflow-visible">
          {/* Desktop FNT Logo - Only show on desktop */}
          <div className="hidden lg:block mb-8 md:mb-12" style={{ marginTop: '0px' }}>
            <img 
              src={fntLogo} 
              alt="FNT Motor Group" 
              className="w-auto mx-auto mb-6 md:mb-8 drop-shadow-2xl transform hover:scale-105 transition-transform duration-500 h-80 lg:h-96 xl:h-[28rem]"
              style={{ transform: 'translateY(-42px) scale(1)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-42px) scale(1.05)';
                e.currentTarget.style.transition = 'transform 0.3s ease';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-42px) scale(1)';
              }}
            />
          </div>
          
          {/* Welcome Text - Bigger and more dominant */}
          <div className="lg:-mt-48" style={{ marginTop: window.innerWidth < 768 ? '130px' : '-80px' }}>
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 md:mb-6 leading-tight tracking-tight px-2" style={{ fontFamily: 'Outfit, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                <span className="text-white">Welcome to F</span><span className="text-fnt-red">N</span><span className="text-white">T Motor Group</span>
          </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white mb-4 md:mb-6 px-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                Find your dream car
              </p>
            </div>
            
            {/* Car Filter Section */}
            <div className="mb-12 relative overflow-visible z-40">
              <CarFilter onFilterChange={handleFilterChange} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center px-4 pb-8">
            <button
              onClick={scrollToInventory}
                className="btn-glass-red text-white px-6 sm:px-6 md:px-10 py-3 sm:py-3 md:py-5 rounded-2xl font-bold text-sm sm:text-lg md:text-xl flex items-center justify-center w-full sm:w-auto"
            >
              Explore Collection
            </button>
              <button className="btn-glass text-white px-6 sm:px-6 md:px-10 py-3 sm:py-3 md:py-5 rounded-2xl font-bold text-sm sm:text-lg md:text-xl w-full sm:w-auto">
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