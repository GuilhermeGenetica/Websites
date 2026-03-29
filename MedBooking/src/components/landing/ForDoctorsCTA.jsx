import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
// O ícone do estetoscópio é importado para ser usado no novo logótipo
import { ArrowRight, CheckCircle, Stethoscope } from 'lucide-react';

/**
 * A Call-To-Action section specifically for doctors.
 * @param {object} props - The component props.
 * @param {Function} props.onJoinClick - Function to trigger the authentication modal.
 */
const ForDoctorsCTA = ({ onJoinClick }) => {
  const benefits = [
    "Global Patient Base",
    "Flexible Schedule Management",
    "Secure and Automated Payments",
    "Professional Networking"
  ];

  return (
    <section id="for-doctors" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="cta-background rounded-2xl p-10 md:p-16 text-white shadow-2xl">
          <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
            {/* Left side: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Join Our Global Network of Specialists
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Elevate your practice by connecting with patients worldwide. We provide the tools you need to manage your global clinic seamlessly.
              </p>
              <ul className="space-y-3 mb-10">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-white/90" />
                    <span className="font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={onJoinClick}
                // Classes de hover atualizadas para mudar para a cor 'accent'
                className="bg-white text-primary hover:bg-accent hover:text-accent-foreground shadow-lg px-8 py-6 text-lg transition-all duration-300 transform hover:scale-105"
              >
                Start Your Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Right side: Interactive Graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              // A classe 'group' permite controlar os estados de hover dos filhos
              className="hidden md:flex justify-center items-center group"
            >
              <div className="relative w-80 h-80">
                {/* Anel de destaque animado que aparece no hover */}
                <div className="absolute inset-0 bg-white/20 rounded-full transition-all duration-500 ease-in-out transform scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100"></div>
                {/* O logótipo principal que reage ao hover */}
                <div className="relative w-full h-full bg-white rounded-full shadow-2xl flex flex-col justify-center items-center text-center p-4 transition-transform duration-300 group-hover:scale-95">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <Stethoscope className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-primary">MedBooking</h3>
                  <p className="text-lg text-muted-foreground mt-1">Global Network</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForDoctorsCTA;
