import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, FileCog, BarChart, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({ totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/admin_stats.php');
            setStats(response.data);
        } catch (error) {
            toast({
                title: 'Failed to Load Stats',
                description: error.response?.data?.error || 'Could not retrieve platform statistics.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    fetchStats();
  }, [toast]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - NutraGenius</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm no-print">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.full_name || 'Admin'}</span>
              <Button variant="ghost" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : new Intl.NumberFormat().format(stats.totalUsers)}</div>
                <p className="text-xs text-muted-foreground">Total registered users</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/rules-editor')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendation Rules</CardTitle>
                <FileCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Edit Engine</div>
                <p className="text-xs text-muted-foreground">Customize report generation logic</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Analytics</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">Detailed usage analytics</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
