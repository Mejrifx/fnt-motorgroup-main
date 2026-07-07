import React from 'react';
import { ShieldCheck, Wrench, CreditCard, Medal, Clock, UsersThree } from '@phosphor-icons/react';

const Services = () => {
  const services = [
    {
      icon: ShieldCheck,
      title: "Comprehensive Warranty",
      description: "All vehicles come with our premium warranty coverage for complete peace of mind"
    },
    {
      icon: Wrench,
      title: "Expert Service & Maintenance",
      description: "Factory-trained technicians providing world-class service and maintenance"
    },
    {
      icon: CreditCard,
      title: "Flexible Financing",
      description: "Competitive financing options tailored to your budget and preferences"
    },
    {
      icon: Medal,
      title: "Trade-In Program",
      description: "Get the best value for your current vehicle with our fair trade-in process"
    },
    {
      icon: Clock,
      title: "Extended Service Hours",
      description: "Convenient service scheduling with extended hours to fit your busy lifestyle"
    },
    {
      icon: UsersThree,
      title: "Personal Concierge",
      description: "Dedicated personal advisors to guide you through every step of your journey"
    }
  ];

  return (
    <section id="services" className="py-28 relative grain">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-20 reveal">
          <h2 className="section-title text-4xl md:text-6xl text-white mb-5">
            Our Services
          </h2>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
            From buying to selling, we're here to help with all your car needs
          </p>
        </div>

        {/* Open editorial grid: hairline separators instead of card boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="group border-t hairline py-10 pr-4 reveal"
                style={{ '--reveal-delay': `${(index % 3) * 80}ms` } as React.CSSProperties}
              >
                <Icon
                  size={30}
                  weight="duotone"
                  className="text-fnt-red mb-6 transition-transform duration-500 ease-spring group-hover:-translate-y-1"
                />
                <h3 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                  {service.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
