import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Estado de loading para a verificação inicial
    
    const navigate = useNavigate();
    const location = useLocation();

    // Função para buscar e validar o usuário com o token atual
    const fetchAndUpdateUser = useCallback(async () => {
        const currentToken = localStorage.getItem('authToken');
        if (!currentToken) {
            setLoading(false);
            setIsAuthenticated(false);
            setUser(null);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_user_status.php`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });

            if (response.status === 401) { // Token inválido ou expirado
                throw new Error("Sessão inválida.");
            }
            
            const data = await response.json();
            if (data.success && data.user) {
                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                throw new Error(data.message || "Falha ao verificar status do usuário.");
            }
        } catch (error) {
            console.error("Auth Error:", error.message);
            logout('/login', 'Sua sessão expirou. Por favor, faça login novamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Efeito para verificação inicial na carga da aplicação
    useEffect(() => {
        fetchAndUpdateUser();
    }, [fetchAndUpdateUser]);

    const login = (userData, userToken) => {
        localStorage.setItem('authToken', userToken);
        setToken(userToken);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = (redirectTo = '/', toastMessage = null) => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        // O toastMessage pode ser usado no componente de login se necessário
        navigate(redirectTo, { state: { toastMessage } });
    };

    const value = {
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        fetchAndUpdateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

