import React from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, Globe, ShieldCheck, CalendarClock, CreditCard } from 'lucide-react';

// An array combining all benefits, with a 'type' to distinguish them.
const allBenefits = [
  { type: 'patient', icon: Globe, title: 'Global Access', description: 'Find specialists from different countries, breaking geographical barriers.' },
  { type: 'doctor', icon: Users, title: 'Expand Your Reach', description: 'Connect with patients from around the world seeking your expertise.' },
  { type: 'patient', icon: CalendarClock, title: 'Flexible Scheduling', description: 'Book online or in-person appointments that fit your life, anytime.' },
  { type: 'doctor', icon: CreditCard, title: 'Simplified Finances', description: 'Automated and secure payment processing for every appointment.' },
  { type: 'patient', icon: ShieldCheck, title: 'Verified Professionals', description: 'All doctors are manually vetted for your safety and peace of mind.' },
  { type: 'doctor', icon: Stethoscope, title: 'Focus on Medicine', description: 'We handle the scheduling logistics so you can focus on patient care.' },
];

/**
 * A new, improved FeatureCard component that acts as a standalone, interactive card.
 * @param {object} props - The component props.
 * @param {React.ElementType} props.icon - The icon component.
 * @param {string} props.title - The title of the benefit.
 * @param {string} props.description - The description of the benefit.
 * @param {string} props.type - The user type ('patient' or 'doctor').
 * @param {number} props.index - The index for animation delay.
 */
const FeatureCard = ({ icon: Icon, title, description, type, index }) => {
  const isPatient = type === 'patient';
  
  // Staggered animation for each card
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="group relative bg-card p-8 rounded-2xl shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
    >
      {/* Badge to indicate the target audience */}
      <div className={`absolute top-0 right-6 -mt-4 px-4 py-1.5 text-xs font-bold rounded-full shadow-md ${isPatient ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
        {isPatient ? 'For Patients' : 'For Doctors'}
      </div>

      {/* Icon with hover effect */}
      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-6 border-2 border-primary/20 group-hover:border-accent group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
        <Icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
      </div>

      {/* Card content */}
      <div className="text-left">
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

/**
 * Section explaining the key benefits of the platform, now with individual interactive cards.
 */
const WhyChooseUsSection = () => {
  return (
    <section id="why-us" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            A Healthcare Experience Without Borders
          </h2>
          <p className="text-lg text-muted-foreground">
            We are building a more connected and accessible future for healthcare. Discover how our platform benefits you, whether you are a patient or a medical professional.
          </p>
        </motion.div>

        {/* A single grid now holds all the new, separate feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allBenefits.map((item, index) => (
            <FeatureCard key={index} {...item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
