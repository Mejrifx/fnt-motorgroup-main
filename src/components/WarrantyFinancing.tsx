import React from 'react';
import { Shield, CreditCard, Phone, Mail, MapPin, CheckCircle, Star, Clock } from 'lucide-react';

const WarrantyFinancing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-fnt-black via-gray-800 to-fnt-black py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="text-white">Warranty & </span><span className="text-fnt-red">Financing</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive protection and flexible financing options for your peace of mind
          </p>
        </div>
      </section>

      {/* Warranty Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="bg-fnt-red/10 p-4 rounded-full">
                  <Shield className="w-12 h-12 text-fnt-red" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-fnt-black mb-4">
                Vehicle Warranty Protection
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Drive with confidence knowing your vehicle is protected with our comprehensive warranty coverage
              </p>
            </div>

            {/* Standard Warranty */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 mb-12 text-white">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-8 h-8 mr-3" />
                <h3 className="text-2xl font-bold">Standard Warranty Included</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xl font-semibold mb-2">6 Months Warranty</h4>
                  <p className="text-green-100">Comprehensive mechanical and electrical coverage on all vehicles</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">6 Months Breakdown Cover</h4>
                  <p className="text-green-100">Nationwide roadside assistance and recovery service</p>
                </div>
              </div>
            </div>

            {/* Upgrade Options */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-fnt-black mb-8 text-center">
                Upgrade Your Coverage
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Silver */}
                <div className="bg-gray-100 rounded-xl p-6 text-center border-2 border-gray-200">
                  <div className="bg-gray-400 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Silver Cover</h4>
                  <p className="text-gray-600 mb-4">Enhanced protection with extended coverage</p>
                  <p className="text-sm text-fnt-red font-semibold">Contact us for details</p>
                </div>

                {/* Gold */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center border-2 border-yellow-300 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Popular
                  </div>
                  <div className="bg-yellow-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Gold Cover</h4>
                  <p className="text-gray-600 mb-4">Premium protection with comprehensive benefits</p>
                  <p className="text-sm text-fnt-red font-semibold">Contact us for details</p>
                </div>

                {/* Platinum */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border-2 border-gray-300">
                  <div className="bg-gray-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Platinum Cover</h4>
                  <p className="text-gray-600 mb-4">Ultimate protection with premium benefits</p>
                  <p className="text-sm text-fnt-red font-semibold">Contact us for details</p>
                </div>
              </div>
            </div>

            {/* Warranty Details */}
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-fnt-black mb-6">Warranty Coverage Details</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Coverage Periods Available:</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-fnt-red" />
                      3 months to 36 months
                    </li>
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-fnt-red" />
                      Flexible upgrade options
                    </li>
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-fnt-red" />
                      Nationwide coverage
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">What's Included:</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Mechanical & electrical repairs
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Breakdown recovery service
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Approved repair network
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="bg-fnt-red/10 p-4 rounded-full">
                  <CreditCard className="w-12 h-12 text-fnt-red" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-fnt-black mb-4">
                Flexible Financing Options
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Make your dream car affordable with our range of financing solutions
              </p>
            </div>

            {/* Financing Benefits */}
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-fnt-black mb-6">Why Choose Our Financing?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-700">Multiple Lenders</h4>
                      <p className="text-gray-600">We work with various finance companies to find the best rates</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-700">Competitive Rates</h4>
                      <p className="text-gray-600">Access to exclusive rates through our lender partnerships</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-700">Flexible Terms</h4>
                      <p className="text-gray-600">Tailored payment plans to suit your budget</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-700">Quick Approval</h4>
                      <p className="text-gray-600">Fast processing for immediate decisions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-fnt-black mb-6">Finance Options Available</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-700">Personal Contract Purchase (PCP)</h4>
                    <p className="text-gray-600">Lower monthly payments with optional final payment</p>
                  </div>
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-700">Hire Purchase (HP)</h4>
                    <p className="text-gray-600">Own the vehicle at the end of the agreement</p>
                  </div>
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-700">Personal Loan</h4>
                    <p className="text-gray-600">Borrow the full amount and own immediately</p>
                  </div>
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-700">Lease Purchase</h4>
                    <p className="text-gray-600">Business-friendly financing options</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferred Lender */}
            <div className="bg-gradient-to-r from-fnt-black to-gray-800 rounded-xl p-8 text-white mb-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Have a Preferred Finance Company?</h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  We're happy to work with your preferred finance provider. Simply let us know during your application, and we'll coordinate with them directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    <span>We work with all major lenders</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    <span>Seamless application process</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-fnt-black mb-6">
              Get Your Quote Today
            </h2>
            <p className="text-lg text-gray-600 mb-12">
              Contact us for personalized warranty and financing information tailored to your needs
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="bg-fnt-red/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-fnt-red" />
                </div>
                <h3 className="font-bold text-gray-700 mb-2">Call Us</h3>
                <a href="tel:07735770031" className="text-fnt-red hover:text-red-600 font-semibold">
                  07735770031
                </a>
              </div>

              <div className="text-center">
                <div className="bg-fnt-red/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-fnt-red" />
                </div>
                <h3 className="font-bold text-gray-700 mb-2">Email Us</h3>
                <a href="mailto:info@fntmotorgroup.com" className="text-fnt-red hover:text-red-600 font-semibold">
                  info@fntmotorgroup.com
                </a>
              </div>

              <div className="text-center">
                <div className="bg-fnt-red/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-fnt-red" />
                </div>
                <h3 className="font-bold text-gray-700 mb-2">Visit Us</h3>
                <p className="text-gray-600">Manchester M12 4RX</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-fnt-black mb-4">Important Information</h3>
              <div className="text-left space-y-3 text-gray-600">
                <p>• All warranty and financing options are subject to terms and conditions</p>
                <p>• Finance applications are subject to credit checks and approval</p>
                <p>• Warranty coverage may vary depending on vehicle age and mileage</p>
                <p>• Contact us for detailed pricing and coverage information</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WarrantyFinancing;
