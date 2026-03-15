import React from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'

const PublicationsSection = ({ t }) => {
  return (
    <section id="publications" className="py-24 reveal-on-scroll">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t.publications.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t.publications.desc}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/*
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex justify-center reveal-on-scroll">
              <div className="relative group">
                <div className="absolute -inset-4 bg-[hsl(var(--luxury-gold))]/10 rounded-2xl blur-xl group-hover:bg-[hsl(var(--luxury-gold))]/20 transition-all duration-500" />
                <img
                  src="/public/capalivro.png"
                  alt={t.publications.bookTitle}
                  className="relative w-64 md:w-80 rounded-xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            </div>

            <div className="space-y-6 reveal-on-scroll">
              <h3 className="text-2xl font-bold luxury-text" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t.publications.bookTitle}
              </h3>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <BookOpen className="text-[hsl(var(--luxury-gold))] flex-shrink-0 mt-1" size={20} />
                  <h4 className="font-bold">{t.publications.vol1.title}</h4>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed pl-8">
                  {t.publications.vol1.text}
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <BookOpen className="text-[hsl(var(--luxury-gold))] flex-shrink-0 mt-1" size={20} />
                  <h4 className="font-bold">{t.publications.vol2.title}</h4>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed pl-8">
                  {t.publications.vol2.text}
                </p>
              </div>

              <div className="pt-4">
                <a
                  href="https://www.amazon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[hsl(var(--luxury-gold))] text-black font-bold rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                >
                  <ExternalLink size={18} />
                  {t.publications.btnBuy}
                </a>
              </div>
            </div>
          </div>
          */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="flex flex-col items-center reveal-on-scroll space-y-6">
              <h3 className="text-2xl font-bold luxury-text text-center lg:hidden" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t.publications.bookTitle}
              </h3>
              <h3 className="text-2xl font-bold luxury-text text-center hidden lg:block" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t.publications.bookTitle}
              </h3>
              <div className="relative group mt-4 lg:mt-0">
                <div className="absolute -inset-4 bg-[hsl(var(--luxury-gold))]/10 rounded-2xl blur-xl group-hover:bg-[hsl(var(--luxury-gold))]/20 transition-all duration-500" />
                <img
                  src="/public/capalivro.png"
                  alt={t.publications.bookTitle}
                  className="relative w-64 md:w-80 rounded-xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500 mx-auto"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-4 reveal-on-scroll h-full">
              <div className="bg-card p-6 rounded-xl border border-border flex-grow flex flex-col justify-center">
                <div className="flex items-start gap-3 mb-3">
                  <BookOpen className="text-[hsl(var(--luxury-gold))] flex-shrink-0 mt-1" size={20} />
                  <h4 className="font-bold">{t.publications.vol1.title}</h4>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed pl-8">
                  {t.publications.vol1.text}
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://www.amazon.com/dp/B0FQ4BZH8Y"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-8 py-3 bg-[hsl(var(--luxury-gold))] text-black font-bold rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                >
                  <ExternalLink size={18} />
                  {t.publications.btnBuy}
                </a>
              </div>
            </div>

            <div className="flex flex-col space-y-4 reveal-on-scroll h-full">
              <div className="bg-card p-6 rounded-xl border border-border flex-grow flex flex-col justify-center">
                <div className="flex items-start gap-3 mb-3">
                  <BookOpen className="text-[hsl(var(--luxury-gold))] flex-shrink-0 mt-1" size={20} />
                  <h4 className="font-bold">{t.publications.vol2.title}</h4>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed pl-8">
                  {t.publications.vol2.text}
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://www.amazon.com/dp/B0FQ4F94V4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-8 py-3 bg-[hsl(var(--luxury-gold))] text-black font-bold rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                >
                  <ExternalLink size={18} />
                  {t.publications.btnBuy}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-4xl mx-auto bg-card p-6 rounded-xl border border-border text-center reveal-on-scroll">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t.publications.resumenotes}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PublicationsSection