import React, { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <>
      <div 
        className="w-full px-4"
        style={{
          position: 'absolute',
          top: '3rem',
          left: 0,
          right: 0,
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        <div className="flex justify-center">
          {/* Floating Navigation Bar */}
          <div 
            className="bg-gradient-to-r from-white via-fnt-red to-white backdrop-blur-xl shadow-2xl border border-gray-200/50 rounded-xl overflow-hidden"
            style={{ pointerEvents: 'auto' }}
          >
          <div className="flex items-center justify-center px-8 py-4">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => scrollToSection('home')}
                className="px-5 py-3 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('inventory')}
                className="px-5 py-3 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Showroom
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="px-5 py-3 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Sell Your Car
              </button>
              <button
                onClick={() => scrollToSection('reviews')}
                className="px-5 py-3 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Reviews
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="px-5 py-3 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-5 py-3 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
              >
                Contact
              </button>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-3 text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/50 bg-white/98">
              <nav className="px-8 py-5 space-y-3">
                <button
                  onClick={() => scrollToSection('home')}
                  className="block w-full text-left py-4 px-5 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('inventory')}
                  className="block w-full text-left py-4 px-5 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
                >
                  Showroom
                </button>
                <button
                  onClick={() => scrollToSection('services')}
                  className="block w-full text-left py-4 px-5 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
                >
                  Sell Your Car
                </button>
                <button
                  onClick={() => scrollToSection('reviews')}
                  className="block w-full text-left py-4 px-5 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
                >
                  Reviews
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="block w-full text-left py-4 px-5 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
                >
                  About Us
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="block w-full text-left py-4 px-5 text-lg font-bold text-fnt-black hover:text-fnt-red hover:bg-fnt-red/10 rounded-lg transition-all duration-300"
                >
                  Contact
                </button>
                
              </nav>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;