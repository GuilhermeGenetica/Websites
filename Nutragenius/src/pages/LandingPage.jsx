// src/pages/LandingPage.jsx

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';

import ThemeToggle from '@/components/ThemeToggle.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import AuthModal from '@/components/AuthModal.jsx';

import Header from '@/components/landing/Header.jsx';
import HeroSection from '@/components/landing/HeroSection.jsx';
import TrustedBySection from '@/components/landing/TrustedBySection.jsx';
import FeaturesSection from '@/components/landing/FeaturesSection.jsx';
import HowItWorksSection from '@/components/landing/HowItWorksSection.jsx';
import TestimonialsSection from '@/components/landing/TestimonialsSection.jsx';
import FaqSection from '@/components/landing/FaqSection.jsx';
import CallToActionSection from '@/components/landing/CallToActionSection.jsx';
import Footer from '@/components/landing/Footer.jsx';

const LandingPage = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin');
  const navigate = useNavigate();
  
  const { user } = useAuth(); 

  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const faqRef = useRef(null);

  const handleScrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openAuthModal = (tab = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };
  
  const closeAuthModal = () => setIsAuthModalOpen(false);
  
  const handleLoginClick = () => openAuthModal('signin');
  const handleRegisterClick = () => openAuthModal('signup');
  
  const handleGetStartedClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      openAuthModal('signup');
    }
  };

  return (
    <>
      {/* <Helmet> ... </Helmet> */}
      
      <div className="min-h-screen bg-background">
        
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} initialTab={authModalTab} />

        {/* FIX: Pass scroll handlers to Header */}
        <Header 
          onLoginClick={handleLoginClick} 
          onRegisterClick={handleRegisterClick} 
          onFeaturesClick={() => handleScrollTo(featuresRef)}
          onHowItWorksClick={() => handleScrollTo(howItWorksRef)}
          onFaqClick={() => handleScrollTo(faqRef)}
        />

        <main>
          {/* FIX: Pass scroll handler to HeroSection */}
          <HeroSection 
            onGetStartedClick={handleGetStartedClick} 
            onLearnMoreClick={() => handleScrollTo(howItWorksRef)} 
          />
          <TrustedBySection />
          {/* FIX: Pass refs to section components */}
          <FeaturesSection ref={featuresRef} />
          <HowItWorksSection ref={howItWorksRef} />
          <TestimonialsSection />
          <FaqSection ref={faqRef} />
          <CallToActionSection onGetStartedClick={handleGetStartedClick} />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LandingPage;