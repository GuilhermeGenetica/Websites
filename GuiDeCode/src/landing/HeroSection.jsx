import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, FileText, Monitor } from 'lucide-react'

const HeroSection = ({ t, language }) => {
  const credentials = {
    en: 'MD (FMP) • MSc Clinical Research (Fiocruz) • Medical Genetics Residency (IFF)',
    pt: 'Médico (FMP) • Mestre em Pesquisa Clínica (Fiocruz) • Residência em Genética Médica (IFF)',
    it: 'Medico (FMP) • Master Ricerca Clinica (Fiocruz) • Specializzazione Genetica Medica (IFF)',
  }

  const scrollLabel = {
    en: 'Scroll to Explore',
    pt: 'Role para Explorar',
    it: 'Scorri per Esplorare',
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 luxury-gradient" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="relative top-[60px] z-10 text-center px-6 max-w-4xl mx-auto"> 
        <div className="mb-6">
          <div className="inline-block px-4 py-1 border border-[hsl(var(--luxury-gold))]/30 rounded-full mb-6">
            <span className="text-[hsl(var(--luxury-gold))] text-xs uppercase tracking-[0.3em] font-medium">
              Medical Genetics & Precision Medicine
            </span>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          Dr. Guilherme
          <span className="block luxury-text">de Macedo Oliveira</span>
        </h1>

        <p className="text-lg md:text-xl text-[hsl(var(--luxury-gold))] mb-4 tracking-wide font-light">
          {t.hero.role}
        </p>

        <p className="text-base text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t.hero.bio}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a
            href="#about"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[hsl(var(--luxury-gold))] text-black font-bold rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
          >
            <FileText size={18} />
            {t.about?.btnCv || 'Curriculum'}
          </a>
          <Link
            to="/workbench/login"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-all hover:scale-105"
          >
            <Monitor size={18} />
            {t.platform?.btnExplore || 'Workbench'}
          </Link>
        </div>

        <p className="text-xs text-white/80 font-light">
          {credentials[language] || credentials.en}
        </p>

        <div className="mt-16 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto relative">
            <div className="w-1 h-3 bg-[hsl(var(--luxury-gold))] rounded-full absolute top-2 left-1/2 -translate-x-1/2 animate-pulse" />
          </div>
          <p className="text-xs text-white/50 mt-3 uppercase tracking-widest flex items-center justify-center gap-2">
            <span>{scrollLabel[language] || scrollLabel.en}</span>
            <ChevronDown size={16} className="animate-bounce" />
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}

export default HeroSection