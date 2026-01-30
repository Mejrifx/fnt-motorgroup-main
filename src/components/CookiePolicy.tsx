import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionItem } from './ui/Accordion';

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

      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-GB', { 
                day: 'numeric',
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Introduction */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What are cookies?</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. 
                  They are widely used to make websites work more efficiently, provide a better user experience, and provide information to website owners.
                </p>
                <p>
                  This Cookie Policy explains what cookies we use on www.fntmotorgroup.com, why we use them, and how you can manage your cookie preferences. 
                  This Policy complies with the Privacy and Electronic Communications Regulations 2003 (PECR) and UK GDPR.
                </p>
                <p>
                  For information on how we use your personal data more generally, please see our <button onClick={() => navigate('/privacy-policy')} className="text-fnt-red underline hover:text-red-600">Privacy Notice</button>.
                </p>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-6">
              
              <Accordion>
                <AccordionItem 
                  title="Essential Cookies (Strictly Necessary Cookies)" 
                  legalBasis="Legitimate Interest (no consent required under PECR)"
                  defaultOpen={true}
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Purpose:</h4>
                  <p>
                    These cookies are essential for the website to function properly. They enable core functionality such as security, 
                    authentication, and navigation. Without these cookies, services you have requested cannot be provided.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Examples of essential cookies we use:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Session management:</strong> To keep you logged in as you navigate the site</li>
                    <li><strong>Security tokens:</strong> To protect against cross-site request forgery (CSRF) attacks</li>
                    <li><strong>Load balancing:</strong> To distribute traffic across our servers</li>
                    <li><strong>Password gate:</strong> To remember that you've entered the development access password</li>
                  </ul>
                  
                  <div className="bg-gray-100 p-4 rounded mt-4">
                    <p className="text-gray-800">
                      <strong>Can you disable these cookies?</strong> No. These cookies are strictly necessary for the website to function. 
                      If you disable them, you will not be able to use our website.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Performance Cookies (Analytics Cookies)" 
                  legalBasis="Consent (required under PECR)"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Purpose:</h4>
                  <p>
                    These cookies collect anonymous information about how visitors use our website, such as which pages are visited most often, 
                    how long visitors stay on pages, and any error messages displayed. This helps us improve the website's performance and user experience.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Third-party analytics services we may use:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Google Analytics:</strong> Tracks page views, bounce rates, traffic sources, and user behavior
                      <br />
                      <span className="text-sm text-gray-600">
                        Data collected: IP address (anonymized), device type, browser, pages visited, time on site
                      </span>
                      <br />
                      <span className="text-sm text-gray-600">
                        Opt-out: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Google Analytics Opt-Out Browser Add-On</a>
                      </span>
                    </li>
                  </ul>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
                    <p className="text-gray-800">
                      <strong>Can you disable these cookies?</strong> Yes. You can manage your analytics cookie preferences through your browser settings 
                      or by using the opt-out tools provided by the third-party services.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Functional Cookies (Preference Cookies)" 
                  legalBasis="Consent (required under PECR)"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Purpose:</h4>
                  <p>
                    These cookies remember your preferences and choices to provide a more personalized experience. 
                    They allow the website to remember information that changes the way the website behaves or looks based on your choices.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Examples of functional cookies we may use:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Vehicle search filters:</strong> To remember your preferred makes, models, price ranges, and mileage filters</li>
                    <li><strong>Saved vehicles:</strong> To remember vehicles you've saved or marked as favorites</li>
                    <li><strong>Language preferences:</strong> To remember your preferred language (if applicable)</li>
                    <li><strong>Display preferences:</strong> To remember your preferred view (grid vs. list) for vehicle listings</li>
                  </ul>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
                    <p className="text-gray-800">
                      <strong>Can you disable these cookies?</strong> Yes. However, if you disable these cookies, 
                      some features may not work as expected, and you may need to re-enter your preferences each time you visit.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Marketing Cookies (Advertising and Targeting Cookies)" 
                  legalBasis="Consent (required under PECR)"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Purpose:</h4>
                  <p>
                    These cookies track your browsing activity across websites to deliver personalized advertisements. 
                    They are often set by third-party advertising networks and may be used to build a profile of your interests 
                    and show you relevant ads on other websites.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Third-party advertising services we may use:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Facebook Pixel / Meta Pixel:</strong> Tracks conversions, optimizes ads, and builds audiences for retargeting
                      <br />
                      <span className="text-sm text-gray-600">
                        Privacy Policy: <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Meta Privacy Policy</a>
                      </span>
                    </li>
                    <li>
                      <strong>Google Ads / Google Tag Manager:</strong> Delivers personalized ads based on your interests and previous interactions
                      <br />
                      <span className="text-sm text-gray-600">
                        Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Google Privacy Policy</a>
                      </span>
                    </li>
                    <li>
                      <strong>TikTok Pixel:</strong> Tracks conversions and enables retargeting on TikTok
                      <br />
                      <span className="text-sm text-gray-600">
                        Privacy Policy: <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">TikTok Privacy Policy</a>
                      </span>
                    </li>
                  </ul>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
                    <p className="text-gray-800">
                      <strong>Can you disable these cookies?</strong> Yes. You can opt-out of personalized advertising through:
                    </p>
                    <ul className="list-disc pl-6 text-gray-800 mt-2">
                      <li><a href="http://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="underline hover:text-fnt-red">Your Online Choices (EU)</a></li>
                      <li><a href="http://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="underline hover:text-fnt-red">Network Advertising Initiative Opt-Out</a></li>
                      <li>Your browser settings (see "How to Manage Cookies" below)</li>
                    </ul>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Third-Party Cookies - Social Media and Embedded Content" 
                  legalBasis="Consent (required under PECR)"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Purpose:</h4>
                  <p>
                    When you interact with social media features on our website (e.g., "Share" buttons, embedded Instagram posts), 
                    social media platforms may set cookies on your device.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Third-party social media platforms we use:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Instagram:</strong> For embedded vehicle photos and social media links
                      <br />
                      <span className="text-sm text-gray-600">
                        Privacy Policy: <a href="https://help.instagram.com/519522125107875" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Instagram Privacy Policy</a>
                      </span>
                    </li>
                    <li>
                      <strong>TikTok:</strong> For embedded videos and social media links
                      <br />
                      <span className="text-sm text-gray-600">
                        Privacy Policy: <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">TikTok Privacy Policy</a>
                      </span>
                    </li>
                    <li>
                      <strong>Facebook:</strong> For social sharing features
                      <br />
                      <span className="text-sm text-gray-600">
                        Privacy Policy: <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Facebook Privacy Policy</a>
                      </span>
                    </li>
                  </ul>
                  
                  <div className="bg-gray-100 p-4 rounded mt-4">
                    <p className="text-gray-800">
                      <strong>Important:</strong> We do not control these third-party cookies. Please review the privacy policies 
                      of these platforms to understand how they use cookies and personal data.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="AutoTrader Integration Cookies" 
                  legalBasis="Legitimate Interest"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Purpose:</h4>
                  <p>
                    We advertise our vehicles on AutoTrader and synchronize our stock data with their platform. 
                    When visitors view our vehicles on AutoTrader and click through to our website, AutoTrader may set cookies 
                    to track conversions and referrals.
                  </p>
                  
                  <p className="mt-4">
                    <strong>Data shared with AutoTrader:</strong> Vehicle listings, images, prices, specifications, and stock availability.
                  </p>
                  
                  <p className="mt-4">
                    For more information on AutoTrader's use of cookies and personal data, please see their <a href="https://www.autotrader.co.uk/privacy-notice" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Privacy Notice</a> and <a href="https://www.autotrader.co.uk/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Cookie Policy</a>.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="How to Manage Cookies - Browser Settings" 
                  legalBasis="N/A"
                >
                  <p>
                    Most web browsers allow you to control cookies through their settings. You can:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>View which cookies are stored on your device</li>
                    <li>Delete existing cookies</li>
                    <li>Block all cookies or only third-party cookies</li>
                    <li>Be notified before cookies are set</li>
                    <li>Clear cookies when you close your browser</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">How to manage cookies by browser:</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <strong className="text-gray-900">Google Chrome:</strong>
                      <p className="text-gray-700 text-sm mt-1">
                        Settings → Privacy and security → Cookies and other site data
                        <br />
                        <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Chrome Cookie Settings Help</a>
                      </p>
                    </div>
                    
                    <div>
                      <strong className="text-gray-900">Mozilla Firefox:</strong>
                      <p className="text-gray-700 text-sm mt-1">
                        Settings → Privacy & Security → Cookies and Site Data
                        <br />
                        <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Firefox Cookie Settings Help</a>
                      </p>
                    </div>
                    
                    <div>
                      <strong className="text-gray-900">Safari (macOS):</strong>
                      <p className="text-gray-700 text-sm mt-1">
                        Preferences → Privacy → Manage Website Data
                        <br />
                        <a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Safari Cookie Settings Help</a>
                      </p>
                    </div>
                    
                    <div>
                      <strong className="text-gray-900">Microsoft Edge:</strong>
                      <p className="text-gray-700 text-sm mt-1">
                        Settings → Cookies and site permissions → Manage and delete cookies and site data
                        <br />
                        <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">Edge Cookie Settings Help</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-6">
                    <p className="text-gray-800">
                      <strong>Warning:</strong> Blocking all cookies may prevent certain features of our website from working properly. 
                      You may not be able to save preferences, log in, or use certain interactive features.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Session Cookies vs. Persistent Cookies" 
                  legalBasis="N/A"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Session Cookies:</h4>
                  <p>
                    These are temporary cookies that are deleted when you close your browser. They help us remember your actions 
                    during a single browsing session (e.g., items in your basket, pages you've visited).
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Persistent Cookies:</h4>
                  <p>
                    These cookies remain on your device for a set period (defined by each cookie) or until you manually delete them. 
                    They remember your preferences across multiple visits (e.g., login details, saved searches, language preferences).
                  </p>
                  
                  <p className="mt-4">
                    We use both session and persistent cookies to provide the best user experience.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="Do Not Track (DNT) Signals" 
                  legalBasis="N/A"
                >
                  <p>
                    Some web browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not want your online activity tracked.
                  </p>
                  
                  <p className="mt-4">
                    Currently, there is no universal standard for how websites should respond to DNT signals. 
                    As a result, we do not currently respond to DNT signals from browsers.
                  </p>
                  
                  <p className="mt-4">
                    However, you can still manage your cookie preferences and opt-out of tracking through:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>Your browser settings (see "How to Manage Cookies" above)</li>
                    <li>Third-party opt-out tools (e.g., Google Analytics Opt-Out, Network Advertising Initiative)</li>
                    <li>Our cookie consent banner (when implemented)</li>
                  </ul>
                </AccordionItem>

                <AccordionItem 
                  title="Changes to This Cookie Policy" 
                  legalBasis="N/A"
                >
                  <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices, 
                    the cookies we use, or for legal or regulatory reasons.
                  </p>
                  
                  <p className="mt-4">
                    Any changes will be posted on this page with an updated "Last Updated" date at the top. 
                    We encourage you to review this Policy periodically.
                  </p>
                  
                  <p className="mt-4">
                    If we make significant changes (e.g., introducing new categories of cookies or third-party services), 
                    we will notify you via email or a prominent notice on our website and, where required, seek your consent.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="Contact Us - Questions About Cookies" 
                  legalBasis="N/A"
                >
                  <p>
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                  </p>
                  
                  <div className="bg-gray-100 p-4 rounded mt-4">
                    <p className="font-semibold text-gray-900 mb-2">FNT Motor Group</p>
                    <p className="text-gray-700">Email: fntgroupltd@gmail.com</p>
                    <p className="text-gray-700">Phone: 07735770031</p>
                    <p className="text-gray-700">Address: Unit 1, Clayton Court, 5 Welcomb Street, Manchester, M11 2NB</p>
                  </div>
                  
                  <p className="mt-4">
                    For information on how we use your personal data more generally, please see our <button onClick={() => navigate('/privacy-policy')} className="text-fnt-red underline hover:text-red-600">Privacy Notice</button>.
                  </p>
                </AccordionItem>
              </Accordion>

            </div>

            {/* Footer Note */}
            <div className="mt-12 bg-gray-100 border-l-4 border-gray-400 p-6">
              <p className="text-gray-800">
                <strong>Legal Compliance:</strong> This Cookie Policy complies with the Privacy and Electronic Communications Regulations 2003 (PECR), 
                the UK General Data Protection Regulation (UK GDPR), and the Data Protection Act 2018.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicy;
