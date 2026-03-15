import React, { useState } from 'react'
import { Microscope, Dna, HeartPulse, Brain, Baby, Shield, Pill, TestTube, Users, Activity, ChevronDown } from 'lucide-react'

const faqIcons = [
  <Microscope size={28} />,
  <Dna size={28} />,
  <HeartPulse size={28} />,
  <Brain size={28} />,
  <Baby size={28} />,
  <Pill size={28} />,
  <TestTube size={28} />,
  <Shield size={28} />,
  <Users size={28} />,
  <Activity size={28} />,
]

const FAQSection = ({ t }) => {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-24 bg-muted/20 reveal-on-scroll">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t.faq.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t.faq.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {t.faq.items.map((item, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-[hsl(var(--luxury-gold))]/30 reveal-on-scroll"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center gap-4 p-6 text-left"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--luxury-gold))]/10 flex items-center justify-center text-[hsl(var(--luxury-gold))]">
                  {faqIcons[index] || <Microscope size={28} />}
                </div>
                <span className="flex-1 text-base font-semibold pr-4">{item.question}</span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-muted-foreground transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-6 pb-6 pl-[88px]">
                  {item.answer.split('\n').map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-muted-foreground text-sm leading-relaxed mb-2 last:mb-0">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {t.faq.closingTitle && (
          <div className="max-w-4xl mx-auto mt-16 text-center reveal-on-scroll">
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t.faq.closingTitle}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{t.faq.closingText}</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default FAQSection