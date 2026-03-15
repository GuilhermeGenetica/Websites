import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, Menu, X, Globe, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { contactApi } from '@/services/api'
import Modal from '@/components/common/Modal'

import HeroSection from '@/landing/HeroSection'
import AboutSection from '@/landing/AboutSection'
import FAQSection from '@/landing/FAQSection'
import PublicationsSection from '@/landing/PublicationsSection'
import TerminalSection from '@/landing/TerminalSection'
import PlatformSection from '@/landing/PlatformSection'
import ContactSection from '@/landing/ContactSection'

import { translations } from '@/lib/translations'

const CurriculumModal = ({ isOpen, onClose, language }) => {
  const cvData = {
    en: {
      title: 'Academic Curriculum',
      sections: [
        { heading: 'Education', items: ['MD — Faculdade de Medicina de Petrópolis', 'Degree Equivalence — Universidade do Porto', 'MSc Medicine Research — Instituto Oswaldo Cruz (Fiocruz)', 'Medical Genetics Residency — Instituto Fernandes Figueira (IFF/Fiocruz)'] },
        { heading: 'Research Interests', items: ['Systems Genetics & Polygenic Risk Scores', 'Quantum Computing Applications in Medicine', 'Machine Learning for Genomic Interpretation', 'Pharmacogenomics & Precision Oncology', 'Catholic Medical Ethics'] },
        { heading: 'Technical Skills', items: ['NGS Analysis (WES, WGS, Gene Panels)', 'Variant Interpretation (ACMG/AMP Guidelines)', 'Bioinformatics Pipelines', 'Clinical Phenotyping & Dysmorphology'] },
      ],
    },
    pt: {
      title: 'Currículo Acadêmico',
      sections: [
        { heading: 'Formação', items: ['Medicina — Faculdade de Medicina de Petrópolis', 'Equivalência de Grau — Universidade do Porto', 'Mestrado em Pesquisa Clínica — Instituto Oswaldo Cruz (Fiocruz)', 'Residência em Genética Médica — Instituto Fernandes Figueira (IFF/Fiocruz)'] },
        { heading: 'Interesses de Pesquisa', items: ['Genética de Sistemas e Escores de Risco Poligênico', 'Computação Quântica Aplicada à Medicina', 'Aprendizado de Máquina para Interpretação Genômica', 'Farmacogenômica e Oncologia de Precisão', 'Ética Médica Católica'] },
        { heading: 'Competências Técnicas', items: ['Análise NGS (WES, WGS, Painéis Genéticos)', 'Interpretação de Variantes (Diretrizes ACMG/AMP)', 'Pipelines Bioinformáticas', 'Fenotipagem Clínica e Dismorfologia'] },
      ],
    },
    it: {
      title: 'Curriculum Accademico',
      sections: [
        { heading: 'Formazione', items: ['Laurea in Medicina — Faculdade de Medicina de Petrópolis', 'Equivalenza del Titolo — Universidade do Porto', 'Master in Ricerca Medica — Instituto Oswaldo Cruz (Fiocruz)', 'Specializzazione in Genetica Medica — Istituto Fernandes Figueira (IFF/Fiocruz)'] },
        { heading: 'Interessi di Ricerca', items: ['Genetica dei Sistemi e Punteggi di Rischio Poligenico', 'Computazione Quantistica Applicata alla Medicina', 'Machine Learning per l\'Interpretazione Genomica', 'Farmacogenomica e Oncologia di Precisione', 'Etica Medica Cattolica'] },
        { heading: 'Competenze Tecniche', items: ['Analisi NGS (WES, WGS, Pannelli Genici)', 'Interpretazione delle Varianti (Linee Guida ACMG/AMP)', 'Pipeline Bioinformatiche', 'Fenotipizzazione Clinica e Dismorfologia'] },
      ],
    },
  }

  const cv = cvData[language] || cvData.en

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cv.title} maxWidth="max-w-3xl">
      <div className="space-y-8">
        {cv.sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-lg font-bold mb-3 luxury-text">{section.heading}</h3>
            <ul className="space-y-2">
              {section.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-[hsl(var(--luxury-gold))] mt-1">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="pt-4 text-center">
          <a
            href="http://lattes.cnpq.br/5775056717193759"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 border border-[hsl(var(--luxury-gold))] text-[hsl(var(--luxury-gold))] rounded-lg hover:bg-[hsl(var(--luxury-gold))] hover:text-black transition-all text-sm font-medium"
          >
            <GraduationCap size={16} />
            Lattes CV
          </a>
        </div>
      </div>
    </Modal>
  )
}

const HomePage = () => {
  const { theme, toggleTheme } = useTheme()
  const [language, setLanguage] = useState('en')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cvModalOpen, setCvModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })

  const t = translations[language]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('reveal-animation')
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    try {
      await contactApi.submit(formData)
      alert(t.contact.success)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch {
      alert(t.contact.error)
    }
  }

  const cycleLanguage = () => {
    const langs = ['en', 'pt', 'it']
    const idx = langs.indexOf(language)
    setLanguage(langs[(idx + 1) % langs.length])
  }

  const languageLabels = { en: 'English', pt: 'Português', it: 'Italiano' }

  const footerDesc = {
    en: 'Innovation in Medical Genetics and Precision Medicine. Integrated approaches through advanced technology and humanized care.',
    pt: 'Inovação em Genética Médica e Medicina de Precisão. Abordagens integradas através de tecnologia avançada e cuidado humanizado.',
    it: 'Innovazione in Genetica Medica e Medicina di Precisione. Approcci integrati attraverso tecnologie avanzate e cure umanizzate.',
  }
  const footerNav = { en: 'Navigation', pt: 'Navegação', it: 'Navigazione' }
  const footerSocial = { en: 'Social & Academic', pt: 'Social e Acadêmico', it: 'Social e Accademico' }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Dr. Guilherme de Macedo Oliveira - Medical Geneticist & Precision Medicine Researcher</title>
        <meta name="description" content="Medical Genetics practice and Precision Medicine research integrating genomic analysis, quantum causality modeling, and evidence-based clinical protocols." />
      </Helmet>

      <CurriculumModal isOpen={cvModalOpen} onClose={() => setCvModalOpen(false)} language={language} />

      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/90 backdrop-blur-md shadow-lg border-b border-border' : 'bg-background/70'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center space-x-2">
            <span className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              GuiDeCode
            </span>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.about}</a>
            <a href="#faq" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.faq}</a>
            <a href="#publications" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.publications}</a>
            <a href="#platform" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.platform}</a>
            <a href="#contact" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.contact}</a>
            <Link to="/blog" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.blog}</Link>

            <button onClick={cycleLanguage} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors" title="Change Language">
              <Globe size={20} />
              <span className="text-sm font-medium">{languageLabels[language]}</span>
            </button>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link to="/workbench/login" className="px-4 py-2 bg-[hsl(var(--luxury-gold))] text-black font-medium rounded hover:opacity-90 transition-all">
              {t.nav.login}
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <div className="container mx-auto px-6 py-4 flex flex-col space-y-4">
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.about}</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.faq}</a>
              <a href="#publications" onClick={() => setMobileMenuOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.publications}</a>
              <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.platform}</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.contact}</a>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">{t.nav.blog}</Link>
              <button onClick={cycleLanguage} className="flex items-center gap-2 hover:text-[hsl(var(--luxury-gold))] transition-colors">
                <Globe size={18} /> {languageLabels[language]}
              </button>
              <Link to="/workbench/login" onClick={() => setMobileMenuOpen(false)} className="inline-block px-4 py-2 bg-[hsl(var(--luxury-gold))] text-black font-medium rounded hover:opacity-90 transition-all text-center">
                {t.nav.login}
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main>
        <HeroSection t={t} language={language} />
        <AboutSection t={t} onOpenCurriculum={() => setCvModalOpen(true)} />
        <FAQSection t={t} />
        <PublicationsSection t={t} />
        <TerminalSection t={t} language={language} />
        <PlatformSection t={t} />
        <ContactSection t={t} formData={formData} setFormData={setFormData} handleContactSubmit={handleContactSubmit} />
      </main>

      <footer className="bg-black text-white border-t border-white/10 py-12">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div>
            <h2 className="text-lg font-bold mb-4">Dr. Guilherme de Macedo Oliveira</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {footerDesc[language] || footerDesc.en}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">{footerNav[language] || footerNav.en}</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {['about', 'faq', 'publications', 'platform', 'contact'].map(item => (
                <li key={item}>
                  <a href={`#${item}`} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">
                    {t.nav[item]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">{footerSocial[language] || footerSocial.en}</h3>
            <div className="flex space-x-6 text-2xl">
              <a
                href="https://www.researchgate.net/profile/Guilherme-Oliveira-113"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[hsl(var(--luxury-gold))] transition-all transform hover:scale-110"
                aria-label="ResearchGate"
              >
                <GraduationCap />
              </a>
              <a
                href="https://guilherme.onnetweb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[hsl(var(--luxury-gold))] transition-all transform hover:scale-110"
                aria-label="Portfolio"
              >
                <Globe />
              </a>
            </div>
          </div>
        </div>
        <div className="text-center mt-12 pt-8 border-t border-white/5 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Dr. Guilherme de Macedo Oliveira. All rights reserved.
          <span className="block mt-2 opacity-30 font-mono">ΙΧΘΥΣ</span>
        </div>
      </footer>
    </div>
  )
}

export default HomePage