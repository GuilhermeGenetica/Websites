import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Eye, FileText, Heart, Shield, XCircle, AlertTriangle, Users } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ValidatorDashboard = ({ onLogout }) => {
  const { records, actions, updateRecord, updateAction, getPendingRecords, getPendingActions } = useData();
  const { toast } = useToast();
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(null); // 'record' or 'action'
  const [notes, setNotes] = useState('');

  const pendingRecords = getPendingRecords();
  const pendingActions = getPendingActions();
  
  const helpRequests = pendingRecords.filter(r => r.type === 'help');
  const offers = pendingRecords.filter(r => r.type === 'offer');

  const handleStatusChange = (itemId, newStatus, type) => {
    let notesToUpdate = '';
    
    if (selectedItem && selectedItem.id === itemId) {
        notesToUpdate = notes;
    } else {
        const item = (type === 'action' ? actions : records).find(i => i.id === itemId);
        if (item) {
            notesToUpdate = item.notes || '';
        }
    }

    const updateFunction = type === 'action' ? updateAction : updateRecord;

    updateFunction(itemId, { 
      status: newStatus,
      notes: notesToUpdate,
      validatedAt: new Date().toISOString()
    });
    
    toast({
      title: "Estado atualizado!",
      description: `Registo marcado como ${newStatus}.`
    });
    
    setSelectedItem(null);
    setItemType(null);
    setNotes('');
  };

  const exportToCSV = () => {
    const allItems = [...records, ...actions];
    const csvContent = [
      ['ID', 'Tipo', 'Nome/Título', 'Contacto', 'Localização', 'Status', 'Data Criação'],
      ...allItems.map(r => [r.id, r.type || 'action', r.name || r.title, r.phone || r.responsiblePhone, r.location || r.address, r.status, new Date(r.createdAt).toLocaleDateString('pt-PT')].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fenix-registos-completos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({ title: "Exportação concluída!", description: "Ficheiro CSV gerado." });
  };

  const getPhasesList = (phases) => {
    if (!phases) return 'Não especificado';
    const allPhases = [...(phases.shortTerm || []), ...(phases.mediumTerm || []), ...(phases.longTerm || [])];
    return allPhases.length > 0 ? allPhases.join(', ') : 'Não especificado';
  };

  const openItem = (item, type) => {
    setSelectedItem(item);
    setItemType(type);
    setNotes(item.notes || '');
  }

  const renderRecordDetails = (record) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Nome</Label><p className="font-semibold">{record.name}</p></div>
        <div><Label>Contacto</Label><p className="font-semibold">{record.phone}</p></div>
      </div>
      <div><Label>Localização</Label><p className="font-semibold">{record.location || record.address}</p></div>
      <div><Label>Fases Selecionadas</Label><p className="font-semibold">{getPhasesList(record.phases)}</p></div>
      <div><Label>Descrição</Label><p>{record.description || 'N/A'}</p></div>
    </>
  );

  const renderActionDetails = (action) => (
     <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Título</Label><p className="font-semibold">{action.title}</p></div>
        <div><Label>Tipo</Label><p className="font-semibold">{action.activityType}</p></div>
      </div>
      <div><Label>Data</Label><p className="font-semibold">{new Date(action.activityDate).toLocaleDateString('pt-PT')}</p></div>
      <div><Label>Localização</Label><p className="font-semibold">{action.location}</p></div>
      <div><Label>Responsável</Label><p className="font-semibold">{action.responsiblePerson} ({action.responsibleEmail})</p></div>
      <div><Label>Descrição</Label><p>{action.description || 'N/A'}</p></div>
    </>
  );

  return (
    <>
      <Helmet>
        <title>Dashboard de Validação - Projeto Fénix</title>
        <meta name="description" content="Dashboard para validação e gestão de pedidos e ofertas de ajuda. Área restrita." />
      </Helmet>

      <div className="bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">Dashboard de Validação</h1>
              <p className="text-xl text-muted-foreground">Gerir e validar pedidos, ofertas e ações</p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={exportToCSV} variant="outline"><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
              <Button onClick={onLogout} variant="destructive">Sair</Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 text-center"><AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" /><div className="text-2xl font-bold text-orange-600">{helpRequests.length}</div><p className="text-sm text-muted-foreground">Pedidos Pendentes</p></div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center"><Heart className="w-8 h-8 text-green-600 mx-auto mb-2" /><div className="text-2xl font-bold text-green-600">{offers.length}</div><p className="text-sm text-muted-foreground">Ofertas Pendentes</p></div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center"><Users className="w-8 h-8 text-blue-600 mx-auto mb-2" /><div className="text-2xl font-bold text-blue-600">{pendingActions.length}</div><p className="text-sm text-muted-foreground">Ações Pendentes</p></div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center"><FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" /><div className="text-2xl font-bold text-purple-600">{records.length + actions.length}</div><p className="text-sm text-muted-foreground">Total de Registos</p></div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[{title: 'Novos Pedidos a Verificar', icon: AlertTriangle, items: helpRequests, color: 'orange', type: 'record'}, {title: 'Novas Ofertas a Verificar', icon: Heart, items: offers, color: 'green', type: 'record'}].map(col => (
              <motion.div key={col.title} initial={{ opacity: 0, x: col.color === 'orange' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-card rounded-2xl shadow-lg p-6">
                <h2 className={`text-xl font-semibold text-foreground mb-6 flex items-center`}><col.icon className={`w-5 h-5 text-${col.color}-600 mr-2`} />{col.title} ({col.items.length})</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {col.items.length > 0 ? col.items.map(item => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                      <div className="flex justify-between items-start mb-2"><h3 className="font-semibold">{item.name}</h3><span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('pt-PT')}</span></div>
                      <p className="text-sm text-muted-foreground mb-2">📍 {item.location || item.address}{item.people ? ` • ${item.people} pessoas` : ''}</p>
                      <p className="text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openItem(item, col.type)}><Eye className="w-4 h-4 mr-1" />Ver</Button>
                        <Button size="sm" onClick={() => handleStatusChange(item.id, 'active', col.type)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-1" />Aprovar</Button>
                        <Button size="sm" onClick={() => handleStatusChange(item.id, 'completed', col.type)} variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejeitar</Button>
                      </div>
                    </div>
                  )) : <div className="text-center py-8 text-muted-foreground"><col.icon className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum registo pendente</p></div>}
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="bg-card rounded-2xl shadow-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center"><Users className="w-5 h-5 text-blue-600 mr-2" />Novas Ações a Verificar ({pendingActions.length})</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingActions.length > 0 ? pendingActions.map(item => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                  <div className="flex justify-between items-start mb-2"><h3 className="font-semibold">{item.title}</h3><span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('pt-PT')}</span></div>
                  <p className="text-sm text-muted-foreground mb-2">📍 {item.location}</p>
                  <p className="text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openItem(item, 'action')}><Eye className="w-4 h-4 mr-1" />Ver</Button>
                    <Button size="sm" onClick={() => handleStatusChange(item.id, 'active', 'action')} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-1" />Aprovar</Button>
                    <Button size="sm" onClick={() => handleStatusChange(item.id, 'completed', 'action')} variant="destructive"><XCircle className="w-4 h-4 mr-1" />Rejeitar</Button>
                  </div>
                </div>
              )) : <div className="text-center py-8 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhuma ação pendente</p></div>}
            </div>
          </motion.div>

          {selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">Detalhes do {itemType === 'record' ? (selectedItem.type === 'help' ? 'Pedido' : 'Oferta') : 'Ação'}</h2>
                  <Button variant="ghost" onClick={() => setSelectedItem(null)}><XCircle className="w-5 h-5" /></Button>
                </div>
                <div className="space-y-4 mb-6">
                  {itemType === 'record' ? renderRecordDetails(selectedItem) : renderActionDetails(selectedItem)}
                </div>
                <div className="mb-6">
                  <Label htmlFor="notes">Notas Internas</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Adicione notas sobre a validação..." rows={3} className="mt-2" />
                </div>
                <div className="flex space-x-4">
                  <Button onClick={() => handleStatusChange(selectedItem.id, 'active', itemType)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-2" />Aprovar</Button>
                  <Button onClick={() => handleStatusChange(selectedItem.id, 'completed', itemType)} variant="destructive"><XCircle className="w-4 h-4 mr-2" />Rejeitar/Concluir</Button>
                  <Button onClick={() => setSelectedItem(null)} variant="ghost">Cancelar</Button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ValidatorDashboard;
