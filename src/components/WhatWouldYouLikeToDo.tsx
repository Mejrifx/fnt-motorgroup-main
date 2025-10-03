import React from 'react';
import { Car, Star, DollarSign, MessageCircle, ArrowRight } from 'lucide-react';

const WhatWouldYouLikeToDo = () => {
  const actions = [
    {
      id: 1,
      title: "Find Your Car",
      description: "Browse our wide selection of reliable cars",
      icon: Car,
      color: "from-fnt-red to-red-600",
      hoverColor: "hover:from-red-600 hover:to-fnt-red",
      link: "#inventory"
    },
    {
      id: 2,
      title: "Sell Your Car",
      description: "Get a fair price for your current vehicle",
      icon: DollarSign,
      color: "from-green-600 to-green-800",
      hoverColor: "hover:from-green-800 hover:to-green-600",
      link: "#services"
    },
    {
      id: 3,
      title: "Read Reviews",
      description: "See what our happy customers have to say",
      icon: Star,
      color: "from-blue-600 to-blue-800",
      hoverColor: "hover:from-blue-800 hover:to-blue-600",
      link: "#reviews"
    },
    {
      id: 4,
      title: "Get In Touch",
      description: "Speak with our friendly team for honest advice",
      icon: MessageCircle,
      color: "from-purple-600 to-purple-800",
      hoverColor: "hover:from-purple-800 hover:to-purple-600",
      link: "#contact"
    }
  ];

  const handleCardClick = (link: string) => {
    const element = document.getElementById(link.replace('#', ''));
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 relative z-0" style={{ backgroundColor: '#171819' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            How Can We <span className="text-fnt-red">Help</span> You?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Quality cars at prices that work for your budget
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => handleCardClick(action.link)}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center transform transition-all duration-500 hover:bg-white/10 hover:border-fnt-red/30 hover:-translate-y-3 hover:shadow-2xl hover:shadow-fnt-red/10 cursor-pointer overflow-hidden"
              >
                {/* Subtle background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-fnt-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                <div className="relative z-1 flex flex-col items-center h-full">
                  <div className={`p-6 rounded-2xl bg-gradient-to-br ${action.color} text-white mb-8 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-fnt-red transition-colors duration-300">
                    {action.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-8 leading-relaxed group-hover:text-gray-300 transition-colors duration-300 flex-grow">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center text-fnt-red font-bold group-hover:text-white transition-all duration-300 transform group-hover:translate-x-2">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-3 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatWouldYouLikeToDo;
