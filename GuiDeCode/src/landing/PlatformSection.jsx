import React from 'react'
import { Link } from 'react-router-dom'
import { Monitor, Cpu } from 'lucide-react'

const PlatformSection = ({ t }) => {
  return (
    <section id="platform" className="py-24 bg-muted/20 reveal-on-scroll">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t.platform.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t.platform.desc}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-8 rounded-xl shadow-md border-l-4 border-[hsl(var(--luxury-gold))] reveal-on-scroll">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="text-[hsl(var(--luxury-gold))]" size={24} />
              <h3 className="text-xl font-bold">{t.platform.interface.title}</h3>
            </div>
            <p className="text-muted-foreground">{t.platform.interface.text}</p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-md border-l-4 border-[hsl(var(--luxury-gold))] reveal-on-scroll">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="text-[hsl(var(--luxury-gold))]" size={24} />
              <h3 className="text-xl font-bold">{t.platform.tools.title}</h3>
            </div>
            <p className="text-muted-foreground">{t.platform.tools.text}</p>
          </div>

          <div className="md:col-span-2 text-center mt-8">
            <Link
              to="/workbench/login"
              className="inline-block px-10 py-4 bg-foreground text-background font-bold rounded-lg hover:bg-[hsl(var(--luxury-gold))] hover:text-black transition-all hover:scale-105 shadow-lg"
            >
              {t.platform.btnExplore}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlatformSection