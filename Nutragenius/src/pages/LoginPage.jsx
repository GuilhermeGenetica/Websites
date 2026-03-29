import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna, Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.is_admin) {
          navigate('/admin');
      } else {
          navigate('/dashboard');
      }
    } catch (error) {
      // Toast is handled within the auth context
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = () => {
    // Redirect to the backend endpoint that starts the Google OAuth flow
    window.location.href = '/api/google_oauth.php';
  };

  return (
    <>
      <Helmet>
        <title>Login - NutraGenius</title>
        <meta name="description" content="Access your personalized NutraGenius dashboard." />
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
              <p className="text-muted-foreground">Welcome back! Sign in to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gold-bg" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;

