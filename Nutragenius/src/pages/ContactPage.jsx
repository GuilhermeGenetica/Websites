import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, User, MessageSquare, Send, Phone, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import axios from 'axios';

const ContactPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/contact.php', formData);
      toast({
        title: 'Message Sent!',
        description: response.data.message || "We'll get back to you shortly.",
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
       toast({
        title: 'Error Sending Message',
        description: error.response?.data?.error || "An unexpected error occurred.",
        variant: 'destructive',
      });
    } finally {
        setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - NutraGenius</title>
        <meta name="description" content="Get in touch with the NutraGenius team. Send us a message, find our address, or give us a call. We're here to help."/>
      </Helmet>

      <ThemeToggle />

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold">Get in Touch</h1>
            <p className="text-muted-foreground mt-2">We're here to help and answer any question you might have. We look forward to hearing from you.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-8 rounded-2xl shadow-xl border"
            >
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="name" placeholder="Your Name" value={formData.name} onChange={handleInputChange} required className="pl-10"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                   <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} required className="pl-10"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                   <div className="relative">
                      <MessageSquare className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
                      <Textarea id="message" placeholder="Your question or feedback..." value={formData.message} onChange={handleInputChange} required className="pl-10" rows={5}/>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-card p-8 rounded-2xl shadow-xl border">
                 <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                 <div className="space-y-4 text-muted-foreground">
                   <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      {/* Endereço atualizado */}
                      <span>Avenida Ribeiro dos Cravos, S/N,<br/>Vale de Prazeres, Fundão, Castelo Branco - Portugal<br/>ZIP 6230-788</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>(+351) 123 456 789</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <Mail className="w-5 h-5 text-primary" />
                      <span>info@nutragenius.com</span>
                   </div>
                    <div className="flex items-start gap-4">
                      <Building className="w-5 h-5 text-primary mt-1" />
                      <span>Business Hours: Mon-Fri, 9am - 5pm WET (Western European Time)</span>
                    </div>
                 </div>
              </div>
              <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
                {/* Iframe do Google Maps atualizado para Fundão, Portugal */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d24430.43577315668!2d-7.519969641285227!3d40.13840016027584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd3d4e7a443b81d7%3A0x6540d6c0d86e1a47!2sFund%C3%A3o%2C%20Portugal!5e0!3m2!1sen!2sus!4v1730102700000!5m2!1sen!2sus"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Company Location (Fundão, Portugal)"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
