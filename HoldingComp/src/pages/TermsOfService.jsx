// File: src/pages/TermsOfService.jsx
// This component contains the text for the Terms of Service.
// It is imported by App.jsx to be displayed as a standalone page.
import React from 'react';

const TermsOfServiceContent = () => {
  return (
    <div className="terms-content-wrapper">
      <header className="terms-popup-header">
        <h1>HoldingComp Global Group Terms of Service</h1>
        <p><em>Effective Date: November 9, 2025</em></p>
      </header>

      <div className="terms-popup-container">
        <h2>1. Introduction</h2>
        <p>
          These Terms of Service ("Terms") govern your use of the HoldingComp Global Group ("HoldingComp," "we," "us," or "our") website (holdingcomp.com) and the information and services provided through it (the "Site").
        </p>
        <p>
          HoldingComp is a global technology hub and holding company. We operate a "Group" of subsidiary companies and platforms (our "Subsidiaries" or "Services"), which include, but are not limited to, NutraShop, NutraGenius, MedBooking, OnNetWeb, and others.
        </p>

        <h2>2. Your Agreement to These Terms</h2>
        <p>
          By accessing or using our Site, you agree to be bound by these Terms. If you do not agree to these Terms, you must not use our Site.
        </p>

        <h2>3. Crucial Distinction: Holding Company vs. Services</h2>
        <p>
          <strong>This is very important:</strong> These Terms govern <strong>only</strong> your use of the HoldingComp corporate Site (this website).
        </p>
        <p>
          Our Subsidiaries (NutraShop, MedBooking, etc.) are separate legal entities that provide their own distinct services. When you use one of our Subsidiary Services, your relationship is with that entity, and you will be subject to <strong>that Service's specific Terms of Service and Privacy Policy</strong>.
        </p>
        <p>
          These HoldingComp Terms do <strong>not</strong> apply to your use of our Subsidiary Services, and the terms of those Services do not apply to your use of this Site. HoldingComp disclaims all liability related to your use of any of our Subsidiary Services.
        </p>

        <h2>4. Use of the Site</h2>
        <p>
          We grant you a limited, non-exclusive, non-transferable, and revocable license to use our Site for informational purposes (e.g., to learn about our Group, our mission, or for investor and press relations).
        </p>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Site for any illegal purpose or in violation of any laws.</li>
          <li>Attempt to gain unauthorized access to the Site or our systems.</li>
          <li>Use the Site in any way that could damage, disable, or impair it.</li>
          <li>Use any automated system (e.g., "bots" or "spiders") to access the Site without our written permission.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          All content on this Site, including text, graphics, logos, and trademarks (the "HoldingComp Content"), is the property of HoldingComp or its licensors and is protected by copyright and other intellectual property laws.
        </p>
        <p>
          The trademarks, logos, and service marks of our Subsidiaries (e.g., "NutraShop," "NutraGenius") are the property of those respective entities. Your use of this Site grants you no license to use the HoldingComp Content or the intellectual property of our Subsidiaries.
        </p>

        <h2>6. Disclaimers</h2>
        <p>
          THE SITE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. HOLDINGCOMP DISCLAIMS ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL HOLDINGCOMP, ITS DIRECTORS, OR EMPLOYEES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SITE.
        </p>
        <p>
          OUR TOTAL LIABILITY TO YOU FOR ANY AND ALL CLAIMS RELATING TO THE SITE IS LIMITED TO THE AMOUNT, IF ANY, YOU PAID TO USE THE SITE.
        </p>

        <h2>8. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless HoldingComp and its officers, directors, employees, and agents from any claims, liabilities, damages, and expenses (including legal fees) arising from your use of the Site or your violation of these Terms.
        </p>

        <h2>9. Governing Law and Dispute Resolution</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of Portugal (or your chosen jurisdiction), without regard to its conflict of law principles.
        </p>
        <p>
          Any dispute arising from these Terms or your use of the Site shall be subject to the exclusive jurisdiction of the courts located in Lisbon, Portugal (or your chosen jurisdiction).
        </p>

        <h2>10. Changes to These Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will post the revised Terms on the Site and update the "Effective Date." Your continued use of the Site after such changes constitutes your acceptance of the new Terms.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
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

export default TermsOfServiceContent;