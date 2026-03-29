import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import ActionForm from '@/components/forms/ActionForm';

const CreateActionPage = () => {
  const navigate = useNavigate();
  const { addAction } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      await addAction(formData);
      toast({
        title: "Atividade submetida com sucesso!",
        description: "A sua atividade foi registada e será validada pela nossa equipa em breve."
      });
      navigate('/acoes');
    } catch (error) {
      toast({
        title: "Erro ao submeter atividade",
        description: "Não foi possível registar a sua atividade. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Cadastrar Atividade - Projeto Fénix</title>
        <meta name="description" content="Organize e registe uma nova atividade de voluntariado para ajudar a comunidade." />
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <ClipboardList className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Cadastrar Nova Atividade
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Preencha o formulário abaixo para organizar uma nova ação de voluntariado. Após validação, ficará visível para todos.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <ActionForm onSubmit={handleSubmit} isLoading={isLoading} />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CreateActionPage;
