// src/pages/WorkbenchLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { authApi } from '@/services/api';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    features: [
      'Settings & Preferences',
      'GuideLines Clinical Library',
      'Contacts App',
      'Curriculum Viewer',
    ],
    locked: [
      'Appointments Scheduling',
      'Medical Calculators',
      'Grapho MAP 3D',
      'Sticky Notes',
      'Terminal & Script Viewer',
    ],
    highlight: false,
    badge: '',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$3.90',
    period: '/month',
    features: [
      'Everything in Free',
      'Appointments Scheduling',
      'Medical Calculators',
      'Sticky Notes',
      'Grapho MAP 3D',
    ],
    locked: [
      'File Manager',
      'Terminal Access',
      'Script Viewer',
    ],
    highlight: true,
    badge: 'POPULAR',
  },
  {
    id: 'complete',
    name: 'Complete',
    price: '$9.90',
    period: '/month',
    features: [
      'Everything in Basic',
      'File Manager',
      'Terminal Access',
      'Script Viewer',
      'All Future Applications',
      'Priority Support',
    ],
    locked: [],
    highlight: false,
    badge: 'FULL ACCESS',
  },
];

const WorkbenchLogin = () => {
  const { wbLogin, wbRegister, user, loading } = useWorkbench();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/workbench', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      setSuccessMsg('Payment successful! Please login to access your upgraded plan.');
      setTimeout(() => setSuccessMsg(''), 6000);
    } else if (status === 'cancelled') {
      setError('Payment was cancelled.');
      setTimeout(() => setError(''), 4000);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);
    
    try {
      if (mode === 'forgot') {
        if (!email.trim()) { setError('Email is required'); setIsSubmitting(false); return; }
        const res = await authApi.forgotPassword(email);
        if (res.success) {
          setSuccessMsg('If the email is registered, a reset link was sent.');
          setMode('login');
        } else {
          setError(res.error || 'Failed to request password reset.');
        }
      } else if (mode === 'login') {
        const result = await wbLogin(email, password);
        if (result.success) {
          navigate('/workbench', { replace: true });
        } else {
          setError(result.error || 'Authentication failed');
        }
      } else if (mode === 'register') {
        if (!name.trim()) { setError('Full name is required'); setIsSubmitting(false); return; }
        const result = await wbRegister(email, password, name);
        if (result.success) {
          navigate('/workbench', { replace: true });
        } else {
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async (planId) => {
    if (planId === 'free') return;
    
    if (!user) {
      setError('Please create an account or sign in first to subscribe.');
      setMode('register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setError(''), 5000);
      return;
    }

    setCheckoutLoading(true);
    try {
      const data = await authApi.createCheckoutSession(planId);
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not create checkout session.');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Checkout error');
      setTimeout(() => setError(''), 4000);
    }
    setCheckoutLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--luxury-navy))]/5 to-transparent pointer-events-none" />

          <section className="container mx-auto px-6 py-12 md:py-16">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-[hsl(var(--luxury-gold))] rounded-xl flex items-center justify-center text-black font-black text-xl" style={{ fontFamily: 'monospace' }}>
                  WB
                </div>
                <div className="text-left">
                  <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    WorkBench
                  </h1>
                  <p className="text-sm text-muted-foreground">Professional Medical Desktop Environment</p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Access powerful clinical tools, database management, file exploration, and medical resources — all in one integrated workspace.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto items-start">

              <motion.div
                className="lg:col-span-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg sticky top-24">
                  <div className="bg-[hsl(var(--luxury-gold))] px-6 py-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-black/20" />
                    <span className="w-3 h-3 rounded-full bg-black/20" />
                    <span className="w-3 h-3 rounded-full bg-black/20" />
                    <span className="text-sm font-bold text-black ml-2">
                      {mode === 'login' && 'Sign In — WorkBench'}
                      {mode === 'register' && 'Create Account — WorkBench'}
                      {mode === 'forgot' && 'Reset Password — WorkBench'}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex mb-6 border-b border-border">
                      <button
                        className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${mode === 'login' ? 'text-[hsl(var(--luxury-gold))] border-[hsl(var(--luxury-gold))]' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                        onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                      >
                        Sign In
                      </button>
                      <button
                        className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${mode === 'register' ? 'text-[hsl(var(--luxury-gold))] border-[hsl(var(--luxury-gold))]' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                        onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                      >
                        Register
                      </button>
                    </div>

                    {successMsg && (
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
                        {successMsg}
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.form
                        key={mode}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {mode === 'register' && (
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Full Name</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--luxury-gold))]/50 focus:border-[hsl(var(--luxury-gold))]"
                              value={name}
                              onChange={e => setName(e.target.value)}
                              placeholder="Dr. John Doe"
                              required
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium mb-1.5">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--luxury-gold))]/50 focus:border-[hsl(var(--luxury-gold))]"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                          />
                        </div>

                        {mode !== 'forgot' && (
                          <div>
                            <div className="flex justify-between items-end mb-1.5">
                              <label className="block text-sm font-medium">Password</label>
                              {mode === 'login' && (
                                <button 
                                  type="button" 
                                  onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                                  className="text-xs text-muted-foreground hover:text-[hsl(var(--luxury-gold))] transition-colors"
                                >
                                  Forgot Password?
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type={showPass ? 'text' : 'password'}
                                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--luxury-gold))]/50 focus:border-[hsl(var(--luxury-gold))] pr-12"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg"
                                onClick={() => setShowPass(v => !v)}
                              >
                                {showPass ? '🙈' : '👁️'}
                              </button>
                            </div>
                          </div>
                        )}

                        {error && (
                          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                            {error}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[hsl(var(--luxury-gold))] text-black font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : (
                            mode === 'login' ? 'ENTER WORKBENCH' : 
                            mode === 'register' ? 'CREATE ACCOUNT' : 
                            'SEND RECOVERY LINK'
                          )}
                        </button>

                        <div className="pt-2">
                          {mode === 'login' && (
                            <p className="text-center text-xs text-muted-foreground">
                              Don't have an account?{' '}
                              <button type="button" onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }} className="text-[hsl(var(--luxury-gold))] hover:underline">
                                Register here
                              </button>
                            </p>
                          )}
                          {(mode === 'register' || mode === 'forgot') && (
                            <p className="text-center text-xs text-muted-foreground">
                              Already have an account?{' '}
                              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="text-[hsl(var(--luxury-gold))] hover:underline">
                                Sign in
                              </button>
                            </p>
                          )}
                        </div>
                      </motion.form>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="lg:col-span-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Choose Your Plan</h2>
                  <p className="text-muted-foreground">Subscribe securely via Stripe to unlock advanced features.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col p-6 rounded-xl border-2 transition-all bg-card ${
                        plan.highlight
                          ? 'border-[hsl(var(--luxury-gold))] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                          : 'border-border hover:border-[hsl(var(--luxury-gold))]/40'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[hsl(var(--luxury-gold))] text-black text-xs font-bold rounded-full uppercase tracking-wider shadow-lg">
                          {plan.badge}
                        </span>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <div className="flex items-end justify-center gap-1">
                          <span className={`text-3xl font-black ${plan.highlight ? 'text-[hsl(var(--luxury-gold))]' : 'text-foreground'}`}>
                            {plan.price}
                          </span>
                          {plan.period && <span className="text-sm text-muted-foreground pb-1">{plan.period}</span>}
                        </div>
                      </div>

                      <div className="space-y-3 flex-1">
                        {plan.features.map((f, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm">
                            <span className="text-green-500 text-sm mt-0.5">✓</span>
                            <span className="leading-snug">{f}</span>
                          </div>
                        ))}
                        {plan.locked.map((f, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground opacity-60">
                            <span className="text-xs mt-0.5">🔒</span>
                            <span className="leading-snug">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 pt-4 border-t border-border">
                        {plan.id === 'free' ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-muted text-muted-foreground font-bold rounded-lg cursor-not-allowed text-sm"
                          >
                            Included by Default
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckout(plan.id)}
                            disabled={checkoutLoading}
                            className={`w-full py-2.5 font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
                              plan.highlight 
                                ? 'bg-[hsl(var(--luxury-gold))] text-black hover:opacity-90 shadow-md' 
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                            }`}
                          >
                            {checkoutLoading ? (
                              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              `Subscribe to ${plan.name}`
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center pt-8">
                  All subscriptions are managed securely via Stripe. You can cancel at any time directly from the application settings.
                </p>
              </motion.div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WorkbenchLogin;