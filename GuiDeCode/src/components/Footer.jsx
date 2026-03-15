import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { newsletterApi } from '@/services/api'

const Footer = () => {
  const { theme, toggleTheme } = useTheme()
  const [nlEmail, setNlEmail] = useState('')
  const [nlMsg, setNlMsg] = useState('')

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    if (!nlEmail) return
    try {
      await newsletterApi.subscribe(nlEmail)
      setNlMsg('Subscribed successfully!')
      setNlEmail('')
      setTimeout(() => setNlMsg(''), 3000)
    } catch {
      setNlMsg('Subscription failed. Try again.')
      setTimeout(() => setNlMsg(''), 3000)
    }
  }

  return (
    <footer className="bg-black text-white border-t border-white/10 py-12">
      <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Dr. Guilherme M. Oliveira
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            Medical Geneticist &amp; General Practitioner. Dedicated to precision medicine, clinical genetics and innovative health solutions.
          </p>
        </div>

        <div>
          <span className="font-semibold mb-4 block">Explore</span>
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="text-sm text-white/60 hover:text-white transition-colors">Home</Link>
            <Link to="/blog" className="text-sm text-white/60 hover:text-white transition-colors">Blog</Link>
            <Link to="/contact" className="text-sm text-white/60 hover:text-white transition-colors">Contact</Link>
            <Link to="/workbench/login" className="text-sm text-white/60 hover:text-white transition-colors">WorkBench</Link>
          </nav>
        </div>

        <div>
          <span className="font-semibold mb-4 block">Legal</span>
          <nav className="flex flex-col space-y-2">
            <span className="text-sm text-white/60">Privacy Policy</span>
            <span className="text-sm text-white/60">Terms of Service</span>
            <button onClick={toggleTheme} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors text-left">
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />} Toggle Theme
            </button>
          </nav>
        </div>

        <div>
          <span className="font-semibold mb-4 block">Newsletter</span>
          <p className="text-sm text-white/60 mb-4">Get updates directly in your inbox!</p>
          <form onSubmit={handleNewsletterSubmit} className="space-y-2">
            <input
              type="email"
              placeholder="Your email"
              value={nlEmail}
              onChange={e => setNlEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-[hsl(var(--luxury-gold))]"
            />
            <button type="submit" className="w-full px-3 py-2 bg-[hsl(var(--luxury-gold))] text-black font-semibold rounded text-sm hover:opacity-90 transition-all">
              Subscribe
            </button>
            {nlMsg && <p className="text-xs text-[hsl(var(--luxury-gold))]">{nlMsg}</p>}
          </form>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} Dr. Guilherme de Macedo Oliveira. All rights reserved.
        </p>
        <p className="text-xs text-white/30">ΙΧΘΥΣ</p>
      </div>
    </footer>
  )
}

export default Footer