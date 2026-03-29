// /src/pages/DashboardPage.jsx (from NutraGenius project)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet'; 
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext'; 
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Send, Edit, DollarSign, X, ShoppingCart, Loader2, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ThemeToggle from '@/components/ThemeToggle'; 
import { useToast } from '@/components/ui/use-toast'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'; 
import 'react-circular-progressbar/dist/styles.css'; 
import axios from 'axios';
import { generateRecommendations } from '@/utils/recommendationEngine'; 

const fieldWeights = {
    profile: { title: "Profile", weight: 40, fields: ['fullName', 'age', 'gender', 'height', 'weight', 'ethnicity', 'activityLevel', 'sleepHours', 'stressLevel', 'diet', 'smokingStatus', 'alcoholConsumption', 'healthGoals', 'healthConcerns', 'medicalConditions', 'currentMedications', 'currentSupplements', 'allergies'] },
    lab: { title: "Lab Results", weight: 40, fields: ['hemoglobin', 'hematocrit', 'rbc', 'mcv', 'mch', 'mchc', 'rdw', 'wbc', 'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils', 'platelets', 'vitaminD', 'vitaminB12', 'folate', 'vitaminB6', 'ferritin', 'serumIron', 'tibc', 'transferrinSat', 'serumMagnesium', 'rBCMagnesium', 'serumZinc', 'copper', 'selenium', 'totalCalcium', 'totalProtein', 'albumin', 'homocysteine', 'hsCRP', 'fibrinogen', 'totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'apoB', 'lipoproteinA', 'fastingGlucose', 'hba1c', 'fastingInsulin', 'homaIR', 'uricAcid', 'alt', 'ast', 'ggt', 'alkalinePhosphatase', 'creatinine', 'eGFR', 'bun', 'sodium', 'potassium', 'tsh', 'freeT4', 'freeT3', 'tpoAb', 'thyroglobulinAb', 'cortisolAM', 'dheas', 'totalTestosterone', 'shbg', 'estradiol', 'progesterone'] },
    genetic: { title: "Genetic", weight: 20, fields: ['geneticVariants', 'geneticReport'] }
};

// REMOVIDO: Constantes de conexão (CONNECTION_DURATION)

const DashboardPage = () => {
  const { user, logout, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completion, setCompletion] = useState({ profile: 0, lab: 0, genetic: 0, total: 0 });
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [keyNutrients, setKeyNutrients] = useState([]);
  
  // NOVO: Estado para o loading do botão da loja
  const [isConnectingToShop, setIsConnectingToShop] = useState(false);

  // REMOVIDO: broadcastChannel, isConnectionActive, connectionCountdown

  // Calculation logic (calculateCompletion) permanece o mesmo
  const calculateCompletion = useCallback((data) => {
    if (!data) return { profile: 0, lab: 0, genetic: 0, total: 0 };
    let individualScores = {};
    let totalWeightedScore = 0;
    for (const sectionKey in fieldWeights) {
        const { weight, fields } = fieldWeights[sectionKey];
        let filledCount = 0;
        fields.forEach(field => {
            const value = data[field];
            const isEmptyArray = Array.isArray(value) && value.length === 0;
            if (value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '') && !isEmptyArray) {
                filledCount++;
             }
        });
        const sectionPercentage = fields.length > 0 ? Math.round((filledCount / fields.length) * 100) : 0;
        individualScores[sectionKey] = sectionPercentage;
        totalWeightedScore += (sectionPercentage / 100) * weight;
    }
    return { profile: individualScores.profile || 0, lab: individualScores.lab || 0, genetic: individualScores.genetic || 0, total: Math.round(totalWeightedScore) };
  }, []);

  // fetchAndProcessData permanece o mesmo
  const fetchAndProcessData = useCallback(async () => {
    if (!user) {
        setIsLoadingData(false);
        setDataError("User session not found. Please log in.");
        return;
    }

    setIsLoadingData(true);
    setDataError(null);
    setKeyNutrients([]);
    try {
        const response = await axios.get('/api/questionnaire.php');

        if (response.data) {
            const fetchedData = response.data;
            fetchedData.healthGoals = Array.isArray(fetchedData.healthGoals) ? fetchedData.healthGoals : [];
            fetchedData.healthConcerns = Array.isArray(fetchedData.healthConcerns) ? fetchedData.healthConcerns : [];
            setCompletion(calculateCompletion(fetchedData));
            const { keyNutrients: nutrients } = await generateRecommendations(fetchedData);
            setKeyNutrients(nutrients || []);

        } else {
            setCompletion({ profile: 0, lab: 0, genetic: 0, total: 0 });
            setDataError("No questionnaire data found for your account.");
        }
    } catch (error) {
        console.error("Failed to fetch data or generate recommendations for dashboard:", error);
        if (error.response && error.response.status === 401) {
             setDataError("Authentication error. Please log in again.");
        } else {
            setDataError("Could not load your data or recommendations. Please try again later.");
        }
        setCompletion({ profile: 0, lab: 0, genetic: 0, total: 0 });
        setKeyNutrients([]);
    } finally {
        setIsLoadingData(false);
    }
  }, [user, calculateCompletion]); // Adicionado `generateRecommendations` se for uma dependência, embora pareça ser importado estaticamente


  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  // Payment success/cancel logic permanece o mesmo
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('payment_success')) {
      toast({ title: 'Payment Successful!', description: 'Your account has been upgraded.' });
      checkAuthStatus();
      navigate('/dashboard', { replace: true });
    }
    if (query.get('payment_canceled')) {
       toast({ title: 'Payment Canceled', description: 'Your payment was canceled.', variant: 'destructive' });
      navigate('/dashboard', { replace: true });
    }
  }, [checkAuthStatus, toast, navigate]);

  // REMOVIDO: useEffect do countdown timer

  // handleLogout permanece o mesmo
  const handleLogout = async () => { await logout(); navigate('/'); };

  // handleGenerateReport permanece o mesmo
  const handleGenerateReport = () => {
    if (user?.has_paid) {
         navigate('/report/preview');
    } else {
        toast({ title: "Premium Feature", description: "Please complete payment to generate reports.", action: <Button onClick={handlePayment}>Pay Now</Button> });
    }
  };


  // ** FIX: Updated handlePayment to call the backend API **
  const handlePayment = async () => {
    setIsLoadingPayment(true);
    try {
      // 1. Call the backend to create a session
      // This sends the user's cookie, so the backend knows who is paying
      const response = await axios.post('/api/stripe.php', { 
        action: 'create-checkout-session' 
      });
      
      // 2. Check for the URL from the backend response
      if (response.data && response.data.url) {
        // 3. Redirect to the Stripe checkout URL
        window.location.href = response.data.url;
      } else {
        // This handles errors returned from stripe.php
        throw new Error(response.data.error || 'Invalid response from payment server');
      }
    } catch (error) {
      console.error("Payment Initiation Error:", error);
      toast({
        title: 'Payment Error',
        description: error.response?.data?.error || 'Could not initiate payment. Please try again.',
        variant: 'destructive',
      });
      setIsLoadingPayment(false);
    }
  };

  // REMOVIDO: initiateShopConnection
  // REMOVIDO: handleConnectToShop

  // ATUALIZADO: handleViewAndConnect para usar a nova API
  const handleViewAndConnect = async () => {
    // 1. Verificar se os dados estão prontos
    if (isLoadingData) {
         toast({ title: 'Data Loading', description: 'Please wait until your data and recommendations are loaded.', variant: 'default' });
         return;
    }
    if (dataError) {
         toast({ title: 'Data Error', description: `Cannot connect due to a data error: ${dataError}`, variant: 'destructive' });
         return;
    }
    if (!keyNutrients || keyNutrients.length === 0) {
        toast({ title: 'No Recommendations', description: 'No supplement recommendations generated based on your current data.', variant: 'destructive'});
        return;
    }

    setIsConnectingToShop(true);
    try {
        // 2. Chamar a nova API do backend do NutraGenius
        const response = await axios.post('/api/initiate_shop_link.php', { 
            recommendedNutrients: keyNutrients 
        });

        if (response.data && response.data.status === 'success' && response.data.token) {
            const token = response.data.token;
            
            // 3. Abrir o Shop em uma nova aba com o token

            const SHOP_BASE_URL = process.env.VITE_SHOP_URL ||  'https://nutrashop.app';
            const url = `${SHOP_BASE_URL}/shop?link_token=${token}`;
            
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            
            if (newWindow) {
                toast({
                    title: 'Opening NutraShop!',
                    description: 'Your recommendations are being loaded in a new tab.'
                });
            } else {
                 toast({
                    title: 'Popup Blocked?',
                    description: `Couldn't open NutraShop automatically. Please allow popups for this site.`,
                    duration: 7000
                 });
            }
        } else {
            // Se a API retornar um erro (ex: falha no cURL)
            throw new Error(response.data.message || 'Failed to get link token from server.');
        }

    } catch (error) {
        console.error("Error initiating shop connection:", error);
        toast({
            title: 'Connection Error',
            description: error.response?.data?.message || 'Could not send recommendations to NutraShop. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsConnectingToShop(false);
    }
  };

  // handleDownloadSupplements permanece o mesmo
  const handleDownloadSupplements = () => {
    if (isLoadingData || !keyNutrients || keyNutrients.length === 0) {
        toast({
            title: 'No Recommendations',
            description: isLoadingData ? 'Recommendations still loading.' : 'No recommendations available to download.',
            variant: 'destructive'
        });
        return;
    }
    try {
        const payload = {
            source: 'NutraGenius',
            timestamp: Date.now(),
            recommendedNutrients: keyNutrients
        };
        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Recommended Supplements.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate download:", error);
        toast({
            title: 'Download Error',
            description: 'Could not prepare the file for download.',
            variant: 'destructive'
        });
    }
  };

  // SendReportModal permanece o mesmo
  const SendReportModal = () => {
        const [doctorInfo, setDoctorInfo] = useState({ doctorName: '', doctorEmail: '', message: '' });
        const [isSending, setIsSending] = useState(false);
        const handleSend = async (e) => {
            e.preventDefault();
            setIsSending(true);
            try {
                await axios.post('/api/send_report.php', doctorInfo);
                toast({ title: 'Success!', description: "Report sent successfully." });
                setIsModalOpen(false);
                 setDoctorInfo({ doctorName: '', doctorEmail: '', message: '' });
            } catch (error) {
                 console.error("Send report error:", error);
                toast({ title: 'Failed to Send', description: error.response?.data?.error || 'An error occurred while sending the report.', variant: 'destructive' });
            } finally { setIsSending(false); }
        };
        return (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Send Report to Doctor</DialogTitle>
                        <DialogDescription>
                            Enter your doctor's details to send them a secure link to your report.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSend} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doctorNameModal" className="text-right">Doctor's Name</Label>
                            <Input id="doctorNameModal" required value={doctorInfo.doctorName} onChange={(e) => setDoctorInfo({...doctorInfo, doctorName: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="doctorEmailModal" className="text-right">Doctor's Email</Label>
                            <Input id="doctorEmailModal" type="email" required value={doctorInfo.doctorEmail} onChange={(e) => setDoctorInfo({...doctorInfo, doctorEmail: e.target.value})} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="messageModal" className="text-right">Message <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                            <Textarea id="messageModal" placeholder="Write a brief message..." value={doctorInfo.message} onChange={(e) => setDoctorInfo({...doctorInfo, message: e.target.value})} className="col-span-3" />
                        </div>
                         <DialogFooter>
                             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="gold-bg" disabled={isSending}>
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {isSending ? 'Sending...' : 'Send Report'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
  };

  // --- JSX Rendering ---
  return (
    <TooltipProvider>
      <Helmet><title>Dashboard - NutraGenius</title></Helmet>
      <SendReportModal />
      <div className="min-h-screen bg-background text-foreground">
        <header className="bg-card shadow-sm no-print">
            {/* Header JSX (sem alterações) */}
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-foreground">NutraGenius Dashboard</h1>
                <div className="flex items-center gap-4">
                    <Link to="/profile" className="text-sm font-medium hover:text-primary">Profile</Link>
                    <Button variant="ghost" onClick={handleLogout} size="sm">Logout</Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>

        <main className="container mx-auto p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h2 className="text-3xl font-semibold mb-4">Welcome back, {user?.full_name || 'User'}!</h2>
                 {user && !user.has_paid && (
                   <>
                     {/* Cartão de Pagamento (sem alterações) */}
                     <Card className="mb-6 bg-yellow-100 dark:bg-yellow-900/50 border-yellow-500">
                       <CardHeader className="flex flex-row items-center gap-4">
                         <DollarSign className="w-8 h-8 text-yellow-600"/>
                         <div>
                           <CardTitle>Unlock Full Potential</CardTitle>
                           <CardDescription>Your account has limited access. Complete payment to generate reports and use all features.</CardDescription>
                         </div>
                       </CardHeader>
                       <CardContent>
                         <Button className="gold-bg" onClick={handlePayment} disabled={isLoadingPayment}>
                             {isLoadingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <DollarSign className="mr-2 h-4 w-4" />}
                             {isLoadingPayment ? 'Processing...' : 'Complete Payment Now'}
                         </Button>
                       </CardContent>
                     </Card>
                   </>
                )}
            </motion.div>

          {/* ESTA É A GRID PRINCIPAL CORRETA */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Cartão do Questionário */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              {/* CORREÇÃO: Removidas as classes 'grid', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6', 'items-start' */}
              <Card className="h-full flex flex-col">
                 <CardHeader>
                  <CardTitle>Health Profile Completion</CardTitle>
                  <CardDescription>Status based on your input.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center">
                   {isLoadingData ? (
                       <div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary"/><p className="text-sm mt-2">Loading profile...</p></div>
                   ) : dataError ? (
                        <div className="text-center text-destructive"><p>{dataError}</p></div>
                   ) : (
                      <div className="grid grid-cols-2 gap-4 w-full mb-6 text-center">
                        {Object.entries(completion)
                            .filter(([key]) => key !== 'total')
                            .map(([key, value]) => (
                            <div key={key} className="flex flex-col items-center">
                               <div className="w-20 h-20 sm:w-24 sm:h-24">
                                  <CircularProgressbar value={value} text={`${value}%`} styles={buildStyles({ textSize: '18px', textColor: 'hsl(var(--foreground))', pathColor: 'hsl(var(--primary))', trailColor: 'hsl(var(--muted))' })} />
                               </div>
                               <p className="text-xs font-semibold mt-2">{fieldWeights[key]?.title || key}</p>
                            </div>
                        ))}
                         <div className="flex flex-col items-center col-span-2 sm:col-span-1">
                           <div className="w-20 h-20 sm:w-24 sm:h-24">
                              <CircularProgressbar value={completion.total} text={`${completion.total}%`} styles={buildStyles({ textSize: '18px', textColor: 'hsl(var(--foreground))', pathColor: 'hsl(var(--brand-gold))', trailColor: 'hsl(var(--muted))' })} />
                           </div>
                           <p className="text-sm font-bold mt-2">Overall Progress</p>
                        </div>
                      </div>
                   )}
                  <Button onClick={() => navigate('/questionnaire')} disabled={isLoadingData}>
                    <Edit className="mr-2 h-4 w-4" />
                    {isLoadingData ? 'Loading...' : (completion.total > 0 ? 'View / Edit Information' : 'Start Questionnaire')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

             {/* Cartão do Plano Personalizado (Botões ATUALIZADOS) */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              {/* CORREÇÃO: Removidas as classes 'grid', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6', 'items-start' */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Your Personalised Plan</CardTitle>
                  <CardDescription>Generate report & connect to shop.</CardDescription>
                </CardHeader>
                {/* CORREÇÃO: Adicionado 'flex-grow flex flex-col' para empurrar as dicas para o final */}
                <CardContent className="flex-grow flex flex-col space-y-4">
                  
                  {/* Wrapper para o conteúdo principal (botões) */}
                  <div className="flex-grow">
                    {/* Botão Gerar Relatório (sem alterações) */}
                    <Button size="lg" onClick={handleGenerateReport} className="w-full" disabled={isLoadingData || !user?.has_paid}>
                      <FileText className="mr-2 h-4 w-4" />
                      {isLoadingData ? 'Loading Data...' : 'Generate My Report'}
                    </Button>

                    <div className="text-center">
                      {isLoadingData && <div className="text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin inline-block"/> Loading recommendations...</div>}
                      {dataError && !isLoadingData && <p className="text-sm text-destructive">{dataError}</p>}

                      {!isLoadingData && !dataError && user?.has_paid && (
                        <div className="space-y-2 pt-2">
                          
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button 
                                      size="lg" 
                                      className="w-full gold-bg" 
                                      onClick={handleViewAndConnect}
                                      disabled={keyNutrients.length === 0 || isConnectingToShop || isLoadingData}
                                  >
                                    {isConnectingToShop ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                                    {isConnectingToShop ? 'Connecting...' : 'View Recommended Supplements'}
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  {keyNutrients.length > 0 ? 
                                      (isConnectingToShop ? <p>Sending recommendations to NutraShop...</p> : <p>Click to open NutraShop with your recommendations applied.</p>) :
                                      <p>No recommendations generated yet. Ensure your profile is complete.</p>
                                  }
                              </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleDownloadSupplements}
                                    disabled={keyNutrients.length === 0}
                                  >
                                      <Download className="mr-2 h-4 w-4" />
                                      Download Supplements (.json)
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{keyNutrients.length > 0 ? "Download your recommended supplements list." : "No recommendations available to download."}</p>
                              </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>

                   {/* Mensagens condicionais (CORREÇÃO: movidas para um wrapper com 'mt-auto') */}
                   <div className="mt-auto pt-4">
                    {!user?.has_paid && <p className="text-xs text-center mt-2 text-destructive">Payment required for these features.</p>}
                    {user?.has_paid && !isLoadingData && !dataError && completion.total < 80 && <p className="text-xs text-center mt-2 text-amber-600">Tip: Complete more of your profile ({completion.total}%) for potentially better recommendations.</p>}
                   </div>
                </CardContent>
              </Card>
            </motion.div>

             {/* Cartão de Serviços Profissionais (sem alterações) */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              {/* CORREÇÃO: Removidas as classes 'grid', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6', 'items-start' */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Professional Services</CardTitle>
                  <CardDescription>Connect with experts for guidance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-8">
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => user?.has_paid ? setIsModalOpen(true) : toast({ title: 'Premium Feature', description: 'Please complete payment to send reports.'})}
                            disabled={!user?.has_paid || isLoadingData || !!dataError}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Send Report to My Doctor
                        </Button>
                     </TooltipTrigger>
                     {!user?.has_paid && <TooltipContent><p>Payment required to send reports.</p></TooltipContent>}
                     {user?.has_paid && (isLoadingData || !!dataError) && <TooltipContent><p>Your data must be loaded without errors to send the report.</p></TooltipContent>}
                    </Tooltip>
                      <a 
                          // CORREÇÃO: Usa a variável de ambiente e anexa o caminho '/schedule'
                          href={`${process.env.VITE_APP_URL_BOOKING || 'https://medbooking.app'}/#search`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full"
                      >
                    <Button variant="outline" className="w-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule a Consultation
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default DashboardPage;
