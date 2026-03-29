import React from 'react';
import { motion } from 'framer-motion';

// Array de parceiros atualizado com as empresas solicitadas e os novos componentes de logótipo
const partners = [
  { name: 'Global Health Inc.', Logo: GlobalHealthLogo },
  { name: 'Wellness International', Logo: WellnessInternationalLogo },
  { name: 'CareConnect', Logo: CareConnectLogo },
  { name: 'Medico Alliance', Logo: MedicoAllianceLogo },
  { name: 'Vitae Group', Logo: VitaeGroupLogo },
];

/**
 * Cartão de parceiro individual com logótipo acima do nome e efeito de destaque.
 * @param {object} props - As propriedades do componente.
 * @param {React.ElementType} props.Logo - O componente do logótipo SVG.
 * @param {string} props.name - O nome do parceiro.
 * @param {number} props.index - O índice para o atraso da animação.
 */
const PartnerCard = ({ Logo, name, index }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      className="group"
    >
      <div className="bg-card h-full p-8 rounded-2xl border border-border/50 flex flex-col items-center justify-center gap-6 transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-primary/40 hover:-translate-y-2 hover:shadow-primary/10">
        {/* Logótipo SVG */}
        <Logo className="h-12 w-auto text-muted-foreground transition-all duration-300 group-hover:text-foreground" />
        {/* Nome da Empresa */}
        <p className="text-sm font-semibold text-center text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          {name}
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Secção para exibir os logótipos dos parceiros de confiança em cartões interativos.
 */
const TrustedBySection = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
            <h2 className="text-center text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-[1.5]">
                Trusted by Healthcare Innovators Worldwide
            </h2>

            <h3 className="text-center text-lg font-semibold text-foreground mb-4 leading-[1.5]">
                We partner with leading organizations to build the future of connected global healthcare.
            </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {partners.map((partner, index) => (
              <PartnerCard key={partner.name} {...partner} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// --- Novos Componentes de Logótipo SVG ---

function GlobalHealthLogo(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.22021 24H43.7802" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 4.22021C28.23 10.1102 31.05 16.8302 32 24.0002C31.05 31.1702 28.23 37.8902 24 43.7802C19.77 37.8902 16.95 31.1702 16 24.0002C16.95 16.8302 19.77 10.1102 24 4.22021V4.22021Z" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WellnessInternationalLogo(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M24 30C30.6274 30 36 24.6274 36 18C36 11.3726 30.6274 6 24 6C17.3726 6 12 11.3726 12 18C12 24.6274 17.3726 30 24 30Z" stroke="currentColor" strokeWidth="3"/>
      <path d="M38 42C38 35.3726 31.6274 30 24 30C16.3726 30 10 35.3726 10 42" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"/>
      <path d="M24 6C20 10 18 14 18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function CareConnectLogo(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M34 14C30.6863 14 28 16.6863 28 20V28C28 31.3137 30.6863 34 34 34" stroke="hsl(var(--accent))" strokeWidth="3" strokeLinecap="round"/>
      <path d="M14 34C17.3137 34 20 31.3137 20 28V20C20 16.6863 17.3137 14 14 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function MedicoAllianceLogo(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 20V32" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 26H30" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function VitaeGroupLogo(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M17 40V28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M31 20V8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M17 34C10.3726 34 5 28.6274 5 22C5 15.3726 10.3726 10 17 10H31C37.6274 10 43 15.3726 43 22C43 28.6274 37.6274 34 31 34H17Z" stroke="hsl(var(--accent))" strokeWidth="3"/>
    </svg>
  );
}

export default TrustedBySection;
