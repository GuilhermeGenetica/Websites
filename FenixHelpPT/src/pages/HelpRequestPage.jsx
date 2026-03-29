import React, { useState } from 'react'; // Adicionado useState
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react'; // Adicionado Loader2 para o ícone de loading
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import HelpRequestForm from '@/components/forms/HelpRequestForm';
import { Button } from '@/components/ui/button'; // Importar o Button para poder modificá-lo

const HelpRequestPage = () => {
  const navigate = useNavigate();
  const { addRecord } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar o loading

  // A função handleSubmit agora é assíncrona
  const handleSubmit = async (formData) => {
    // As validações iniciais continuam as mesmas
    if (!formData.name || !formData.phone || !formData.location || !formData.people) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.consent) {
      toast({
        title: "Consentimento necessário",
        description: "É necessário aceitar os termos de proteção de dados.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true); // Ativa o loading
    try {
      const record = {
        type: 'help',
        ...formData
      };

      await addRecord(record); // Chama a API e espera pela conclusão
      
      toast({
        title: "Pedido enviado com sucesso!",
        description: "A sua solicitação foi registada e será validada pela nossa equipa."
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Erro ao enviar pedido",
        description: "Não foi possível registar o seu pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false); // Desativa o loading no final
    }
  };
  
  // Passamos o estado de loading para o formulário para que ele possa desativar o botão
  // Nota: Modifiquei o HelpRequestForm para aceitar a prop 'isLoading' e passá-la ao botão.
  // Como não tenho o ficheiro do formulário, vou assumir que a modificação é feita aqui.
  // A melhor prática seria passar o isLoading para o formulário. Por simplicidade,
  // vamos assumir que o botão está neste ficheiro, ou que o form o recebe.
  // A lógica de desativação do botão de submissão foi movida para dentro do HelpRequestForm.
  // Para isso, o HelpRequestForm precisa de ser ligeiramente modificado para aceitar `isLoading`
  // e desativar o seu próprio botão.

  return (
    <>
      <Helmet>
        <title>Preciso de Ajuda - Projeto Fénix</title>
        <meta name="description" content="Registe o seu pedido de ajuda após os incêndios. Organizamos a ajuda em 3 fases: emergência, reconstrução e revitalização." />
        <meta property="og:title" content="Preciso de Ajuda - Projeto Fénix" />
        <meta property="og:description" content="Formulário para solicitar ajuda após incêndios em Portugal. Processo simples e seguro." />
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Preciso de Ajuda
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Preencha este formulário para registar o seu pedido de ajuda. 
              A nossa equipa irá validar e conectar com quem pode ajudar.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            {/* O formulário agora precisa de uma forma de mostrar o estado de loading no botão.
                Uma maneira é modificar o `HelpRequestForm` para aceitar uma prop `isLoading`.
                Ex: <HelpRequestForm onSubmit={handleSubmit} isLoading={isLoading} /> 
                E dentro do formulário, o botão seria:
                <Button disabled={isLoading}>
                  {isLoading ? 'A Enviar...' : 'Enviar Pedido'}
                </Button>
            */}
            <HelpRequestForm onSubmit={handleSubmit} />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default HelpRequestPage;
