import React from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="py-20" style={{ backgroundColor: '#171819' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Visit Our Showroom
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Come see our cars in person at our Manchester showroom, or get in touch with our friendly team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <div className="bg-gray-50 rounded-3xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-fnt-black mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-fnt-red mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-fnt-black mb-1">Location</h4>
                    <p className="text-gray-600">
                      Redgate Lane, Manchester M12 4RX<br />
                      United Kingdom
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-fnt-red mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-fnt-black mb-1">Phone</h4>
                    <a href="tel:07735770031" className="text-gray-600 hover:text-fnt-red transition-colors duration-300">07735770031</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-fnt-red mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-fnt-black mb-1">Email</h4>
                    <a href="mailto:fntgroupltd@gmail.com" className="text-gray-600 hover:text-fnt-red transition-colors duration-300">fntgroupltd@gmail.com</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-fnt-red mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-fnt-black mb-1">Hours</h4>
                    <div className="text-gray-600 text-sm space-y-1">
                      <p>Monday - Friday: 9:00 AM - 8:00 PM</p>
                      <p>Saturday: 9:00 AM - 6:00 PM</p>
                      <p>Sunday: 11:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-xl font-bold mb-4">Ready to Find Your Perfect Vehicle?</h3>
              <p className="mb-6 opacity-90">
                Our expert consultants are standing by to help you discover the luxury vehicle that matches your lifestyle and preferences.
              </p>
              <a 
                href="tel:07735770031"
                className="inline-block bg-fnt-red hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Contact Us Now
              </a>
            </div>
          </div>

          <div>
            <form className="bg-gray-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-fnt-black mb-6">Sell Your Car</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                    placeholder="07735770031"
                />
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-fnt-black mb-4">Car Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Car Registration
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                      placeholder="AB12 CDE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mileage
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                      placeholder="50,000"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make & Model
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all duration-300"
                    placeholder="BMW 3 Series"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Car Info
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                  placeholder="Tell us about your car's condition, service history, or any other relevant details..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-fnt-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
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