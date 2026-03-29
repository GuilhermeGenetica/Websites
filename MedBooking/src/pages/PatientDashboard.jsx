import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar,
  User,
  HelpCircle,
  LogOut,
  Search,
  CheckCircle,
  HeartHandshake,
  ListChecks,
  Book,
  Shield,
  X
} from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const TermsOfUseModal = () => (
  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-primary">MedBooking Terms of Service</DialogTitle>
      <DialogDescription>
        Please read these terms carefully before using our platform.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 text-foreground pt-4 text-sm">
      
      <p className="font-bold text-lg">IMPORTANT MEDICAL DISCLAIMER</p>
      <p>MedBooking is NOT a healthcare provider, telemedicine service, or medical clinic at this time. We do NOT provide medical advice, diagnosis, or treatment. Our platform is a scheduling and facilitation service designed to connect patients with independent, verified medical professionals.</p>
      <p>Any and all medical care, advice, or teleconsultation services are provided solely by the independent doctors registered on our platform. MedBooking does not store or have access to any patient medical records, clinical notes, or personal health information (PHI) exchanged during a consultation.</p>

      <ul className="list-disc list-inside space-y-2 mt-4">
        <li><strong>Role of the Platform:</strong> MedBooking acts as a technology facilitator to help patients find and book appointments with doctors. We also provide a secure payment processing service.</li>
        <li><strong>Doctor's Responsibility:</strong> Registered doctors are independent contractors, not employees of MedBooking. Each doctor is solely responsible for their medical license, compliance with all local, national, and international laws governing their medical practice (including telemedicine), and the quality of the medical care they provide. The doctor is responsible for providing the patient with the tool and link for any online consultation (e.g., Google Meet, Zoom, WhatsApp).</li>
        <li><strong>Doctor Verification:</strong> We perform a manual verification of doctors' credentials (such as medical license and specialty) upon registration. However, it is the responsibility of the client and the doctors to inform us of any changes or updates to this information regarding the professional competence of any doctor, after initial approval.</li>
        <li><strong>Payment and Fees:</strong> Patients pay the full consultation fee to MedBooking at the time of booking. MedBooking holds these funds and releases 90% of the fee to the doctor after the appointment is confirmed as completed. MedBooking retains a 10% service and processing fee.</li>
        <li><strong>Cancellation and Refund Policy:</strong> All cancellation and refund requests must be submitted through our official support contact form.
          <ul className="list-circle list-inside ml-6 mt-1">
            <li>Cancellations made more than 24 hours before the scheduled appointment time are eligible for a refund of the consultation fee, minus a 20% processing and administrative fee.</li>
            <li>Cancellations made within 24 hours of the appointment, or failure to attend (no-show), are not eligible for a refund.</li>
          </ul>
        </li>
        <li><strong>No Medical Records:</strong> We are not a medical records system. We do not store, manage, or have access to any clinical notes, diagnoses, or patient histories. This data is managed exclusively by the patient and their chosen doctor.</li>
      </ul>
    </div>
     <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </DialogClose>
  </DialogContent>
);

const PrivacyPolicyModal = () => (
  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-primary">MedBooking Privacy Policy</DialogTitle>
      <DialogDescription>
        How we collect, use, and protect your information.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 text-foreground pt-4 text-sm">
      <p>MedBooking is committed to protecting your privacy. This policy describes how we handle your personal information.</p>
      
      <h4 className="font-semibold mt-2">Information We Collect</h4>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>For Patients:</strong> We collect your name, email, contact details, and payment information. Payment details are processed by Stripe; we do not store your full credit card number.</li>
        <li><strong>For Doctors:</strong> We collect your name, email, professional contact details, bank account information (for payouts), and copies of your professional credentials (license, diploma) for verification purposes.</li>
      </ul>

      <h4 className="font-semibold mt-2">What We DO NOT Collect</h4>
      <p>We DO NOT collect, store, or process any Personal Health Information (PHI), medical records, clinical notes, symptoms, or diagnoses. Your medical information is confidential and shared only between you and your doctor.</p>
      
      <h4 className="font-semibold mt-2">How We Use Your Data</h4>
      <ul className="list-disc list-inside space-y-2">
        <li>To facilitate account creation and management.</li>
        <li>To process appointment bookings and payments.</li>
        <li>To manually verify the credentials of medical professionals.</li>
        <li>To facilitate communication between patient and doctor for a scheduled appointment.</li>
      </ul>

      <h4 className="font-semibold mt-2">Data Sharing</h4>
      <ul className="list-disc list-inside space-y-2">
        <li>Your contact information is shared with the other party (doctor or patient) only after a booking is confirmed.</li>
        <li>We share necessary data with third-party service providers, such as Stripe for payment processing.</li>
        <li>We do not sell your personal information to any third parties.</li>
      </ul>

      <h4 className="font-semibold mt-2">Legal Compliance</h4>
      <p>We operate in compliance with major global data protection laws, such as the GDPR. As we are not a healthcare provider and do not store PHI, we are not a "Covered Entity" under HIPAA (USA). However, we apply high standards of security to protect all user data.</p>
      
      <p className="mt-4">For any questions or requests related to your privacy, please contact us via our official Contact Support form.</p>
    </div>
     <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </DialogClose>
  </DialogContent>
);

const ContactAdminModal = ({ isOpen, onClose, onSendEmail }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!subject || !message) {
      toast({
        title: "Required fields",
        description: "Please fill in the subject and message.",
        variant: "destructive",
      });
      return;
    }
    setIsSending(true);
    const result = await onSendEmail(null, subject, message, 'admin');
    setIsSending(false);
    if (result.success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Contact Administrator</AlertDialogTitle>
          <AlertDialogDescription>
            Use this form to send a message directly to the administration team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-contact-subject">Subject</Label>
            <Input id="admin-contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject of your message" disabled={isSending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-contact-message">Message</Label>
            <Textarea id="admin-contact-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." rows={6} disabled={isSending} />
          </div>
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
    <Card className={`bg-gradient-to-br ${color} text-white shadow-lg`}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium opacity-80">{title}</CardTitle>
          <div className="text-3xl font-bold mt-1">{value}</div>
        </div>
        {Icon && <Icon className="w-10 h-10 opacity-30" />}
      </CardContent>
    </Card>
  </motion.div>
);

const QuickActionCard = ({ title, description, icon: Icon, color, onClick, delay }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay }} className="h-full">
    <Card className="flex flex-col h-full hover:shadow-xl transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        {Icon && <Icon className={`h-6 w-6 text-${color.split(' ')[0].split('-')[1]}-600`} />}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const PatientDashboard = () => {
  const { user, API_BASE_URL, token, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [isContactAdminModalOpen, setIsContactAdminModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!user || !token) {
      navigate('/');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/get_patient_appointments.php`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const now = new Date();
        const upcoming = data.appointments.filter(app => new Date(`${app.appointment_date}T${app.appointment_time}`) > now);
        const completed = data.appointments.filter(app => new Date(`${app.appointment_date}T${app.appointment_time}`) <= now);
        setUpcomingAppointments(upcoming);
        setCompletedAppointments(completed);
        setTotalAppointments(data.appointments.length);
      } else {
        if (data.message && (data.message.includes("Invalid token") || data.message.includes("expired"))) {
          logout();
        }
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  }, [user, token, API_BASE_URL, navigate, logout]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

const handleSendAdminEmail = async (toEmailPlaceholder, subject, message, recipientType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/send_contact_email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          senderName: user?.name || 'Patient User',
          senderEmail: user?.email,
          subject, 
          message, 
          recipientType 
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "Message Sent!", description: data.message });
        return { success: true };
      } else {
        toast({ title: "Sending Error", description: data.message, variant: "destructive" });
        return { success: false };
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not send the message.", variant: "destructive" });
      return { success: false };
    }
  };

  const modals = {
    'terms': <TermsOfUseModal />,
    'privacy': <PrivacyPolicyModal />,
  };

  return (
    <>
      <Helmet><title>Patient Dashboard</title></Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader /> 
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-4xl font-extrabold text-center">Welcome, <span className="gradient-text">{user?.name || 'Patient'}</span>!</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Upcoming Appointments" value={upcomingAppointments.length} icon={Calendar} color="from-blue-600 to-purple-600" delay={0.1} />
              <StatCard title="Completed Appointments" value={completedAppointments.length} icon={CheckCircle} color="from-green-600 to-teal-600" delay={0.2} />
              <StatCard title="Total Appointments" value={totalAppointments} icon={HeartHandshake} color="from-yellow-600 to-orange-600" delay={0.3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
              <QuickActionCard title="Search Doctors" description="Find and book new appointments" icon={Search} color="from-blue-600 to-cyan-600" onClick={() => navigate('/patient/search-doctors')} delay={0.1} />
              <QuickActionCard title="My Profile" description="View or update your information" icon={User} color="from-purple-600 to-pink-600" onClick={() => navigate('/patient/profile')} delay={0.2} />
              <QuickActionCard title="My Appointments" description="View and manage your appointments" icon={ListChecks} color="from-orange-600 to-red-600" onClick={() => navigate('/patient/my-appointments')} delay={0.3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
              <QuickActionCard title="Terms of Use" description="Read our platform terms" icon={Book} color="from-gray-600 to-gray-800" onClick={() => setActiveModal('terms')} delay={0.4} />
              <QuickActionCard title="Privacy Policy" description="How we handle your data" icon={Shield} color="from-gray-600 to-gray-800" onClick={() => setActiveModal('privacy')} delay={0.5} />
              <QuickActionCard title="Contact Support" description="Send a message to the administrator" icon={HelpCircle} color="from-gray-600 to-gray-800" onClick={() => setIsContactAdminModalOpen(true)} delay={0.6} />
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <ContactAdminModal isOpen={isContactAdminModalOpen} onClose={() => setIsContactAdminModalOpen(false)} onSendEmail={handleSendAdminEmail} />
      
      <Dialog open={activeModal !== null} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
        {activeModal && modals[activeModal]}
      </Dialog>
    </>
  );
};

export default PatientDashboard;