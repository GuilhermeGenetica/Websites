// src/components/landing/TrustedBySection.jsx
// NEW: Created as a modular component.
// EXPANSION: Added a section title and a more robust grid layout for credibility.

import React from 'react';
import { ShieldCheck, BookOpen, Users } from 'lucide-react';

const TrustedBySection = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-semibold text-center text-muted-foreground mb-10">
          Our Commitment to Your Data & Privacy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-90">
          <div className="flex flex-col items-center text-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <span className="text-sm font-semibold">HIPAA Compliant Framework</span>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <span className="text-sm font-semibold">GDPR Ready</span>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <span className="text-sm font-semibold">Clinician Reviewed</span>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <span className="text-sm font-semibold">Evidence-Based Science</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
