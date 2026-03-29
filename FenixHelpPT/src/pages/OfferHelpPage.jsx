import React, { useState } from 'react'; // Adicionado useState
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react'; // Adicionado Loader2
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import OfferHelpForm from '@/components/forms/OfferHelpForm';

const OfferHelpPage = () => {
  const navigate = useNavigate();
  const { addRecord } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar o loading

  // A função handleSubmit agora é assíncrona
  const handleSubmit = async (formData) => {
    // Validações
    if (!formData.name || !formData.phone || !formData.email || !formData.address || !formData.postalCode) {
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
        type: 'offer',
        ...formData
      };

      await addRecord(record); // Chama a API
      
      toast({
        title: "Oferta registada com sucesso!",
        description: "A sua disponibilidade para ajudar foi registada e será validada pela nossa equipa."
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Erro ao registar oferta",
        description: "Não foi possível registar a sua oferta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false); // Desativa o loading
    }
  };

  return (
    <>
      <Helmet>
        <title>Quero Ajudar - Projeto Fénix</title>
        <meta name="description" content="Registe a sua oferta de ajuda para vítimas dos incêndios. Voluntariado, doações e apoio organizado em 3 fases." />
        <meta property="og:title" content="Quero Ajudar - Projeto Fénix" />
        <meta property="og:description" content="Formulário para oferecer ajuda às vítimas dos incêndios em Portugal. Junte-se à comunidade solidária." />
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Heart className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Quero Ajudar
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Registe a sua disponibilidade para ajudar. Juntos, podemos fazer a diferença 
              na reconstrução das comunidades afetadas pelos incêndios.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            {/* O OfferHelpForm também precisaria de ser modificado para aceitar `isLoading`
                e desativar o seu botão de submissão.
                Ex: <OfferHelpForm onSubmit={handleSubmit} isLoading={isLoading} />
            */}
            <OfferHelpForm onSubmit={handleSubmit} />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default OfferHelpPage;
