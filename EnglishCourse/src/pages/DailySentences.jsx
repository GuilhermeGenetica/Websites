import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Play, Pause, Heart, RotateCcw, Loader2, AlertTriangle, Check, Repeat, StopCircle
} from 'lucide-react';

import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from "@/components/ui/progress";

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

const DailySentences = () => {
  const { token } = useAuth();
  const { studySentence, toggleFavoriteSentence } = useUser();
  const { toast } = useToast();

  const [dailySentences, setDailySentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFavoriting, setIsFavoriting] = useState(false);
  const utteranceRef = useRef(null);
  const [audioState, setAudioState] = useState('idle'); // idle, playing, paused
  const [playbackRate, setPlaybackRate] = useState(1);

  // CORREÇÃO AUDIO: Adicionado cleanup effect para cancelar a fala ao sair da página
  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const fetchPhrases = useCallback(async () => {
    if (!token) {
        setIsLoading(false);
        setError("Autenticação necessária.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/get_daily_phrases.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Erro ao carregar frases.");
      
      setDailySentences(data.phrases || []);
      setCurrentSentenceIndex(0);
      handleStop(); // Garante que qualquer áudio anterior pare
    } catch (err) {
      setError("Não foi possível carregar as frases. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPhrases();
  }, [fetchPhrases]);

  const currentSent = useMemo(() => dailySentences[currentSentenceIndex], [dailySentences, currentSentenceIndex]);
  const progressValue = dailySentences.length > 0 ? ((currentSentenceIndex + 1) / dailySentences.length) * 100 : 0;

  const handleNext = async () => {
    if (!currentSent) return;
    handleStop();
    
    studySentence(currentSent.id); 

    if (currentSentenceIndex < dailySentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    } else {
       toast({ title: "Parabéns!", description: "Você completou as frases de hoje! Carregando novas.", className: "bg-green-500 text-white" });
       fetchPhrases();
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentSent || isFavoriting) return;
    setIsFavoriting(true);
    const currentIsFavorite = !!currentSent.is_favorite;
    const success = await toggleFavoriteSentence(currentSent.id);
    if(success) {
      setDailySentences(prev => prev.map(sent => 
        sent.id === currentSent.id ? { ...sent, is_favorite: currentIsFavorite ? 0 : 1 } : sent
      ));
      toast({
          title: "Favoritos",
          description: currentIsFavorite ? "Removido dos favoritos." : "Adicionado aos favoritos!",
      });
    }
    setIsFavoriting(false);
  };
  
  const handlePlayPause = useCallback(() => {
    if (!currentSent || !window.speechSynthesis) return;

    if (audioState === 'playing') {
        speechSynthesis.pause();
        setAudioState('paused');
    } else if (audioState === 'paused') {
        speechSynthesis.resume();
        setAudioState('playing');
    } else { // 'idle'
        speechSynthesis.cancel(); // Garante que nada mais está falando
        const utterance = new SpeechSynthesisUtterance(currentSent.english);
        utterance.lang = 'en-US';
        utterance.rate = playbackRate;

        utterance.onstart = () => setAudioState('playing');
        utterance.onresume = () => setAudioState('playing');
        utterance.onpause = () => setAudioState('paused');
        utterance.onend = () => setAudioState('idle');
        utterance.onerror = (event) => {
            if (event.error !== 'canceled') {
              toast({ title: "Erro de Áudio", description: "Não foi possível reproduzir o áudio.", variant: "destructive" });
            }
            setAudioState('idle');
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
    }
  }, [currentSent, audioState, playbackRate, toast]);

  const handleStop = () => {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    setAudioState('idle');
  }

  const handleSetPlaybackRate = (rate) => {
      setPlaybackRate(rate);
      if (audioState === 'playing' || audioState === 'paused') {
        handleStop();
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(currentSent.english);
            utterance.lang = 'en-US';
            utterance.rate = rate;
            utterance.onstart = () => setAudioState('playing');
            utterance.onend = () => setAudioState('idle');
            utterance.onerror = () => setAudioState('idle');
            speechSynthesis.speak(utterance);
        }, 100);
      }
  }

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error) return <div className="flex flex-col justify-center items-center h-screen p-4 bg-gray-50 dark:bg-gray-900"><AlertTriangle className="w-12 h-12 text-red-500 mb-4" /><h2 className="text-xl font-semibold mb-2">Ocorreu um erro</h2><p className="text-muted-foreground mb-6 text-center">{error}</p><Button onClick={fetchPhrases}><RotateCcw className="w-4 h-4 mr-2" /> Tentar Novamente</Button></div>;

  return (
    <>
      <Helmet><title>Frases do Dia - Perfect English</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navigation />
        <main className="flex-grow container mx-auto py-8 px-4 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentSent ? (
              <motion.div key={currentSent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <Card className="shadow-xl border-t-2 border-primary overflow-hidden mb-4">
                  <CardHeader>
                    <div className="flex justify-between items-center"><CardTitle className="text-base sm:text-lg">Frase {currentSentenceIndex + 1} de {dailySentences.length}</CardTitle></div>
                    <Progress value={progressValue} className="w-full mt-2 h-1.5" />
                  </CardHeader>
                </Card>
                <div className="grid md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-base">English</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-xl font-semibold text-foreground">"{currentSent.english}"</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-base">Português</CardTitle></CardHeader>
                            <CardContent><p className="text-lg text-muted-foreground italic">"{currentSent.portuguese}"</p></CardContent>
                        </Card>
                    </div>
                     <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Controles de Áudio</CardTitle></CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                               <div className="flex items-center justify-center gap-2">
                                  <Button variant="outline" size="icon" onClick={handleStop} title="Parar"><StopCircle className="w-5 h-5" /></Button>
                                  <Button size="icon" className="w-14 h-14 rounded-full" onClick={handlePlayPause} title={audioState === 'playing' ? 'Pausar' : 'Reproduzir'}>{audioState === 'playing' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</Button>
                                  <Button variant="ghost" size="icon" onClick={handleToggleFavorite} disabled={isFavoriting} className={currentSent.is_favorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'} title="Favoritar">{isFavoriting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${currentSent.is_favorite ? 'fill-current' : ''}`} />}</Button>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Velocidade:</span>
                                  {[0.75, 1, 1.25].map(rate => (
                                      <Button key={rate} size="sm" variant={playbackRate === rate ? 'secondary' : 'outline'} onClick={() => handleSetPlaybackRate(rate)}>{rate}x</Button>
                                  ))}
                               </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-base">Progresso</CardTitle></CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <Button onClick={handleNext} size="lg" className="w-full">{currentSentenceIndex === dailySentences.length - 1 ? 'Finalizar Sessão' : 'Próxima Frase'} <Check className="w-5 h-5 ml-2" /></Button>
                                <Button variant="outline" onClick={fetchPhrases} className="w-full"><Repeat className="w-4 h-4 mr-2" /> Obter Novas Frases</Button>
                            </CardContent>
                        </Card>
                     </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <Card className="max-w-md mx-auto p-8"><h2 className="text-2xl font-bold mb-4">Sessão Concluída!</h2><p className="text-muted-foreground mb-6">Bom trabalho! Você pode carregar um novo conjunto de frases.</p><Button onClick={fetchPhrases} size="lg"><RotateCcw className="w-4 h-4 mr-2"/> Carregar Novas Frases</Button></Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default DailySentences;
