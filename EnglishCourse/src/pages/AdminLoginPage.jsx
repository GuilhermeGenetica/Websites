import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Mail, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';
const ADMIN_EMAIL = 'info@perfectenglish.onnetweb.com';

const AdminLoginPage = () => {
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [email, setEmail] = useState(ADMIN_EMAIL);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (isAuthenticated && user?.is_admin) {
            navigate('/admin', { replace: true });
        } else if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);


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

            if (data.success && data.user.is_admin) {
                login(data.user, data.token);
                toast({
                    title: "Sucesso!",
                    description: `Bem-vindo, Administrador ${data.user.name}.`,
                });
                navigate('/admin', { replace: true });
            } else if (data.success && !data.user.is_admin) {
                 toast({
                    title: "Acesso Negado",
                    description: "Esta conta não tem permissões de administrador.",
                    variant: "destructive",
                });
            }
            else {
                toast({
                    title: "Erro de Login",
                    description: data.message || "Credenciais inválidas.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Erro de Conexão",
                description: "Não foi possível conectar-se ao servidor.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Admin Login | Perfect English</title>
            </Helmet>
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                 <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm"
                >
                    <Card className="shadow-2xl">
                        <CardHeader className="text-center">
                             <ShieldCheck className="w-12 h-12 mx-auto text-primary" />
                            <CardTitle className="text-2xl font-bold mt-2">
                                Acesso de Administrador
                            </CardTitle>
                            <CardDescription className="pt-1">
                                Insira as suas credenciais para gerir o sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email de Administrador</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            readOnly
                                            className="pl-10 bg-muted/50"
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
                                            autoFocus
                                            className="pl-10"
                                        />
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'A Validar...' : 'Entrar'}
                                </Button>
                            </form>
                            <div className="mt-6 text-center text-sm">
                                <Link to="/" className="text-primary hover:underline">Voltar à Página Inicial</Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default AdminLoginPage;
