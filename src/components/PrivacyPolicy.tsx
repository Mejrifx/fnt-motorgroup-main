import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionItem } from './ui/Accordion';

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

      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Privacy Notice
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Who are we? Data Controller and contact details</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  For the purposes of this Notice, the data controller is FNT Motor Group (trading as FNT Motor Group) 
                  and whose registered office address is at Unit 1, Clayton Court, 5 Welcomb Street, Manchester, M11 2NB.
                </p>
                <p>
                  FNT Motor Group is committed to protecting your privacy and ensuring that your personal data is handled 
                  in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, 
                  and the Privacy and Electronic Communications Regulations 2003 (PECR).
                </p>
                <p>
                  This Privacy Notice applies to all visitors to and users of our website at www.fntmotorgroup.com, 
                  anyone contacting us by phone, SMS, email, in letters and other correspondence, in person and via social media.
                </p>
                <div className="bg-gray-50 border-l-4 border-fnt-red p-4 mt-4">
                  <p className="font-semibold text-gray-900 mb-2">Contact our Data Protection team:</p>
                  <p className="text-gray-700">Email: fntgroupltd@gmail.com</p>
                  <p className="text-gray-700">Phone: 07735770031</p>
                  <p className="text-gray-700">Address: Unit 1, Clayton Court, 5 Welcomb Street, Manchester, M11 2NB</p>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-6">
              
              <Accordion>
                <AccordionItem 
                  title="Account Creation and Website Use" 
                  legalBasis="Contract, Legitimate Interest"
                  defaultOpen={true}
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Information we collect:</h4>
                  <p>
                    When you create an account or use our website, we collect your <strong>email address</strong>, 
                    chosen <strong>password</strong>, and (if you provide it) your <strong>full name</strong> and <strong>telephone number</strong>.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">How we use this information:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To create and manage your account</li>
                    <li>To send you service communications about your account</li>
                    <li>To process your enquiries and vehicle viewings</li>
                    <li>To provide customer support</li>
                  </ul>
                  
                  <p className="mt-4">
                    You can access your account at any time to update your details and change your marketing preferences.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="Vehicle Enquiries and Sales" 
                  legalBasis="Contract, Legitimate Interest, Legal Obligation"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Information we collect:</h4>
                  <p>
                    When you enquire about or purchase a vehicle, we collect your <strong>name</strong>, <strong>email address</strong>, 
                    <strong>telephone number</strong>, <strong>address</strong>, and details of the vehicle you're interested in.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">How we use this information:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To respond to your enquiries about vehicles</li>
                    <li>To arrange test drives and vehicle viewings</li>
                    <li>To process vehicle sales and complete necessary documentation</li>
                    <li>To provide after-sales support and warranty services</li>
                    <li>To comply with legal obligations (e.g., DVLA registration, finance checks)</li>
                  </ul>
                </AccordionItem>

                <AccordionItem 
                  title="Part Exchange and Vehicle Valuations" 
                  legalBasis="Contract, Legitimate Interest"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Information we collect:</h4>
                  <p>
                    When you request a part-exchange valuation, we collect your <strong>vehicle registration number (VRM)</strong>, 
                    <strong>mileage</strong>, <strong>condition details</strong>, and <strong>service history</strong>.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">How we use this information:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To provide an accurate valuation of your vehicle</li>
                    <li>To check for outstanding finance on the vehicle</li>
                    <li>To verify vehicle ownership and history</li>
                    <li>To process part-exchange transactions</li>
                  </ul>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
                    <p className="text-gray-800">
                      <strong>Important:</strong> We may share your VRM with finance providers to identify vehicles 
                      with existing finance agreements and prevent fraudulent sales.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Finance Applications" 
                  legalBasis="Contract, Legitimate Interest"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Information we collect:</h4>
                  <p>
                    When you apply for finance, we collect <strong>personal information</strong> (name, address, date of birth), 
                    <strong>employment details</strong>, <strong>income information</strong>, and <strong>credit history data</strong> 
                    (via third-party credit reference agencies).
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">How we use this information:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To submit your finance application to our approved lenders</li>
                    <li>To assess your creditworthiness and affordability</li>
                    <li>To provide you with suitable finance options</li>
                    <li>To comply with regulatory requirements (FCA regulations)</li>
                  </ul>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
                    <p className="text-gray-800">
                      <strong>Third-party processors:</strong> Finance applications are processed by our approved finance partners. 
                      They have their own privacy policies, which you should review when applying for finance.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Marketing Communications" 
                  legalBasis="Consent, Legitimate Interest"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">How we use your information for marketing:</h4>
                  <p>
                    With your consent, we may send you marketing communications about:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>New vehicles available for sale</li>
                    <li>Special offers and promotions</li>
                    <li>Finance deals and warranty packages</li>
                    <li>Service reminders and MOT notifications</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Your right to opt-out:</h4>
                  <p>
                    You can opt-out of marketing communications at any time by:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>Clicking the "unsubscribe" link in any marketing email</li>
                    <li>Updating your preferences in your account settings</li>
                    <li>Contacting us directly at fntgroupltd@gmail.com</li>
                  </ul>
                  
                  <p className="mt-4">
                    Even if you opt-out of marketing, we will still send you service communications (e.g., purchase confirmations, warranty notifications).
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="Cookies and Website Analytics" 
                  legalBasis="Consent, Legitimate Interest"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Information collected automatically:</h4>
                  <p>
                    When you visit our website, we automatically collect:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li><strong>Device information:</strong> IP address, browser type, device type, operating system</li>
                    <li><strong>Usage data:</strong> Pages visited, time spent on site, referring website</li>
                    <li><strong>Cookies:</strong> Small text files stored on your device (see our Cookie Policy for details)</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">How we use this information:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To improve website functionality and user experience</li>
                    <li>To analyze traffic and understand how visitors use our site</li>
                    <li>To detect and prevent fraud or security issues</li>
                    <li>To serve relevant advertisements (with your consent)</li>
                  </ul>
                  
                  <p className="mt-4">
                    For full details on cookies, please see our <button onClick={() => navigate('/cookie-policy')} className="text-fnt-red underline hover:text-red-600">Cookie Policy</button>.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="Disclosure of Your Information - Who We Share Data With" 
                  legalBasis="Contract, Legitimate Interest, Legal Obligation"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">We may share your personal data with:</h4>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <h5 className="font-semibold text-gray-800">Finance Providers</h5>
                      <p className="text-gray-700">
                        To process finance applications and credit checks. Finance providers have their own privacy policies.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">Warranty Providers</h5>
                      <p className="text-gray-700">
                        To arrange vehicle warranties and breakdown cover.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">DVLA and Government Agencies</h5>
                      <p className="text-gray-700">
                        To register vehicle ownership, conduct VRM lookups, and comply with legal obligations.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">Payment Processors</h5>
                      <p className="text-gray-700">
                        To process deposits, payments, and refunds securely.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">AutoTrader and Advertising Platforms</h5>
                      <p className="text-gray-700">
                        To list vehicles for sale and manage our online presence. Our vehicles are advertised on AutoTrader, 
                        and we synchronize stock data with their platform in accordance with their privacy policy.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">Service Providers</h5>
                      <p className="text-gray-700">
                        Website hosting (Netlify), database services (Supabase), email services, and analytics tools.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">Legal Authorities</h5>
                      <p className="text-gray-700">
                        When required by law, to prevent fraud, or to protect our rights and the rights of consumers 
                        under the Consumer Protection from Unfair Trading Regulations 2008 and Consumer Rights Act 2015.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-6">
                    <p className="text-gray-800">
                      <strong>Important:</strong> We do not sell your personal data to third parties.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Where We Store Your Personal Data - International Transfers" 
                  legalBasis="Contract, Legitimate Interest"
                >
                  <p>
                    FNT Motor Group takes all reasonable steps to ensure that your data is treated securely and in accordance with this Notice.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Data storage locations:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All information you provide is stored securely within the UK or European Economic Area (EEA)</li>
                    <li>Some service providers (e.g., payment processors) may transfer data outside the UK/EEA with appropriate safeguards</li>
                    <li>Where data is transferred internationally, we ensure equivalent protection through contractual protections or adequacy decisions</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Security measures:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>SSL/TLS encryption for data transmission</li>
                    <li>Secure, encrypted database storage</li>
                    <li>Access controls and staff training</li>
                    <li>Regular security audits and penetration testing</li>
                  </ul>
                </AccordionItem>

                <AccordionItem 
                  title="How Long Do We Keep Your Data?" 
                  legalBasis="Legal Obligation, Legitimate Interest"
                >
                  <p>
                    We retain your personal data only as long as necessary to fulfill the purposes outlined in this Notice, 
                    or as required by law.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Retention periods:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account data:</strong> Retained while your account is active, plus 3 years after closure</li>
                    <li><strong>Purchase records:</strong> 6 years (for accounting and tax purposes, as required by HMRC)</li>
                    <li><strong>Finance applications:</strong> 6 years (FCA regulatory requirement)</li>
                    <li><strong>Marketing consents:</strong> Until you withdraw consent, or 3 years of inactivity</li>
                    <li><strong>CCTV footage:</strong> 30 days (security purposes)</li>
                  </ul>
                  
                  <p className="mt-4">
                    After the retention period expires, we securely delete or anonymize your data. In some circumstances, 
                    we may anonymize your data for research or statistical purposes, in which case it can no longer be associated with you.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="Your Rights as a Data Subject Under UK GDPR" 
                  legalBasis="Legal Obligation"
                >
                  <p>
                    Under UK GDPR and the Data Protection Act 2018, you have the following rights:
                  </p>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <h5 className="font-semibold text-gray-800">1. Right of Access</h5>
                      <p className="text-gray-700">
                        You can request a copy of the personal data we hold about you (commonly known as a "Subject Access Request" or SAR).
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">2. Right to Rectification</h5>
                      <p className="text-gray-700">
                        You can correct inaccurate or incomplete data we hold about you.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">3. Right to Erasure (Right to be Forgotten)</h5>
                      <p className="text-gray-700">
                        In certain circumstances, you can request deletion of your data (e.g., if data is no longer necessary, 
                        or if you withdraw consent where consent was the basis for processing).
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">4. Right to Restrict Processing</h5>
                      <p className="text-gray-700">
                        You can ask us to limit how we use your data (e.g., while we verify data accuracy).
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">5. Right to Data Portability</h5>
                      <p className="text-gray-700">
                        You can receive your data in a structured, commonly used, machine-readable format and transfer it to another data controller.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">6. Right to Object</h5>
                      <p className="text-gray-700">
                        You can object to processing based on legitimate interests, direct marketing, or automated decision-making/profiling.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-800">7. Right to Withdraw Consent</h5>
                      <p className="text-gray-700">
                        Where processing is based on consent (e.g., marketing emails), you can withdraw consent at any time.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-6">
                    <p className="text-gray-800 mb-2">
                      <strong>To exercise any of these rights, please contact us:</strong>
                    </p>
                    <p className="text-gray-800">Email: fntgroupltd@gmail.com</p>
                    <p className="text-gray-800">Phone: 07735770031</p>
                    <p className="text-gray-800 mt-3">
                      We will respond to your request within 30 days. Some rights may not apply in certain circumstances 
                      (e.g., we cannot erase data if we have a legal obligation to retain it).
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Complaints and Supervisory Authority" 
                  legalBasis="Legal Obligation"
                >
                  <p>
                    If you wish to make a complaint about how your personal data is being processed by FNT Motor Group, 
                    please contact us first at fntgroupltd@gmail.com or by phone at 07735770031.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Right to lodge a complaint with the ICO:</h4>
                  <p>
                    You have the right to lodge a complaint with the UK supervisory authority, 
                    the <strong>Information Commissioner's Office (ICO)</strong>:
                  </p>
                  
                  <div className="bg-gray-100 p-4 rounded mt-4">
                    <p className="font-semibold text-gray-900">Information Commissioner's Office (ICO)</p>
                    <p className="text-gray-700 mt-2">Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">www.ico.org.uk</a></p>
                    <p className="text-gray-700">Helpline: 0303 123 1113</p>
                    <p className="text-gray-700">Address: Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Third-Party Links and Social Media" 
                  legalBasis="N/A"
                >
                  <p>
                    Our website may contain links to third-party websites, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>AutoTrader (where our vehicles are advertised)</li>
                    <li>Finance providers (for online applications)</li>
                    <li>Social media platforms (Instagram, TikTok, Facebook)</li>
                    <li>Payment processors</li>
                  </ul>
                  
                  <p className="mt-4">
                    We are not responsible for the privacy practices of these third-party websites. 
                    Please review their privacy policies separately before providing any personal data.
                  </p>
                  
                  <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
                    <p className="text-gray-800">
                      <strong>Important:</strong> When you click on third-party links or use social media features (e.g., "Share" buttons), 
                      those third parties may collect data about you in accordance with their privacy policies.
                    </p>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="Changes to This Privacy Notice" 
                  legalBasis="N/A"
                >
                  <p>
                    We may update this Privacy Notice from time to time to reflect changes in our practices, 
                    legal requirements, or for other operational reasons.
                  </p>
                  
                  <p className="mt-4">
                    Any changes will be posted on this page with an updated "Last Updated" date at the top. 
                    We encourage you to review this Notice periodically to stay informed about how we protect your data.
                  </p>
                  
                  <p className="mt-4">
                    For significant changes (e.g., new purposes for processing or changes to your rights), 
                    we will notify you by email or via a prominent notice on our website.
                  </p>
                </AccordionItem>
              </Accordion>

            </div>

            {/* Footer Note */}
            <div className="mt-12 bg-gray-100 border-l-4 border-gray-400 p-6">
              <p className="text-gray-800">
                <strong>Data Protection Legislation:</strong> This Notice complies with the UK General Data Protection Regulation (UK GDPR), 
                the Data Protection Act 2018, and the Privacy and Electronic Communications Regulations 2003 (PECR).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
