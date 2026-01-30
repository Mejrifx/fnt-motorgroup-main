import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Eye, Lock, UserCheck, Database, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

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
              <Shield className="w-12 h-12 text-fnt-red" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Privacy <span className="text-fnt-red">Policy</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your personal information.
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Introduction */}
            <div className="bg-gray-50 rounded-xl p-8 mb-12">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-fnt-red mr-3" />
                <h2 className="text-2xl font-bold text-fnt-black">Our Commitment to Your Privacy</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                FNT Motor Group ("we," "us," or "our") is committed to protecting your privacy and ensuring 
                that your personal data is handled in accordance with the UK General Data Protection Regulation (GDPR) 
                and the Data Protection Act 2018.
              </p>
              <p className="text-gray-600 leading-relaxed">
                This Privacy Policy explains how we collect, use, store, and protect your personal information 
                when you visit our website or use our services.
              </p>
            </div>

            {/* Privacy Sections */}
            <div className="space-y-12">
              
              {/* 1. Information We Collect */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">1. Information We Collect</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Personal Information You Provide:</h4>
                    <ul className="space-y-2 ml-6">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Name, email address, phone number</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Vehicle registration and details (for trade-ins or inquiries)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Financial information (for finance applications, processed by third-party providers)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Any other information you provide through forms, emails, or phone calls</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Information Collected Automatically:</h4>
                    <ul className="space-y-2 ml-6">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>IP address, browser type, device information</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Pages visited, time spent on site, referring website</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Cookies and similar tracking technologies (see our Cookie Policy)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2. How We Use Your Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">2. How We Use Your Information</h3>
                </div>
                
                <p className="text-gray-600 mb-4">We use your personal information for the following purposes:</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>To process vehicle sales, trade-ins, and finance applications</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>To respond to your inquiries and provide customer service</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>To send you marketing communications (with your consent)</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>To improve our website and services</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>To comply with legal obligations and prevent fraud</span>
                  </li>
                </ul>
              </div>

              {/* 3. Legal Basis for Processing */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">3. Legal Basis for Processing (GDPR)</h3>
                </div>
                
                <p className="text-gray-600 mb-4">We process your personal data under the following legal bases:</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Consent:</strong> When you provide explicit consent (e.g., marketing emails)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Contract:</strong> To fulfill a contract with you (e.g., vehicle sale)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Legitimate Interests:</strong> To improve our services and prevent fraud
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Legal Obligation:</strong> To comply with UK laws and regulations
                    </div>
                  </li>
                </ul>
              </div>

              {/* 4. Sharing Your Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">4. Sharing Your Information</h3>
                </div>
                
                <p className="text-gray-600 mb-4">We may share your personal data with:</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Finance Providers:</strong> For processing finance applications
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Warranty Providers:</strong> For vehicle warranty services
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Service Providers:</strong> Payment processors, email services, website hosting
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Legal Authorities:</strong> When required by law or to protect our rights
                    </div>
                  </li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                  <p className="text-blue-800">
                    We do not sell your personal data to third parties.
                  </p>
                </div>
              </div>

              {/* 5. Data Security */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">5. Data Security</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  We implement appropriate technical and organizational measures to protect your personal data, including:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>SSL encryption for data transmission</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Secure storage of personal information</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Access controls and staff training</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Regular security audits and updates</span>
                  </li>
                </ul>
              </div>

              {/* 6. Data Retention */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">6. Data Retention</h3>
                </div>
                
                <p className="text-gray-600">
                  We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy, 
                  or as required by law (e.g., financial records for 6 years). After this period, we securely delete or 
                  anonymize your information.
                </p>
              </div>

              {/* 7. Your Rights */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">7. Your Rights Under GDPR</h3>
                </div>
                
                <p className="text-gray-600 mb-4">You have the following rights regarding your personal data:</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Right of Access:</strong> Request a copy of your personal data
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Right to Erasure:</strong> Request deletion of your data (under certain conditions)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Right to Restrict Processing:</strong> Limit how we use your data
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Right to Data Portability:</strong> Receive your data in a structured format
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Right to Object:</strong> Object to processing based on legitimate interests
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Right to Withdraw Consent:</strong> Opt-out of marketing communications at any time
                    </div>
                  </li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
                  <p className="text-green-800">
                    To exercise any of these rights, please contact us using the details below.
                  </p>
                </div>
              </div>

              {/* 8. Third-Party Links */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">8. Third-Party Links</h3>
                </div>
                
                <p className="text-gray-600">
                  Our website may contain links to third-party websites (e.g., AutoTrader, social media). 
                  We are not responsible for their privacy practices. Please review their privacy policies separately.
                </p>
              </div>

              {/* 9. Changes to This Policy */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">9. Changes to This Privacy Policy</h3>
                </div>
                
                <p className="text-gray-600">
                  We may update this Privacy Policy from time to time. Any changes will be posted on this page 
                  with an updated "Last Modified" date. We encourage you to review this policy periodically.
                </p>
              </div>

              {/* 10. Contact Us */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">10. Contact Us</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-fnt-red mr-3" />
                    <span className="text-gray-700">Email: fntgroupltd@gmail.com</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-fnt-red mr-3 flex items-center justify-center">📞</div>
                    <span className="text-gray-700">Phone: 07735770031</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 text-fnt-red mr-3 flex items-center justify-center mt-1">📍</div>
                    <span className="text-gray-700">Address: Unit 1, Clayton Court, 5 Welcomb Street, Manchester M11 2NB</span>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                  <p className="text-yellow-800">
                    <strong>Right to Complain:</strong> You have the right to lodge a complaint with the 
                    Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline">ico.org.uk</a>.
                  </p>
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

export default PrivacyPolicy;
