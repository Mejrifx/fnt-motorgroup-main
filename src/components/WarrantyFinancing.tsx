import React, { useEffect } from 'react';
import { ShieldCheck, CreditCard, Phone, EnvelopeSimple, MapPin, CheckCircle, Star, Clock, ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const WarrantyFinancing: React.FC = () => {
  const navigate = useNavigate();

  usePageMeta({
    title: 'Warranty & Car Finance in Manchester',
    description: 'Every car from FNT Motor Group comes with 6 months warranty and breakdown cover. Flexible finance options available on all vehicles in Manchester.',
    path: '/warranty-financing',
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen glass-scene grain">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="btn-glass flex items-center space-x-2 text-white hover:text-fnt-red px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Home</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(800px 400px at 50% -10%, rgba(255,73,67,0.10), transparent 65%)' }}></div>
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="section-title text-4xl md:text-6xl text-white mb-6">
            <span className="text-white">Warranty & </span><span className="text-fnt-red">Financing</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive protection and flexible financing options for your peace of mind
          </p>
        </div>
      </section>

      {/* Warranty Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="glass-subtle p-4 rounded-full">
                  <ShieldCheck className="w-12 h-12 text-emerald-400" />
                </div>
              </div>
              <h2 className="section-title text-3xl md:text-4xl text-white mb-4">
                Vehicle Warranty Protection
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Drive with confidence knowing your vehicle is protected with our comprehensive warranty coverage
              </p>
            </div>

            {/* Standard Warranty */}
            <div className="glass rounded-3xl p-8 mb-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(500px 250px at 15% 0%, rgba(52,211,153,0.10), transparent 70%)' }}></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-8 h-8 mr-3 text-emerald-400" />
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Standard Warranty Included</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-subtle rounded-2xl p-5">
                    <h4 className="text-xl font-semibold mb-2">6 Months Warranty</h4>
                    <p className="text-gray-400">Comprehensive mechanical and electrical coverage on all vehicles</p>
                  </div>
                  <div className="glass-subtle rounded-2xl p-5">
                    <h4 className="text-xl font-semibold mb-2">6 Months Breakdown Cover</h4>
                    <p className="text-gray-400">Nationwide roadside assistance and recovery service</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Options */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white mb-8 text-center" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                Upgrade Your Coverage
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Silver */}
                <div className="glass-card p-6 text-center">
                  <div className="glass-subtle p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Silver Cover</h4>
                  <p className="text-gray-400 mb-4">Enhanced protection with extended coverage</p>
                  <p className="text-sm text-fnt-red font-semibold">Contact us for details</p>
                </div>

                {/* Gold */}
                <div className="glass-card p-6 text-center relative" style={{ borderColor: 'rgba(251, 191, 36, 0.35)' }}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white px-4 py-1 rounded-full text-sm font-bold" style={{ background: 'linear-gradient(180deg, #fbbf24, #d97706)', boxShadow: '0 8px 20px -8px rgba(251,191,36,0.5)' }}>
                    Popular
                  </div>
                  <div className="glass-subtle p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-8 h-8 text-amber-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Gold Cover</h4>
                  <p className="text-gray-400 mb-4">Premium protection with comprehensive benefits</p>
                  <p className="text-sm text-fnt-red font-semibold">Contact us for details</p>
                </div>

                {/* Platinum */}
                <div className="glass-card p-6 text-center">
                  <div className="glass-subtle p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-8 h-8 text-slate-200" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Platinum Cover</h4>
                  <p className="text-gray-400 mb-4">Ultimate protection with premium benefits</p>
                  <p className="text-sm text-fnt-red font-semibold">Contact us for details</p>
                </div>
              </div>
            </div>

            {/* Warranty Details */}
            <div className="glass rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Warranty Coverage Details</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-200 mb-3">Coverage Periods Available:</h4>
                  <ul className="space-y-2 text-gray-400">
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
                  <h4 className="font-semibold text-gray-200 mb-3">What's Included:</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                      Mechanical & electrical repairs
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                      Breakdown recovery service
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="glass-subtle p-4 rounded-full">
                  <CreditCard className="w-12 h-12 text-fnt-red" />
                </div>
              </div>
              <h2 className="section-title text-3xl md:text-4xl text-white mb-4">
                Flexible Financing Options
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Make your dream car affordable with our range of financing solutions
              </p>
            </div>

            {/* Financing Benefits */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="glass rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Why Choose Our Financing?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-200">Multiple Lenders</h4>
                      <p className="text-gray-400">We work with various finance companies to find the best rates</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-200">Competitive Rates</h4>
                      <p className="text-gray-400">Access to exclusive rates through our lender partnerships</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-200">Flexible Terms</h4>
                      <p className="text-gray-400">Tailored payment plans to suit your budget</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-200">Quick Approval</h4>
                      <p className="text-gray-400">Fast processing for immediate decisions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Finance Options Available</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-200">Personal Contract Purchase (PCP)</h4>
                    <p className="text-gray-400">Lower monthly payments with optional final payment</p>
                  </div>
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-200">Hire Purchase (HP)</h4>
                    <p className="text-gray-400">Own the vehicle at the end of the agreement</p>
                  </div>
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-200">Personal Loan</h4>
                    <p className="text-gray-400">Borrow the full amount and own immediately</p>
                  </div>
                  <div className="border-l-4 border-fnt-red pl-4">
                    <h4 className="font-semibold text-gray-200">Lease Purchase</h4>
                    <p className="text-gray-400">Business-friendly financing options</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferred Lender */}
            <div className="glass rounded-3xl p-8 text-white mb-12 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(255,73,67,0.10), transparent 70%)' }}></div>
              <div className="text-center relative">
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Have a Preferred Finance Company?</h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  We're happy to work with your preferred finance provider. Simply let us know during your application, and we'll coordinate with them directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                    <span>We work with all major lenders</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                    <span>Seamless application process</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="section-title text-3xl md:text-4xl text-white mb-6">
              Get Your Quote Today
            </h2>
            <p className="text-lg text-gray-400 mb-12">
              Contact us for personalized warranty and financing information tailored to your needs
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="glass-card p-6 text-center">
                <div className="glass-subtle p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-fnt-red" />
                </div>
                <h3 className="font-bold text-white mb-2">Call Us</h3>
                <a href="tel:07735770031" className="text-fnt-red hover:text-red-400 font-semibold">
                  07735770031
                </a>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="glass-subtle p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <EnvelopeSimple className="w-8 h-8 text-fnt-red" />
                </div>
                <h3 className="font-bold text-white mb-2">Email Us</h3>
                <a href="mailto:fntgroupltd@gmail.com" className="text-fnt-red hover:text-red-400 font-semibold break-all">
                  fntgroupltd@gmail.com
                </a>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="glass-subtle p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-fnt-red" />
                </div>
                <h3 className="font-bold text-white mb-2">Visit Us</h3>
                <p className="text-gray-400">Unit 1, Clayton Court, 5 Welcomb Street<br />Manchester M11 2NB</p>
              </div>
            </div>

            <div className="glass rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Important Information</h3>
              <div className="text-left space-y-3 text-gray-400">
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
