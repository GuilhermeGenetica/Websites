import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Database, Search, Edit, Trash, FileDown, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AdminPage = () => {
  const { records, users, actions, loginUser, updateUser, deleteUser, updateRecord, deleteRecord, updateAction, deleteAction, loading } = useData();
  const { toast } = useToast();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ email: 'admin@fenix.pt', password: 'admin123' });
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const [selectedTable, setSelectedTable] = useState('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    try {
      const user = await loginUser(loginData);
      if (user.accessLevel === 'admin') {
        setIsLoggedIn(true);
        toast({ title: "Login de administrador bem-sucedido!" });
      } else {
        throw new Error("Acesso restrito a administradores.");
      }
    } catch (error) {
      toast({ 
        title: "Credenciais inválidas ou sem permissão",
        description: error.message || "Verifique as suas credenciais.",
        variant: "destructive" 
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const dataMap = {
    records: records,
    users: users,
    actions: actions,
  };

  const dataToDisplay = dataMap[selectedTable] || [];
  const filteredData = dataToDisplay.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEditChange = (field, value) => {
    setEditingItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const actionMap = {
      records: updateRecord,
      users: updateUser,
      actions: updateAction,
    };
    const action = actionMap[selectedTable];
    try {
      await action(editingItem.id, editingItem);
      toast({ title: "Item atualizado com sucesso!" });
      setEditingItem(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem a certeza que deseja apagar este item? Esta ação é irreversível.')) {
      const actionMap = {
        records: deleteRecord,
        users: deleteUser,
        actions: deleteAction,
      };
      const action = actionMap[selectedTable];
      try {
        await action(id);
        toast({ title: "Item apagado com sucesso!" });
      } catch (error) {
        toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
      }
    }
  };
  
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "A tabela atual está vazia.",
        variant: "destructive"
      });
      return;
    }

    const columns = Object.keys(filteredData[0]);
    const header = columns.join(',');
    
    const rows = filteredData.map(item => {
      return columns.map(col => {
        let value = item[col];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fenix-${selectedTable}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída!",
      description: `Ficheiro CSV (${selectedTable}) gerado com sucesso.`
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <Helmet><title>Administração - Login</title></Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-xl">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-6 text-3xl font-bold text-center text-foreground">Painel de Administração</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Acesso restrito</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} required className="mt-1" /></div>
            <div><Label htmlFor="password">Palavra-passe</Label><Input id="password" type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required className="mt-1" /></div>
            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const columnsConfig = {
    records: records.length > 0 ? Object.keys(records[0]) : [],
    users: ['id', 'name', 'email', 'accessLevel', 'createdAt'],
    actions: actions.length > 0 ? Object.keys(actions[0]) : [],
  };
  const columns = columnsConfig[selectedTable];

  return (
    <>
      <Helmet><title>Painel de Administração</title></Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-foreground">Painel de Administração</h1>
            <div className="flex items-center gap-2">
              <Button variant={selectedTable === 'records' ? 'default' : 'outline'} onClick={() => { setSelectedTable('records'); setEditingItem(null); }}>Registos</Button>
              <Button variant={selectedTable === 'users' ? 'default' : 'outline'} onClick={() => { setSelectedTable('users'); setEditingItem(null); }}>Utilizadores</Button>
              <Button variant={selectedTable === 'actions' ? 'default' : 'outline'} onClick={() => { setSelectedTable('actions'); setEditingItem(null); }}>Ações</Button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl shadow-lg">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div>
              <Button variant="outline" onClick={exportToCSV}><FileDown className="w-4 h-4 mr-2" /> Exportar CSV</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50">
                  <tr>
                    {columns.map(col => <th key={col} className="p-4 capitalize">{col.replace(/([A-Z])/g, ' $1')}</th>)}
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={columns.length + 1} className="text-center p-8"><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /></td></tr>
                  ) : (
                    filteredData.map(item => (
                      <tr key={item.id} className="border-b hover:bg-accent">
                        {columns.map(col => (
                          <td key={`${item.id}-${col}`} className="p-4 align-top">
                            {editingItem?.id === item.id ? (
                              <Input value={editingItem[col]} onChange={e => handleEditChange(col, e.target.value)} className="h-8" />
                            ) : (
                              <span className="line-clamp-2">{typeof item[col] === 'object' && item[col] !== null ? JSON.stringify(item[col]) : String(item[col])}</span>
                            )}
                          </td>
                        ))}
                        <td className="p-4">
                          <div className="flex gap-2">
                            {editingItem?.id === item.id ? (
                              <Button size="sm" onClick={handleSave}>Guardar</Button>
                            ) : (
                              <Button size="icon" variant="ghost" onClick={() => setEditingItem(item)}><Edit className="w-4 h-4" /></Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminPage;
