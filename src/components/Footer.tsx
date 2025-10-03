import React from 'react';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import fntLogo from '../assets/fnt-logo.png';

const Footer = () => {
  const navigate = useNavigate();

  const handleAdminAccess = () => {
    navigate('/admin/login');
  };

  return (
    <footer className="bg-fnt-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex flex-col items-center mb-6">
              <img 
                src={fntLogo} 
                alt="FNT Motor Group" 
                className="h-32 w-auto mb-0"
                style={{ marginTop: '-30px' }}
              />
              <p className="text-gray-300 mb-4 leading-relaxed text-center" style={{ transform: 'translateY(-20px)' }}>
                Your premier destination for luxury automotive excellence. We craft exceptional vehicle experiences in Greater Manchester.
              </p>
            </div>
            <div className="flex space-x-4" style={{ marginTop: '-8px', marginLeft: '30px', transform: 'translateY(-20px)' }}>
              <a 
                href="https://www.instagram.com/fnt_motorgroup/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fnt-red transition-colors duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@fntmotorgroup?_t=ZN-90FaqSjhSRa&_r=1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fnt-red transition-colors duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://www.autotrader.co.uk/dealers/lancashire/manchester/fnt-motor-group-10042804" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity duration-300 flex items-center"
                style={{ marginTop: '-28px' }}
              >
                <img 
                  src="/autotrader-logo-nobg.png" 
                  alt="AutoTrader" 
                  className="w-24 h-24 object-contain"
                />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#home" className="text-gray-300 hover:text-fnt-red transition-colors duration-300">Home</a></li>
              <li><a href="#inventory" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Inventory</a></li>
              <li><a href="#services" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Services</a></li>
              <li><a href="#about" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">About Us</a></li>
              <li><a href="#contact" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-fnt-red transition-colors duration-300">Vehicle Sales</a></li>
              <li><button onClick={() => navigate('/warranty-financing')} className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Financing</button></li>
              <li><a href="#" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Trade-In</a></li>
              <li><button onClick={() => navigate('/warranty-financing')} className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Warranty</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-fnt-red mt-1 flex-shrink-0" />
                <div className="text-gray-300">
                  Manchester M12 4RX<br />
                  United Kingdom
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-fnt-red flex-shrink-0" />
                <span className="text-gray-300">07735770031</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-fnt-red flex-shrink-0" />
                <span className="text-gray-300">fntgroupltd@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-300 text-sm">
                  © 2025 <button 
                    onClick={handleAdminAccess}
                    className="hover:text-fnt-red transition-colors duration-300 cursor-pointer"
                  >
                    FNT Motor Group
                  </button>. All rights reserved.
                </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button onClick={() => navigate('/terms-conditions')} className="text-gray-300 hover:text-fnt-red text-sm transition-colors duration-300">Privacy Policy</button>
              <button onClick={() => navigate('/terms-conditions')} className="text-blue-100 hover:text-amber-500 text-sm transition-colors duration-300">Terms of Service</button>
              <button onClick={() => navigate('/terms-conditions')} className="text-blue-100 hover:text-amber-500 text-sm transition-colors duration-300">Cookie Policy</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;