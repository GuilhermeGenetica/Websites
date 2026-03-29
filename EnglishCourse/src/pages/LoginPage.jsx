// Adress: src/pages/
// File: LoginPage.jsx
// Extension: .jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import {
  LogIn, Mail, KeyRound, ShieldCheck, Twitter, Linkedin, Instagram, Loader2
} from 'lucide-react';

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

// Definir as credenciais do administrador para preenchimento e referência
const ADMIN_EMAIL = 'info@perfectenglish.onnetweb.com';
const ADMIN_PASSWORD_HINT = 'adminpass'; // Apenas para referência, não preencher automaticamente

// --- Header Component ---
const Header = () => (
    <header className="py-4 border-b bg-card">
        <div className="container max-w-7xl flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-primary">Perfect English</Link>
            <ThemeToggle />
        </div>
    </header>
);

// --- Footer Component ---
const Footer = () => (
    <footer className="bg-card py-12 border-t">
        <div className="container max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="font-semibold text-foreground">Perfect English</h3>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li><Link to="/about" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
                        <li><Link to="/pricing" className="hover:text-primary transition-colors">Preços</Link></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Contato</Link></li>
                        <li><Link to="/terms-policy" className="hover:text-primary transition-colors">Termos e Política</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Ajuda</h3>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li><a href="/#faq" className="hover:text-primary transition-colors">FAQ</a></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Suporte</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Acesso</h3>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
                        <li><Link to="/" className="hover:text-primary transition-colors">Registo</Link></li>
                        <li>
                            <Link 
                                to="/login?admin=true" 
                                className="hover:text-primary transition-colors font-semibold text-orange-500 flex items-center gap-1"
                            >
                                <ShieldCheck className="w-4 h-4" /> Administração
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Siga-nos</h3>
                    <div className="flex mt-4 space-x-4">
                        <a href="#" className="text-muted-foreground hover:text-primary"><Twitter /></a>
                        <a href="#" className="text-muted-foreground hover:text-primary"><Instagram /></a>
                        <a href="#" className="text-muted-foreground hover:text-primary"><Linkedin /></a>
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Perfect English. Todos os direitos reservados.</p>
            </div>
        </div>
    </footer>
);


const LoginPage = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Efeito para verificar o parâmetro de admin e preencher o email
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
        
        const isAdminLogin = searchParams.get('admin') === 'true';
        if (isAdminLogin) {
            setEmail(ADMIN_EMAIL);
            toast({
                title: "Acesso de Administrador",
                description: `Email preenchido. Insira a senha.`,
                variant: "default",
            });
        }
    }, [isAuthenticated, navigate, searchParams, toast]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                // A função login agora recebe o user e o token
                login(data.user, data.token);
                toast({
                    title: "Sucesso!",
                    description: `Bem-vindo(a) de volta, ${data.user.name}.`,
                });
                
                // Redirecionamento condicional para o Dashboard de Admin
                const from = location.state?.from?.pathname || (data.user.is_admin ? "/admin" : "/dashboard");
                navigate(from, { replace: true });

            } else {
                toast({
                    title: "Erro de Login",
                    description: data.message || "Credenciais inválidas. Tente novamente.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Erro ao efetuar login:", error);
            toast({
                title: "Erro Crítico",
                description: "Não foi possível conectar-se ao servidor.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminLoginClick = () => {
        setEmail(ADMIN_EMAIL);
        setPassword('');
        toast({
            title: "Acesso de Administrador",
            description: `Email preenchido. Insira a senha para entrar.`,
            variant: "default",
        });
    };

    return (
        <>
            <Helmet>
                <title>Login | Perfect English</title>
                <meta name="description" content="Acesse sua conta para continuar sua jornada de fluência em inglês." />
            </Helmet>
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md"
                    >
                        <Card className="shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-3xl font-extrabold flex items-center justify-center gap-2">
                                    <LogIn className="w-6 h-6" /> Acesso à Conta
                                </CardTitle>
                                <CardDescription className="pt-2">
                                    Insira seu email e senha para entrar na plataforma.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="pl-10"
                                            />
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Senha</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pl-10"
                                            />
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <Link to="/request-password-reset" className="text-sm text-primary hover:underline block text-right">Esqueceu a senha?</Link>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                        {isLoading ? 'A Entrar...' : 'Entrar'}
                                    </Button>
                                </form>
                                <div className="mt-6 text-center text-sm text-muted-foreground">
                                    Não tem uma conta? <Link to="/" className="text-primary hover:underline font-semibold">Registe-se</Link>
                                </div>
                                <div className="mt-4 text-center">
                                    <Button variant="link" size="sm" onClick={handleAdminLoginClick} className="text-orange-500 hover:text-orange-600">
                                        <ShieldCheck className="w-4 h-4 mr-1" /> Acesso Rápido de Administração
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </main>
                <Footer />
            </div>
        </>
    );
};

export default LoginPage;
