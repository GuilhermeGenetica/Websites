import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Heart, Search, Filter, Calendar, X, Trash2, Loader2, BookOpen, ChevronLeft, ChevronRight, Trash
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUser } from '@/contexts/UserContext';

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';
const ITEMS_PER_PAGE = 10;

const History = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const { toggleFavoriteSentence } = useUser();
  
  const [historySentences, setHistorySentences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const fetchHistory = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get_user_history.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistorySentences(data.history);
      } else {
        throw new Error(data.message || "Falha ao carregar histórico.");
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível buscar seu histórico. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  const handleDelete = useCallback(async () => {
    if (!itemToDelete || !token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/delete_history_item.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ history_id: itemToDelete.history_id }),
      });
      const data = await response.json();
      if (data.success) {
        setHistorySentences(prev => prev.filter(item => item.history_id !== itemToDelete.history_id));
        toast({ title: "Item removido!", description: "A frase foi excluída do seu histórico." });
      } else {
        throw new Error(data.message || "Falha ao remover item.");
      }
    } catch (error) {
      toast({ title: "Erro de exclusão", description: "Não foi possível remover o item do histórico.", variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  }, [itemToDelete, token, toast]);
  
  const handleClearHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clear_history.php`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setHistorySentences([]);
        toast({ title: "Histórico Limpo!", description: "Todos os seus registros foram removidos.", className: "bg-green-500 text-white" });
      } else {
        throw new Error(data.message || "Falha ao limpar o histórico.");
      }
    } catch (error) {
      toast({ title: "Erro ao Limpar", description: "Não foi possível limpar o seu histórico.", variant: "destructive" });
    } finally {
      setIsClearingHistory(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = useMemo(() => {
    return historySentences.filter(item => {
      const searchMatch = searchTerm
        ? item.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.portuguese.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const filterMatch = filterBy === 'favorites' ? item.is_favorite : true;
      return searchMatch && filterMatch;
    });
  }, [historySentences, searchTerm, filterBy]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filteredHistory, totalPages, currentPage]);

  const handleToggleFavorite = useCallback(async (historyItem) => {
    const isCurrentlyFavorite = historyItem.is_favorite;
    const success = await toggleFavoriteSentence(historyItem.phrase_id);
    if(success) {
      setHistorySentences(prev => prev.map(item => 
        item.history_id === historyItem.history_id 
          ? { ...item, is_favorite: !isCurrentlyFavorite }
          : item
      ));
    }
  }, [toggleFavoriteSentence]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <Helmet><title>Meu Histórico - Perfect English</title></Helmet>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
          <Card className="mb-8 p-6 shadow-lg dark:bg-gray-800">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Meu Histórico de Estudos</h1>
            <p className="text-gray-600 dark:text-gray-400">Aqui estão todas as frases que você revisou e estudou.</p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Input
              type="text"
              placeholder="Buscar por frase em Inglês ou Português..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Select onValueChange={setFilterBy} value={filterBy}>
              <SelectTrigger className="w-full sm:w-[180px] dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <Filter className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Filtrar..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-white">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="favorites">Favoritas</SelectItem>
              </SelectContent>
            </Select>
            <Button 
                variant="destructive" 
                onClick={() => setIsClearingHistory(true)}
                disabled={historySentences.length === 0}
            >
                <Trash className="w-4 h-4 mr-2" />
                Limpar Histórico
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
             <AnimatePresence initial={false}>
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                    <Accordion type="single" collapsible className="w-full">
                        {paginatedHistory.length > 0 ? (
                            paginatedHistory.map((item) => (
                                <motion.div
                                    key={item.history_id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <AccordionItem value={String(item.history_id)} className="border-b">
                                        <AccordionTrigger className="flex items-center justify-between text-left p-4 hover:no-underline space-x-4">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Calendar className="w-3 h-3 text-gray-500" />
                                                    <span className="font-semibold text-xs text-gray-500 dark:text-gray-400">{formatDate(item.viewed_at)}</span>
                                                    {item.is_favorite && (<Heart className="w-3 h-3 text-red-500 fill-red-500" />)}
                                                </div>
                                                <p className="text-base font-medium text-gray-800 dark:text-gray-200">{truncateText(item.english)}</p>
                                            </div>
                                            <div className="flex space-x-2 shrink-0">
                                                <Button variant="ghost" size="icon" className={`w-8 h-8 rounded-full transition-colors ${item.is_favorite ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item); }}>
                                                    <Heart className={`w-4 h-4 ${item.is_favorite ? 'fill-red-500' : ''}`} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600"
                                                    onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 bg-gray-50 dark:bg-gray-700 border-t">
                                            <div className="space-y-3">
                                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                    <p className="text-sm font-semibold text-primary mb-1 flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Inglês</p>
                                                    <p className="text-lg text-gray-900 dark:text-gray-100">{item.english}</p>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                    <p className="text-sm font-semibold text-primary mb-1 flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Português</p>
                                                    <p className="text-lg text-gray-900 dark:text-gray-100">{item.portuguese}</p>
                                                </div>
                                                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                    <span className="font-medium">Nível: <span className="text-gray-900 dark:text-gray-100">{item.level}</span></span>
                                                    <span className="font-medium">Pronúncia: <span className="text-gray-900 dark:text-gray-100">{item.phonetic || 'N/A'}</span></span>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-10"><X className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" /><h3 className="text-lg font-semibold">Nenhuma frase encontrada</h3><p className="text-sm text-muted-foreground">O seu histórico está vazio.</p></div>
                        )}
                    </Accordion>
                </motion.div>
             </AnimatePresence>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </main>
      </div>
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá a frase do seu histórico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={isClearingHistory} onOpenChange={setIsClearingHistory}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Limpar todo o histórico?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível e removerá todas as frases do seu histórico, incluindo as favoritas. Tem a certeza?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearHistory} className="bg-red-600 hover:bg-red-700">Sim, limpar tudo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
};

export default History;

