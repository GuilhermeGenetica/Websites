import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ArrowLeft, LogOut, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import axios from 'axios';

const AdminUserManagement = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { toast } = useToast();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sorting, setSorting] = useState({ sortBy: 'created_at', sortOrder: 'desc' });

    // Debounce search input to avoid excessive API calls
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(p => ({ ...p, page: 1 })); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: 10,
                sortBy: sorting.sortBy,
                sortOrder: sorting.sortOrder,
                search: debouncedSearchTerm,
            });
            const response = await axios.get(`/api/admin_users.php?${params.toString()}`);
            setUsers(response.data.users);
            setPagination(response.data.pagination);
        } catch (error) {
            toast({
                title: 'Error Fetching Users',
                description: error.response?.data?.error || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, sorting, debouncedSearchTerm, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleAction = async (action, userId, field = null) => {
        try {
            const response = await axios.post('/api/admin_users.php', { action, userId, field });
            toast({ title: 'Success', description: response.data.message });
            fetchUsers(); // Refresh data
        } catch (error) {
            toast({
                title: 'Action Failed',
                description: error.response?.data?.error || 'An error occurred.',
                variant: 'destructive',
            });
        }
    };

    const handleSort = (column) => {
        setSorting(current => {
            const isAsc = current.sortBy === column && current.sortOrder === 'asc';
            return {
                sortBy: column,
                sortOrder: isAsc ? 'desc' : 'asc'
            };
        });
        setPagination(p => ({ ...p, page: 1 })); // Reset to first page on sort
    };

    const SortableHeader = ({ column, title }) => (
        <TableHead>
            <Button variant="ghost" onClick={() => handleSort(column)}>
                {title}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </TableHead>
    );

    return (
        <>
            <Helmet><title>User Management - NutraGenius Admin</title></Helmet>
            <div className="min-h-screen bg-background">
                <header className="fixed top-0 left-0 right-0 z-10 bg-card/80 backdrop-blur-sm no-print shadow-sm">
                    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                        <h1 className="text-xl font-bold">Admin: User Management</h1>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate('/admin')} size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Admin Dashboard</Button>
                            <Button variant="ghost" onClick={handleLogout} size="sm"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <main className="container mx-auto p-6 pt-24">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">Manage Users</h2>
                        <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
                    </div>

                    <div className="rounded-lg border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHeader column="full_name" title="Name" />
                                    <SortableHeader column="email" title="Email" />
                                    <TableHead>Active</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <SortableHeader column="created_at" title="Registered At" />
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center">Loading users...</TableCell></TableRow>
                                ) : users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.full_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Switch checked={!!user.is_active} onCheckedChange={() => handleAction('toggleStatus', user.id, 'is_active')} /></TableCell>
                                        <TableCell><Switch checked={!!user.is_admin} onCheckedChange={() => handleAction('toggleStatus', user.id, 'is_admin')} /></TableCell>
                                        <TableCell><Switch checked={!!user.has_paid} onCheckedChange={() => handleAction('toggleStatus', user.id, 'has_paid')} /></TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => toast({ title: '🚧 Not implemented' })}>Edit User</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/30 focus:text-destructive" onClick={() => handleAction('deleteUser', user.id)}>Delete User</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: 1 }))} disabled={pagination.page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm">Page {pagination.page} of {pagination.totalPages || 1}</span>
                        <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: pagination.totalPages }))} disabled={pagination.page >= pagination.totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminUserManagement;
