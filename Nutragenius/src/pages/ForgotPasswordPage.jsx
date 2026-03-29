// /src/pages/ForgotPasswordPage.jsx
// New page for handling the "Forgot Password" functionality.

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const response = await axios.post('/api/forgot_password.php', { email });
            toast({
                title: 'Request Sent',
                description: response.data.message,
            });
            setMessage(response.data.message);
        } catch (error) {
            toast({
                title: 'Request Failed',
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
                <title>Forgot Password - NutraGenius</title>
            </Helmet>
            <div className="min-h-screen flex items-center justify-center luxury-gradient p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-card rounded-2xl shadow-2xl p-8 border-2 gold-border">
                        <div className="text-center mb-8">
                            <Link to="/" className="inline-flex items-center gap-2 mb-4">
                                <Dna className="h-10 w-10 gold-accent" />
                                <span className="text-3xl font-bold">NutraGenius</span>
                            </Link>
                            <h2 className="text-2xl font-semibold">Forgot Your Password?</h2>
                            <p className="text-muted-foreground mt-2">No problem. Enter your email and we'll send you a link to reset it.</p>
                        </div>

                        {message ? (
                             <div className="text-center">
                                <p className="text-green-600 mb-4">{message}</p>
                                <Button onClick={() => navigate('/login')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email" type="email" placeholder="you@example.com"
                                            value={email} onChange={(e) => setEmail(e.target.value)}
                                            required disabled={loading} className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full gold-bg" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>
                        )}
                        
                        <p className="mt-6 text-center text-sm">
                            <button onClick={() => navigate('/login')} className="underline text-muted-foreground hover:text-primary">
                                Back to Login
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
