import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';

const About = () => {
  const achievements = [
    "Years of trusted car sales",
    "1,000+ happy customers in Manchester",
    "Fair prices and honest negotiations",
    "Friendly & Knowledgeable Team"
  ];

  return (
    <section id="about" className="py-24 glass-scene grain">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <h2 className="section-title text-4xl md:text-6xl text-white mb-6">
              Your trusted car dealer in Manchester
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              At FNT Motor Group, we believe everyone deserves a reliable car that fits their budget. 
              We work hard to find quality vehicles and negotiate fair prices for all our customers, 
              whether you're buying your first car or upgrading to something better.
            </p>
            
            <div className="mb-8 divide-y divide-white/[0.07] border-y hairline">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 py-3.5">
                  <CheckCircle size={22} weight="duotone" className="text-fnt-red flex-shrink-0" />
                  <span className="text-gray-200 font-medium">{achievement}</span>
                </div>
              ))}
            </div>

            <p className="text-gray-300 leading-relaxed">
              Our team of automotive specialists brings decades of combined experience in luxury vehicle 
              sales and service. We understand that purchasing a premium vehicle is more than a transaction 
              – it's an investment in your lifestyle and a reflection of your success.
            </p>
          </div>

          <div className="relative reveal" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Luxury showroom"
                  className="rounded-2xl border border-white/10 shadow-glass-sm hover:-translate-y-1 transition-transform duration-500 ease-spring"
                />
                <img
                  src="https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Expert service"
                  className="rounded-2xl border border-white/10 shadow-glass-sm hover:-translate-y-1 transition-transform duration-500 ease-spring"
                />
              </div>
              <div className="space-y-4 mt-8">
                <img
                  src="https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Customer consultation"
                  className="rounded-2xl border border-white/10 shadow-glass-sm hover:-translate-y-1 transition-transform duration-500 ease-spring"
                />
                <img
                  src="https://images.pexels.com/photos/544542/pexels-photo-544542.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Mini Cooper"
                  className="rounded-2xl border border-white/10 shadow-glass-sm hover:-translate-y-1 transition-transform duration-500 ease-spring"
                />
              </div>
            </div>
            
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-fnt-red rounded-full opacity-15 blur-3xl"></div>
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-fnt-red rounded-full opacity-10 blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;