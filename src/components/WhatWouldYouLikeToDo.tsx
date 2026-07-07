import React, { useState } from 'react';
import { CarProfile, Star, CurrencyGbp, ChatCircleText, ArrowRight } from '@phosphor-icons/react';
import SellCarModal from './SellCarModal';

const WhatWouldYouLikeToDo = () => {
  const [isSellCarModalOpen, setIsSellCarModalOpen] = useState(false);

  const actions = [
    {
      id: 1,
      title: "Find Your Car",
      description: "Browse our wide selection of reliable cars",
      icon: CarProfile,
      link: "#inventory"
    },
    {
      id: 2,
      title: "Sell Your Car",
      description: "Get a fair price for your current vehicle",
      icon: CurrencyGbp,
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
      icon: ChatCircleText,
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
    <section className="py-28 relative z-0 overflow-visible grain">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-16 reveal">
          <h2 className="section-title text-5xl md:text-7xl text-white mb-6">
            How can we <span className="text-fnt-red">help</span> you?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
            Quality cars at prices that work for your budget
          </p>
        </div>

        {/* Flat interactive tiles: surface only appears on hover */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t hairline">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => handleCardClick(action)}
                className="group relative cursor-pointer px-6 py-12 lg:py-16 border-b lg:border-b-0 lg:border-r hairline last:border-r-0 last:border-b-0 transition-colors duration-500 hover:bg-white/[0.04] reveal"
                style={{ '--reveal-delay': `${index * 80}ms` } as React.CSSProperties}
              >
                {/* Red bloom rising from the top edge on hover */}
                <div
                  className="absolute inset-x-0 top-0 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(320px 96px at 50% 0%, rgba(255,73,67,0.12), transparent 70%)' }}
                ></div>

                <div className="relative flex flex-col h-full">
                  <Icon
                    size={34}
                    weight="duotone"
                    className="text-fnt-red mb-8 transition-transform duration-500 ease-spring group-hover:-translate-y-1"
                  />

                  <h3 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                    {action.title}
                  </h3>

                  <p className="text-gray-400 mb-8 leading-relaxed group-hover:text-gray-300 transition-colors duration-300 flex-grow">
                    {action.description}
                  </p>

                  <div className="flex items-center gap-2 text-fnt-red font-semibold transition-transform duration-300 group-hover:translate-x-1">
                    Get Started
                    <ArrowRight size={18} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
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
