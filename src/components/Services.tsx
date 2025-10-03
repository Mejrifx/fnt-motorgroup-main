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
    <section id="services" className="py-20" style={{ backgroundColor: '#171819' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            From buying to selling, we're here to help with all your car needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 hover:bg-gradient-to-br hover:from-gray-50 hover:to-red-50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-xl group"
            >
              <div className="text-fnt-red mb-6 group-hover:text-red-600 transition-colors duration-300">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-fnt-black mb-4">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
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