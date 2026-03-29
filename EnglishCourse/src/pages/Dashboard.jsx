import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, MessageSquare, Trophy, Flame, Star, BookOpen, Target, TrendingUp, Crown, ExternalLink, Loader2 } from 'lucide-react';

import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { scheduleData } from '@/lib/scheduleData';

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

const Dashboard = () => {
  const { user, token, fetchAndUpdateUser, loading: authLoading } = useAuth();
  const { progress, completeActivity, loading: progressLoading } = useUser();
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activityUrl, setActivityUrl] = useState(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      verifyPayment(sessionId);
      searchParams.delete('payment');
      searchParams.delete('session_id');
      setSearchParams(searchParams);
    } else if (paymentStatus === 'cancelled') {
        toast({
            title: "Pagamento Cancelado",
            description: "Pode tentar novamente quando quiser.",
            variant: "default"
        });
        searchParams.delete('payment');
        setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast, token]);

  const verifyPayment = async (sessionId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_session_details.php?session_id=${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success && result.status === 'paid') {
            toast({
                title: "Pagamento bem-sucedido!",
                description: "Obrigado por se tornar um membro Premium.",
                className: "bg-green-500 text-white"
            });
            await fetchAndUpdateUser();
        } else {
            throw new Error(result.message || 'Falha ao verificar o pagamento.');
        }
    } catch (error) {
        toast({ title: "Erro de Verificação", description: error.message, variant: "destructive" });
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
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
        setIsManagingSubscription(false);
    }
  };

  const handleStartActivity = (activity) => {
    if (activity.link.startsWith('/')) {
      navigate(activity.link);
    } else {
      setActivityUrl(activity.link);
    }
    completeActivity(activity.id);
  };
  
  if (authLoading || progressLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p>Não foi possível carregar os dados do usuário. Por favor, tente <Link to="/login" className="text-primary underline">fazer login</Link> novamente.</p>
        </div>
    );
  }

  const currentLevelSchedule = scheduleData[user?.level] || scheduleData.A1;
  const today = new Date().getDate();
  const todayData = currentLevelSchedule.days[today - 1] || currentLevelSchedule.days[0];

  const stats = [
    { title: "Streak Atual", value: progress.streak || 0, icon: Flame, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
    { title: "XP Total", value: progress.xp || 0, icon: Star, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
    { title: "Frases Aprendidas", value: progress.learned_sentences_count || 0, icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Progresso Nível", value: `${progress.level_progress || 0}%`, icon: Trophy, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" }
  ];

  const quickActions = [
    { title: "Frases de Hoje", description: "Pratique suas frases diárias", icon: MessageSquare, link: "/sentences", color: "from-blue-500 to-blue-600" },
    { title: "Meu Cronograma", description: "Veja seu plano de estudos", icon: Calendar, link: "/schedule", color: "from-green-500 to-green-600" },
    { title: "Revisar Histórico", description: "Revise frases anteriores", icon: BookOpen, link: "/history", color: "from-purple-500 to-purple-600" }
  ];

  return (
    <>
      <Helmet><title>Painel - Perfect English</title></Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
                <p className="text-muted-foreground text-lg">Pronto para sua jornada? Nível: <span className="font-semibold text-primary">{user?.level}</span></p>
              </div>
              {user?.plan === 'premium' && user.is_active ? (
                  <div className="text-right">
                      <div className="flex items-center gap-2 p-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                          <Crown className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-sm text-green-700 dark:text-green-300">Plano Premium Ativo</span>
                      </div>
                      <Button variant="link" size="sm" onClick={handleManageSubscription} disabled={isManagingSubscription}>
                          Gerir Assinatura
                          <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                  </div>
              ) : (
                  <Link to="/pricing">
                      <Button variant="premium">
                          <Crown className="w-4 h-4 mr-2" /> Fazer Upgrade
                      </Button>
                  </Link>
              )}
            </div>
          </motion.div>
          
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div key={index} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}><Icon className={`w-6 h-6 ${stat.color}`} /></div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /><span>Ações Rápidas</span></CardTitle></CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                      <Link key={index} to={action.link}>
                        <motion.div whileHover={{ y: -5 }} className={`p-6 rounded-lg bg-gradient-to-br ${action.color} text-white cursor-pointer shadow-lg`}>
                          <action.icon className="w-8 h-8 mb-3" /><h3 className="font-semibold mb-1">{action.title}</h3><p className="text-sm opacity-90">{action.description}</p>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /><span>Progresso Geral</span></CardTitle></CardHeader>
                <CardContent>
                  <div>
                    <div className="flex justify-between text-sm mb-2"><span>Nível {user?.level}</span><span>{progress.level_progress || 0}%</span></div>
                    <Progress value={progress.level_progress || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-8">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /><span>Atividades de Hoje (Dia {today})</span></CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayData.activities.map((activity, index) => (
                    <motion.div key={index} whileHover={{ scale: 1.01 }} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${progress.completed_activities && JSON.parse(progress.completed_activities)[activity.id] ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30' : 'border-border bg-card hover:border-primary/50'}`} onClick={() => handleStartActivity(activity)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${progress.completed_activities && JSON.parse(progress.completed_activities)[activity.id] ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <div><h4 className="font-semibold text-foreground">{activity.title}</h4><p className="text-sm text-muted-foreground">{activity.source}</p></div>
                          </div>
                        </div>
                        <div className="text-right"><span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">{activity.type}</span><p className="text-xs text-muted-foreground mt-1">{activity.duration}</p></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 text-center"><Link to="/schedule"><Button variant="outline" className="w-full sm:w-auto">Ver Cronograma Completo</Button></Link></div>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        {/* --- INÍCIO DA CORREÇÃO DO MODAL --- */}
        <Dialog open={!!activityUrl} onOpenChange={() => setActivityUrl(null)}>
          <DialogContent 
            className="w-[calc(100vw-20px)] h-[calc(100vh-20px)] max-w-none flex flex-col p-0 m-0"
          >
            <DialogHeader className="p-4 border-b shrink-0">
              <DialogTitle>Atividade do Curso</DialogTitle>
              <DialogDescription>Complete a atividade abaixo. O seu progresso será salvo automaticamente.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow">
              <iframe
                src={activityUrl}
                title="Atividade Externa"
                className="w-full h-full border-0"
              />
            </div>
          </DialogContent>
        </Dialog>
        {/* --- FIM DA CORREÇÃO DO MODAL --- */}

      </div>
    </>
  );
};

export default Dashboard;
