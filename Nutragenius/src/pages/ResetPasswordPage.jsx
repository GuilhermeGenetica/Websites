// /src/pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dna, Lock, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    
    const [token, setToken] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(null); // null, true, or false
    const [message, setMessage] = useState('');

    useEffect(() => {
        const resetToken = searchParams.get('token');
        if (!resetToken) {
            setIsValidToken(false);
            setMessage('Invalid or missing reset token.');
            return;
        }
        setToken(resetToken);
        
        const validateToken = async () => {
            try {
                await axios.post('/api/validate_token.php', { token: resetToken });
                setIsValidToken(true);
            } catch (error) {
                setIsValidToken(false);
                setMessage(error.response?.data?.error || 'The reset link is invalid or has expired.');
            }
        };
        validateToken();
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: 'Passwords do not match', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post('/api/reset_password.php', { token, password });
            toast({
                title: 'Password Reset Successful',
                description: 'You can now log in with your new password.',
            });
            navigate('/login');
        } catch (error) {
            toast({
                title: 'Reset Failed',
                description: error.response?.data?.error || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>Reset Your Password - NutraGenius</title></Helmet>
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
                            <h2 className="text-2xl font-semibold">Set a New Password</h2>
                        </div>

                        {isValidToken === null && <p className="text-center">Validating link...</p>}
                        {isValidToken === false && <p className="text-center text-red-500">{message}</p>}

                        {isValidToken === true && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input id="password" type="password" placeholder="Min. 8 characters" minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="pl-10" />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative mt-1">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input id="confirmPassword" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} className="pl-10" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full gold-bg" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default ResetPasswordPage;
