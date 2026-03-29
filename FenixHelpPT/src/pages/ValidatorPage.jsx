import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ValidatorDashboard from '@/components/validator/ValidatorDashboard';

const ValidatorPage = () => {
  // A função loginUser agora vem do contexto e é assíncrona
  const { loginUser } = useData();
  const { toast } = useToast();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false); // Novo estado para o loading

  // A função de login foi convertida para async/await para lidar com a chamada à API
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Ativa o estado de loading
    try {
      const user = await loginUser(loginData); // Chama a API para fazer login

      // Apenas utilizadores com acesso 'validator' ou 'admin' podem entrar aqui
      if (user.accessLevel === 'validator' || user.accessLevel === 'admin') {
          setIsLoggedIn(true);
          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo, ${user.name}.`,
          });
      } else {
          // Se o utilizador não tiver a permissão correta, lança um erro
          throw new Error("Acesso não permitido a esta área.");
      }
    } catch (error) {
      // Captura erros da API (ex: password errada) ou de permissão
      toast({
        title: "Credenciais inválidas ou sem permissão",
        description: error.message || "Verifique o email e palavra-passe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Desativa o estado de loading no final
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginData({ email: '', password: '' });
  }

  if (!isLoggedIn) {
    return (
      <>
        <Helmet>
          <title>Área do Validador - Projeto Fénix</title>
          <meta name="description" content="Área restrita para validação de pedidos e ofertas de ajuda. Acesso apenas para equipa autorizada." />
        </Helmet>

        <div className="min-h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Área do Validador
              </h1>
              <p className="text-muted-foreground">
                Acesso restrito à equipa de validação
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@fenix.pt"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-foreground">
                  Palavra-passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="mt-2"
                  required
                />
              </div>

              {/* O botão agora fica desativado durante o loading */}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                <Shield className="w-4 h-4 mr-2" />
                {isLoading ? 'A entrar...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Demo:</strong> admin@fenix.pt / admin123
              </p>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return <ValidatorDashboard onLogout={handleLogout} />;
};

export default ValidatorPage;
