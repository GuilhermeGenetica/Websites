import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet';

// Import landing page components with explicit .jsx extension to fix build error
import Header from '@/components/landing/Header.jsx';
import HeroSection from '@/components/landing/HeroSection.jsx';
import TrustedBySection from '@/components/landing/TrustedBySection.jsx';
import SearchSection from '@/components/landing/SearchSection.jsx';
import WhyChooseUsSection from '@/components/landing/WhyChooseUsSection.jsx';
import TestimonialsSection from '@/components/landing/TestimonialsSection.jsx';
import ForDoctorsCTA from '@/components/landing/ForDoctorsCTA.jsx';
import Footer from '@/components/landing/Footer.jsx';
import AuthModal from '@/components/landing/AuthModal.jsx';

const LandingPage = () => {
    // Ref to scroll to the search section
    const searchSectionRef = useRef(null);
    // State to control the authentication modal visibility
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Handler to smoothly scroll to the search section
    const handleSearchNowClick = () => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Handlers to open and close the authentication modal
    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <>
            <Helmet>
                <title>MedBooking - Global Medical Appointment Scheduling</title>
                <meta name="description" content="A modern platform for scheduling online and in-person medical appointments. Connect patients and doctors quickly and securely worldwide." />
                <meta name="keywords" content="telemedicine, online doctor, medical appointment, find a doctor, global healthcare" />
            </Helmet>

            <div className="min-h-screen bg-background">
                {/* The authentication modal, controlled by state */}
                <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />

                {/* The header component, with a function to open the auth modal */}
                <Header onLoginClick={openAuthModal} />

                <main>
                    {/* The main sections of the landing page */}
                    <HeroSection onSearchNowClick={handleSearchNowClick} />
                    <TrustedBySection />
                    <SearchSection ref={searchSectionRef} onBookNowClick={openAuthModal} />
                    <WhyChooseUsSection />
                    <TestimonialsSection />
                    <ForDoctorsCTA onJoinClick={openAuthModal} />
                </main>

                {/* The footer component */}
                <Footer />
            </div>
        </>
    );
};

export default LandingPage;
