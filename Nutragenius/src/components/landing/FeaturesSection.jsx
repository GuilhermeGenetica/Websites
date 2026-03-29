// src/components/landing/FeaturesSection.jsx
// NEW: Created as a modular component.
// EXPANSION: Added 'Shop Your Recommendations' feature, a key value proposition.
// CORRECTION: Fixed grid centering and implemented button rendering on the last card.

import React from 'react';
import { motion } from 'framer-motion';
import { Dna, Activity, BrainCircuit, HeartPulse, ShieldCheck, TestTube, ShoppingCart } from 'lucide-react';

const features = [
  {
    icon: Dna,
    title: "Genetic Analysis",
    description: "Integrate your genetic data (e.g., MTHFR, APOE) to understand predispositions and optimize nutrient pathways."
  },
  {
    icon: TestTube,
    title: "Lab Result Interpretation",
    description: "Upload your blood work. Our engine analyzes 100+ biomarkers to find suboptimal ranges and potential deficiencies."
  },
  {
    icon: Activity,
    title: "Lifestyle & Symptom Intake",
    description: "Our comprehensive questionnaire captures your diet, activity, sleep, stress, and symptoms for a 360-degree view."
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Recommendations",
    description: "The core engine cross-references all your data points against thousands of rules to generate a prioritized list of supplement and nutrition recommendations."
  },
  {
    icon: HeartPulse,
    title: "Personalized Wellness Plan",
    description: "Receive a detailed, actionable report explaining 'why' each recommendation is made and how it helps you reach your goals."
  },
  {
    icon: ShieldCheck,
    title: "Data Security & Privacy",
    description: "Your health data is encrypted and secure, built on a HIPAA-compliant foundation. You control your information."
  },
  {
    icon: ShoppingCart,
    title: "Shop Your Recommendations",
    description:
      "Connect seamlessly to our partner shop (NutraShop) to find and purchase the exact, high-quality supplements recommended in your report.",
    button: (
    <a
      href={process.env.VITE_APP_URL || 'https://nutragenius.app'} 
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 mt-2 text-white bg-teal-800 rounded-md hover:bg-yellow-500 transition"
    >
      Visit NutraShop
    </a>
    )
  }
];

const FeaturesSection = React.forwardRef((props, ref) => {
  return (
    <section id="features" ref={ref} className="py-20 md:py-28 section-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">A Smarter Path to Wellness</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Go beyond generic advice. NutraGenius connects the dots between your unique biology and your health goals.
          </p>
        </motion.div>
        
        <div className="flex justify-center">
          <motion.div 

            className="inline-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
            initial="hidden"
            whileInView="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <div className="p-8 bg-card rounded-2xl shadow-lg border h-full glass-effect flex flex-col">
                  <div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5 border border-primary/20">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>

                  {feature.button && (
                    <div className="mt-auto pt-4">
                      {feature.button}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default FeaturesSection;