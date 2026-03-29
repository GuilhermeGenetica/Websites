// Adress: src/pages/
// File: Contact.jsx
// Extension: .jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Mail, Send, Loader2 } from 'lucide-react';

import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PHP_API_URL = 'https://perfectenglish.onnetweb.com/api/contact_form_handler.php';

const Contact = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "📧 Mensagem Enviada!",
          description: "Obrigado por entrar em contacto. Responderemos em breve.",
        });
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
      } else {
        throw new Error(result.message || "Ocorreu um erro inesperado.");
      }
    } catch (error) {
      toast({ title: "❌ Erro ao enviar", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <>
      <Helmet><title>Contacto - Perfect English</title></Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-4">Fale Connosco</h1>
            <p className="text-xl text-muted-foreground">Tem alguma dúvida, sugestão ou precisa de ajuda? Estamos aqui para o ouvir.</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 } }}>
            <Card className="max-w-2xl mx-auto card-border-gradient">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Envie a sua mensagem</CardTitle>
                <CardDescription>Preencha o formulário abaixo e a nossa equipa entrará em contacto.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Seu Nome</Label>
                      <Input id="name" value={formData.name} onChange={handleChange} required autoComplete="name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Seu Email</Label>
                      <Input type="email" id="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input id="subject" value={formData.subject} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Sua Mensagem</Label>
                    <Textarea id="message" value={formData.message} onChange={handleChange} rows={6} required />
                  </div>
                  <Button type="submit" disabled={isSending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {isSending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {isSending ? 'A Enviar...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default Contact;
