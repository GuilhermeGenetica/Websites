import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Heart, Users, Gift, UserCheck, ArrowRight, Clock, Hammer, TreePine, ShoppingCart } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const HomePage = () => {
  const { getActiveRecords, getStats } = useData();
  const { toast } = useToast();
  const activeRecords = getActiveRecords();
  const stats = getStats();
  const urgentRequests = activeRecords
    .filter(record => record.type === 'help')
    .slice(0, 6);

  const phases = [
    {
      title: 'Curto Prazo',
      subtitle: 'Emergência',
      description: 'Necessidades imediatas: alojamento, alimentação, roupas e apoio psicológico.',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Médio Prazo',
      subtitle: 'Reconstrução',
      description: 'Materiais de construção, mobiliário, eletrodomésticos e apoio jurídico.',
      icon: Hammer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Longo Prazo',
      subtitle: 'Revitalização',
      description: 'Reflorestação, mentoria de negócios e formação profissional.',
      icon: TreePine,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ];
  
  const handleShopClick = () => {
    toast({
      title: 'Loja Online em Breve!',
      description: 'Esta funcionalidade será implementada em breve. Agradecemos a sua paciência e apoio!',
    });
  };

  return (
    <>
      <Helmet>
        <title>Projeto Fénix - Das cinzas, a esperança. Juntos, reerguemos Portugal</title>
        <meta name="description" content="Plataforma que conecta vítimas dos incêndios em Portugal com cidadãos, empresas e ONGs. Ajuda organizada em 3 fases: Emergência, Reconstrução e Revitalização." />
        <meta property="og:title" content="Projeto Fénix - Das cinzas, a esperança" />
        <meta property="og:description" content="A plataforma que une quem precisa de ajuda com quem pode ajudar após os incêndios em Portugal." />
      </Helmet>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover"
            src="https://video.euronews.com/mp4/SHD/21/26/70/04/SHD_PYR_2126704_20250731142326.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-700/60 to-green-700/60 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Das cinzas, a esperança.
            <br />
            <span className="text-green-300">Juntos, reerguemos Portugal.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-12 text-gray-100"
          >
            A plataforma que une quem precisa de ajuda com quem pode ajudar.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link to="/preciso-ajuda">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold w-64">
                <AlertTriangle className="w-6 h-6 mr-3" />
                Preciso de Ajuda
              </Button>
            </Link>
            <Link to="/quero-ajudar">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold w-64">
                <Heart className="w-6 h-6 mr-3" />
                Quero Ajudar
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Impacto em Tempo Real
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Números atualizados em tempo real (podem começar em zero)
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-2xl card-shadow"
            >
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-green-700 dark:text-green-400">{stats.familiesSupported}</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Famílias Apoiadas</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl card-shadow"
            >
              <Gift className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-blue-700 dark:text-blue-400">{stats.offersReceived}</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Ofertas Recebidas</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center p-8 bg-purple-50 dark:bg-purple-900/20 rounded-2xl card-shadow"
            >
              <UserCheck className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-purple-700 dark:text-purple-400">{stats.volunteersRegistered}</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Voluntários Registados</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Pedidos Urgentes
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Ajudas necessárias com prioridade alta
              </p>
            </div>
            <Link to="/mural">
              <Button variant="outline" className="hidden sm:flex">
                Ver Todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {urgentRequests.length > 0 ? (
              urgentRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 card-shadow hover:shadow-lg transition-shadow border-l-4 border-orange-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="status-active">Ativo</span>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {request.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    📍 {request.location}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                    {request.description}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Nenhum pedido urgente no momento
                </p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-8 sm:hidden">
            <Link to="/mural">
              <Button variant="outline">
                Ver Todos os Pedidos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Colabore com o nosso Projeto</h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                    A sua contribuição financeira é vital para mantermos a plataforma a funcionar e para apoiarmos as nossas equipas de validação no terreno. Ajude-nos a continuar esta missão!
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link to="/doar">
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                            <Heart className="w-5 h-5 mr-2" /> Fazer uma Doação
                        </Button>
                    </Link>
                    <Button size="lg" variant="outline" onClick={handleShopClick} className="w-full sm:w-auto">
                        <ShoppingCart className="w-5 h-5 mr-2" /> Loja Solidária
                    </Button>
                </div>
            </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Processo simples e seguro em 3 passos
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Registe Pedido/Oferta
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Preencha o formulário com as suas necessidades ou disponibilidade para ajudar.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                A Equipa Valida
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Verificamos e validamos todas as informações para garantir segurança e autenticidade.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Conectamos a Ajuda
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fazemos a ligação entre quem precisa e quem pode ajudar de forma coordenada.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fases da Ajuda
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Organizamos a ajuda em 3 fases para máxima eficiência
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`${phase.bgColor} rounded-2xl p-8 card-shadow hover:shadow-lg transition-shadow`}
                >
                  <Icon className={`w-12 h-12 ${phase.color} mb-6`} />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {phase.title}
                  </h3>
                  <p className={`${phase.color} font-semibold mb-4`}>
                    {phase.subtitle}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {phase.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
