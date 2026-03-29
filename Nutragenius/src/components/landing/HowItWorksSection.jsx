// src/components/landing/HowItWorksSection.jsx
// NEW: Created as a modular component.
// EXPANSION: Step descriptions are now more specific and credible (e.g., "100+ biomarkers").

import React from 'react';
import { motion } from 'framer-motion';

const HowItWorksSection = React.forwardRef((props, ref) => {
  const steps = [
    {
      title: "Step 1: Build Your Profile",
      description: "Sign up and complete our secure, in-depth questionnaire covering your lifestyle, health goals, symptoms, and medical history.",
      imageUrl: "/media/step1.jpg"
    },
    {
      title: "Step 2: Upload Your Biomarkers",
      description: "Securely input your recent lab results (full biomarkers) and any known nutragenetic variants. The more data you provide, the smarter the analysis.",
      imageUrl: "/media/step2.jpg"
    },
    {
      title: "Step 3: Run the Analysis",
      description: "Our engine cross-references your complete biological profile against thousands of scientific rules to find nutrient gaps and optimization opportunities.",
      imageUrl: "/media/step3.jpg"
    },
    {
      title: "Step 4: Receive Your Action Plan",
      description: "Get your personalized report explaining every recommendation. Take your plan to your doctor, download your list, or connect to our partner shop.",
      imageUrl: "/media/step4.jpg"
    }
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Get your personalized health plan in 4 simple steps.
          </p>
        </motion.div>

        {/* New Card Layout */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-card rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 glass-effect"
            >
              <img 
                src={step.imageUrl} 
                alt={step.title} 
                className="w-full h-48 object-cover" 
                onError={(e) => { e.target.onerror = null; e.target.src = '/media/imgerror.svg'; }}
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

export default HowItWorksSection;