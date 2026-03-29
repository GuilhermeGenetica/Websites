// /src/components/AuthModal.jsx
// Updated to handle Google error messages and display Forgot Password link.

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chrome, LogIn, UserPlus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const AuthModal = ({ isOpen, onClose, initialTab = "signin" }) => {
    const { login, register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);

    // Form states
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');
    const [signUpName, setSignUpName] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    
    // Handle Google error from URL query params
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('google_error')) {
            toast({
                title: "Google Sign-In Unavailable",
                description: "The Google login service is currently unavailable. Please register or sign in directly using your email and password.",
                variant: "destructive",
                duration: 8000,
            });
            // Clean up the URL
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate, toast]);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const loggedInUser = await login(signInEmail, signInPassword);
            if (loggedInUser) {
                onClose();
                navigate(loggedInUser.is_admin ? '/admin' : '/dashboard');
            }
        } catch (error) {
            // Toast is handled in AuthContext
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await register(signUpName, signUpEmail, signUpPassword);
            if (success) {
                toast({
                    title: "Registration Successful!",
                    description: "Please sign in with your new account.",
                });
                setActiveTab("signin");
            }
        } catch (error) {
            // Toast is handled in AuthContext
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-8">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-bold">Welcome to NutraGenius</DialogTitle>
                    <DialogDescription>
                        {activeTab === 'signin' ? "Sign in to access your dashboard." : "Create an account to get started."}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    
                    {/* Sign In Tab */}
                    <TabsContent value="signin">
                        <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                            <div className="space-y-1">
                                <Label htmlFor="signin-email">Email</Label>
                                <Input id="signin-email" type="email" placeholder="you@example.com" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="signin-password">Password</Label>
                                <Input id="signin-password" type="password" placeholder="••••••••" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required disabled={loading} />
                            </div>
                            <Button type="submit" className="w-full gold-bg" disabled={loading}>
                                <LogIn className="mr-2 h-4 w-4" />{loading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                         <p className="mt-4 text-center text-sm">
                            <button onClick={() => navigate('/forgot-password')} className="underline text-muted-foreground hover:text-primary">
                                Forgot Password?
                            </button>
                        </p>
                    </TabsContent>

                    {/* Sign Up Tab */}
                    <TabsContent value="signup">
                        <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                            <div className="space-y-1">
                                <Label htmlFor="signup-name">Full Name</Label>
                                <Input id="signup-name" placeholder="John Doe" value={signUpName} onChange={e => setSignUpName(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" type="email" placeholder="you@example.com" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" type="password" placeholder="Min. 8 characters" minLength="8" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required disabled={loading} />
                            </div>
                            <Button type="submit" className="w-full gold-bg" disabled={loading}>
                                <UserPlus className="mr-2 h-4 w-4" />{loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                </div>

                <Button variant="outline" className="w-full" onClick={loginWithGoogle}>
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default AuthModal;

