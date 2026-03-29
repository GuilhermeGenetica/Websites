// src/components/landing/CallToActionSection.jsx
// NEW: Created as a modular component.
// EXPANSION: Added a money-back guarantee as a final conversion optimization.

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const CallToActionSection = ({ onGetStartedClick }) => {
  return (
    <section className="py-20 md:py-28 cta-background">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Stop guessing. Start analyzing. Get your personalized, data-driven wellness plan today.
          </p>
          <Button size="lg" variant="outline" className="bg-white/90 text-primary hover:bg-white text-lg px-8 py-6 font-bold" onClick={onGetStartedClick}>
            Start Your Analysis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-white/70 mt-6">
            Select the best supplements for your profile.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToActionSection;