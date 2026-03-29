import React from 'react';
// import { Helmet } from 'react-helmet'; // Removido para corrigir o erro de compilação
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Dna, Microscope, Target, BrainCircuit, LineChart, Network, Globe } from 'lucide-react';
// import { Button } from '@/components/ui/button'; // Removido para corrigir o erro de compilação
// import { ThemeToggle } from '@/components/ThemeToggle'; // Removido para corrigir o erro de compilação

const AboutUsPage = () => {
  const navigate = useNavigate();

  const teamMembers = [
    // CORREÇÃO 1: Alterado de 'imageSrc' para 'imageUrl' para ser consistente
    { name: 'Dr. Michele Costa', role: 'Founder & CEO \n Head of Nutrigenomics and Nutraceutics \n Head of Global Compliance',  imageUrl: '/media/michele.jpg' },
    { name: 'Dr. Guilherme Oliveira', role: 'Chief Genomic Scientific Officer \n Chief Genetic Medical Officer \n Chief Technology Officer', imageUrl: '/media/guilherme.jpg' },
  ];

  return (
    <>
      {/* <Helmet>
        <title>About Us - NutraGenius</title>
        <meta name="description" content="Learn about the mission, vision, and team behind NutraGenius, the global leader in personalized nutrition." />
      </Helmet> */}
      
      {/* <ThemeToggle /> */}

      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto py-12 px-4">
          <button 
            onClick={() => navigate('/')} 
            className="mb-8 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 text-left justify-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">About NutraGenius</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                The Global Leader in Personalized Health through Data, Genomics, and Artificial Intelligence.
              </p>
            </div>

            {/* Our Story Section */}
            <div className="max-w-3xl mx-auto mb-20 text-center">
                <h2 className="text-3xl font-bold mb-4">Our Founding Principle</h2>
                <p className="text-lg text-muted-foreground">
                  Founded by a world-class team of specialists, NutraGenius was established on a simple, powerful idea: healthcare must be proactive, not reactive. We rejected the world of generic advice and one-size-fits-all solutions. We are the engine for a new future in health, translating complex biological data into actionable, personalized, and life-changing insights for everyone, everywhere.
                </p>
            </div>

            {/* Mission and Vision Section */}
            <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <img src="/media/about1.jpg" alt="Scientists collaborating in a lab" className="rounded-lg shadow-xl w-full h-auto" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <h2 className="text-3xl font-bold mb-4 flex items-center"><Target className="w-8 h-8 mr-3 text-primary"/> Our Mission</h2>
                <p className="text-muted-foreground mb-6">
                  To empower individuals and healthcare professionals with data-driven, hyper-personalized nutritional and lifestyle strategies. We strive to replace guesswork with genomic precision, making optimal health accessible, actionable, and achievable for everyone.
                </p>
                <h2 className="text-3xl font-bold mb-4 flex items-center"><Globe className="w-8 h-8 mr-3 text-primary"/> Our Vision</h2>
                <p className="text-muted-foreground">
                  To be the world's most trusted and scientifically advanced platform for personalized health, setting the global standard where individual biological blueprints inform all preventative and therapeutic choices, leading to longer, healthier, and more vibrant lives.
                </p>
              </motion.div>
            </div>

            {/* The Science Behind NutraGenius */}
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The Science Behind NutraGenius</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
                Our platform is built on a foundation of rigorous scientific principles, integrating multiple layers of biological data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="p-6 border rounded-lg bg-card">
                  <Microscope className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nutrigenomics</h3>
                  <p className="text-muted-foreground">We analyze how your specific genetic variants influence your response to different nutrients, allowing for truly personalized recommendations.</p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <LineChart className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Biomarker Analysis</h3>
                  <p className="text-muted-foreground">By interpreting your lab results, we gain a real-time snapshot of your metabolic health, identifying imbalances and opportunities for optimization.</p>
                </div>
                 <div className="p-6 border rounded-lg bg-card">
                  <Dna className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Pharmaconutrigenomics</h3>
                  <p className="text-muted-foreground">We assess gene-drug and gene-supplement interactions to provide precision recommendations for supplements and nutraceuticals.</p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                   <BrainCircuit className="mx-auto h-12 w-12 text-primary mb-4" />
                   <h3 className="text-xl font-semibold mb-2">AI & Systems Biology</h3>
                   <p className="text-muted-foreground">Our AI understands the body as a complex system. It connects the dots between your genes, biomarkers, and lifestyle to see the complete health picture.</p>
                </div>
              </div>
            </div>

             {/* Our Global Standard Section (Replaces IPO section) */}
            <div className="bg-card border rounded-lg p-10 md:p-16 mb-20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <h2 className="text-3xl font-bold mb-6">Our Global Standard</h2>
                    <p className="text-muted-foreground mb-4">
                      As the established global leader in personalized health, NutraGenius sets the benchmark for nutritional, pharmaconutrigenomic, and nutrigenetic assessment. Our platform is trusted by clinicians, hospital systems, and individuals across six continents.
                    </p>
                    <p className="text-muted-foreground">
                      Our global scale is built on a non-negotiable foundation of scientific integrity and full regulatory compliance in every market we serve. We are the trusted partner for organizations seeking to implement precision health at scale, backed by a proven, secure, and scientifically-validated infrastructure.
                    </p>
                  </motion.div>
                   <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <img src="/media/about2.jpg" alt="Global network connections" className="rounded-lg shadow-xl w-full h-auto" />
                  </motion.div>
              </div>
            </div>


            {/* Meet the Team Section */}
            <div className="text-center place-items-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Leadership</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
                NutraGenius is led by a world-class team of scientists, doctors, and technologists passionate about preventative health.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 place-items-center">
                {teamMembers.map((member, index) => (
                  <motion.div 
                    key={index}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <img 
                      src={member.imageUrl} 
                      alt={`Portrait of ${member.name}`} 
                      className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/eeeeee/333333?text=NG"; }}
                    />
                    <h3 className="text-xl font-semibold">{member.name}</h3>
                    <p className="text-primary whitespace-pre-line">{member.role}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AboutUsPage;