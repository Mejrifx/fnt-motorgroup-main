import React, { useEffect } from 'react';
import { ArrowLeft, FileText, Shield, Clock, CreditCard, Car, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 bg-white/90 backdrop-blur-xl text-fnt-black hover:text-fnt-red transition-colors duration-300 px-4 py-2 rounded-lg shadow-lg border border-gray-200/50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Home</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-fnt-black via-gray-800 to-fnt-black py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-fnt-red/10 p-4 rounded-full">
              <FileText className="w-12 h-12 text-fnt-red" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Terms & <span className="text-fnt-red">Conditions</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Clear and transparent terms for your peace of mind
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Introduction */}
            <div className="bg-gray-50 rounded-xl p-8 mb-12">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-fnt-red mr-3" />
                <h2 className="text-2xl font-bold text-fnt-black">Important Information</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                These terms and conditions govern the sale of vehicles by FNT Motor Group. 
                Please read them carefully before making a purchase. By proceeding with a purchase, 
                you agree to be bound by these terms.
              </p>
            </div>

            {/* Terms Sections */}
            <div className="space-y-12">
              
              {/* 1. Deposits */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">1. Deposits</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Collection Timeline</h4>
                    <p className="text-blue-700">
                      From the time of deposit being paid, the vehicle has to be collected within 7 days. 
                      Otherwise, the deposit may be forfeited unless the seller arranges different circumstances 
                      agreed prior to paying the deposit.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      Deposits are NON-REFUNDABLE in the following conditions:
                    </h4>
                    <ul className="space-y-3 ml-6">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Buyer changes their mind:</strong> If the buyer decides not to go through with the purchase due to a change of mind for any reason.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Vehicle has been withdrawn from sale:</strong> If the dealership has removed the vehicle from sale and buyer does not collect the vehicle within 7 days.
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      Deposits are REFUNDABLE in the following conditions:
                    </h4>
                    <ul className="space-y-3 ml-6">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Vehicle is faulty or not as described:</strong> If the vehicle has defects or is not as described in the advertisement or agreement, the buyer may be entitled to a refund of the deposit.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Seller cancels the agreement:</strong> If the seller cancels the sale, the buyer may be entitled to a refund of the deposit, potentially with additional compensation.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2. Vehicle Description */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">2. Vehicle Description</h3>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-800">
                    All vehicles are sold as described. While we strive to provide accurate specifications, 
                    errors may occur. It is your responsibility to inspect and verify the vehicle prior to purchase.
                  </p>
                </div>
              </div>

              {/* 3. Price and Payment */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">3. Price and Payment</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>The price of the vehicle is as stated on the invoice.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Payment must be made in full before the vehicle is released.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>We accept payment by bank transfer, debit/credit card, cash, or finance (subject to approval).</span>
                  </li>
                </ul>
              </div>

              {/* 4. Deposit and Cancellation */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">4. Deposit and Cancellation</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>A deposit is required to secure the vehicle.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Deposits are non-refundable unless we fail to fulfil the contract.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>If you cancel the purchase, we reserve the right to retain the deposit as compensation.</span>
                  </li>
                </ul>
              </div>

              {/* 5. Part Exchange */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">5. Part Exchange</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>If you are part-exchanging a vehicle, you must disclose any outstanding finance and provide accurate information about its condition.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>We reserve the right to adjust the agreed part-exchange value if the vehicle is not as described.</span>
                  </li>
                </ul>
              </div>

              {/* 6. Vehicle Collection */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">6. Vehicle Collection</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Vehicles must be collected within 7 days of notification of availability.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Failure to collect may result in storage charges or cancellation of the sale.</span>
                  </li>
                </ul>
              </div>

              {/* 7. Warranty */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">7. Warranty</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Vehicles may come with a warranty – details will be provided in the sale agreement.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Used vehicles are sold with the benefit of any remaining manufacturer's warranty or a dealership warranty where stated.</span>
                  </li>
                </ul>
              </div>

              {/* 8. Consumer Rights */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">8. Consumer Rights</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Your statutory rights under the Consumer Rights Act 2015 are unaffected by these terms.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>If the vehicle is faulty, you may have the right to a repair, replacement, or refund.</span>
                  </li>
                </ul>
              </div>

              {/* 9. Distance Selling */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">9. Distance Selling (if applicable)</h3>
                </div>
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <p className="text-green-800">
                    If you purchased the vehicle online or over the phone without visiting the dealership, 
                    you may have the right to cancel within 14 days of delivery. You must inform us in writing 
                    and return the vehicle in the same condition.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-fnt-black to-gray-800 rounded-xl p-8 text-white mt-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Questions About These Terms?</h3>
                <p className="text-gray-300 mb-6">
                  If you have any questions about these terms and conditions, please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="tel:07735770031"
                    className="flex items-center justify-center space-x-2 bg-fnt-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    <span>Call: 07735770031</span>
                  </a>
                  <a 
                    href="mailto:fntgroupltd@gmail.com"
                    className="flex items-center justify-center space-x-2 bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    <span>Email Us</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Last updated: {new Date().toLocaleDateString('en-GB', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsAndConditions;
