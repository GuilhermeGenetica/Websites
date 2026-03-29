import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const PolicyPage = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* <Helmet>
        <title>Privacy Policy - NutraGenius</title>
        <meta name="description" content="Understand how NutraGenius collects, uses, and protects your personal, health, and genetic data. Our commitment to your privacy is our priority." />
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
            <h1>Privacy Policy</h1>
            <p className="lead">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <br />
            <h2>1. Introduction & Scope</h2>
            <p>Welcome to NutraGenius ("we," "us," or "our"). Our goal is to be a global leader in personalized nutritional, nutrigenetic, and pharmaconutrigenomic analysis, advice and consulting. Our mission requires the highest standard of trust. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, services, and websites ("Services").</p>
            <p>This policy applies to all users worldwide, including individual consumers and healthcare professionals. Please read this policy carefully. By using our Services, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this privacy policy, please do not access the Services.</p>
            <br />
            <h2>2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, when you participate in activities on the platform, or otherwise when you contact us.</p>
            <br />
            <h4>A. Personal Information Provided by You:</h4>
            <ul>
              <li><strong>Identity Data:</strong> Includes your full name, email address, password, date of birth, and location.</li>
              <li><strong>Contact Data:</strong> Includes your email address, telephone number, and professional credentials (for healthcare providers).</li>
              <li><strong>Health and Genetic Data (Sensitive Data):</strong> All data you enter into our questionnaire, including but not limited to demographic information, lifestyle habits (diet, exercise, sleep), medical history, symptoms, laboratory test results, and any genetic information from uploaded reports. This is considered sensitive data and is treated with the highest level of security and confidentiality.</li>
              <li><strong>Payment Data:</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is stored by our payment processor and you should review its privacy policies.</li>
            </ul>
            <br />
            <h4>B. Information Collected Automatically:</h4>
            <ul>
              <li><strong>Log and Usage Data:</strong> We may automatically collect information when you access and use our Services. This data may include your IP address, browser type, operating system, referring URLs, device information, and pages visited. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics purposes.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</li>
            </ul>
            <br />
            <h2>3. How We Use Your Information</h2>
            <p>We use your personal information for a variety of business purposes, based on our legitimate interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent. The purposes include:</p>
            <ul>
              <li><strong>To Provide and Personalize Our Services:</strong> We use your Health and Genetic Data to power our core service: generating automated, personalized nutritional reports, insights, and nutraceutical recommendations.</li>
              <li><strong>To Facilitate Account Creation and Management:</strong> We use your Identity and Contact data to create and manage your account, and to communicate with you about it.</li>
              <li><strong>To Process Payments:</strong> To fulfill transactions for our premium services.</li>
              <li><strong>To Send Administrative and Service-Related Information:</strong> We may use your personal information to send you product, service, and new feature information and/or information about changes to our terms, conditions, and policies.</li>
              <li><strong>To Protect Our Services:</strong> We may use your information as part of our efforts to keep our platform safe and secure (for example, for fraud monitoring and prevention).</li>
              <li><strong>To Respond to User Inquiries and Offer Support:</strong> We may use your information to respond to your inquiries and solve any potential issues you might have with the use of our Services.</li>
              <li><strong>For Research and Development (with Your Consent):</strong> We may use <strong>de-identified and aggregated data</strong> (information that does not personally identify you) for internal R&D to improve and optimize our platform, algorithms, and service offerings. We may also ask for your <strong>explicit, opt-in consent</strong> to use your data for scientific research, which you may refuse or withdraw at any time without penalty.</li>
            </ul>
            <br />
            <h2>4. Legal Basis for Processing (GDPR)</h2>
            <p>If you are a resident of the European Economic Area (EEA), our legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Data we collect and the specific context in
which we collect it:</p>
            <ul>
                <li><strong>Contract:</strong> To perform our contractual obligations to you (e.g., to provide the Services you paid for).</li>
                <li><strong>Consent:</strong> You have given us explicit consent to do so (e.g., for processing sensitive health data, for R&D, or for marketing).</li>
                <li><strong>Legitimate Interests:</strong> The processing is in our legitimate interests and not overridden by your rights (e.g., for fraud prevention, network security).</li>
                <li><strong>Legal Obligation:</strong> To comply with the law (e.g., financial record-keeping).</li>
            </ul>
            <br />
            <h2>5. Will Your Information Be Shared With Anyone?</h2>
            <p><strong>We do not sell, rent, or lease your personal data.</strong> We only share information in the following limited circumstances:</p>
            <ul>
              <li><strong>With Your Consent:</strong> We may share your information for a specific purpose if you have given us your explicit consent to do so (e.g., sharing your report with a healthcare provider you designate).</li>
              <li><strong>To Comply with Laws:</strong> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process, such as in response to a court order or a subpoena (including in response to public authorities to meet national security or law enforcement requirements).</li>
              <li><strong>Vendors, Consultants, and Other Third-Party Service Providers:</strong> We may share your data with third-party vendors, service providers (e.g., cloud hosting, payment processing), contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. These parties are contractually obligated to keep your information confidential and secure and are prohibited from using it for any other purpose.</li>
               <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company. We will notify you before your Personal Data is transferred and becomes subject to a different Privacy Policy.</li>
            </ul>
            <br />
            <h2>6. How We Keep Your Information Safe</h2>
            <p>We have implemented appropriate and robust technical and organizational security measures designed to protect the security of any personal information we process. These measures include end-to-end encryption, encryption-at-rest (AES-256), strict access controls, and regular security audits. These are detailed on our "Trust, Security & Compliance" page. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure. While we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk.</p>
            <br />
            <h2>7. International Data Transfers</h2>
            <p>Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. As a global company headquartered in Europe, we transfer data, including Personal Data, to our server data centers and process it there. We will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy and no transfer of your Personal Data will take place to an organization or a country unless there are adequate controls in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.</p>
            <br />
            <h2>8. Your Privacy Rights</h2>
            <p>You have certain rights regarding your personal information, subject to local data protection laws. These may include the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request access to and obtain a copy of your personal information.</li>
              <li><strong>Rectify:</strong> Request correction of any inaccurate or incomplete personal information.</li>
              <li><strong>Erasure:</strong> Request the deletion of your personal information (the "right to be forgotten").</li>
              <li><strong>Restrict Processing:</strong> Request to restrict the processing of your personal information.</li>
              <li><strong>Data Portability:</strong> Request to receive your data in a machine-readable format.</li>
              <li><strong>Object to Processing:</strong> Object to our processing of your personal data based on legitimate interests.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw your consent at any time where we relied on your consent to process your information.</li>
            </ul>
            <p>You can exercise these rights at any time through your account settings or by contacting our Data Protection Officer at: 
                       <Link to="/contact" className="text-primary hover:underline"               
                               onClick={() => {
                                window.scrollTo({ top: 0, behavior: "smooth" }); 
                             }}>contact support
                       </Link> .
              
              </p>
            <br />
            <h2>9. Specific Jurisdictions</h2>
            <h4>A. For Users in the United States (HIPAA)</h4>
            <p>While NutraGenius operates as an informational and educational tool for consumers, we align our security practices with the standards set by the Health Insurance Portability and Accountability Act (HIPAA). If you are a healthcare professional ("Covered Entity") using our Services to process patient data, we provide a Business Associate Agreement (BAA) to ensure compliance.</p>
            <h4>B. For Users in California (CCPA/CPRA)</h4>
            <p>California residents have specific rights regarding their personal information. We do not sell your personal information. You have the right to request disclosure of the categories and specific pieces of personal information we have collected, as well as the right to request deletion.</p>
            <br />
            <h2>10. Data Retention</h2>
            <p>We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to provide the Services, comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies. De-identified and aggregated data may be kept indefinitely for research and service improvement purposes.</p>
            <br />
            <h2>11. Policy for Children</h2>
            <p>We do not knowingly solicit data from or market to children under the age of 18. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records.</p>
            <br />
            <h2>12. Changes to This Privacy Policy</h2>
            <p>We may update this privacy policy from time to time to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. The updated version will be indicated by a "Last Updated" date and will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.</p>
            <br />
            <h2>13. Contact Us</h2>
            <p>If you have any questions or concerns about this policy or our data practices, please contact us. For formal inquiries related to your data rights, please contact our Data Protection Officer:</p>
            <p>
              
              <strong> Email: 
                
                        <Link to="/contact" className="text-primary hover:underline"               
                               onClick={() => {
                               window.scrollTo({ top: 0, behavior: "smooth" }); 
                             }}> Contact our Support
                       </Link>  
                
              </strong>
            </p>

            <p><strong>Address: NutraGenius Inc.</strong></p>
            <br />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PolicyPage;
