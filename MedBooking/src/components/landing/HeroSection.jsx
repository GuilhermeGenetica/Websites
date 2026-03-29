import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, ShieldCheck, Users, CheckCircle } from 'lucide-react';

// Dados para os novos "cards" de destaque
const featureHighlights = [
  {
    icon: Globe,
    title: "Global Network",
    description: "Doctors in over 50 countries."
  },
  {
    icon: ShieldCheck,
    title: "Verified Professionals",
    description: "All doctors are manually approved."
  },
  {
    icon: Users,
    title: "Patient-Focused",
    description: "Your well-being is our priority."
  }
];

/**
 * Componente para o "card" de destaque individual com efeito de hover.
 * @param {object} props - As propriedades do componente.
 * @param {React.ElementType} props.icon - O componente do ícone.
 * @param {string} props.title - O título do destaque.
 * @param {string} props.description - A descrição do destaque.
 * @param {number} props.index - O índice para o atraso da animação.
 */
const FeatureCard = ({ icon: Icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
    className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-primary/40 hover:-translate-y-2 hover:shadow-primary/10"
  >
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  </motion.div>
);

/**
 * A secção principal de herói da landing page, agora aprimorada.
 * @param {object} props - As propriedades do componente.
 * @param {Function} props.onSearchNowClick - Função para rolar para a secção de busca.
 */
const HeroSection = ({ onSearchNowClick }) => {
  return (
    <section className="hero-background section-background overflow-hidden">
      <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Coluna de Texto */}
          <div className="text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-4 text-lg font-semibold text-primary"
            >
              Medical Booking Simplified
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground"
            >
              Your Health, Anywhere in the World.
              <span className="gradient-text block mt-2">Find Your Specialist Today.</span>
            </motion.h1>
            
            {/* --- PARTE MODIFICADA --- */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0"
            >
              Schedule your appointments with specialist doctors quickly and safe. 
              Receive quality care in-person or online 🌐 Anywhere.   
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2"
            >
              <span className="flex items-center text-sm font-medium text-foreground/80"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Quick Scheduling</span>
              <span className="flex items-center text-sm font-medium text-foreground/80"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Personalized Care</span>
              <span className="flex items-center text-sm font-medium text-foreground/80"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Precision Medicine</span>
            </motion.div>
            {/* --- FIM DA PARTE MODIFICADA --- */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button size="lg" onClick={onSearchNowClick} className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20 px-8 py-6 text-lg w-full sm:w-auto">
                Find a Specialist Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>

          {/* Coluna da Imagem */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:block relative"
          >
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/10 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent/10 rounded-full animate-pulse delay-500"></div>
              <img
                src="doctor1.png"
                alt="A professional and friendly doctor smiling"
                className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src='@/media/doctor1.png'; }}
              />
            </div>
          </motion.div>
        </div>

        {/* Secção de "Cards" de Destaque */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureHighlights.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
