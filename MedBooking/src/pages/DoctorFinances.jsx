import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, TrendingUp, Download, CreditCard, Users, BarChart3, Trash2, Banknote, ShieldOff } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (amount, currencyCode) => {
    const safeCurrency = currencyCode || 'EUR';
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: safeCurrency,
        }).format(amount);
    } catch (e) {
        return `${safeCurrency.toUpperCase()} ${amount.toFixed(2)}`;
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

const DoctorFinances = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { API_BASE_URL } = useAuth();

  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [financialData, setFinancialData] = useState({
    totalEarningsByCurrency: {},
    thisMonthEarningsByCurrency: {},
    totalPlatformFeesByCurrency: {},
    completedConsultations: 0,
    averagePerConsultationByCurrency: {}
  });

  const fetchPaymentRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not logged in. Redirecting to the login page.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/doctor_finances_api.php?action=get_payment_history`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment history.');
      }

      const data = await response.json();
      setPaymentRecords(data.payments || []);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: `Could not load financial history: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast, API_BASE_URL]);

  useEffect(() => {
    fetchPaymentRecords();
  }, [fetchPaymentRecords]);

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filteredRecords = paymentRecords.filter(record =>
      record.paymentStatus === 'paid' && record.consultationStatus === 'completed' && record.transfer_status === 'released'
    );

    if (selectedPeriod === 'thisMonth') {
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === 'lastMonth') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === lastMonthYear;
      });
    } else if (selectedPeriod === 'last3Months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      filteredRecords = filteredRecords.filter(record => new Date(record.date) >= threeMonthsAgo);
    }
    
    const calculateAggregates = (records, field) => {
        return records.reduce((acc, record) => {
            const currency = record.currency || 'EUR';
            acc[currency] = (acc[currency] || 0) + (record[field] || 0);
            return acc;
        }, {});
    };

    const totalEarningsByCurrency = calculateAggregates(filteredRecords, 'amount_transferred');
    const totalPlatformFeesByCurrency = calculateAggregates(filteredRecords, 'platform_fee');

    const thisMonthRecords = paymentRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && 
               recordDate.getFullYear() === currentYear && 
               record.paymentStatus === 'paid' && 
               record.consultationStatus === 'completed' &&
               record.transfer_status === 'released';
    });

    const thisMonthEarningsByCurrency = calculateAggregates(thisMonthRecords, 'amount_transferred');

    const completedConsultations = filteredRecords.length;
    
    const consultationsByCurrency = filteredRecords.reduce((acc, record) => {
        const currency = record.currency || 'EUR';
        acc[currency] = (acc[currency] || 0) + 1;
        return acc;
    }, {});

    const averagePerConsultationByCurrency = Object.keys(totalEarningsByCurrency).reduce((acc, currency) => {
        acc[currency] = totalEarningsByCurrency[currency] / (consultationsByCurrency[currency] || 1);
        return acc;
    }, {});

    setFinancialData({
      totalEarningsByCurrency,
      thisMonthEarningsByCurrency,
      totalPlatformFeesByCurrency,
      completedConsultations,
      averagePerConsultationByCurrency
    });
  }, [paymentRecords, selectedPeriod]);

  const getFilteredRecordsForDisplay = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let filtered = paymentRecords;

    if (selectedPeriod === 'thisMonth') {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === 'lastMonth') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === lastMonthYear;
      });
    } else if (selectedPeriod === 'last3Months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      filtered = filtered.filter(record => new Date(record.date) >= threeMonthsAgo);
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const handleGenerateReport = () => {
    const data = getFilteredRecordsForDisplay();
    if (data.length === 0) {
      toast({ title: "Empty Report", description: "No financial data for the selected period for the report." });
      return;
    }

    let reportContent = "Date,Patient,Time,Total Amount,Currency,Platform Fee,Net Earning,Payment Status,Consultation Status,Transfer Status,Transaction ID\n";
    data.forEach(record => {
      reportContent += [
        new Date(record.date).toLocaleDateString('en-US'),
        record.patientName,
        record.time,
        record.amount,
        record.currency || 'N/A',
        record.platform_fee || 0,
        record.amount_transferred || 0,
        record.paymentStatus,
        record.consultationStatus,
        record.transfer_status,
        record.paymentId
      ].join(',') + '\n';
    });

    const blob = new Blob([reportContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `financial_report_${selectedPeriod}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({ title: "Report Generated!", description: "Your financial report download has started." });
  };

  const handleDeletePaymentRecord = async (paymentRecordId, patientName) => {
    if (!window.confirm(`WARNING: You are about to PERMANENTLY DELETE the payment record for ${patientName}. This action cannot be undone and may affect the integrity of your financial reports. Do you want to continue?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctor_finances_api.php?action=delete_payment_record&payment_record_id=${paymentRecordId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment record.');
      }

      const data = await response.json();
      toast({
        title: "Success!",
        description: data.message,
      });
      fetchPaymentRecords();
    } catch (err) {
      toast({
        title: "Error",
        description: `Could not delete payment record: ${err.message}`,
        variant: "destructive",
      });
    }
  };


  const filteredRecordsForDisplay = getFilteredRecordsForDisplay();
  const periodLabels = { thisMonth: 'This Month', lastMonth: 'Last Month', last3Months: 'Last 3 Months', allTime: 'All Time' };

  const formatMultiCurrency = (currencyMap) => {
    if (Object.keys(currencyMap).length === 0) return formatCurrency(0, 'EUR');
    return Object.entries(currencyMap)
                 .map(([curr, amt]) => formatCurrency(amt, curr))
                 .join(' | ');
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }


  return (
    <>
      <Helmet>
        <title>Financial Report - MedBooking</title>
        <meta name="description" content="Track your earnings and payments on the MedBooking platform" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader showBackButton={true} showThemeToggle={true} />
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Financial Report</h1>
                <p className="text-xl text-muted-foreground">Track your earnings and payment history</p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="last3Months">Last 3 Months</SelectItem>
                    <SelectItem value="allTime">All Time</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGenerateReport} variant="outline"><Download className="w-4 h-4 mr-2" />Generate Report</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard 
                    title={`Net Earnings - ${periodLabels[selectedPeriod]}`} 
                    value={formatMultiCurrency(financialData.totalEarningsByCurrency)}
                    icon={DollarSign} 
                    color="from-green-600 to-green-700" 
                    delay={0.1} 
                />
                <StatCard title="Completed Consultations" value={financialData.completedConsultations} icon={Users} color="from-blue-600 to-blue-700" delay={0.2} />
                <StatCard 
                    title="Avg. Net per Consultation" 
                    value={formatMultiCurrency(financialData.averagePerConsultationByCurrency)}
                    icon={BarChart3} 
                    color="from-purple-600 to-purple-700" 
                    delay={0.3} 
                />
                <StatCard 
                    title="This Month's Net Earnings" 
                    value={formatMultiCurrency(financialData.thisMonthEarningsByCurrency)}
                    icon={TrendingUp} 
                    color="from-orange-600 to-orange-700" 
                    delay={0.4} 
                />
                 <StatCard 
                    title={`Platform Fees - ${periodLabels[selectedPeriod]}`} 
                    value={formatMultiCurrency(financialData.totalPlatformFeesByCurrency)}
                    icon={Banknote} 
                    color="from-red-600 to-red-700" 
                    delay={0.5} 
                />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2"><CreditCard className="w-5 h-5 text-primary" /><CardTitle>Payment History</CardTitle></div>
                  <CardDescription>All registered payments - {periodLabels[selectedPeriod]}</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredRecordsForDisplay.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-10 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                        <span>Date</span>
                        <span className="col-span-2">Patient</span>
                        <span>Total</span>
                        <span>Fee</span>
                        <span>Net</span>
                        <span>Pay Status</span>
                        <span>Consult. Status</span>
                        <span>Transfer Status</span>
                        <span>Actions</span>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredRecordsForDisplay.map((record, index) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="grid grid-cols-10 gap-4 text-sm py-3 border-b border-border hover:bg-secondary rounded items-center"
                          >
                            <span className="font-medium">{new Date(record.date).toLocaleDateString('en-US')}</span>
                            <span className="col-span-2">{record.patientName}</span>
                            <span className="font-semibold">{formatCurrency(record.amount, record.currency)}</span>
                            <span className="font-semibold text-red-600">{formatCurrency(record.platform_fee || 0, record.currency)}</span>
                            <span className="font-semibold text-green-600">{formatCurrency(record.amount_transferred || 0, record.currency)}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                record.paymentStatus === 'refunded' ? 'bg-red-100 text-red-800' :
                                record.paymentStatus === 'failed' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {record.paymentStatus}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                record.consultationStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                record.consultationStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                record.consultationStatus === 'cancelled' || record.consultationStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {record.consultationStatus}
                            </span>
                             <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                record.transfer_status === 'released' ? 'bg-green-100 text-green-800' :
                                record.transfer_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {record.transfer_status}
                            </span>
                            <div>
                                {(record.paymentStatus === 'paid' && record.transfer_status === 'pending') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeletePaymentRecord(record.id, record.patientName)}
                                        className="text-red-500 hover:text-red-700 p-0 h-auto"
                                        title="Delete payment record (Only for pending transfers)"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                 {record.paymentStatus === 'failed' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeletePaymentRecord(record.id, record.patientName)}
                                        className="text-red-500 hover:text-red-700 p-0 h-auto"
                                        title="Delete failed record"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                 )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground/80 mb-2">No payments found</h3>
                      <p className="text-muted-foreground">There are no registered payments for the selected period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DoctorFinances;