import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* <Helmet>
        <title>Terms of Service - NutraGenius</title>
        <meta name="description" content="Read the Terms of Service for using the NutraGenius platform. Your agreement to these terms is required to use our services." />
      </Helmet> */}
      
      {/* <ThemeToggle /> */}

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => navigate('/')} 
            className="mb-8 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-left justify-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose dark:prose-invert max-w-none"
          >
            <h1>Terms of Service</h1>
            <p className="lead">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <br />
            <h2>1. Agreement to Terms</h2>
            <p>By accessing or using the NutraGenius platform, websites, or services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Services. This agreement is a legally binding contract between you and NutraGenius Inc. ("we," "us," or "our"), a company registered in Europe.</p>
            <br />
            <h2>2. IMPORTANT MEDICAL DISCLAIMER:</h2>
            <p><strong>OUR SERVICES DO NOT CONSTITUTE MEDICAL ADVICE.</strong></p>
            <p>NutraGenius provides informational, educational, and automated analysis content only. The Services, including all reports, insights, nutritional recommendations, nutraceutical suggestions, and supplement information, are not medical advice, nor are they a substitute for professional medical advice, diagnosis, or treatment from a qualified healthcare provider.</p>
            <p>Our platform is an automated system that analyzes data provided by you. It does not and cannot take into account your full medical history, allergies not listed, or potential drug-nutrient interactions beyond its programming. The recommendations generated are automated suggestions based on general scientific literature and the data you input. They do not constitute a medical prescription or treatment plan.</p>
            <p><strong>Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or before starting any new diet, supplement, nutraceutical, or exercise regimen.</strong> Never disregard professional medical advice or delay in seeking it because of something you have read or received from our Services. If you think you may have a medical emergency, call your doctor or your local emergency services (e.G., 112 in Europe, 911 in the US) immediately.</p>
            <br />
            <h2>3. Description of Service</h2>
            <p>NutraGenius is an integrated platform for automated nutritional, genetic, and metabolic analysis. We use data provided by you, including but not limited to health questionnaires, laboratory results, and genetic reports, to generate personalized insights and recommendations related to nutrition, supplements, and lifestyle. The Service is designed to assist you in your personal health and wellness journey and to provide a decision-support tool for qualified healthcare professionals.</p>
            <br />
            <h2>4. Eligibility and User Accounts</h2>
            <ul>
              <li><strong>Account Creation:</strong> You must be 18 years of age or older to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</li>
              <li><strong>Account Security:</strong> You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</li>
              <li><strong>Use by Healthcare Professionals:</strong> If you are a healthcare professional (e.g., doctor, nutritionist, dietitian) using the Services on behalf of a patient, you represent and warrant that you have obtained all necessary patient consent (including consent to our Privacy Policy) and that you are licensed and in good standing in your jurisdiction. You agree to use the Services as a decision-support tool only and to apply your own professional medical judgment in evaluating and applying any information provided by the Services.</li>
            </ul>
            <br />
            <h2>5. Billing, Payments, and Subscriptions</h2>
            <p>Some of our Services are offered for a fee. By purchasing a service, you agree to our payment terms.</p>
            <ul>
                <li><strong>Fees:</strong> You agree to pay all fees or charges to your account in accordance with the fees, charges, and billing terms in effect at the time a fee or charge is due and payable.</li>
                <li><strong>Payment:</strong> We use a third-party payment processor to handle all payments. You must provide our payment processor with valid payment information.</li>
                <li><strong>Subscriptions:</strong> If you purchase a subscription, it will automatically renew at the end of the subscription period, unless you cancel your subscription through your account settings before the end of the current period.</li>
                <li><strong>Refunds:</strong> All payments are generally non-refundable, except as required by law or as explicitly stated in our refund policy at the time of purchase.</li>
            </ul>
            <br />
            <h2>6. Intellectual Property Rights</h2>
            <p>The Services and their entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by NutraGenius Inc., its licensors, or other providers of such material and are protected by European and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
            <p>We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your personal, non-commercial use (or for your internal clinical use, if you are a healthcare professional). You may not reproduce, distribute, modify, or create derivative works of any part of the Service.</p>
            <br />
            <h2>7. User-Provided Content</h2>
            <p>By submitting your health, genetic, and personal data to the platform ("User Content"), you grant us a worldwide, non-exclusive, royalty-free, perpetual (for de-identified data) license to use, process, analyze, de-identify, and aggregate this data for the purpose of providing the Services to you and improving our Services and algorithms. We will handle your data in accordance with our Privacy Policy. You represent and warrant that you have the right to submit this information and that it is accurate.</p>
            <br />
            <h2>8. Prohibited Uses</h2>
            <p>You may not use the Service:</p>
            <ul>
                <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
                <li>To transmit any data or material that contains viruses, Trojan horses, worms, or other harmful computer code.</li>
                <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Services, the server on which the Services are stored, or any server, computer, or database connected to the Services.</li>
                <li>To reverse-engineer, decompile, or disassemble any part of the platform's software or proprietary algorithms.</li>
                <li>For any commercial purpose (e.g., reselling reports) without our express written consent.</li>
            </ul>
            <br />
            <h2>9. Termination</h2>
            <p>We may terminate or suspend your access to our Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Services will cease immediately. You may terminate your account at any time by contacting our support team. All provisions of the Terms which by their nature should survive termination shall survive, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
            <br />
            <h2>10. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless NutraGenius Inc. and its licensors, and their respective officers, directors, employees, contractors, and agents, from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Services, including, but not limited to, any use of the Service's content, reports, or recommendations other than as expressly authorized in these Terms or your use of any information obtained from the Services.</p>
            <br />
            <h2>11. Limitation of Liability</h2>
            <p>IN NO EVENT WILL NUTRAGENIUS, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICES, ANY CONTENT ON THE SERVICES, OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.</p>
            <p>OUR TOTAL LIABILITY TO YOU FOR ANY AND ALL CLAIMS ARISING FROM THE USE OF THE SERVICE IS LIMITED TO THE AMOUNT YOU PAID TO US FOR THE SERVICES IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
            <p>THE FOREGOING DOES NOT AFFECT ANY LIABILITY THAT CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.</p>
            <br />
            <h2>12. Governing Law and Dispute Resolution</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of Europe, namely in the country where this company is based, without regard to its conflict of law provisions.</p>
            <p>Any dispute, controversy, or claim arising out of or relating to these Terms or the breach, termination, or invalidity thereof, shall be settled by arbitration in the country where this company is based, in accordance with the rules of the Arbitration Center of the Chamber of Commerce and Industry. The language of the arbitration shall be in Portuguese and possibly in English if both parties agree. By agreeing to these Terms, you waive your right to a jury trial and to participate in a class-action lawsuit.</p>
            <br />
            <h2>13. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
            <br />
            <h2>14. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us at: <strong>
                        <Link to="/contact" className="text-primary hover:underline"               
                               onClick={() => {
                               window.scrollTo({ top: 0, behavior: "smooth" }); 
                             }}> Contact our Support
                       </Link> 
              
              </strong></p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;
