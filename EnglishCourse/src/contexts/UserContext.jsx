import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from "@/components/ui/use-toast";

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const { toast } = useToast();
    
    const [progress, setProgress] = useState({
        xp: 0,
        streak: 0,
        level_progress: 0,
        completed_activities: '{}',
        learned_sentences_count: 0,
    });
    
    const [loading, setLoading] = useState(true);

    const fetchUserData = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_user_progress.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setProgress(data.progress);
            } else {
                 throw new Error(data.message || "Falha ao carregar o progresso do usuário.");
            }
        } catch (error) {
            console.error("Falha ao buscar dados de progresso:", error);
            toast({
                title: "Erro de Sincronização",
                description: "Não foi possível carregar seu progresso. Tente recarregar a página.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [token, isAuthenticated, toast]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const completeActivity = async (activityId) => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/track_progress.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'complete_activity', activity_id: activityId })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            if (result.updatedProgress) {
                 setProgress(result.updatedProgress);
            }
            toast({
                title: "Atividade Concluída!",
                description: "Bom trabalho! O seu progresso foi salvo.",
                className: "bg-green-500 text-white"
            });
            return true;
        } catch (error) {
            toast({ title: "Erro de Progresso", description: `Não foi possível guardar o seu progresso: ${error.message}`, variant: "destructive" });
            return false;
        }
    };
    
    const studySentence = async (phraseId) => {
        if (!token) return false;
        try {
            await fetch(`${API_BASE_URL}/record_phrase_progress.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'studied', phrase_id: phraseId })
            });
            
            const trackResponse = await fetch(`${API_BASE_URL}/track_progress.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'study_sentence', phrase_id: phraseId })
            });
            const trackData = await trackResponse.json();
            if (trackData.success && trackData.updatedProgress) {
                setProgress(trackData.updatedProgress);
            }
            return true;
        } catch (error) {
            toast({ title: "Erro", description: `Não foi possível gravar a frase: ${error.message}`, variant: "destructive" });
            return false;
        }
    };

    const toggleFavoriteSentence = async (phraseId) => {
        if (!token) return false;
        try {
            const response = await fetch(`${API_BASE_URL}/record_phrase_progress.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'favorite', phrase_id: phraseId })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            toast({ title: "Favoritos", description: "Estado de favorito atualizado." });
            return true;
        } catch (error) {
            toast({ title: "Erro", description: `Não foi possível atualizar favoritos: ${error.message}`, variant: "destructive" });
            return false;
        }
    };

    // NOVA FUNÇÃO para marcar/desmarcar atividades
    const toggleActivityCompleted = async (activityId) => {
        if (!token) return false;
        try {
            const response = await fetch(`${API_BASE_URL}/toggle_activity.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ activity_id: activityId })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            // Atualiza o estado local para refletir a mudança imediatamente
            setProgress(prev => ({
                ...prev,
                completed_activities: JSON.stringify(result.completed_activities)
            }));
            
            return true;
        } catch (error) {
            toast({ title: "Erro", description: `Não foi possível atualizar a atividade: ${error.message}`, variant: "destructive" });
            return false;
        }
    };
    
    const value = { 
        progress, 
        loading, 
        fetchUserData,
        completeActivity, 
        studySentence, 
        toggleFavoriteSentence,
        toggleActivityCompleted // Exporta a nova função
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

