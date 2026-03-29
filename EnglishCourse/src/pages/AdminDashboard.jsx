import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserX, UserCheck, Trash2, ShieldCheck, Search, ArrowUpDown, Edit, Save, XCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const AdminDashboard = () => {
    const { token, logout } = useAuth();
    const { toast } = useToast();

    // Estados da Tabela
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Estados do Modal de Edição
    const [editingUser, setEditingUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction,
                search: debouncedSearchTerm,
            });
            const response = await fetch(`${API_BASE_URL}/admin.php?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (error) {
            toast({ title: "Erro", description: `Não foi possível carregar os utilizadores: ${error.message}`, variant: "destructive" });
            if (error.message.includes("Acesso negado")) logout();
        } finally {
            setIsLoading(false);
        }
    }, [token, toast, logout, pagination.page, pagination.limit, sortConfig, debouncedSearchTerm]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleEditChange = (field, value) => {
        setEditingUser(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSaveUser = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        
        // CORREÇÃO: Transforma strings vazias em null para os campos do Stripe antes de enviar
        const payload = {
            ...editingUser,
            stripe_customer_id: editingUser.stripe_customer_id || null,
            stripe_subscription_id: editingUser.stripe_subscription_id || null,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    userIdToUpdate: payload.id,
                    updates: payload // Envia o objeto com os dados corrigidos
                }),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            toast({ title: "Sucesso", description: "O utilizador foi atualizado." });
            setEditingUser(null);
            fetchUsers(); // Recarrega a lista
        } catch (error) {
            toast({ title: "Erro", description: `Não foi possível guardar: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderSortableHeader = (key, label) => (
        <TableHead>
            <Button variant="ghost" onClick={() => handleSort(key)}>
                {label}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </TableHead>
    );

    return (
        <>
            <Helmet><title>Admin - Perfect English</title></Helmet>
            <div className="min-h-screen bg-background">
                <Navigation />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldCheck /> Painel de Administração</CardTitle>
                            <CardDescription>Gestão de utilizadores do sistema ({pagination.total} registos).</CardDescription>
                            <div className="relative mt-4">
                               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                               <Input type="search" placeholder="Pesquisar em todos os campos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto">
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {renderSortableHeader('name', 'Nome')}
                                            {renderSortableHeader('email', 'Email')}
                                            {renderSortableHeader('level', 'Nível')}
                                            {renderSortableHeader('plan', 'Plano')}
                                            {renderSortableHeader('is_active', 'Estado')}
                                            {renderSortableHeader('is_admin', 'Admin')}
                                            <TableHead>Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan="7" className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                                        ) : users.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.name}</TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>{u.level}</TableCell>
                                                <TableCell>{u.plan}</TableCell>
                                                <TableCell><span className={`px-2 py-1 text-xs rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.is_active ? 'Ativo' : 'Inativo'}</span></TableCell>
                                                <TableCell><span className={`px-2 py-1 text-xs rounded-full ${u.is_admin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{u.is_admin ? 'Sim' : 'Não'}</span></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)}><Edit className="w-4 h-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                             {/* Controles de Paginação */}
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-muted-foreground">Página {pagination.page} de {pagination.totalPages}</span>
                                <div className="space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setPagination(p => ({...p, page: p.page - 1}))} disabled={pagination.page <= 1}>Anterior</Button>
                                    <Button variant="outline" size="sm" onClick={() => setPagination(p => ({...p, page: p.page + 1}))} disabled={pagination.page >= pagination.totalPages}>Próxima</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Modal de Edição */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Utilizador: {editingUser?.name}</DialogTitle>
                        <DialogDescription>Altere os dados abaixo e clique em salvar.</DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                           <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Nome</Label><Input id="name" value={editingUser.name} onChange={(e) => handleEditChange('name', e.target.value)} className="col-span-3" /></div>
                           <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" value={editingUser.email} onChange={(e) => handleEditChange('email', e.target.value)} className="col-span-3" /></div>
                           <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="level" className="text-right">Nível</Label>
                                <Select value={editingUser.level} onValueChange={(v) => handleEditChange('level', v)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="B2">B2</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="C2">C2</SelectItem></SelectContent>
                                </Select>
                           </div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="plan" className="text-right">Plano</Label>
                                <Select value={editingUser.plan} onValueChange={(v) => handleEditChange('plan', v)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="free">Gratuito</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
                                </Select>
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="stripe_customer" className="text-right">Stripe Customer ID</Label><Input id="stripe_customer" value={editingUser.stripe_customer_id || ''} onChange={(e) => handleEditChange('stripe_customer_id', e.target.value)} className="col-span-3" /></div>
                           <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="stripe_subscription" className="text-right">Stripe Subscription ID</Label><Input id="stripe_subscription" value={editingUser.stripe_subscription_id || ''} onChange={(e) => handleEditChange('stripe_subscription_id', e.target.value)} className="col-span-3" /></div>
                           <div className="flex items-center space-x-2 justify-end col-span-4 pr-4 pt-2">
                               <Label htmlFor="is_active">Ativo</Label>
                               <Switch id="is_active" checked={!!editingUser.is_active} onCheckedChange={(c) => handleEditChange('is_active', c)} />
                               <Label htmlFor="is_admin" className="ml-4">Admin</Label>
                               <Switch id="is_admin" checked={!!editingUser.is_admin} onCheckedChange={(c) => handleEditChange('is_admin', c)} />
                           </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button onClick={handleSaveUser} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminDashboard;
