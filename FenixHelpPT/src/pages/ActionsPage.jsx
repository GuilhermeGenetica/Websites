import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Mail, MessageCircle, User, XCircle, Users, ClipboardList } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const ActionsPage = () => {
  const { getActiveActions } = useData();
  const [selectedAction, setSelectedAction] = useState(null);

  const activeActions = getActiveActions().filter(action => {
    const today = new Date();
    const actionDate = new Date(action.activityDate);
    today.setHours(0, 0, 0, 0);
    actionDate.setHours(0, 0, 0, 0);
    return actionDate >= today;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const DetailItem = ({ icon: Icon, label, value }) => (
    value ? (
      <div>
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <div className="flex items-center space-x-2 mt-1">
          <Icon className="w-4 h-4 text-primary" />
          <p className="font-semibold text-foreground">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <>
      <Helmet>
        <title>Ações de Voluntariado - Projeto Fénix</title>
        <meta name="description" content="Participe em ações de voluntariado ativas. Encontre oportunidades para ajudar na sua comunidade." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Users className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ações de Voluntariado Ativas
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Encontre e participe em atividades organizadas para ajudar na recuperação das áreas afetadas. A sua ajuda faz a diferença.
            </p>
            <div className="mt-8">
              <Link to="/criar-acao">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                  <ClipboardList className="w-5 h-5 mr-2" />
                  Cadastrar Nova Atividade
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeActions.length > 0 ? (
              activeActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow border-t-4 border-green-500 flex flex-col"
                >
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 flex-grow">{action.title}</h3>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="w-4 h-4 text-green-600" />
                      <span>{action.activityType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span>{formatDate(action.activityDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>{action.location}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-auto"
                    onClick={() => setSelectedAction(action)}
                  >
                    Ver Mais
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Nenhuma ação agendada
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  De momento não existem atividades futuras. Volte em breve ou registe uma nova!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAction && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border dark:border-gray-700">
              <div className="flex justify-between items-start mb-6 pb-4 border-b dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedAction.title}</h2>
                  <p className="text-muted-foreground text-sm">{selectedAction.activityType}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAction(null)} className="rounded-full"><XCircle className="w-5 h-5" /></Button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Calendar} label="Data da Atividade" value={formatDate(selectedAction.activityDate)} />
                  <DetailItem icon={MapPin} label="Localização" value={selectedAction.location} />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Descrição Completa</Label>
                  <p className="mt-1 p-3 bg-muted/50 dark:bg-muted/20 rounded-md text-foreground">{selectedAction.description || 'N/A'}</p>
                </div>
                 <div>
                  <Label className="text-sm text-muted-foreground">Notas Adicionais</Label>
                  <p className="mt-1 p-3 bg-muted/50 dark:bg-muted/20 rounded-md text-foreground">{selectedAction.notes || 'N/A'}</p>
                </div>
                <div className="border-t dark:border-gray-700 pt-4">
                    <h3 className="font-semibold mb-4">Contacto do Responsável</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem icon={User} label="Pessoa Responsável" value={selectedAction.responsiblePerson} />
                    </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t dark:border-gray-700 flex flex-wrap gap-4 justify-center">
                <a href={`mailto:${selectedAction.responsibleEmail}`} className="w-full sm:w-auto">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Mail className="w-4 h-4 mr-2" /> Quero Participar (Email)
                  </Button>
                </a>
                <a href={`https://wa.me/${selectedAction.responsiblePhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" /> Quero Participar (WhatsApp)
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActionsPage;
