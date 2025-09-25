import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';
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
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src={fntLogo} 
                alt="FNT Motor Group" 
                className="h-10 w-auto"
              />
              <h3 className="text-2xl font-bold">FNT MOTOR GROUP</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your premier destination for luxury automotive excellence. We've been crafting exceptional vehicle experiences for over two decades.
            </p>
            <div className="flex space-x-4">
              <button className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fnt-red transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fnt-red transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fnt-red transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fnt-red transition-colors duration-300">
                <Linkedin className="w-5 h-5" />
              </button>
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
              <li><a href="#" className="text-gray-300 hover:text-fnt-red transition-colors duration-300">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-fnt-red transition-colors duration-300">Vehicle Sales</a></li>
              <li><a href="#" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Financing</a></li>
              <li><a href="#" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Trade-In</a></li>
              <li><a href="#" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Service & Maintenance</a></li>
              <li><a href="#" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Parts & Accessories</a></li>
              <li><a href="#" className="text-blue-100 hover:text-amber-500 transition-colors duration-300">Warranty</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-fnt-red mt-1 flex-shrink-0" />
                <div className="text-gray-300">
                  123 Luxury Avenue<br />
                  Premium District, NY 10001
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-fnt-red flex-shrink-0" />
                <span className="text-gray-300">(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-fnt-red flex-shrink-0" />
                <span className="text-gray-300">info@fntmotorgroup.com</span>
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
              <a href="#" className="text-gray-300 hover:text-fnt-red text-sm transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-blue-100 hover:text-amber-500 text-sm transition-colors duration-300">Terms of Service</a>
              <a href="#" className="text-blue-100 hover:text-amber-500 text-sm transition-colors duration-300">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;