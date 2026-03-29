import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna, Mail, Lock, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch (error) {
      // Toast is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - NutraGenius</title>
        <meta name="description" content="Access the NutraGenius administration panel." />
      </Helmet>
      
      <ThemeToggle />

      <div className="min-h-screen flex items-center justify-center luxury-gradient p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl shadow-2xl p-8 border-2 gold-border">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <Dna className="h-10 w-10 gold-accent" />
                <span className="text-3xl font-bold text-foreground">NutraGenius</span>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">Admin Portal</h1>
              <p className="text-muted-foreground">Sign in to manage the platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
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
                <UserCog className="mr-2 h-4 w-4" />
                {loading ? 'Authenticating...' : 'Enter Admin Portal'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Are you a user? Login here.
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLoginPage;