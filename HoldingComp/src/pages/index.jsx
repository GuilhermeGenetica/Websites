// File: src/pages/index.jsx
import React, { useState, useEffect, useRef } from 'react';
import Popup from '../components/Popup.jsx';
import { debounce } from '../lib/utils.js';

// [NOTE] We import the legal content to populate the popups,
// even though the primary links now go to separate pages.
import TermsOfServiceContent from './TermsOfService.jsx';
import PrivacyPolicyContent from './PrivacyPolicy.jsx';

const Page = ({ theme }) => {
  const [activePopup, setActivePopup] = useState(null);
  const [arrowState, setArrowState] = useState({ visible: false, icon: '⬇️' });
  const lastScrollY = useRef(0);

  // Scroll Arrow Logic
  const handleArrowScroll = () => {
    const currentScrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (currentScrollY === 0) {
      setArrowState({ visible: true, icon: '⬇️' });
    } else if (currentScrollY + windowHeight >= documentHeight - 5) { // 5px tolerance
      setArrowState({ visible: true, icon: '⬆️' });
    } else {
      setArrowState({ visible: false, icon: '⬇️' });
    }
    lastScrollY.current = currentScrollY;
  };
  
  // Responsive Table Logic
  const adjustTable = () => {
      const tableCells = document.querySelectorAll('#responsiveTable .table-cell');
      const width = window.innerWidth;
      
      if (!tableCells.length) return;

      if (width <= 800) {
          tableCells.forEach(cell => {
              cell.style.flex = '1 1 100%';
              cell.style.padding = '5px';
          });
      } else {
          tableCells.forEach(cell => {
              cell.style.flex = '1 1 33%';
              cell.style.padding = '10px';
          });
      }
  }

  useEffect(() => {
    const debouncedAdjustTable = debounce(adjustTable, 250);
    adjustTable();
    window.addEventListener('resize', debouncedAdjustTable);
    window.addEventListener('scroll', handleArrowScroll);

    return () => {
      window.removeEventListener('resize', debouncedAdjustTable);
      window.removeEventListener('scroll', handleArrowScroll);
    };
  }, []); // Runs once on mount

  // Videos (from /public/ folder)
  const mainVideo = theme === 'light' ? '/media/lightback.mp4' : '/media/blackback.mp4';
  const propagandaVideo = '/media/propaganda.mp4';

  const openPopup = (popupId) => {
    setActivePopup(popupId);
  };

  const closePopups = () => {
    setActivePopup(null);
  };

  return (
    <>
      {/* --- HERO SECTION --- */}
      <div className="parallax" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video autoPlay muted loop className="parallax-video" id="themeVideo" key={mainVideo}>
          <source src={mainVideo} type="video/mp4" />
        </video>
        <div className="content" style={{ padding: '0px 20px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '3.5rem' }}>HoldingComp Group</h1>
          <h2 style={{ marginTop: '0', fontSize: '2rem', fontWeight: '300' }}>
            Orchestrating the Future of Global Solutions
          </h2>
          <p style={{ fontSize: '1.2rem', fontWeight: '400' }}>
            We are the central hub where innovation, technology, and visionary leadership converge.
          </p>
        </div>
      </div>

      {/* --- HOME/ABOUT SECTION --- */}
      <section id="home" className="parallax parallax1">
        <div className="content">
          <h1>Forging the Vanguard of Innovation</h1>
          <h2>A Global Hub for Transformative Enterprise</h2><br />
          <p>
            <b>HoldingComp Global Group</b> is not just a company; it is a dynamic ecosystem. We serve as the catalyst for a diverse portfolio of forward-thinking businesses, unifying them under a shared vision of excellence.
          </p>
          <p>
            Operating at the intersection of Digital Marketing, Personalized Medicine, Software Development, and strategic e-Commerce, we empower our subsidiaries to break barriers and redefine their industries. Our unique structure fosters synergy, drives technological advancement, and creates exponential value for our partners, communities, and stakeholders worldwide.
          </p>
        </div>
      </section>

      {/* --- PORTFOLIO SECTION --- */}
      <section className="parallax parallax1">
        <div id="responsiveTable" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '900px', margin: '0 auto', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '10px', padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ flex: '1 1 100%', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '2.5rem' }}>
              Our Ecosystem in Action
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#ddd', fontWeight: 300 }}>
              A glimpse into the diverse and synergistic entities that form our global portfolio.
            </p>
          </div>
          
          {/* Portfolio Items */}
          <div className="table-cell" style={{ flex: '1 1 33%', padding: '10px', boxSizing: 'border-box', transition: 'transform 0.3s ease' }}>
            <a href="https://vitavenda.onnetweb.com" target="_blank" rel="noopener noreferrer">
              <img src="/media/img1.png" alt="VitaVenda" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '5px', boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }} />
            </a>
          </div>
          <div className="table-cell" style={{ flex: '1 1 33%', padding: '10px', boxSizing: 'border-box', transition: 'transform 0.3s ease' }}>
            <a href="https://emporiovip.com" target="_blank" rel="noopener noreferrer">
              <img src="/media/img2.png" alt="EmporioVip" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '5px', boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }} />
            </a>
          </div>
          <div className="table-cell" style={{ flex: '1 1 33%', padding: '10px', boxSizing: 'border-box', transition: 'transform 0.3s ease' }}>
            <a href="https://nutrashop.app" target="_blank" rel="noopener noreferrer">
              <img src="/media/img3.png" alt="NutraShop" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '5px', boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }} />
            </a>
          </div>
          <div className="table-cell" style={{ flex: '1 1 33%', padding: '10px', boxSizing: 'border-box', transition: 'transform 0.3s ease' }}>
            <a href="https://nutragenius.app" target="_blank" rel="noopener noreferrer">
              <img src="/media/img4.png" alt="NutraGenius" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '5px', boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }} />
            </a>
          </div>
          <div className="table-cell" style={{ flex: '1 1 33%', padding: '10px', boxSizing: 'border-box', transition: 'transform 0.3s ease' }}>
            <a href="https://medbooking.app" target="_blank" rel="noopener noreferrer">
              <img src="/media/img5.png" alt="MedBooking" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '5px', boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }} />
            </a>
          </div>
          <div className="table-cell" style={{ flex: '1 1 33%', padding: '10px', boxSizing: 'border-box', transition: 'transform 0.3s ease' }}>
            <a href="https://onnetweb.com" target="_blank" rel="noopener noreferrer">
              <img src="/media/img6.png" alt="OneNetWeb" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: '5px', boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }} />
            </a>
          </div>

          <div style={{ flex: '1 1 100%', marginTop: '20px', textAlign: 'center', color: '#ddd', fontSize: '0.9em' }}>
            <br />
            This portfolio represents the breadth of our interests, from consumer-facing platforms to B2B infrastructure.<br />
            For a detailed understanding of our corporate governance and service agreements, please review our 
            <a 
              href="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#0af', textDecoration: 'underline', cursor: 'pointer', margin: '0 4px' }}
              title="Open Terms & Conditions"
            >
              Terms & Conditions
            </a>
            or contact our team.
          </div>
        </div>
      </section>

      {/* --- SUSTAINABILITY SECTION --- */}
      <section id="sustainability" className="static">
        <div className="content">
          <h1>A Legacy of Responsibility</h1>
          <h2>Engineering a Sustainable Tomorrow</h2><br />
          <p>At <b>HoldingComp Global Group</b>, sustainability is not an initiative; it is integral to our identity. We are profoundly committed to embedding ethical and sustainable practices into the core of our operations and those of our subsidiaries.</p>
          <p>We champion progress that respects planetary boundaries and uplifts communities. From architecting green software solutions to promoting supply chain transparency, we actively work to create a positive and lasting impact on both the environment and society. We believe that long-term value is only achievable through responsible leadership.</p>
        </div>
      </section>
    
      {/* --- CAREERS SECTION (uses "welcome" ID for navbar link) --- */}
      <section id="welcome" className="parallax parallax2">
        <div className="content">
          <h1>The Architects of Tomorrow</h1>
          <h2>Your Future Starts at HoldingComp</h2><br />
          <p>At <b>HoldingComp Global Group</b>, we are not just offering jobs; we are offering journeys. We seek out the brilliant, the passionate, and the visionary—individuals who want to be part of a dynamic, multidisciplinary environment.</p>
          <p>Our diverse ecosystem provides unparalleled opportunities for growth, spanning strategic sectors from AI-driven marketing to genomic analysis. You will collaborate on transformative projects that integrate cutting-edge technology, global strategy, and meaningful social impact.</p>
          <p>We provide structured career paths, continuous learning, and a collaborative culture that prizes talent and potential. Join us, and build a remarkable career in a global ecosystem of innovation.</p>
        </div>
      </section>
      
      {/* --- INVESTORS SECTION --- */}
      <section id="investors" className="static">
        <div className="content">
          <h1>Value Through Vision</h1>
          <h2>Investor Relations</h2><br />
          <p>At HoldingComp Global Group, we believe in building enduring value through strategic foresight and transparent governance. Our Investor Relations portal provides our partners with comprehensive insights into our performance, strategies, and future outlook.</p>
          <p>We are committed to clear, consistent communication and financial discipline. Discover our financial reports, corporate governance updates, and key developments as we continue to drive innovation and deliver sustainable, long-term growth.</p>
        </div>
      </section>

      {/* --- PRESS SECTION --- */}
      <section id="pressroom" className="static">
        <div className="content">
          <h1>The Chronicle of Innovation</h1>
          <h2>Press Room</h2><br />
          <p>Welcome to the official Press Room of <b>HoldingComp Global Group</b>. This is your primary source for the latest announcements, corporate milestones, and insights from our leadership team.</p>
          <p>Explore press releases, media kits, and expert analysis that reflect our commitment to excellence and our role in shaping the future of technology and business. For all media inquiries, please contact our corporate communications team.</p>
        </div>
      </section>

      {/* --- ABOUT (POPUP LINKS) SECTION --- */}
      <section id="about" className="parallax parallax1">
        <div className="content">
          <h1><b><u>About</u></b></h1><br />
          <div className="columns">
            <div className="column">
              <a className="title-link" onClick={() => openPopup('about-HoldingComp')}>About HoldingComp</a>
              <a className="title-link" onClick={() => openPopup('values')}>Our Values</a>
              <a className="title-link" onClick={() => openPopup('mission')}>Mission & Objectives</a>
            </div>
            <div className="column">
              <a className="title-link" onClick={() => openPopup('guidelines')}>Community & Compliance</a>
              <a className="title-link" onClick={() => openPopup('activities')}>Activities & Services</a>
              <a 
                href="/terms" 
                target="_blank"
                rel="noopener noreferrer"
                className="title-link" 
                title="Open Terms & Conditions"
              >
                Full Terms and Policy
              </a>
            </div>
            <div className="column">
              <a 
                href="/privacy" 
                target="_blank"
                rel="noopener noreferrer"
                className="title-link" 
                title="Open Privacy Policy"
              >
                Privacy Policy
              </a>
              <a className="title-link" onClick={() => openPopup('cookies')}>Cookies Policy</a>
              <a className="title-link" onClick={() => openPopup('support')}>Support and Contact</a>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROPAGANDA VIDEO SECTION (MOVED TO FINAL POSITION) --- */}
      <section className="parallax" style={{ minHeight: '100vh', position: 'relative' }}>
        <video autoPlay muted loop className="parallax-video">
          <source src={propagandaVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* This section is purely visual, so it has no .content overlay */}
      </section>

      {/* --- NEW, STATIC FOOTER SECTION --- */}
      <section className="static" style={{ 
        backgroundColor: 'var(--accent-dark)', 
        minHeight: 'auto', 
        padding: '10px 20px',
        color: 'var(--text-color-dark)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap', // Allows text and logo to stack on mobile
          justifyContent: 'center', // Centers the items as a group
          alignItems: 'center', // Vertically aligns text and logo
          maxWidth: '900px',
          margin: '0 auto',
          gap: '30px' // Creates space between text and logo
        }}>
          
         {/* Footer Logo Block (Appears to the left  on desktop) */}
          <div style={{ textAlign: 'center' }}>
            <img 
              src="/media/logo.png" 
              alt="HoldingComp Logo" 
              style={{ 
                width: '100px', // Adjusted size for footer
                height: 'auto', 
                opacity: '0.8' 
              }} 
            />
          </div>

          {/* Footer Text Block */}
          <div style={{ textAlign: 'center' }}> {/* Centered for mobile stacking */}
            <p style={{ margin: '5px 0', fontSize: '1.1em', fontWeight: '300' }}>
              <a href="/" title="HoldingComp Group© 2025. All rights reserved.">HoldingComp Group©</a> 2025. All rights reserved.
            </p>
            <p style={{ fontSize: '1em', color: '#ccc', fontWeight: '300', margin: '5px 0' }}>
              A global hub for innovation. Made with ❤️ by <a href="https://onnetweb.com" target="_blank" rel="noopener noreferrer">OnNetWeb</a>.
            </p>
          </div>
          

        </div>
      </section>
      
      {/* --- SCROLL ARROW --- */}
      <div 
         id="arrow" 
         className={`arrow-container ${arrowState.visible ? 'visible' : ''}`}
         onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <div className="arrow">{arrowState.icon}</div>
      </div>

      {/* --- EXPANDED POPUPS --- */}

      <Popup id="about-HoldingComp" title="About HoldingComp" isVisible={activePopup === 'about-HoldingComp'} onClose={closePopups}>
        <b>HoldingComp Global Group</b> is an innovative and multidisciplinary holding company that acts as a catalyst for opportunities in various strategic sectors. We are a global technology company hub that aims to offer services, conduct advisory and consultancy, as well as manage e-commerce in various areas.
        <br /><br />
        We have no limits; our goal is to be the world leader in technological development advisory, always at the forefront and implementing cutting-edge services for all types of companies.
        <br /><br />
        From digital marketing to personalized medicine, we operate in dynamic markets, always focused on positively impacting the future and promoting sustainable growth. We are the architects of a connected ecosystem, designed to build and scale the enterprises of tomorrow.
      </Popup>
      
      <Popup id="values" title="Our Core Values" isVisible={activePopup === 'values'} onClose={closePopups}>
        Our values are the foundation of our culture and guide every decision we make:
        <br /><br />
        <p>
          <b>Ethics and Virtues:</b> We uphold the ethical values and standards of all Christian virtues throughout our company. Our business is built on a foundation of integrity, honesty, and unwavering moral principles.
        </p>
        <br />
        <p>
          <b>Innovation:</b> We are relentlessly curious. We anticipate market shifts, challenge the status quo, and invest in the disruptive technologies and ideas that will define the future.
        </p>
        <br />
        <p>
          <b>Excellence:</b> We strive to exceed expectations in every facet of our operations. We are committed to delivering exceptional results for our partners, clients, and investors through rigor, precision, and a constant pursuit of mastery.
        </p>
        <br />
        <p>
          <b>Sustainability:</b> We build for the long term. We value and implement practices that respect the environment, foster social well-being, and ensure the enduring viability of our enterprises and communities.
        </p>
        <br />
        <p>
          <b>Collaboration:</b> We believe in the power of synergy. We foster a collaborative environment where strong partnerships, shared knowledge, and mutual respect drive collective progress and geometric growth.
        </p>
      </Popup>

      <Popup id="mission" title="Mission and Objectives" isVisible={activePopup === 'mission'} onClose={closePopups}>
        <h2><b> Mission: </b></h2>
        <p>
          To transform innovative ideas into powerful, practical, and scalable solutions that positively impact businesses, people, and communities. Our mission is to facilitate and automate complex work, enabling humanity to dedicate more time to care, creativity, and connection.
        </p>
        <br />
        <h2><b>Objectives: </b></h2>
        <br />1. To be the undisputed global leader in technology advisory, e-commerce strategy, and digital marketing integration.
        <br /><br />2. To pioneer the development and adoption of personalized, sustainable technologies, particularly in health and data science.
        <br /><br />3. To create and nurture a seamlessly integrated ecosystem of companies that maximizes value and innovation for all stakeholders.
        <br /><br />4. To strategically invest in and scale projects that promote global health, individual well-being, and technological literacy.
      </Popup>
      
      <Popup id="guidelines" title="Community & Compliance Guidelines" isVisible={activePopup === 'guidelines'} onClose={closePopups}>
        At <b>HoldingComp Global Group</b>, we believe in building an inclusive, respectful, and lawful global community. To achieve this, we have established the following guidelines for all partners, employees, and subsidiaries:
        <br />
        <br />1. Respect diverse opinions, cultures, and perspectives.
        <br />2. Act with absolute integrity and reject unethical or deceptive practices.
        <br />3. Promote collaboration, transparency, and the free exchange of knowledge.
        <br />4. Value positive social impact and sustainability in all actions.
        <br />
        <br />
        <h2><b>Our Commitment to Global Standards</b></h2>
        <br />As a global company, we are unequivocally committed to full compliance with all local and international regulations. Our policy includes:
        <br />
        <br /><b>Data Protection:</b> We rigorously protect user data in accordance with all applicable laws, including GDPR, CCPA, and others.
        <br /><br /><b>Freedom of Expression:</b> We support the right to free speech within the bounds of democratic law, mutual respect, and the prohibition of hate speech.
        <br /><br /><b>Due Process:</b> We respect the right to self-defense and fair treatment in all business and legal matters.
        <br /><br /><b>Freedom of Movement:</b> We believe in the right to free movement and locomotion for law-abiding citizens, regardless of their social status or financial resources.
        <br /><br /><b>Protecting the Vulnerable:</b> We are dedicated to protecting the weak and the innocent, with zero tolerance for exploitation.
        <br /><br /><b>National Sovereignty:</b> We respect the individuality, culture, and laws of democratic nations.
        <br /><br /><b>Social Well-being:</b> We actively contribute to social well-being and a free, balanced development for all.
      </Popup>
      
      <Popup id="activities" title="Activities and Services" isVisible={activePopup === 'activities'} onClose={closePopups}>
        Our operations as a global technology hub are diverse and synergistic, primarily focused on:
        <br />
        <br />
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>
            <b>Services, Advisory & Consultancy:</b> Providing expert guidance, strategic planning, and technological development advisory for enterprise-level clients.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <b>E-commerce Administration:</b> Building, scaling, and managing sophisticated online stores and marketplaces across diverse sectors.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <b>Digital Marketing:</b> Executing comprehensive, data-driven strategies to build brands and expand their global online presence.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <b>Affiliate Sales & Networks:</b> Managing and supporting high-performance affiliate networks to maximize conversions and partner success.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <b>Sectoral Marketplaces:</b> Developing and operating specialized platforms for health, luxury goods, genomics, and wellness.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <b>Technology & Software Development:</b> Architecting and developing customized, scalable software applications and SaaS platforms.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <b>Personalized Medicine & Genomics:</b> Investing in and developing advanced solutions in genomic analysis, personalized health, and bioinformatics.
          </li>
        </ul>
        <br />
        We are committed to delivering impactful results and building tailor-made solutions for each client and partner.
      </Popup>

      {/* [NOTE] This popup still exists, but its content is
        loaded from the TermsOfServiceContent component.
        This is good as it keeps the content DRY.
      */}
      <Popup id="terms" title="Terms of Service" isVisible={activePopup === 'terms'} onClose={closePopups}>
        <TermsOfServiceContent />
      </Popup>
      
      {/* [NOTE] Same as above, for Privacy. */}
      <Popup id="privacy" title="Privacy Policy" isVisible={activePopup === 'privacy'} onClose={closePopups}>
        <PrivacyPolicyContent />
      </Popup>
      
      <Popup id="cookies" title="Cookies Policy" isVisible={activePopup === 'cookies'} onClose={closePopups}>
        Our website, like most professional websites, uses cookies—tiny files downloaded to your computer to improve your experience.
        <br /><br />
        <b>How We Use Cookies:</b>
        <br />We use cookies for a varietyD of reasons, including session management, analytics, and personalizing content. Disabling cookies may downgrade or "break" certain elements of the site's functionality.
        <br /><br />
        <b>Your Choices:</b>
        <br />You can manage your cookie preferences through your browser settings. Be aware that restricting cookies may impact the functionality you experience on our site.
        <br /><br />
        For more detailed information, please review our full <b>Privacy Policy</b>, which includes our cookie usage.
      </Popup>
      
      <Popup id="support" title="Support and Contact" isVisible={activePopup === 'support'} onClose={closePopups}>
        We are here to help. Our dedicated support team is available for all inquiries, from partnership opportunities to technical questions.
        <br />
        <br /><b>General Inquiries:</b> email@holdingcomp.com
        <br /><b>Investor Relations:</b> investors@holdingcomp.com
        <br /><b>Press & Media:</b> press@holdingcomp.com
        <br />
        <br /><b>Phone:</b> At one of our offices
        <br /><b>Address:</b> At one of our offices
        <br />
        <br />Our primary support hours are Monday to Friday, from 9 a.m. to 6 p.m. (GMT). We strive to respond to all inquiries within one business day.
      </Popup>
    </>
  );
};

export default Page;