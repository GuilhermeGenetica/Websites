// File: src/pages/PrivacyPolicy.jsx
// This component contains the text for the Privacy Policy.
// It is imported by App.jsx to be displayed as a standalone page.
import React from 'react';

const PrivacyPolicyContent = () => {
  return (
    <div className="terms-content-wrapper">
      <header className="terms-popup-header">
        <h1>HoldingComp Global Group Privacy Policy</h1>
        <p><em>Effective Date: November 9, 2025</em></p>
      </header>

      <div className="terms-popup-container">
        <h2>1. Introduction</h2>
        <p>
          Welcome to HoldingComp Global Group ("HoldingComp," "we," "us," or "our"). We are a global technology hub and holding company that operates, manages, and provides services to a portfolio of subsidiary companies and platforms (our "Group"). Our Group includes, but is not limited to, entities such as NutraShop, NutraGenius, MedBooking, OnNetWeb, VitaVenda, and EmporioVip (collectively, our "Subsidiaries" or "Services").
        </p>
        <p>
          This Privacy Policy explains how HoldingComp, as the parent entity, collects, uses, discloses, and safeguards your information. This policy primarily applies to information collected directly by HoldingComp (e.g., through this website, investor relations, or direct contact) and also governs how we process data received from our Subsidiaries for overarching administrative, legal, and analytical purposes.
        </p>
        <p>
          Please note that each of our Subsidiaries is a distinct service and may have its own separate privacy policy that governs the data it collects from you directly. We encourage you to read the privacy policies of any of our Services you use.
        </p>

        <h2>2. Information We Collect</h2>
        <p>HoldingComp may collect information in the following ways:</p>
        <ul>
          <li>
            <strong>Information You Provide Directly:</strong> When you contact us via this website (e.g., for investor relations, press inquiries, or support), you may provide personal information such as your name, email address, phone number, and the content of your message.
          </li>
          <li>
            <strong>Information from our Subsidiaries:</strong> We may receive information about you from our Subsidiaries for group-level administration, analytics, compliance, and reporting. This may include aggregated and anonymized user analytics, as well as specific personal information necessary for legal or compliance-related tasks (e.g., responding to a data request that involves multiple Services).
          </li>
          <li>
            <strong>Information Collected Automatically:</strong> When you visit this website, we may automatically collect certain information, such as your IP address, browser type, operating system, and browsing behavior, using cookies and similar technologies.
          </li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect for the following purposes:</p>
        <ul>
          <li>
            <strong>To Operate our Website and Business:</strong> To respond to your inquiries, manage investor and press relations, and maintain the security of our website.
          </li>
          <li>
            <strong>Group-Level Administration:</strong> To perform "back-office" functions for our Group, such as legal, accounting, compliance (including Google OAuth verification and other API provider requirements), and aggregated business intelligence.
          </li>
          <li>
            <strong>Analytics and Improvement:</strong> To understand how our website and Group services are performing, to conduct aggregated analysis, and to improve our offerings.
          </li>
          <li>
            <strong>Legal and Compliance:</strong> To comply with our legal obligations, respond to lawful requests from public authorities, enforce our agreements, and protect the rights, property, or safety of HoldingComp, our Group, our users, or the public.
          </li>
        </ul>

        <h2>4. Information Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share information in the following limited circumstances:</p>
        <ul>
          <li>
            <strong>Within our Group:</strong> We may share information with our Subsidiaries for administrative, compliance, and operational purposes, ensuring a consistent standard of data protection across our Group.
          </li>
          <li>
            <strong>With Service Providers:</strong> We may share information with third-party vendors who perform services on our behalf, such as cloud hosting, analytics, and legal services. These providers are contractually bound to protect your information.
          </li>
          <li>
            <strong>For Legal Reasons:</strong> We may disclose your information if required by law, subpoena, or other legal process, or if we have a good faith belief that disclosure is necessary to protect our rights, prevent fraud, or ensure safety.
          </li>
          <li>
            <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.
          </li>
        </ul>

        <h2>5. Global Data Protection (GDPR & US Laws)</h2>
        <p>As a global entity, we comply with major data protection frameworks.</p>
        <ul>
          <li>
            <strong>For Users in the European Economic Area (EEA):</strong> If you are in the EEA, we comply with the General Data Protection Regulation (GDPR). Our legal bases for processing include "Legitimate Interest" (to operate our business and Group), "Performance of a Contract," and "Compliance with a Legal Obligation." You have the right to access, rectify, or erase your personal data, as well as the right to data portability and the right to object to or restrict processing.
          </li>
          <li>
            <strong>For Users in the United States (e.g., CCPA/CPRA):</strong> If you are a California resident, you have specific rights, including the right to know what personal information we collect, the right to request deletion, and the right to opt-out of the "sale" or "sharing" of your information (which we do not do).
          </li>
          <li>
            <strong>International Transfers:</strong> Your information may be transferred to and processed in countries other than your own. We use appropriate safeguards, such as Standard Contractual Clauses, to ensure your data is protected.
          </li>
        </ul>

        <h2>6. Data Security</h2>
        <p>
          We implement robust technical and organizational measures to protect your information from unauthorized access, use, or disclosure. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>7. Cookies Policy</h2>
        <p>
          Our website uses cookies (small text files) to function, to analyze performance, and to personalize your experience. Some cookies are "Strictly Necessary" for the site to work. Others, like "Analytics" cookies, help us understand site usage. By using our site, you consent to the use of Strictly Necessary cookies. For others, we will ask for your consent where required by law.
        </p>

        <h2>8. Children's Privacy</h2>
        <p>
          Our services are not directed to individuals under the age of 18 (or the relevant age of majority), and we do not knowingly collect personal information from children.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. The "Effective Date" at the top indicates the latest revision. We encourage you to review this policy periodically.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or our data practices as the HoldingComp parent entity, please contact our Data Protection Officer at:
          <br />
          Email: <strong>email@holdingcomp.com</strong> (or your official contact email)
        </p>
      </div>

      <footer className="terms-popup-footer">
        &copy; 2025 HoldingComp Global Group. All rights reserved.
      </footer>
    </div>
  );
};

export default PrivacyPolicyContent;