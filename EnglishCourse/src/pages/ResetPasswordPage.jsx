// Adress: src/pages/
// File: ResetPasswordPage.jsx
// Extension: .jsx

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { KeyRound, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// URL for the PHP password reset script
// IMPORTANT: Adjust this URL to your production endpoint
const PHP_API_URL = 'https://perfectenglish.onnetweb.com/api/reset_password.php'; 

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const email = searchParams.get('email'); // Email is also essential

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  // Prevenção de Erro: Check for required URL parameters
  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      toast({
        title: 'Reset Error',
        description: 'Incomplete or invalid reset link.',
        variant: 'destructive',
      });
    }
  }, [token, email, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'The password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setStatus('loading');

    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, new_password: password }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        toast({
          title: 'Success!',
          description: data.message,
          variant: 'default',
        });
        // Redirect to the login page after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        setStatus('error');
        toast({
          title: 'Error',
          description: data.message || 'An error occurred while resetting the password.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Password Reset Error:', error);
      setStatus('error');
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (status === 'error') {
      return (
        <div className="text-center p-6 space-y-4">
          <XCircle className="w-16 h-16 mx-auto text-destructive" />
          <p className="text-lg font-semibold">Invalid or Expired Token.</p>
          <CardDescription>
            The password reset link is invalid or has already been used. Please request a new reset.
          </CardDescription>
          <Link to="/request-password-reset">
            <Button className="w-full mt-4">Request New Reset</Button>
          </Link>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center p-6 space-y-4">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <p className="text-lg font-semibold">Password Reset Successful!</p>
          <CardDescription>
            Your password has been updated. You will be redirected to the login page shortly.
          </CardDescription>
          <Button onClick={() => navigate('/')} className="w-full mt-4">Go to Login</Button>
        </div>
      );
    }

    // Default form (idle/loading)
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="Minimum 8 characters" 
            required 
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="Confirm the new password" 
            required 
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || password !== confirmPassword || password.length < 8}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Lock className="w-4 h-4 mr-2" />
          )}
          Reset Password
        </Button>
      </form>
    );
  };

  return (
    <>
      <Helmet>
        <title>Redefinir Senha - Perfect English</title>
        <meta name="description" content="Página para redefinição da senha com o token de segurança." />
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
              <KeyRound className="w-10 h-10 mx-auto text-primary" />
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              {status === 'idle' && (
                <CardDescription>
                  Set a new password for your account.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {renderContent()}
              
              {(status === 'idle' || status === 'loading') && (
                <div className="mt-6 text-center text-sm">
                  <Link to="/" className="text-primary hover:underline">
                    Cancel and Go Back to Login
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;