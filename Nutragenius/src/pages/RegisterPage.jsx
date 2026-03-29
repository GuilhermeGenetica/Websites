import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import axios from 'axios';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/register.php', formData);
      toast({
        title: 'Registration Successful!',
        description: 'You can now log in with your credentials.',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.error || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - NutraGenius</title>
        <meta name="description" content="Create your NutraGenius account." />
      </Helmet>
      
      <ThemeToggle />

      <div className="min-h-screen flex items-center justify-center luxury-gradient p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl shadow-2xl p-8 border-2 gold-border">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <Dna className="h-10 w-10 gold-accent" />
                <span className="text-3xl font-bold text-foreground">NutraGenius</span>
              </Link>
              <p className="text-muted-foreground">Create your account to begin.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="fullName" placeholder="John Doe" required className="pl-10" onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" required className="pl-10" onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Min. 8 characters" required className="pl-10" minLength="8" onChange={handleChange} disabled={loading} />
                </div>
              </div>

              <Button type="submit" className="w-full gold-bg" disabled={loading}>
                <UserPlus className="mr-2 h-4 w-4" />
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;
