import React from 'react';
import { Helmet } from 'react-helmet'; 
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ArrowLeft, ShieldCheck, Lock, DatabaseZap, FileLock2, Globe, Scale, BookCheck, ShieldAlert, LineChart, Users, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button'; 
import ThemeToggle from '@/components/ThemeToggle'; 

const CertificationsPage = () => {
  const navigate = useNavigate();

  return (
    <>

      <Helmet>
        <title>Trust, Security & Compliance - NutraGenius</title>
        <meta name="description" content="Learn about NutraGenius's commitment to data security, global privacy compliance (GDPR, HIPAA, LGPD), and scientific integrity." />
      </Helmet>
      
      <div className="min-h-screen bg-background py-12 px-4">

        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="max-w-3xl mx-auto">

          <Button 
            variant="outline"
            onClick={() => navigate('/')} 
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose dark:prose-invert max-w-none"
          >
            <h1>Trust, Security & Compliance</h1>
            <p className="lead">As the global leader in personalized health, our commitment to data security, privacy, scientific integrity, and ethical standards is the bedrock of our platform. We operate with the highest standards of trust expected of a public-facing, global entity operating in the medical and financial arenas.</p>
            <br/>
            <h2>1. Data Security & Infrastructure</h2>
            <p>We employ a multi-layered, state-of-the-art security strategy to protect your sensitive health and genetic information at every stage. Our platform is built on secure, modern cloud infrastructure that provides robust, redundant protection against unauthorized access.</p>
            
             <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
              <DatabaseZap className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="mt-0">End-to-End Encryption</h3>
                <p>All data transmitted between your device and our servers is encrypted using Transport Layer Security (TLS) 1.3, the latest industry standard. This ensures that your information is unreadable to any third party during transit.</p>
              </div>
            </div>

             <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
              <FileLock2 className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="mt-0">Encryption at Rest</h3>
                <p>Your data, including profile information, questionnaire answers, and uploaded reports, is encrypted using the AES-256 standard before being stored in our databases. This means your data remains protected and unreadable even in the highly unlikely event of a physical server breach.</p>
              </div>
            </div>

            <ul>
              <li><strong>Secure Cloud Infrastructure:</strong> Our services are hosted on leading cloud platforms (e.g., AWS, Google Cloud, Oracle, Hostinger...) that comply with major international security standards, including SOC 2, ISO 27001, and PCI DSS.</li>
              <li><strong>Regular Security Audits:</strong> We conduct regular internal and third-party penetration tests and vulnerability scans to proactively identify and address potential security risks.</li>
               <li><strong>Access Control:</strong> We enforce a strict principle of least privilege. Access to sensitive user data is tightly controlled, logged, and monitored, limited only to essential personnel for operational purposes.</li>
            </ul>
            <br/>
            <h2>2. Global Privacy & Data Compliance</h2>
            <p>NutraGenius is designed with a "privacy-by-design" philosophy and is fully compliant with major global privacy regulations. We are committed to upholding your right to privacy and data ownership.</p>
            <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
              <ShieldCheck className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="mt-0">GDPR (European Union)</h3>
                <p>As a European-based company, we are fully compliant with the General Data Protection Regulation. This ensures all users have clear rights to data access, portability, rectification, and erasure ("right to be forgotten"), which can be exercised through your account or by contacting our Data Protection Officer (DPO). We operate on a clear legal basis for all data processing, centered on user consent and contract fulfillment.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
              <ShieldAlert className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="mt-0">HIPAA (United States)</h3>
                <p>We implement security principles and safeguards aligned with the Health Insurance Portability and Accountability Act (HIPAA) to protect all Protected Health Information (PHI). For healthcare professionals ("Covered Entities") using our platform in a clinical setting, we provide executable Business Associate Agreements (BAAs) and maintain strict PHI de-identification protocols to ensure full compliance.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
              <Globe className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="mt-0">Global Regulatory Monitoring</h3>
                <p>Our dedicated compliance team actively monitors and ensures adherence to emerging and established data privacy laws worldwide, including Brazil (LGPD), Canada (PIPEDA), California (CCPA/CPRA), and others across our global footprint.</p>
              </div>
            </div>
            <br/>
          
          {/* Esta é a versão correta e completa da Seção 3 */}
          <h2>3. Clinical & Scientific Integrity</h2>
          <p>Our credibility as a global leader rests on the quality of our science. We are committed to providing recommendations that are evidence-based, clinically relevant, and scientifically sound.</p>
           <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
             <BookCheck className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
             <div>
               <h3 className="mt-0">Evidence-Based Engine</h3>
               <p>Our automated recommendation engine is not a "black box." Its logic is built upon a vast, curated library of peer-reviewed scientific literature, international medical guidelines, and established biochemical pathways. All recommendations are traceable to scientific evidence.</p>
             </div>
           </div>
           <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
             <Users className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
             <div>
               <h3 className="mt-0">Scientific Advisory Board</h3>
               <p>NutraGenius is guided by an independent Scientific Advisory Board composed of world-renowned experts in genomics, nutrition, pharmacology, and medicine. They review our methodologies and ensure our platform remains at the forefront of scientific discovery.</p>
             </div>
           </div>
           <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
             <ClipboardCheck className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
             <div>
               <h3 className="mt-0">Validated Pipelines & Reporting Standards</h3>
               <p>To ensure the highest standard for our genetic and omics pipelines, we strictly adhere to internationally recognized protocols for data analysis and interpretation. Our reporting framework for genetic counseling is developed in accordance with the joint guidelines of the American College of Medical Genetics and Genomics (ACMG) and the Association for Molecular Pathology (AMP). Furthermore, we incorporate recommendations from leading European regulatory bodies and specialized consortia, such as the Clinical Pharmacogenetics Implementation Consortium (CPIC), ensuring our reports are robust, clinically actionable, and meet global certification standards.</p>
             </div>
           </div>
           <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
             <ShieldCheck className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
             <div>
               <h3 className="mt-0">Regulatory Compliance & Product Quality</h3>
               <p>Our commitment extends to the physical products we recommend. We ensure our formulation logic and supplement guidance align with the standards set by major health regulatory agencies, including the U.S. Food and Drug Administration (FDA) and the European Food Safety Authority (EFSA). We also adhere to guidelines from specialized organizations and protocols, such as Good Manufacturing Practices (GMP), to ensure the recommended nutraceuticals and supplements meet stringent criteria for quality, purity, and safety.</p>
             </div>
           </div>
          <br/>

           <h2>4. Corporate & Clinical Governance</h2>
          <p>As a global leader, NutraGenius operates with the highest degree of corporate transparency, accountability, and governance, adhering to standards expected by public markets and global financial regulators.</p>
           <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
            <Scale className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="mt-0">Financial & Operational Transparency</h3>
              <p>Our financial practices are rigorous and transparent. We undergo regular, independent audits by top-tier accounting firms to ensure full compliance with International Financial Reporting Standards (IFRS) and other relevant regulatory frameworks.</p>
            </div>
          </div>
           <div className="flex items-start gap-4 my-6 p-4 border rounded-lg bg-card/50">
            <LineChart className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="mt-0">Ethical Governance</h3>
              <p>We maintain a formal corporate governance structure with an independent board of directors. Our ethical commitment is codified in our policies: we do not sell identifiable personal data, we operate with full transparency, and we place the well-being and trust of our users at the center of our business model.</p>
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CertificationsPage;
