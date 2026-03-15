import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import { submitContactForm } from '@/services/contactService';
import {
  ArrowLeft, Send, Mail, User, MessageSquare, FileText,
  MapPin, Phone, Globe, Linkedin, Github, GraduationCap,
  CheckCircle, Loader2
} from 'lucide-react';

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        setSubmitted(true);
        toast({ title: 'Message Sent!', description: 'Thank you for reaching out. We will respond soon.' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to send message. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the server. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact | Dr. Guilherme de Macedo Oliveira</title>
        <meta name="description" content="Get in touch with Dr. Guilherme de Macedo Oliveira for inquiries about medical genetics, precision medicine, or collaboration opportunities." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--luxury-navy))] to-background"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-10 w-72 h-72 bg-[hsl(var(--luxury-gold))] rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-5xl md:text-6xl font-bold mb-4 text-white"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Get in <span className="text-[hsl(var(--luxury-gold))]">Touch</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Have a question, proposal, or just want to connect? I would be happy to hear from you.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">

              <div className="lg:col-span-2">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Message Sent!
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Thank you for your message. I will review it and get back to you as soon as possible.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" onClick={() => setSubmitted(false)}>
                        Send Another Message
                      </Button>
                      <Link to="/">
                        <Button className="luxury-gold-gradient text-black font-semibold">
                          Back to Home
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="border-border">
                      <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                          Send a Message
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  name="name"
                                  placeholder="Your full name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  required
                                  className="pl-10"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  name="email"
                                  type="email"
                                  placeholder="your@email.com"
                                  value={formData.email}
                                  onChange={handleChange}
                                  required
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Subject</label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                name="subject"
                                placeholder="What is this about?"
                                value={formData.subject}
                                onChange={handleChange}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Message <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                              name="message"
                              placeholder="Write your message here..."
                              value={formData.message}
                              onChange={handleChange}
                              required
                              rows={6}
                              className="resize-none"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full luxury-gold-gradient text-black font-semibold h-12 text-base"
                          >
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Send Message
                              </div>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-6"
              >
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Contact Information
                    </h3>
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-[hsl(var(--luxury-gold))]/10 rounded-lg flex-shrink-0">
                          <Mail className="h-5 w-5 text-[hsl(var(--luxury-gold))]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <a href="mailto:guilherme.genetica@gmail.com" className="text-sm text-muted-foreground hover:text-[hsl(var(--luxury-gold))] transition-colors break-all">
                            Send an e-mail!
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-[hsl(var(--luxury-gold))]/10 rounded-lg flex-shrink-0">
                          <MapPin className="h-5 w-5 text-[hsl(var(--luxury-gold))]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">
                            Available for remote consultations worldwide
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-[hsl(var(--luxury-gold))]/10 rounded-lg flex-shrink-0">
                          <Globe className="h-5 w-5 text-[hsl(var(--luxury-gold))]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Website</p>
                          <a href="https://guilherme.onnetweb.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[hsl(var(--luxury-gold))] transition-colors">
                            guilherme.onnetweb.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Academic Profiles
                    </h3>
                    <div className="space-y-3">
                      <a
                        href="https://www.researchgate.net/profile/Guilherme-Oliveira-113"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <GraduationCap className="h-5 w-5 text-muted-foreground group-hover:text-[hsl(var(--luxury-gold))] transition-colors" />
                        <span className="text-sm group-hover:text-[hsl(var(--luxury-gold))] transition-colors">ResearchGate</span>
                      </a>
                      <a
                        href="https://www.linkedin.com/in/guilhermemo/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <Linkedin className="h-5 w-5 text-muted-foreground group-hover:text-[hsl(var(--luxury-gold))] transition-colors" />
                        <span className="text-sm group-hover:text-[hsl(var(--luxury-gold))] transition-colors">LinkedIn</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[hsl(var(--luxury-gold))]/20 bg-[hsl(var(--luxury-gold))]/5">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-8 w-8 text-[hsl(var(--luxury-gold))] mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      For clinical inquiries, research collaborations, or speaking engagements, please include relevant details in your message for a faster response.
                    </p>
                  </CardContent>
                </Card>

                <div className="text-center pt-4">
                  <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[hsl(var(--luxury-gold))] transition-colors">
                    <ArrowLeft size={14} /> Back to Portfolio
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ContactPage;