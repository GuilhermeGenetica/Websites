import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { step: "1", title: "Sign Up", description: "Create your account as a patient or doctor" },
  { step: "2", title: "Complete Your Profile", description: "Add your personal and contact information" },
  { step: "3", title: "Schedule Your Appointment", description: "Choose the doctor and available time" },
  { step: "4", title: "Make the Payment", description: "Pay securely and receive confirmation" }
];

const StepCard = ({ step, title, description, index }) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.2 }}
    className="text-center"
  >
    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
      {step}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const HowItWorksSection = () => (
  <section id="how-it-works" className="how-it-works-section-background py-20">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A simple and quick process to schedule your appointment
        </p>
      </motion.div>
      <div className="grid md:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <StepCard key={index} {...step} index={index} />
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
