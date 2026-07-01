import React, { useState } from 'react';
import { Car, Star, DollarSign, MessageCircle, ArrowRight } from 'lucide-react';
import SellCarModal from './SellCarModal';

const WhatWouldYouLikeToDo = () => {
  const [isSellCarModalOpen, setIsSellCarModalOpen] = useState(false);

  const actions = [
    {
      id: 1,
      title: "Find Your Car",
      description: "Browse our wide selection of reliable cars",
      icon: Car,
      link: "#inventory"
    },
    {
      id: 2,
      title: "Sell Your Car",
      description: "Get a fair price for your current vehicle",
      icon: DollarSign,
      link: "#services",
      isModal: true
    },
    {
      id: 3,
      title: "Read Reviews",
      description: "See what our happy customers have to say",
      icon: Star,
      link: "#reviews"
    },
    {
      id: 4,
      title: "Get In Touch",
      description: "Speak with our friendly team for honest advice",
      icon: MessageCircle,
      link: "#contact"
    }
  ];

  const handleCardClick = (action: any) => {
    if (action.isModal) {
      setIsSellCarModalOpen(true);
    } else {
      const element = document.getElementById(action.link.replace('#', ''));
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 relative z-0 overflow-visible glass-scene">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title text-5xl md:text-6xl font-black text-white mb-6">
            How Can We <span className="text-fnt-red">Help</span> You?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Quality cars at prices that work for your budget
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => handleCardClick(action)}
                className="group glass-card p-8 flex flex-col items-center text-center cursor-pointer overflow-hidden relative"
              >
                {/* Subtle red bloom on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(400px 200px at 50% 0%, rgba(255,73,67,0.10), transparent 70%)' }}></div>
                
                <div className="relative z-1 flex flex-col items-center h-full">
                  <div className="p-5 rounded-2xl glass-subtle text-fnt-red mb-8 transform transition-all duration-500 ease-spring group-hover:scale-110 group-hover:-translate-y-1">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 transition-colors duration-300" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                    {action.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-8 leading-relaxed group-hover:text-gray-300 transition-colors duration-300 flex-grow">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center text-fnt-red font-semibold transition-all duration-300 transform group-hover:translate-x-1">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <SellCarModal 
        isOpen={isSellCarModalOpen} 
        onClose={() => setIsSellCarModalOpen(false)} 
      />
    </section>
  );
};

export default WhatWouldYouLikeToDo;
