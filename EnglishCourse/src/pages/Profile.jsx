import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { User, KeyRound, Save, Loader2, Crown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

const Profile = () => {
    const { user, token, fetchAndUpdateUser } = useAuth();
    const { fetchUserData } = useUser();
    const { toast } = useToast();
    const navigate = useNavigate();
    
    const [isManaging, setIsManaging] = useState(false);
    
    const [profileData, setProfileData] = useState({ name: '', level: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name || '', level: user.level || 'A1' });
        }
    }, [user]);

    if (!user) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        const originalLevel = user.level;

        try {
            const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: profileData.name, level: profileData.level }),
            });
            const result = await response.json();
            
            if (!result.success) throw new Error(result.message);
            
            await fetchAndUpdateUser(); 
            
            if (originalLevel !== profileData.level) {
                await fetchUserData();
            }

            toast({ title: "✅ Sucesso", description: "O seu perfil foi atualizado." });

        } catch (error) {
            toast({ title: "❌ Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 8) {
            toast({ title: "❌ Erro", description: "A nova senha deve ter pelo menos 8 caracteres.", variant: "destructive" });
            return;
        }
        setIsSavingPassword(true);
        try {
            const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    currentPassword: passwordData.currentPassword, 
                    newPassword: passwordData.newPassword 
                }),
            });
             const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            toast({ title: "✅ Sucesso", description: "A sua senha foi alterada." });
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (error) {
            toast({ title: "❌ Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsManaging(true);
        try {
             const response = await fetch(`${API_BASE_URL}/manage_subscription.php`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ userId: user.id })
             });
             const result = await response.json();
             if (result.success && result.url) {
                 window.location.href = result.url;
             } else {
                 throw new Error(result.error || 'Não foi possível aceder à gestão da sua assinatura.');
             }
        } catch (error) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setIsManaging(false);
        }
    };
    
    // CORREÇÃO: Define se o botão de gerir assinatura deve estar ativo
    const canManageSubscription = user.plan === 'premium' && user.is_active && user.stripe_subscription_id;

    return (
        <>
            <Helmet><title>Meu Perfil - Perfect English</title></Helmet>
            <TooltipProvider>
            <div className="min-h-screen bg-background">
                <Navigation />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Minha Conta</h1>
                        <p className="text-muted-foreground">Gerencie as suas informações, assinatura e segurança.</p>
                    </motion.div>

                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="profile">Perfil</TabsTrigger>
                            <TabsTrigger value="security">Segurança</TabsTrigger>
                            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="mt-6">
                            <Card>
                                <CardHeader><CardTitle>Informações do Perfil</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleProfileSave} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome Completo</Label>
                                            <Input 
                                                id="name" 
                                                value={profileData.name} 
                                                onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" value={user.email} disabled />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="level">Nível de Inglês</Label>
                                            <Select value={profileData.level} onValueChange={(v) => setProfileData({...profileData, level: v})}>
                                                {/* CORREÇÃO: Adicionado placeholder no SelectValue */}
                                                <SelectTrigger><SelectValue placeholder="Selecione o seu nível..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A1">A1 - Iniciante</SelectItem>
                                                    <SelectItem value="A2">A2 - Básico</SelectItem>
                                                    <SelectItem value="B1">B1 - Intermediário</SelectItem>
                                                    <SelectItem value="B2">B2 - Intermediário Superior</SelectItem>
                                                    <SelectItem value="C1">C1 - Avançado</SelectItem>
                                                    <SelectItem value="C2">C2 - Proficiente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground pt-1">Mudar de nível reiniciará o seu progresso no cronograma atual.</p>
                                        </div>
                                        <Button type="submit" disabled={isSavingProfile}>
                                            {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Salvar Alterações
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="mt-6">
                            <Card>
                                <CardHeader><CardTitle>Alterar Senha</CardTitle></CardHeader>
                                <CardContent>
                                   <form onSubmit={handlePasswordSave} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Senha Atual</Label>
                                        <Input 
                                            id="currentPassword" 
                                            type="password" 
                                            value={passwordData.currentPassword} 
                                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nova Senha</Label>
                                        <Input 
                                            id="newPassword" 
                                            type="password" 
                                            value={passwordData.newPassword} 
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                     <Button type="submit" disabled={isSavingPassword || !passwordData.currentPassword || !passwordData.newPassword}>
                                        {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                        Atualizar Senha
                                    </Button>
                                   </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                         <TabsContent value="subscription" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Minha Assinatura</CardTitle>
                                    <CardDescription>Visualize o estado da sua assinatura e faça alterações.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-muted/50 rounded-lg">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-semibold">{user.plan === 'premium' && user.is_active ? 'Plano Premium' : 'Plano Gratuito'}</h3>
                                                {user.plan === 'premium' && user.is_active && <Crown className="w-5 h-5 text-primary" />}
                                            </div>
                                            <p className="text-muted-foreground">
                                                {user.plan === 'premium' && user.is_active ? 'Acesso total a todos os recursos.' : 'Faça um upgrade para uma experiência completa.'}
                                            </p>
                                        </div>
                                        {user.plan === 'premium' && user.is_active ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    {/* Envolve o botão com um span para o Tooltip funcionar quando o botão estiver desativado */}
                                                    <span>
                                                        <Button onClick={handleManageSubscription} disabled={isManaging || !canManageSubscription} className="mt-4 sm:mt-0">
                                                            {isManaging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                                                            Gerir Assinatura
                                                        </Button>
                                                    </span>
                                                </TooltipTrigger>
                                                {!canManageSubscription && (
                                                    <TooltipContent>
                                                        <p>Este plano foi concedido administrativamente e não pode ser gerido.</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        ) : (
                                            <Button onClick={() => navigate('/pricing')} className="mt-4 sm:mt-0">
                                                <Crown className="w-4 h-4 mr-2" /> Fazer Upgrade
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
            </TooltipProvider>
        </>
    );
};

export default Profile;
