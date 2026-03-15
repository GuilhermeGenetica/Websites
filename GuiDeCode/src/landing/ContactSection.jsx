import React from 'react'
import { Send, CalendarDays } from 'lucide-react'

const ContactSection = ({ t, formData, setFormData, handleContactSubmit }) => {
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <section id="contact" className="py-24 reveal-on-scroll">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t.contact.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t.contact.desc}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="bg-card p-8 rounded-xl shadow-2xl border border-border reveal-on-scroll">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.contact.labels.name}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-[hsl(var(--luxury-gold))] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.contact.labels.email}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-[hsl(var(--luxury-gold))] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.contact.labels.subject}</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-[hsl(var(--luxury-gold))] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.contact.labels.message}</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-[hsl(var(--luxury-gold))] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 bg-[hsl(var(--luxury-gold))] text-black font-bold rounded-lg hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
              >
                <Send size={18} />
                {t.contact.labels.send}
              </button>
            </form>
          </div>

          {t.contact.scheduleTitle && (
            <div className="flex flex-col justify-center reveal-on-scroll">
              <div className="bg-card p-8 rounded-xl border border-border">
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--luxury-gold))]/10 flex items-center justify-center mb-6">
                  <CalendarDays className="text-[hsl(var(--luxury-gold))]" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {t.contact.scheduleTitle}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {t.contact.scheduleDesc}
                </p>
                <a
                  href="https://medbooking.app"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[hsl(var(--luxury-gold))] text-[hsl(var(--luxury-gold))] font-bold rounded-lg hover:bg-[hsl(var(--luxury-gold))] hover:text-black transition-all"
                >
                  <CalendarDays size={18} />
                  {t.contact.btnSchedule}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ContactSection