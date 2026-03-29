// src/components/landing/HeroSection.jsx
// NEW: Created as a modular component.
// EXPANSION: Added a trust-signal/sub-headline below buttons for conversion.

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const HeroSection = ({ onGetStartedClick, onLearnMoreClick }) => {
  return (
    <section className="relative py-20 md:py-32 hero-section-background">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Unlock Your Optimal Health
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            NutraGenius analyzes your genetics, lab results, and lifestyle to deliver precision supplement, nutrition, and wellness recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gold-bg" onClick={onGetStartedClick}>
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={onLearnMoreClick}>
              Learn More
            </Button>
          </div>
          <motion.p 
            className="text-sm text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Start your journey. No credit card required to sign up.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;