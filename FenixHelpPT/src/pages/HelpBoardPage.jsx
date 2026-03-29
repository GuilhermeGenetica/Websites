import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, AlertTriangle, Heart, MapPin, Calendar, User, XCircle, 
  Mail, Phone, Users, Link as LinkIcon, Home, Globe, ClipboardList 
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

const HelpBoardPage = () => {
  const { getActiveRecords } = useData();
  const { toast } = useToast();
  const activeRecords = getActiveRecords();
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredRecords = activeRecords.filter(record => {
    const location = record.location || record.address || '';
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    
    const hasPhaseContent = Object.values(record.phases || {}).some(phase => Array.isArray(phase) && phase.length > 0);
    const matchesPhase = phaseFilter === 'all' || (hasPhaseContent && (
        (phaseFilter === 'short' && record.phases?.shortTerm?.length > 0) ||
        (phaseFilter === 'medium' && record.phases?.mediumTerm?.length > 0) ||
        (phaseFilter === 'long' && record.phases?.longTerm?.length > 0)
    ));
    
    const matchesRegion = regionFilter === 'all' || 
                         location.toLowerCase().includes(regionFilter.toLowerCase());
    
    return matchesSearch && matchesType && matchesPhase && matchesRegion;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const locationA = a.location || a.address || '';
    const locationB = b.location || b.address || '';
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'location':
        return locationA.localeCompare(locationB);
      case 'urgency':
        if (a.type === 'help' && b.type !== 'help') return -1;
        if (a.type !== 'help' && b.type === 'help') return 1;
        return 0;
      default:
        return 0;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: 'status-active',
      pending: 'status-pending',
      completed: 'status-completed'
    };
    return badges[status] || 'status-pending';
  };

  const getPhaseInfo = (phases) => {
    if (!phases) return 'Não especificado';
    const hasShort = phases.shortTerm?.length > 0;
    const hasMedium = phases.mediumTerm?.length > 0;
    const hasLong = phases.longTerm?.length > 0;
    if (hasShort && !hasMedium && !hasLong) return 'Curto Prazo';
    if (!hasShort && hasMedium && !hasLong) return 'Médio Prazo';
    if (!hasShort && !hasMedium && hasLong) return 'Longo Prazo';
    if ([hasShort, hasMedium, hasLong].filter(Boolean).length > 1) return 'Múltiplas Fases';
    return 'Não especificado';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPhasesList = (phases) => {
    if (!phases) return [];
    const allPhases = [
      ...(phases.shortTerm || []).map(p => ({ phase: 'Curto Prazo', label: p })),
      ...(phases.mediumTerm || []).map(p => ({ phase: 'Médio Prazo', label: p })),
      ...(phases.longTerm || []).map(p => ({ phase: 'Longo Prazo', label: p }))
    ];
    return allPhases;
  };

  const DetailItem = ({ icon: Icon, label, value, isLink = false }) => (
    value ? (
      <div>
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 mt-1 text-blue-500 hover:underline">
            <Icon className="w-4 h-4" />
            <span className="font-semibold truncate">{value}</span>
          </a>
        ) : (
          <div className="flex items-center space-x-2 mt-1">
            <Icon className="w-4 h-4 text-primary" />
            <p className="font-semibold text-foreground">{value}</p>
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <>
      <Helmet>
        <title>Mural de Ajudas - Projeto Fénix</title>
        <meta name="description" content="Consulte todos os pedidos e ofertas de ajuda ativos. Filtre por tipo, fase, região e urgência para encontrar como pode contribuir." />
        <meta property="og:title" content="Mural de Ajudas - Projeto Fénix" />
        <meta property="og:description" content="Plataforma pública com pedidos e ofertas de ajuda para vítimas dos incêndios em Portugal." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Mural de Ajudas
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Consulte todos os pedidos e ofertas de ajuda ativos. 
              Encontre formas de contribuir ou veja se há ajuda disponível para si.
            </p>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros e Pesquisa
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar por nome, localização..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="help">Pedidos</SelectItem>
                  <SelectItem value="offer">Ofertas</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Fases</SelectItem>
                  <SelectItem value="short">Curto Prazo</SelectItem>
                  <SelectItem value="medium">Médio Prazo</SelectItem>
                  <SelectItem value="long">Longo Prazo</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="location">Localização</SelectItem>
                  <SelectItem value="urgency">Urgência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Estatísticas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {activeRecords.filter(r => r.type === 'help').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos Ativos</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
              <Heart className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {activeRecords.filter(r => r.type === 'offer').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ofertas Disponíveis</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
              <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {sortedRecords.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resultados Filtrados</p>
            </div>
          </motion.div>

          {/* Lista de Registos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRecords.length > 0 ? (
              sortedRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 ${
                    record.type === 'help' ? 'border-orange-500' : 'border-green-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={getStatusBadge(record.status)}>
                      {record.status === 'active' ? 'Ativo' : 
                       record.status === 'pending' ? 'Pendente' : 'Concluído'}
                    </span>
                    {record.type === 'help' ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Heart className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {record.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{record.location || record.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(record.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="w-4 h-4" />
                      <span>{getPhaseInfo(record.phases)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                    {record.description || 'Sem descrição adicional.'}
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedRecord(record)}
                  >
                    Ver Detalhes
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tente ajustar os filtros ou termos de pesquisa.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border dark:border-gray-700">
              <div className="flex justify-between items-start mb-6 pb-4 border-b dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedRecord.type === 'help' ? 'Pedido de Ajuda' : 'Oferta de Ajuda'}</h2>
                  <p className="text-muted-foreground text-sm">Publicado em {formatDate(selectedRecord.createdAt)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedRecord(null)} className="rounded-full"><XCircle className="w-5 h-5" /></Button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={User} label="Nome" value={selectedRecord.name} />
                  {selectedRecord.type === 'help' && <DetailItem icon={Users} label="Nº de Pessoas" value={selectedRecord.people} />}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Phone} label="Contacto Telefónico" value={selectedRecord.phone} />
                  <DetailItem icon={Mail} label="Email" value={selectedRecord.email} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Home} label="Localidade/Freguesia" value={selectedRecord.location || selectedRecord.address} />
                  <DetailItem icon={MapPin} label="Código Postal" value={selectedRecord.postalCode} />
                </div>

                <DetailItem icon={Globe} label="País" value={selectedRecord.country} />
                <DetailItem icon={LinkIcon} label="Link para Fotos" value={selectedRecord.photoLink} isLink={true} />

                <div>
                  <Label className="text-sm text-muted-foreground">Descrição Detalhada</Label>
                  <p className="mt-1 p-3 bg-muted/50 dark:bg-muted/20 rounded-md text-foreground">{selectedRecord.description || 'N/A'}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Tipo de Ajuda Necessária / Oferecida</Label>
                  <div className="mt-2 space-y-2">
                    {getPhasesList(selectedRecord.phases).length > 0 ? getPhasesList(selectedRecord.phases).map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <span className={`font-semibold w-24 ${item.phase === 'Curto Prazo' ? 'text-orange-500' : item.phase === 'Médio Prazo' ? 'text-blue-500' : 'text-green-500'}`}>{item.phase}:</span>
                        <span className="text-foreground capitalize">{item.label.replace(/-/g, ' ')}</span>
                      </div>
                    )) : <p className="text-foreground">Não especificado.</p>}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t dark:border-gray-700 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>Fechar</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpBoardPage;
