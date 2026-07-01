import React from 'react';
import { Shield, Wrench, CreditCard, Award, Clock, Users } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Comprehensive Warranty",
      description: "All vehicles come with our premium warranty coverage for complete peace of mind"
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Expert Service & Maintenance",
      description: "Factory-trained technicians providing world-class service and maintenance"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Flexible Financing",
      description: "Competitive financing options tailored to your budget and preferences"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Trade-In Program",
      description: "Get the best value for your current vehicle with our fair trade-in process"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Extended Service Hours",
      description: "Convenient service scheduling with extended hours to fit your busy lifestyle"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Personal Concierge",
      description: "Dedicated personal advisors to guide you through every step of your journey"
    }
  ];

  return (
    <section id="services" className="py-24 glass-scene">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title text-4xl md:text-5xl font-black text-white mb-4">
            Our Services
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            From buying to selling, we're here to help with all your car needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="glass-card p-8 group"
            >
              <div className="inline-flex p-4 rounded-2xl glass-subtle text-fnt-red mb-6 transition-transform duration-500 ease-spring group-hover:scale-110">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                {service.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;