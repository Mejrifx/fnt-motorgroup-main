import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionItem } from './ui/Accordion';

const TermsAndConditions: React.FC = () => {
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
              Terms and Conditions
            </h1>
            <p className="text-lg text-gray-600">
              Clear and transparent terms for vehicle sales
            </p>
            <p className="text-sm text-gray-500 mt-2">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Information</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  These terms and conditions ("Terms") govern the sale of vehicles by FNT Motor Group ("we," "us," or "our"). 
                  Please read them carefully before making a purchase.
                </p>
                <p>
                  By proceeding with a purchase, viewing a vehicle, paying a deposit, or entering into any agreement with us, 
                  you agree to be bound by these Terms.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                  <p className="text-blue-900">
                    <strong>Your Statutory Rights:</strong> Nothing in these Terms affects your statutory rights under 
                    the Consumer Rights Act 2015, the Consumer Protection from Unfair Trading Regulations 2008, 
                    or any other applicable consumer protection legislation.
                  </p>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-6">
              
              <Accordion>
                <AccordionItem 
                  title="1. Definitions" 
                  defaultOpen={true}
                >
                  <p>In these Terms, the following definitions apply:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li><strong>"Vehicle"</strong> means any motor vehicle offered for sale by FNT Motor Group</li>
                    <li><strong>"Deposit"</strong> means any payment made to reserve a vehicle prior to full payment</li>
                    <li><strong>"You" or "Buyer"</strong> means the person purchasing or intending to purchase a vehicle</li>
                    <li><strong>"Contract"</strong> means the agreement formed when a deposit is paid or a vehicle is purchased</li>
                    <li><strong>"Finance"</strong> means any credit arrangement for the purchase of a vehicle</li>
                  </ul>
                </AccordionItem>

                <AccordionItem 
                  title="2. Contract Formation"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">When a contract is formed:</h4>
                  <p>
                    A legally binding contract is formed when:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>You pay a deposit to reserve a vehicle, and we confirm acceptance in writing (email or SMS); or</li>
                    <li>You pay the full purchase price and we confirm the sale; or</li>
                    <li>A finance agreement is approved and signed by both parties</li>
                  </ul>
                  
                  <p className="mt-4">
                    Until a contract is formed, we reserve the right to refuse any sale or withdraw any vehicle from sale.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="3. Deposits - Payment and Refund Policy"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Collection timeline:</h4>
                  <p>
                    From the time a deposit is paid, the vehicle must be collected within <strong>7 days</strong>. 
                    If you fail to collect the vehicle within 7 days, the deposit may be forfeited unless:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>You have arranged different circumstances with us in writing prior to paying the deposit; or</li>
                    <li>We have withdrawn the vehicle from sale and failed to notify you</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Deposits are NON-REFUNDABLE in the following circumstances:</h4>
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-3">
                    <ul className="list-disc pl-6 space-y-2 text-red-900">
                      <li>
                        <strong>Buyer changes their mind:</strong> If you decide not to proceed with the purchase for any reason, 
                        including finding another vehicle, financial difficulties, or simply changing your mind
                      </li>
                      <li>
                        <strong>Failure to collect within 7 days:</strong> If you do not collect the vehicle within 7 days 
                        and have not arranged alternative collection dates with us in writing
                      </li>
                      <li>
                        <strong>Finance declined:</strong> If your finance application is declined by the lender 
                        (unless we agreed in writing that the deposit was conditional on finance approval)
                      </li>
                    </ul>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Deposits are REFUNDABLE in the following circumstances:</h4>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-3">
                    <ul className="list-disc pl-6 space-y-2 text-green-900">
                      <li>
                        <strong>Vehicle is faulty or not as described:</strong> If the vehicle has defects that were not disclosed 
                        or the vehicle is materially different from the description or advertisement
                      </li>
                      <li>
                        <strong>We cancel the agreement:</strong> If we cancel the sale for any reason, 
                        you are entitled to a full refund of your deposit
                      </li>
                      <li>
                        <strong>We fail to provide the vehicle:</strong> If we are unable to deliver the vehicle 
                        or provide it in the agreed condition
                      </li>
                    </ul>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="4. Price and Payment"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Vehicle pricing:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The price of the vehicle is as stated on the invoice or quotation provided to you</li>
                    <li>Prices are subject to change until a deposit is paid or a contract is formed</li>
                    <li>Prices include VAT where applicable (most used vehicles are sold VAT-free under the VAT margin scheme)</li>
                    <li>Additional costs (e.g., delivery, number plates, first registration fee) will be clearly stated</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Payment methods:</h4>
                  <p>We accept payment by:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>Bank transfer (preferred method for large payments)</li>
                    <li>Debit card or credit card (subject to transaction limits)</li>
                    <li>Cash (up to £9,000 under UK Money Laundering Regulations)</li>
                    <li>Finance (subject to approval by our approved lenders)</li>
                  </ul>
                  
                  <p className="mt-4">
                    <strong>Payment must be made in full before the vehicle is released.</strong> We will not release the vehicle 
                    or provide the V5C registration document until full payment has been received and cleared.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="5. Vehicle Description and Accuracy"
                >
                  <p>
                    All vehicles are sold as described in the advertisement, invoice, or during the inspection/viewing. 
                    While we strive to provide accurate specifications, errors may occur.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Your responsibility to inspect:</h4>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-3">
                    <p className="text-yellow-900">
                      <strong>Important:</strong> It is your responsibility to inspect and verify the vehicle prior to purchase. 
                      We strongly recommend:
                    </p>
                    <ul className="list-disc pl-6 text-yellow-900 mt-2 space-y-1">
                      <li>Viewing the vehicle in person before purchase</li>
                      <li>Conducting a test drive (subject to valid insurance and driving license)</li>
                      <li>Requesting an independent inspection or vehicle history check</li>
                      <li>Verifying mileage, service history, and vehicle condition</li>
                    </ul>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Mileage and condition:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Mileage is stated to the best of our knowledge and is believed to be accurate</li>
                    <li>We cannot guarantee mileage unless explicitly warranted in writing</li>
                    <li>Used vehicles may have wear and tear commensurate with age and mileage</li>
                    <li>Any known defects or damage will be disclosed prior to sale</li>
                  </ul>
                </AccordionItem>

                <AccordionItem 
                  title="6. Part Exchange"
                >
                  <p>
                    If you are part-exchanging a vehicle as part of your purchase, the following conditions apply:
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Your obligations:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You must disclose any outstanding finance on the part-exchange vehicle</li>
                    <li>You must provide accurate information about the vehicle's condition, mileage, and service history</li>
                    <li>You must be the legal owner of the vehicle (or have authority to sell it)</li>
                    <li>You must provide all keys, service records, and the V5C registration document</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Our rights:</h4>
                  <p>
                    We reserve the right to adjust the agreed part-exchange value if:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>The vehicle is not as described or has undisclosed defects</li>
                    <li>Outstanding finance is discovered that was not disclosed</li>
                    <li>The vehicle fails an independent inspection</li>
                  </ul>
                  
                  <p className="mt-4">
                    If we adjust the part-exchange value and you do not agree to the new value, 
                    you have the right to withdraw from the sale and receive a full refund of any deposit paid.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="7. Vehicle Collection and Delivery"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Collection:</h4>
                  <p>
                    Vehicles must be collected within <strong>7 days</strong> of notification that the vehicle is ready for collection 
                    (or within the timeframe agreed in writing).
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>Failure to collect may result in storage charges of £25 per day after the 7-day period</li>
                    <li>If the vehicle is not collected within 30 days, we may cancel the sale and retain the deposit</li>
                    <li>You must provide proof of insurance and a valid driving license before taking possession</li>
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Delivery:</h4>
                  <p>
                    If you request delivery, the following applies:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>Delivery costs will be agreed in advance and added to the invoice</li>
                    <li>We will arrange delivery to your specified address within the UK mainland</li>
                    <li>You must inspect the vehicle upon delivery and report any issues immediately</li>
                    <li>Risk passes to you upon delivery</li>
                  </ul>
                </AccordionItem>

                <AccordionItem 
                  title="8. Warranty and After-Sales Support"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Standard warranty:</h4>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <p className="text-green-900">
                      <strong>All vehicles come with:</strong>
                    </p>
                    <ul className="list-disc pl-6 text-green-900 mt-2 space-y-1">
                      <li>6 months warranty (mechanical and electrical coverage)</li>
                      <li>6 months breakdown cover (nationwide roadside assistance and recovery)</li>
                    </ul>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Extended warranty options:</h4>
                  <p>
                    We offer optional extended warranty packages (Silver, Gold, and Platinum) for additional coverage. 
                    Details and pricing are available upon request.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Manufacturer warranty:</h4>
                  <p>
                    If the vehicle has remaining manufacturer's warranty, this will be disclosed and transferred to you. 
                    Manufacturer warranties are subject to the manufacturer's terms and conditions.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">What the warranty covers:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Mechanical failures (engine, gearbox, drivetrain components)</li>
                    <li>Electrical faults (excluding wear-and-tear items like bulbs and fuses)</li>
                    <li>Repairs carried out by approved garages within our network</li>
                  </ul>
                  
                  <p className="mt-4">
                    For full warranty terms and exclusions, please refer to the warranty provider's documentation.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="9. Consumer Rights Act 2015"
                >
                  <p>
                    Your statutory rights under the Consumer Rights Act 2015 are unaffected by these Terms.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Your rights under the Consumer Rights Act:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Right to reject (first 30 days):</strong> If the vehicle is faulty or not as described, 
                      you can reject it and receive a full refund within 30 days of purchase
                    </li>
                    <li>
                      <strong>Right to repair or replacement (30 days to 6 months):</strong> If a fault develops within 6 months, 
                      we will repair or replace the vehicle at no cost to you
                    </li>
                    <li>
                      <strong>Right to price reduction or refund (after 6 months):</strong> If a fault cannot be repaired, 
                      you may be entitled to a partial refund or price reduction
                    </li>
                  </ul>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                    <p className="text-blue-900">
                      <strong>Important:</strong> Under the Consumer Rights Act, goods must be:
                    </p>
                    <ul className="list-disc pl-6 text-blue-900 mt-2 space-y-1">
                      <li>Of satisfactory quality</li>
                      <li>Fit for purpose</li>
                      <li>As described</li>
                    </ul>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="10. Distance Selling and Cancellation Rights"
                >
                  <p>
                    If you purchased the vehicle online, over the phone, or without visiting our premises in person, 
                    you may have additional rights under the Consumer Contracts Regulations 2013.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">14-day cooling-off period:</h4>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <p className="text-green-900">
                      You have the right to cancel the purchase within <strong>14 days</strong> of receiving the vehicle, 
                      without giving a reason. To exercise this right, you must:
                    </p>
                    <ul className="list-disc pl-6 text-green-900 mt-2 space-y-1">
                      <li>Inform us in writing (email or letter) of your decision to cancel</li>
                      <li>Return the vehicle in the same condition it was delivered (reasonable wear and tear excepted)</li>
                      <li>Cover the cost of returning the vehicle to us</li>
                    </ul>
                  </div>
                  
                  <p className="mt-4">
                    If you cancel under distance selling rules, we will refund the full purchase price (excluding delivery costs) 
                    within 14 days of receiving the vehicle back.
                  </p>
                  
                  <p className="mt-4">
                    <strong>Note:</strong> The 14-day cooling-off period does not apply if you visited our premises and inspected 
                    the vehicle before purchase.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="11. Limitation of Liability"
                >
                  <p>
                    To the fullest extent permitted by law:
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>
                      We are not liable for any indirect, consequential, or special losses (e.g., loss of earnings, 
                      loss of business opportunity, or travel costs)
                    </li>
                    <li>
                      Our total liability under these Terms is limited to the purchase price of the vehicle
                    </li>
                    <li>
                      We are not liable for delays or failures caused by events beyond our reasonable control 
                      (e.g., strikes, natural disasters, pandemics)
                    </li>
                  </ul>
                  
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
                    <p className="text-red-900">
                      <strong>Important:</strong> Nothing in these Terms limits our liability for:
                    </p>
                    <ul className="list-disc pl-6 text-red-900 mt-2 space-y-1">
                      <li>Death or personal injury caused by our negligence</li>
                      <li>Fraud or fraudulent misrepresentation</li>
                      <li>Any liability that cannot be excluded by law</li>
                    </ul>
                  </div>
                </AccordionItem>

                <AccordionItem 
                  title="12. Complaints and Dispute Resolution"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">How to make a complaint:</h4>
                  <p>
                    If you are dissatisfied with any aspect of your purchase or our service, please contact us:
                  </p>
                  
                  <div className="bg-gray-100 p-4 rounded mt-4">
                    <p className="font-semibold text-gray-900">FNT Motor Group</p>
                    <p className="text-gray-700 mt-2">Email: fntgroupltd@gmail.com</p>
                    <p className="text-gray-700">Phone: 07735770031</p>
                    <p className="text-gray-700">Address: Unit 1, Clayton Court, 5 Welcomb Street, Manchester, M11 2NB</p>
                  </div>
                  
                  <p className="mt-4">
                    We will acknowledge your complaint within 3 working days and aim to resolve it within 14 days.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Alternative Dispute Resolution (ADR):</h4>
                  <p>
                    If we cannot resolve your complaint to your satisfaction, you may refer it to an alternative dispute resolution body:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>
                      <strong>The Motor Ombudsman:</strong> <a href="https://www.themotorombudsman.org" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">www.themotorombudsman.org</a>
                    </li>
                    <li>
                      <strong>Citizens Advice Consumer Service:</strong> <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="text-fnt-red underline hover:text-red-600">www.citizensadvice.org.uk</a>
                    </li>
                  </ul>
                </AccordionItem>

                <AccordionItem 
                  title="13. Governing Law and Jurisdiction"
                >
                  <p>
                    These Terms and any dispute arising out of or in connection with them (including non-contractual disputes) 
                    shall be governed by and construed in accordance with the law of England and Wales.
                  </p>
                  
                  <p className="mt-4">
                    The courts of England and Wales shall have exclusive jurisdiction to settle any dispute arising out of 
                    or in connection with these Terms.
                  </p>
                  
                  <p className="mt-4">
                    <strong>Note:</strong> If you are a consumer in Scotland or Northern Ireland, you may have additional 
                    rights under local consumer protection laws.
                  </p>
                </AccordionItem>

                <AccordionItem 
                  title="14. Changes to These Terms"
                >
                  <p>
                    We may update these Terms from time to time to reflect changes in our business practices or for legal reasons.
                  </p>
                  
                  <p className="mt-4">
                    Any changes will be posted on our website with an updated "Last Updated" date. 
                    The Terms in effect at the time of your purchase will apply to your transaction.
                  </p>
                  
                  <p className="mt-4">
                    We recommend reviewing these Terms each time you make a purchase.
                  </p>
                </AccordionItem>
              </Accordion>

            </div>

            {/* Contact Section */}
            <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions About These Terms?</h3>
              <p className="text-gray-700 mb-6">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="tel:07735770031"
                  className="inline-flex items-center justify-center px-6 py-3 bg-fnt-red text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                >
                  Call: 07735770031
                </a>
                <a 
                  href="mailto:fntgroupltd@gmail.com"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Email Us
                </a>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 bg-gray-100 border-l-4 border-gray-400 p-6">
              <p className="text-gray-800">
                <strong>Legal Compliance:</strong> These Terms comply with the Consumer Rights Act 2015, 
                the Consumer Contracts Regulations 2013, and the Consumer Protection from Unfair Trading Regulations 2008.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsAndConditions;
