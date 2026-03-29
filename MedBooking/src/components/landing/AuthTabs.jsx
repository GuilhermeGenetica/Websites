import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Stethoscope } from 'lucide-react';

const AuthForm = ({ isLogin, onSubmit, onInputChange, data, userType }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {!isLogin && (
      <div className="space-y-2">
        <Label htmlFor={`${userType}-name`}>Full Name</Label>
        <Input
          id={`${userType}-name`}
          placeholder={userType === 'doctor' ? 'Dr. Your full name' : 'Your full name'}
          value={data.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          required
        />
      </div>
    )}
    <div className="space-y-2">
      <Label htmlFor={`${userType}-email`}>E-mail</Label>
      <Input
        id={`${userType}-email`}
        type="email"
        placeholder="your@email.com"
        value={data.email}
        onChange={(e) => onInputChange('email', e.target.value)}
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${userType}-password`}>Password</Label>
      <Input
        id={`${userType}-password`}
        type="password"
        placeholder="••••••••"
        value={data.password}
        onChange={(e) => onInputChange('password', e.target.value)}
        required
      />
    </div>
    {!isLogin && (
      <div className="space-y-2">
        <Label htmlFor={`${userType}-confirmPassword`}>Confirm Password</Label>
        <Input
          id={`${userType}-confirmPassword`}
          type="password"
          placeholder="••••••••"
          value={data.confirmPassword}
          onChange={(e) => onInputChange('confirmPassword', e.target.value)}
          required
        />
      </div>
    )}
    <Button type="submit" className={`w-full ${userType === 'patient' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'}`}>
      {isLogin ? 'Login' : 'Create Account'}
    </Button>
  </form>
);

const AuthTabs = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('patient');
  const [isLogin, setIsLogin] = useState(true);
  const { API_BASE_URL, login, register, setUser, setUserType, setToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const result = await login(loginData, activeTab); 
    if (result.success) {
      toast({ title: "Login successful!" });
      navigate(activeTab === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    const result = await register(registerData, activeTab);
    if (result.success) {
      toast({ title: "Registration successful!", description: "Please log in." });
      setIsLogin(true);
      setLoginData({ email: registerData.email, password: '' });
    }
  };

  const handleGoogleLogin = async () => {
    const endpoint = activeTab === 'patient'
        ? '/google_auth_initiate_patient.php'
        : '/google_auth_initiate_doctor.php';

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`Server error (${response.status})`);
        
        const data = await response.json();
        if (data.success && data.redirect_url) {
            window.open(data.redirect_url, 'google-auth', 'width=600,height=700,left=' + (window.screen.width / 2 - 300) + ',top=' + (window.screen.height / 2 - 350));
            
            const messageListener = (event) => {
                if (event.origin !== window.location.origin) return;
                if (!event.data || typeof event.data.success !== 'boolean') return;
                
                window.removeEventListener('message', messageListener);
                
                const { success, token, user, error, file, line } = event.data;

                if (success && token && user) {
                    const userDataWithToken = { ...user, token: token };

                    // Atualiza o estado global da aplicação
                    setUser(userDataWithToken);
                    setUserType(user.user_type);
                    setToken(token);

                    // Guarda no localStorage
                    localStorage.setItem('user', JSON.stringify(userDataWithToken));
                    localStorage.setItem('userType', user.user_type);
                    localStorage.setItem('token', token);

                    toast({ title: "Authentication successful!", description: "Redirecting to your dashboard..." });
                    
                    // Usa o navigate do React Router para uma transição suave
                    navigate(`/${user.user_type}/dashboard`);
                } else {
                    const errorMessage = `Authentication failed. ${error || 'Unknown error.'}` + (file ? ` (File: ${file}, Line: ${line})` : '');
                    toast({
                        title: "Google Login Error",
                        description: errorMessage,
                        variant: "destructive",
                        duration: 9000,
                    });
                }
            };
            
            window.addEventListener('message', messageListener, false);
        } else {
            throw new Error(data.message || 'The server response to initiate login is invalid.');
        }
    } catch (error) {
        toast({ title: "Connection Error", description: error.message, variant: "destructive" });
    }
  };

  const handleForgotPassword = () => navigate('/forgot-password');

  const renderForm = (userType) => (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">
          {isLogin ? `Login as ${userType === 'patient' ? 'Patient' : 'Doctor'}` : `Register as ${userType === 'patient' ? 'Patient' : 'Doctor'}`}
        </CardTitle>
        <CardDescription>
          {isLogin ? `Access your account to ${userType === 'patient' ? 'schedule appointments' : 'manage your schedule'}` : `Create your account and ${userType === 'patient' ? 'start taking care of your health' : 'join our network'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLogin ? (
          <AuthForm isLogin={true} onSubmit={handleLoginSubmit} onInputChange={(field, value) => setLoginData(prev => ({ ...prev, [field]: value }))} data={loginData} userType={userType} />
        ) : (
          <AuthForm isLogin={false} onSubmit={handleRegisterSubmit} onInputChange={(field, value) => setRegisterData(prev => ({ ...prev, [field]: value }))} data={registerData} userType={userType} />
        )}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.9c0-14.2 1.1-28.2 3.3-42.1h240.7v83.8H253.3c-11.4 46.2-52.1 79.9-102.7 79.9-60.6 0-109.4-49.2-109.4-109.4s48.8-109.4 109.4-109.4c34.1 0 63.7 15.6 83.3 40.2l62.4-62.4C325.2 89.2 286.8 64 244 64 109.3 64 0 173.3 0 307.9 0 322.1 1.1 335.9 3.3 349.8l-.2-.2C3.1 335.7 3 321.9 3 307.9c0-134.6 109.3-243.9 241-243.9 109.3 0 200.4 66.8 233.4 159.9l-1.3-1.3C485.9 246.2 488 253.9 488 261.8z"></path></svg>
          Sign up with Google
        </Button>
        <div className="mt-6 text-center text-sm">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-semibold text-blue-600 hover:underline ml-1">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
        {isLogin && (
                      <div className="text-center text-sm mt-2">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="font-semibold text-orange-700 dark:text-orange-300 hover:underline hover:text-orange-800 dark:hover:text-orange-200"
                        > Forgot your password?
                        </button>
                      </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger 
          value="patient" 
          className="flex items-center space-x-2 transition-all duration-300 
            hover:bg-gradient-to-b hover:from-blue-200 hover:to-blue-100 
            dark:hover:from-blue-800 dark:hover:to-blue-700 
            data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-300 data-[state=active]:to-blue-100 
            data-[state=active]:text-blue-900 
            dark:data-[state=active]:from-blue-900 dark:data-[state=active]:to-blue-700 
            dark:data-[state=active]:text-blue-100"
        >
          <Users className="w-4 h-4" />
          <span>Patient</span>
        </TabsTrigger>

        <TabsTrigger 
          value="doctor" 
          className="flex items-center space-x-2 transition-all duration-300 
            hover:bg-gradient-to-b hover:from-green-200 hover:to-green-100 
            dark:hover:from-green-800 dark:hover:to-green-700 
            data-[state=active]:bg-gradient-to-b data-[state=active]:from-green-300 data-[state=active]:to-green-100 
            data-[state=active]:text-green-900 
            dark:data-[state=active]:from-green-900 dark:data-[state=active]:to-green-700 
            dark:data-[state=active]:text-green-100"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="patient">{renderForm('patient')}</TabsContent>
      <TabsContent value="doctor">{renderForm('doctor')}</TabsContent>
    </Tabs>
  );
};

export default AuthTabs;
