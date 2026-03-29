import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react'; 

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Dr. Sarah Johnson, ND",
      role: "Naturopathic Doctor",
      quote: "NutraGenius is a game-changer for my practice. It allows me to quickly integrate lab, genetic, and lifestyle data to create truly personalized protocols for my patients. The rule engine is incredibly powerful."
    },
    {
      name: "Mark T., Biohacker",
      role: "Health Enthusiast",
      quote: "I've used every health app out there, and nothing comes close. I finally understand 'why' I need certain supplements based on my own labs and genetics, not just generic advice."
    },
    {
      name: "Emily R.",
      role: "Wellness Seeker",
      quote: "After years of guesswork, I finally have a clear roadmap. My energy levels and digestion have improved dramatically since following my NutraGenius report."
    },
    {
      name: "Alex G., Software Engineer",
      role: "Data-Driven Wellness",
      quote: "As an engineer, I love the data. Seeing my lab markers, genetic data, and symptoms all in one place with clear, actionable insights is exactly what I was looking for. My brain fog is gone."
    }
  ];

  return (
    <section id="testimonials" className="py-20 md:py-28 section-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Professionals & Users</h2>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
          initial="hidden"
          whileInView="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="p-8 bg-card rounded-2xl shadow-lg border h-full flex flex-col glass-effect">
                <div className="flex-grow">
                  <div className="flex text-yellow-500 mb-2"> 
                    <Star fill="currentColor" />
                    <Star fill="currentColor" />
                    <Star fill="currentColor" />
                    <Star fill="currentColor" />
                    <Star fill="currentColor" />
                  </div>
                  <p className="text-lg text-foreground italic">"{testimonial.quote}"</p>
                </div>
                <div className="mt-6">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
