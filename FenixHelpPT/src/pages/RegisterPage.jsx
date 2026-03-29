import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Eye, EyeOff } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RegisterPage = () => {
  const navigate = useNavigate();
  // A função addUser agora é assíncrona e comunica com a API
  const { addUser } = useData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accessLevel: 'validator'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Novo estado de loading

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // A função de submissão agora é assíncrona
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro de Registo",
        description: "As palavras-passe não coincidem.",
        variant: "destructive"
      });
      return;
    }

    // A verificação de email duplicado foi removida daqui.
    // O backend (API) é agora responsável por garantir que o email é único.
    
    setIsLoading(true); // Ativa o loading
    try {
        // Removemos o campo de confirmação antes de enviar para a API
        const { confirmPassword, ...newUser } = formData;
        await addUser(newUser); // Chama a API para criar o utilizador

        toast({
          title: "Registo efetuado com sucesso!",
          description: "A sua conta foi criada. Pode agora fazer login."
        });

        navigate('/validador'); // Redireciona para a página de login

    } catch (error) {
        // O erro pode ser um email duplicado ou outro problema do servidor
        toast({
          title: "Erro de Registo",
          description: "Não foi possível criar a conta. O email pode já existir.",
          variant: "destructive"
        });
    } finally {
        setIsLoading(false); // Desativa o loading
    }
  };

  return (
    <>
      <Helmet>
        <title>Registar Nova Conta - Projeto Fénix</title>
        <meta name="description" content="Crie uma nova conta de validador ou administrador para ajudar na gestão da plataforma Projeto Fénix." />
      </Helmet>
      <div className="min-h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <UserPlus className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Criar Nova Conta
            </h1>
            <p className="text-muted-foreground">
              Junte-se à equipa de gestão do Projeto Fénix.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required className="mt-2" />
            </div>
            <div className="relative">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required className="mt-2" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[2.4rem] text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
              <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="accessLevel">Tipo de Conta</Label>
              <Select value={formData.accessLevel} onValueChange={(value) => handleInputChange('accessLevel', value)}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="validator">Validador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            {/* Botão de registo desativado durante o loading */}
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? 'A registar...' : 'Registar'}
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;
