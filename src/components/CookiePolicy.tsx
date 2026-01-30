import React, { useEffect } from 'react';
import { ArrowLeft, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy: React.FC = () => {
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
              <Cookie className="w-12 h-12 text-fnt-red" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Cookie <span className="text-fnt-red">Policy</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            How we use cookies and similar technologies on our website
          </p>
        </div>
      </section>

      {/* Cookie Content */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Introduction */}
            <div className="bg-gray-50 rounded-xl p-8 mb-12">
              <div className="flex items-center mb-4">
                <Cookie className="w-8 h-8 text-fnt-red mr-3" />
                <h2 className="text-2xl font-bold text-fnt-black">What Are Cookies?</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies are small text files that are stored on your device when you visit a website. 
                They help us provide you with a better browsing experience by remembering your preferences 
                and improving our website's functionality.
              </p>
              <p className="text-gray-600 leading-relaxed">
                This Cookie Policy explains what cookies we use, why we use them, and how you can manage 
                your cookie preferences.
              </p>
            </div>

            {/* Cookie Sections */}
            <div className="space-y-12">
              
              {/* 1. Types of Cookies We Use */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">1. Types of Cookies We Use</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Essential Cookies (Strictly Necessary)</h4>
                    <p className="text-blue-700 mb-2">
                      These cookies are required for the website to function properly. They enable core functionality 
                      such as security, authentication, and network management.
                    </p>
                    <p className="text-blue-600 text-sm">
                      <strong>Examples:</strong> Session management, security tokens, website functionality
                    </p>
                    <p className="text-blue-600 text-sm mt-2">
                      <strong>Can be disabled?</strong> No – these are necessary for the website to work.
                    </p>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Performance Cookies (Analytics)</h4>
                    <p className="text-green-700 mb-2">
                      These cookies help us understand how visitors interact with our website by collecting 
                      anonymous information about page views, traffic sources, and time spent on pages.
                    </p>
                    <p className="text-green-600 text-sm">
                      <strong>Examples:</strong> Google Analytics, page view tracking, bounce rate analysis
                    </p>
                    <p className="text-green-600 text-sm mt-2">
                      <strong>Can be disabled?</strong> Yes – you can opt-out of analytics cookies.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Functional Cookies</h4>
                    <p className="text-yellow-700 mb-2">
                      These cookies remember your preferences and choices to provide a more personalized experience 
                      (e.g., language preferences, filters, search history).
                    </p>
                    <p className="text-yellow-600 text-sm">
                      <strong>Examples:</strong> Saved filters, preferred view settings, remembered choices
                    </p>
                    <p className="text-yellow-600 text-sm mt-2">
                      <strong>Can be disabled?</strong> Yes – but some features may not work as expected.
                    </p>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Marketing Cookies (Advertising)</h4>
                    <p className="text-purple-700 mb-2">
                      These cookies track your browsing activity to deliver personalized advertisements on our website 
                      and other platforms. They may be set by third-party advertising networks.
                    </p>
                    <p className="text-purple-600 text-sm">
                      <strong>Examples:</strong> Facebook Pixel, Google Ads, retargeting cookies
                    </p>
                    <p className="text-purple-600 text-sm mt-2">
                      <strong>Can be disabled?</strong> Yes – you can opt-out of marketing cookies.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Third-Party Cookies */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">2. Third-Party Cookies</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  We may use third-party services that set cookies on your device. These services include:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Google Analytics:</strong> For website traffic analysis
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Social Media Platforms:</strong> For social sharing and embedded content (e.g., Instagram, TikTok)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>AutoTrader:</strong> For vehicle listings and stock synchronization
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Payment Processors:</strong> For secure payment processing
                    </div>
                  </li>
                </ul>
                <div className="bg-gray-100 p-4 mt-4 rounded">
                  <p className="text-gray-700 text-sm">
                    <strong>Note:</strong> These third-party services have their own privacy and cookie policies, 
                    which we encourage you to review.
                  </p>
                </div>
              </div>

              {/* 3. How to Manage Cookies */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">3. How to Manage Cookies</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  You have several options to control and manage cookies:
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Browser Settings</h4>
                    <p className="text-gray-600 mb-2">
                      Most browsers allow you to:
                    </p>
                    <ul className="space-y-2 ml-6">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>View cookies stored on your device</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Delete existing cookies</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Block all cookies or only third-party cookies</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span>Be notified before cookies are set</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <p className="text-yellow-800">
                      <strong>Important:</strong> Blocking all cookies may affect your browsing experience 
                      and prevent certain features from working correctly.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">How to Manage Cookies by Browser:</h4>
                    <ul className="space-y-2 ml-6">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other site data
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Opt-Out Tools:</h4>
                    <ul className="space-y-2 ml-6">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Google Analytics Opt-Out:</strong>{' '}
                          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline">
                            Browser Add-On
                          </a>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-fnt-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <strong>Network Advertising Initiative:</strong>{' '}
                          <a href="http://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline">
                            Opt-Out Tool
                          </a>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4. Session vs Persistent Cookies */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">4. Session vs Persistent Cookies</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Session Cookies</h4>
                    <p className="text-gray-600">
                      These are temporary cookies that are deleted when you close your browser. 
                      They help us remember your actions during a single browsing session.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Persistent Cookies</h4>
                    <p className="text-gray-600">
                      These cookies remain on your device for a set period or until you delete them manually. 
                      They remember your preferences across multiple visits to our website.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Do Not Track */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">5. Do Not Track (DNT)</h3>
                </div>
                
                <p className="text-gray-600">
                  Some browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not 
                  want to be tracked. Currently, there is no universal standard for how to respond to DNT signals. 
                  We do not currently respond to DNT signals, but you can manage your cookie preferences through 
                  your browser settings or the methods described above.
                </p>
              </div>

              {/* 6. Changes to This Policy */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">6. Changes to This Cookie Policy</h3>
                </div>
                
                <p className="text-gray-600">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or 
                  for legal reasons. Any updates will be posted on this page with a revised "Last Updated" date.
                </p>
              </div>

              {/* 7. Contact Us */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-fnt-black">7. Contact Us</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  If you have any questions about our use of cookies, please contact us:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-fnt-red mr-3 flex items-center justify-center">📧</div>
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

export default CookiePolicy;
