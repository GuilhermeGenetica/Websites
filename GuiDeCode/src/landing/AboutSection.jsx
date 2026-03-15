import React from 'react'
import { Award } from 'lucide-react'

const AboutSection = ({ t, onOpenCurriculum }) => {
  return (
    <section id="about" className="py-24 reveal-on-scroll">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t.about.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t.about.desc}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {t.about.cards.map((card, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-xl shadow-lg border border-border hover:border-[hsl(var(--luxury-gold))]/30 transition-all duration-300 hover:-translate-y-1 reveal-on-scroll"
            >
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--luxury-gold))]/10 flex items-center justify-center mb-6">
                <Award className="text-[hsl(var(--luxury-gold))]" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{card.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>

        <div className="text-center reveal-on-scroll">
          <button
            onClick={onOpenCurriculum}
            className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background font-bold rounded-lg hover:bg-[hsl(var(--luxury-gold))] hover:text-black transition-all hover:scale-105 shadow-lg"
          >
            <Award size={18} />
            {t.about.btnCv}
          </button>
          {t.about.cvSubtext && (
            <p className="mt-3 text-xs text-muted-foreground">{t.about.cvSubtext}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default AboutSection