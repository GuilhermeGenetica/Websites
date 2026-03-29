import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Shield, Phone, Clock, Users, Heart } from 'lucide-react';

const features = [
  { icon: Calendar, title: "Simple Scheduling", description: "Intuitive interface to schedule appointments in a few clicks" },
  { icon: Shield, title: "Secure Payment", description: "Secure processing via Stripe with full data protection" },
  { icon: Phone, title: "Consultation via WhatsApp", description: "Direct service via WhatsApp with verified doctors" },
  { icon: Clock, title: "Flexible Hours", description: "Doctors define their availability with personalized intervals" },
  { icon: Users, title: "Advanced Search", description: "Find doctors by specialty, location, and ratings" },
  { icon: Heart, title: "Personalized Care", description: "Complete profiles for more personalized service" }
];

const FeatureCard = ({ icon: Icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    className="bg-card-features text-card-features-foreground rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-border-features"
  >
    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-card-features-foreground">{title}</h3>
    <p className="text-card-features-muted">{description}</p>
  </motion.div>
);

const FeaturesSection = () => (
  <section id="features" className="py-20 features-section-background glass-effect">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-bold mb-4 text-features-foreground">Why choose our platform?</h2>
        <p className="text-xl text-features-muted max-w-3xl mx-auto">
          We offer a complete and secure experience to connect patients and doctors
        </p>
      </motion.div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} index={index} />
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
