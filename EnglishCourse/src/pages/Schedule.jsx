import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, CheckCircle, Play, BookOpen, Headphones, PenTool, MessageSquare, Clock, Star, HelpCircle, Loader2, Lock, Crown
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { scheduleData } from '@/lib/scheduleData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from "@/components/ui/checkbox";

const PremiumPaywall = () => {
    const navigate = useNavigate();
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 border-2 border-dashed rounded-lg mt-8"
        >
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground">Acesso Exclusivo para Membros Premium</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Este cronograma completo é um recurso premium. Faça o upgrade para desbloquear todos os 30 dias de estudo e acelerar a sua jornada para a fluência.
            </p>
            <Button size="lg" className="mt-6" onClick={() => navigate('/pricing')}>
                <Crown className="w-5 h-5 mr-2" /> Fazer Upgrade Agora
            </Button>
        </motion.div>
    );
};

const Schedule = () => {
  const { user, loading: authLoading } = useAuth();
  const { progress, completeActivity, toggleActivityCompleted, loading: progressLoading } = useUser();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activityUrl, setActivityUrl] = useState(null);

  const hasPremiumAccess = useMemo(() => {
    if (!user) return false;
    return user.is_admin || (user.plan === 'premium' && user.is_active);
  }, [user]);

  const currentSchedule = useMemo(() => {
      if (!user?.level) return scheduleData.A1;
      return scheduleData[user.level] || scheduleData.A1;
  }, [user?.level]);
  
  const currentDayData = useMemo(() => {
      const dayIndex = Math.max(0, Math.min(selectedDay - 1, 29));
      return currentSchedule.days[dayIndex];
  }, [selectedDay, currentSchedule]);

  const getActivityIcon = (type) => {
    const icons = {
      listening: Headphones, speaking: MessageSquare, reading: BookOpen, writing: PenTool,
      grammar: BookOpen, vocabulary: Star, pronunciation: Play, quiz: HelpCircle,
    };
    return icons[type] || HelpCircle;
  };

  const handleStartActivity = (activity) => {
    const isCompleted = !!(JSON.parse(progress.completed_activities || '{}')[activity.id]);
    if (activity.link.startsWith('/')) {
      navigate(activity.link);
    } else {
      setActivityUrl(activity.link);
    }
    if (!isCompleted) {
        completeActivity(activity.id);
    }
  };
  
  const handleCheckboxChange = (activityId) => {
      toggleActivityCompleted(activityId);
  };

  const completedActivitiesForDay = useMemo(() => {
    try {
      if (!progress.completed_activities) return {};
      return JSON.parse(progress.completed_activities || '{}');
    } catch (e) {
      console.error("Failed to parse completed activities:", e);
      return {};
    }
  }, [progress.completed_activities]);

  const completedCount = useMemo(() => {
      if (!currentDayData?.activities) return 0;
      return currentDayData.activities.filter(a => completedActivitiesForDay[a.id]).length;
  }, [completedActivitiesForDay, currentDayData]);

  const totalActivities = currentDayData?.activities?.length || 0;
  const dayProgress = totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0;
  
  if (authLoading || progressLoading || !user || !currentDayData) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <>
      <Helmet><title>Cronograma - Perfect English</title></Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Cronograma de 30 Dias 📅</h1>
            <p className="text-muted-foreground text-lg">Seu plano de estudos para o nível {user?.level} - {currentSchedule.title}</p>
          </motion.div>
          {!hasPremiumAccess ? (
            <PremiumPaywall />
          ) : (
            <div className="grid lg:grid-cols-4 gap-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                <Card className="sticky top-24">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /><span>Dias</span></CardTitle>
                      <CardDescription>Acesso Premium Completo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 h-[60vh] overflow-y-auto">
                    {currentSchedule.days.map(({ day }) => (
                      <Button key={day} variant={day === selectedDay ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedDay(day)}>
                        Dia {day}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-4 sm:mb-0">
                        <CardTitle className="text-2xl">Dia {selectedDay}: {currentDayData.theme}</CardTitle>
                        <p className="text-muted-foreground mt-1">{completedCount} de {totalActivities} atividades concluídas</p>
                      </div>
                      <div className="text-right"><div className="text-2xl font-bold text-primary">{Math.round(dayProgress)}%</div><p className="text-xs text-muted-foreground">Progresso do Dia</p></div>
                    </div>
                    <Progress value={dayProgress} className="mt-4 h-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentDayData.activities.map((activity, index) => {
                        const Icon = getActivityIcon(activity.type);
                        const isCompleted = !!completedActivitiesForDay[activity.id];
                        
                        return (
                          <motion.div key={activity.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }} className={`p-4 rounded-lg border-2 transition-all ${isCompleted ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30' : 'border-border bg-card'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full bg-muted`}><Icon className="w-5 h-5 text-muted-foreground" /></div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{activity.title}</h4>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{activity.type}</span>
                                    <div className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /><span className="text-xs">{activity.duration}</span></div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`activity-${activity.id}`}
                                    checked={isCompleted}
                                    onCheckedChange={() => handleCheckboxChange(activity.id)}
                                    aria-label={`Marcar ${activity.title} como concluída`}
                                  />
                                  <Button size="sm" variant={isCompleted ? "secondary" : "default"} onClick={() => handleStartActivity(activity)}>
                                    {isCompleted ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Play className="w-4 h-4 mr-1" />}
                                    {isCompleted ? 'Revisar' : 'Iniciar'}
                                  </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </main>
      </div>
      
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
    </>
  );
};

export default Schedule;

