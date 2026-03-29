// src/components/landing/FaqSection.jsx
// NEW: Created as a modular component.
// EXPANSION: Added two new, relevant FAQs to handle common objections and build trust.

import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.jsx";

const FaqSection = React.forwardRef((props, ref) => {
  const faqs = [
    {
      q: "Is my health data secure?",
      a: "Yes. Data security is our highest priority. We use industry-leading encryption and follow HIPAA and GDPR guidelines to ensure your personal health information is protected. We never sell your data."
    },
    {
      q: "What genetic tests do you support?",
      a: "Our platform is designed to be data-agnostic. You can manually input key genetic variants (SNPs) from any major genetic testing provider, such as 23andMe, AncestryDNA, or specialized functional genomics reports."
    },
    {
      q: "Do I need to provide all data points (labs, genetics, lifestyle)?",
      a: "No, but the more data you provide, the more personalized and accurate your recommendations will be. Our engine can provide insights based on just a lifestyle questionnaire, but its power is truly unlocked when combined with lab and genetic data."
    },
    {
      q: "Who builds the recommendation engine?",
      a: "Our engine is built and curated by a team of functional medicine doctors, naturopaths, and nutrigenomics experts. All recommendations are based on an extensive review of thousands of peer-reviewed scientific studies and clinical data."
    },
    {
      q: "Do I have to buy supplements from your shop?",
      a: "No. Your personalized report is 100% independent. You will receive a downloadable list of all recommended nutrients and foods. Our partner shop is an optional convenience to help you easily find high-quality, third-party tested products."
    },
    {
      q: "Is this a substitute for medical advice?",
      a: "No. NutraGenius is an informational and educational tool. It is not intended to diagnose, treat, cure, or prevent any disease. You should always consult with your physician or qualified health provider before making any changes to your health regimen."
    }
  ];
  return (
    <section id="faq" ref={ref} className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        </motion.div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border-b">
              <AccordionTrigger className="py-4 text-lg font-semibold text-left hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-base text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
});

export default FaqSection;