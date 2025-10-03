import React from 'react';
import { CheckCircle } from 'lucide-react';

const About = () => {
  const achievements = [
    "Years of trusted car sales",
    "1,000+ happy customers in Manchester",
    "Fair prices and honest negotiations",
    "Friendly & Knowledgeable Team"
  ];

  return (
    <section id="about" className="py-20" style={{ backgroundColor: '#171819' }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Your Trusted Car Dealer In Manchester
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              At FNT Motor Group, we believe everyone deserves a reliable car that fits their budget. 
              We work hard to find quality vehicles and negotiate fair prices for all our customers, 
              whether you're buying your first car or upgrading to something better.
            </p>
            
            <div className="space-y-4 mb-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-fnt-red flex-shrink-0" />
                  <span className="text-gray-300 font-medium">{achievement}</span>
                </div>
              ))}
            </div>

            <p className="text-gray-300 leading-relaxed">
              Our team of automotive specialists brings decades of combined experience in luxury vehicle 
              sales and service. We understand that purchasing a premium vehicle is more than a transaction 
              – it's an investment in your lifestyle and a reflection of your success.
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Luxury showroom"
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <img
                  src="https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Expert service"
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
              </div>
              <div className="space-y-4 mt-8">
                <img
                  src="https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Customer consultation"
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <img
                  src="/minicooper.png"
                  alt="Premium vehicles"
                  className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
              </div>
            </div>
            
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-r from-fnt-red to-red-600 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-r from-fnt-black to-gray-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;