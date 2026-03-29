// Adress: src/pages/
// File: RequestPasswordResetPage.jsx
// Extension: .jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Mail, Loader2, LogIn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// URL for the PHP password reset request script
// IMPORTANT: Adjust this URL to your production endpoint
const PHP_API_URL = 'https://perfectenglish.onnetweb.com/api/request_password_reset.php'; 

const RequestPasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Error Prevention: Client-side email format check
    if (!email || !email.includes('@')) {
        toast({
            title: 'Error',
            description: 'Please enter a valid email address.',
            variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        // We show success even if the email doesn't exist for security reasons (generic message)
        toast({
          title: 'Success',
          description: data.message,
          variant: 'default',
        });
        setEmail('');
      } else {
        // Handle explicit backend errors (e.g., rate limiting)
        toast({
          title: 'Error',
          description: data.message || 'An error occurred while processing your request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Password Reset Request Error:', error);
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Senha - Perfect English</title>
        <meta name="description" content="Página de requisição de redefinição de senha para o Perfect English." />
      </Helmet>
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="space-y-1 text-center">
              <Mail className="w-10 h-10 mx-auto text-primary" />
              <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
              <CardDescription>
                Informe seu email para receber um link de redefinição.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu.email@exemplo.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Enviar Link de Redefinição
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                Lembrou da senha?{' '}
                <Link to="/" className="text-primary hover:underline flex items-center justify-center mt-2">
                  <LogIn className="w-4 h-4 mr-1" />
                  Voltar para o Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default RequestPasswordResetPage;