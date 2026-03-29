import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, Stethoscope, LogIn, LogOut, CheckCircle, XCircle, Trash2, RefreshCcw, ThumbsUp, ThumbsDown, DollarSign, Banknote, Clock } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DoctorsTab from './DoctorsTab';
import AppointmentsTab from './AppointmentsTab';
import PatientsTab from './PatientsTab';

const formatCurrency = (amount, currencyCode = 'EUR') => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    } catch (e) {
        return `${currencyCode.toUpperCase()} ${amount.toFixed(2)}`;
    }
};

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
  >
    <Card className={`bg-gradient-to-r ${color} text-white`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <Icon className="w-8 h-8 opacity-50" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const AdminDashboard = () => {
  const { token, API_BASE_URL, logout, setToken, setUser, setUserType } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [financialOverview, setFinancialOverview] = useState(null);

  const [initialDataFetched, setInitialDataFetched] = useState(false);

  const handleApiResponse = async (response, name) => {
    if (!response.ok) {
      let errorDetail = `HTTP Status: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorDetail += ` - Message: ${errorBody.message || JSON.stringify(errorBody)}`;
      } catch (jsonError) {
        errorDetail += ` - Raw response: ${await response.text()}`;
      }
      throw new Error(`Failed to load ${name}: ${errorDetail}`);
    }
    const data = await response.json();
    if (data.success === false) {
      throw new Error(`Backend error loading ${name}: ${data.message || 'Unknown error.'}`);
    }
    return data;
  };

  const fetchAllData = useCallback(async () => {
    setDataLoading(true);
    setError(null);

    if (!token) {
      setDataLoading(false);
      return;
    }

    try {
      const adminApiUrl = `${API_BASE_URL}/admin.php`;
      const headers = { 'Authorization': `Bearer ${token}` };

      const [doctorsData, patientsData, appointmentsData, overviewData] = await Promise.all([
        fetch(`${adminApiUrl}?action=get_doctors`, { headers }).then(res => handleApiResponse(res, 'doctors')),
        fetch(`${adminApiUrl}?action=get_patients`, { headers }).then(res => handleApiResponse(res, 'patients')),
        fetch(`${adminApiUrl}?action=get_appointments`, { headers }).then(res => handleApiResponse(res, 'appointments')),
        fetch(`${adminApiUrl}?action=get_financial_overview`, { headers }).then(res => handleApiResponse(res, 'financial overview'))
      ]);

      setDoctors(doctorsData.doctors);
      setPatients(patientsData.patients);
      setAppointments(appointmentsData.appointments);
      setFinancialOverview(overviewData.overview);

      toast({ title: "Data loaded!", description: "All admin information updated." });

    } catch (err) {
      setError(err.message);
      toast({
        title: "Error loading data",
        description: err.message,
        variant: "destructive",
      });
      if (err.message.includes("Invalid token") || err.message.includes("expired") || err.message.includes("Access denied") || err.message.includes("Authentication failed")) {
        logout();
      }
    } finally {
      setDataLoading(false);
    }
  }, [token, API_BASE_URL, toast, logout]);

  useEffect(() => {
    if (token && !initialDataFetched) {
      fetchAllData();
      setInitialDataFetched(true);
    } else if (!token) {
      setInitialDataFetched(false);
      setDataLoading(false);
    }
  }, [token, fetchAllData, initialDataFetched]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        const adminUser = { user_id: data.user_id, user_type: data.user_type, username: data.username };
        setUser(adminUser);
        setUserType(data.user_type);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('userType', data.user_type);

        toast({ title: "Login Successful!", description: data.message });
        setInitialDataFetched(false);
      } else {
        toast({ title: "Login Error", description: data.message || "Invalid credentials.", variant: "destructive" });
        setError(data.message || "Invalid credentials.");
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
      setError("Network error when trying to log in.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleToggleUserStatus = async (type, id, currentStatus) => {
    const action = type === 'doctor' ? 'toggle_doctor_status' : 'toggle_patient_status';
    const idField = type === 'doctor' ? 'doctor_id' : 'patient_id';
    const newStatus = currentStatus ? 0 : 1;

    try {
      const response = await fetch(`${API_BASE_URL}/admin.php?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [idField]: id, is_active: newStatus }),
      });
      const data = await handleApiResponse(response, `${type} status`);
      toast({ title: "Status Updated!", description: data.message });
      fetchAllData();
    } catch (error) {
      toast({ title: "Error Updating Status", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleMedBookingroval = async (id, currentStatus) => {
    const newStatus = currentStatus ? 0 : 1;
    try {
        const response = await fetch(`${API_BASE_URL}/admin.php?action=toggle_doctor_approval`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ doctor_id: id, is_approved: newStatus }),
        });
        const data = await handleApiResponse(response, `approval status`);
        toast({ title: "Approval Status Updated!", description: data.message });
        fetchAllData();
    } catch (error) {
        toast({ title: "Error Updating Approval", description: error.message, variant: "destructive" });
    }
  };
  
  const handleForceCompletion = async (appointmentId) => {
     try {
        const response = await fetch(`${API_BASE_URL}/admin.php?action=admin_force_completion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ appointment_id: appointmentId }),
        });
        const data = await handleApiResponse(response, `force completion`);
        toast({ title: "Funds Released!", description: data.message });
        fetchAllData();
    } catch (error) {
        toast({ title: "Error Forcing Completion", description: error.message, variant: "destructive" });
    }
  };

  const handleAdminConfirmManualPayout = async (paymentRecordId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin.php?action=admin_confirm_manual_payout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ payment_record_id: paymentRecordId }),
        });
        const data = await handleApiResponse(response, `manual payout confirmation`);
        toast({ title: "Manual Payout Confirmed!", description: data.message });
        fetchAllData();
    } catch (error) {
        toast({ title: "Error Confirming Payout", description: error.message, variant: "destructive" });
    }
  };

  const handlePermanentDeleteUser = async (type, id) => {
    if (!window.confirm(`WARNING: You are about to PERMANENTLY DELETE this ${type}. This action is IRREVERSIBLE. Are you sure?`)) {
      return;
    }
    const action = type === 'doctor' ? 'delete_doctor_permanent' : 'delete_patient_permanent';
    try {
      const response = await fetch(`${API_BASE_URL}/admin.php?action=${action}&id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await handleApiResponse(response, `permanent deletion of the ${type}`);
      toast({ title: "User Deleted!", description: data.message });
      fetchAllData();
    } catch (error) {
      toast({ title: "Deletion Error", description: error.message, variant: "destructive" });
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  if (!token) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { duration: 0.8, ease: "easeOut" } } }} className="w-full max-w-md">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <Shield className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                <CardTitle className="text-2xl font-bold">Administrative Access</CardTitle>
                <CardDescription>Log in to access the panel.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">User</Label>
                    <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loginLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loginLoading} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loginLoading}>
                    {loginLoading ? 'Logging in...' : <><LogIn className="w-4 h-4 mr-2" /> Login</>}
                  </Button>
                  {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { staggerChildren: 0.1 } }} className="space-y-8">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">User Management</h1>
              <Button onClick={logout} variant="destructive"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
            </motion.div>
            <motion.div variants={itemVariants} className="flex justify-end">
              <Button onClick={fetchAllData} disabled={dataLoading}>
                {dataLoading ? 'Updating...' : <><RefreshCcw className="w-4 h-4 mr-2" /> Update Data</>}
              </Button>
            </motion.div>
            
            <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
                <StatCard 
                    title="Platform Revenue" 
                    value={formatCurrency(financialOverview?.platform_revenue || 0)}
                    icon={DollarSign} 
                    color="from-green-600 to-green-700" 
                    delay={0.1} 
                />
                <StatCard 
                    title="Funds Held (Pending)" 
                    value={formatCurrency(financialOverview?.funds_held || 0)}
                    icon={Clock} 
                    color="from-yellow-600 to-yellow-700" 
                    delay={0.2} 
                />
                 <StatCard 
                    title="Total Transacted" 
                    value={formatCurrency(financialOverview?.total_transacted || 0)}
                    icon={Banknote} 
                    color="from-blue-600 to-blue-700" 
                    delay={0.3} 
                />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Tabs defaultValue="doctors" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="doctors">Doctors ({doctors.length})</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
                  <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="doctors" className="mt-4">
                  <DoctorsTab
                    doctors={doctors}
                    loading={dataLoading}
                    error={error}
                    onToggleStatus={handleToggleUserStatus}
                    onToggleApproval={handleToggleMedBookingroval}
                    onDeleteUser={handlePermanentDeleteUser}
                  />
                </TabsContent>
                <TabsContent value="appointments" className="mt-4">
                  <AppointmentsTab
                    appointments={appointments}
                    loading={dataLoading}
                    error={error}
                    onForceCompletion={handleForceCompletion}
                    onConfirmManualPayout={handleAdminConfirmManualPayout}
                  />
                </TabsContent>
                <TabsContent value="patients" className="mt-4">
                  <PatientsTab
                    patients={patients}
                    loading={dataLoading}
                    error={error}
                    onToggleStatus={handleToggleUserStatus}
                    onDeleteUser={handlePermanentDeleteUser}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;