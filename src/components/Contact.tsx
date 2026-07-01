import React from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="py-24 glass-scene">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title text-4xl md:text-5xl font-black text-white mb-4">
            Visit Our Showroom
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Come see our cars in person at our Manchester showroom, or get in touch with our friendly team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="glass rounded-3xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2.5 rounded-xl glass-subtle flex-shrink-0">
                    <MapPin className="w-5 h-5 text-fnt-red" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Location</h4>
                    <p className="text-gray-400">
                      Unit 1, Clayton Court, 5 Welcomb Street<br />
                      Manchester M11 2NB<br />
                      United Kingdom
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2.5 rounded-xl glass-subtle flex-shrink-0">
                    <Phone className="w-5 h-5 text-fnt-red" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Phone</h4>
                    <a href="tel:07735770031" className="text-gray-400 hover:text-fnt-red transition-colors duration-300">07735770031</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2.5 rounded-xl glass-subtle flex-shrink-0">
                    <Mail className="w-5 h-5 text-fnt-red" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Email</h4>
                    <a href="mailto:fntgroupltd@gmail.com" className="text-gray-400 hover:text-fnt-red transition-colors duration-300">fntgroupltd@gmail.com</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2.5 rounded-xl glass-subtle flex-shrink-0">
                    <Clock className="w-5 h-5 text-fnt-red" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Hours</h4>
                    <div className="text-gray-400 text-sm space-y-1">
                      <p>Monday - Saturday: 9:00 AM - 5:00 PM</p>
                      <p>Sunday: 9:00 AM - 5:00 PM (No car viewings)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(400px 220px at 85% 0%, rgba(255,73,67,0.12), transparent 70%)' }}></div>
              <div className="relative">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Ready to Find Your Perfect Vehicle?</h3>
                <p className="mb-6 text-gray-300">
                  Our expert consultants are standing by to help you discover the luxury vehicle that matches your lifestyle and preferences.
                </p>
                <a 
                  href="tel:07735770031"
                  className="btn-glass-red inline-block text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Contact Us Now
                </a>
              </div>
            </div>
          </div>

          <div>
            <form className="glass rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Sell Your Car</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="glass-input w-full px-4 py-3 rounded-xl"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="glass-input w-full px-4 py-3 rounded-xl"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="glass-input w-full px-4 py-3 rounded-xl"
                    placeholder="07735770031"
                />
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Car Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Car Registration
                    </label>
                    <input
                      type="text"
                      className="glass-input w-full px-4 py-3 rounded-xl"
                      placeholder="AB12 CDE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mileage
                    </label>
                    <input
                      type="text"
                      className="glass-input w-full px-4 py-3 rounded-xl"
                      placeholder="50,000"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Make & Model
                  </label>
                  <input
                    type="text"
                    className="glass-input w-full px-4 py-3 rounded-xl"
                    placeholder="BMW 3 Series"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Car Info
                </label>
                <textarea
                  rows={4}
                  className="glass-input w-full px-4 py-3 rounded-xl resize-none"
                  placeholder="Tell us about your car's condition, service history, or any other relevant details..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-glass-red w-full text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;