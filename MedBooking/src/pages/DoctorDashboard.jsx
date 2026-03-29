import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AppHeader from '@/components/shared/AppHeader';
import {
  Calendar,
  DollarSign,
  User,
  Users,
  Clock,
  HelpCircle,
  LogOut,
  ListChecks,
  Book,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
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

const DoctorTermsModal = () => (
  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-primary">MedBooking Terms of Service (Health Professionals)</DialogTitle>
      <DialogDescription>
        Last updated: {new Date().toLocaleDateString()}
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 text-foreground pt-4 text-sm">
      <p>Welcome to MedBooking, an innovative and secure scheduling solution designed to efficiently connect doctors and patients. By using our services, you agree to the Terms of Use described in this document. These terms are designed to ensure all interactions are conducted ethically, securely, and in accordance with local and international regulations.</p>
      
      <h4 className="font-semibold mt-2">1. Acceptance of Terms</h4>
      <p>By accessing or using our platform, you agree to fully comply with the Terms of Use described herein. If you do not agree with any part of this document, do not use our services.</p>
      
      <h4 className="font-semibold mt-2">2. Professional Licensing and Registration Requirements</h4>
      <p>The platform is intended for duly licensed and registered physicians according to the regulations of the patient's country of residence. By using the platform, you affirm that you are a qualified health professional and possess the necessary licenses to practice medicine in the patient's country of residence, as required by local law.</p>

      <h4 className="font-semibold mt-2">3. Limitation of Liability and Regulation of Care</h4>
      <p>MedBooking advises that all medical encounters conducted through the platform be restricted to doctors registered in the patient's country, in compliance with local legal standards. This means:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Care in Patient's Country of Residence:</strong> Remote medical care can only be provided by doctors registered and authorized to practice medicine in the patient's country of residence.</li>
          <li><strong>Platform Liability:</strong> The platform is not responsible for consultations or care provided outside the established regulations. If the doctor provides care to patients in other countries or outside local norms, the platform disclaims any liability for possible legal, ethical, or professional consequences.</li>
      </ul>

      <h4 className="font-semibold mt-2">4. Use of the Platform</h4>
      <p>By using the platform, you commit to:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Conduct Consultations Exclusively in the Patient's Country of Residence:</strong> In compliance with the laws and regulations of each country, consultations must only occur within authorized jurisdictional limits.</li>
          <li><strong>Maintain a Suitable Consultation Environment:</strong> You must ensure that the conditions for remote care are safe, effective, and ethical. This includes maintaining an appropriate consultation environment, with compatible and secure technology, respecting standards of confidentiality and quality.</li>
      </ul>

      <h4 className="font-semibold mt-2">5. Professional Responsibility</h4>
      <p>As a doctor, you are responsible for:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Providing Quality Medical Care:</strong> Care must be based on best medical practices and appropriate clinical knowledge, respecting international telemedicine protocols.</li>
          <li><strong>Requesting Informed Consent:</strong> Before starting any consultation, you must obtain informed consent from the patient, explaining the nature of the remote consultation and its risks.</li>
          <li><strong>Maintaining Medical Confidentiality:</strong> You must ensure that all personal and health information of the patient is kept confidential, in compliance with the data protection laws of the patient's country.</li>
      </ul>

      <h4 className="font-semibold mt-2">6. Patient Consent</h4>
      <p>The platform requires you to ensure that the patient provides explicit consent before the consultation begins, confirming awareness that the care is provided remotely and in compliance with local regulations. Consent must be documented and accessible to both parties.</p>

      <h4 className="font-semibold mt-2">7. Rules of Professional Conduct</h4>
      <p>You agree to follow the ethical guidelines and professional regulations of your country of residence, including, but not limited to:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Technical Responsibility:</strong> You will be responsible for ensuring that remote medical care is appropriate and that diagnoses and recommendations are made according to the best medical standards.</li>
          <li><strong>Limitations of Telemedicine:</strong> The platform advises that telemedicine consultations do not replace an in-person consultation when necessary. The doctor must assess, based on the patient's history, whether remote care is appropriate or if the patient should be referred for an in-person consultation.</li>
      </ul>

      <h4 className="font-semibold mt-2">8. Ownership and Use of the Platform</h4>
      <p>MedBooking grants registered doctors a limited, non-transferable, and non-exclusive right to use the platform for professional purposes, respecting all terms described herein. The doctor may not use the platform for other purposes, nor conduct activities outside the established guidelines.</p>
      
      <h4 className="font-semibold mt-2">9. Limitation of Liability</h4>
      <p>MedBooking is not responsible for:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Technical Failures:</strong> Any technical failure that occurs during a consultation, including internet connection problems or interruptions in telemedicine services.</li>
          <li><strong>Legal or Ethical Consequences:</strong> The platform is not responsible for any violation of legal norms or local regulations by the doctor or patient, including providing care outside the permitted jurisdiction.</li>
      </ul>

      <h4 className="font-semibold mt-2">10. Modifications to the Terms of Use</h4>
      <p>MedBooking reserves the right to change or update these Terms of Use at any time, without prior notice, to reflect changes in platform operations, laws, or professional guidelines. Any changes will be published on this page, and the updated version will be valid from the date of publication.</p>

      <h4 className="font-semibold mt-2">11. Support and Contact</h4>
      <p>If you have questions about these Terms of Use or how to use the platform, please contact our support team, which is available to assist you.</p>

      <h4 className="font-semibold mt-2">12. Guarantee of Legal and Professional Compliance</h4>
      <p>MedBooking is committed to following telemedicine regulations and ethical requirements in all locations where we operate. However, it is the doctor's responsibility to ensure that their care complies with the standards of their country of residence and with specific rules for the practice of telemedicine.</p>
      
      <h4 className="font-semibold mt-2">13. Acceptance of Terms</h4>
      <p>By using our platform, you confirm that you have read, understood, and agree to these Terms of Use. The platform aims to provide a safe, effective environment in compliance with the best practices of telemedicine.</p>

      <p className="font-semibold mt-2">Important Note: As the platform is used in multiple countries or regions, it is recommended that the doctor review the applicable local regulations, ensuring that their care always complies with relevant legal norms.</p>

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
            Clearly describe your problem or question.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-contact-subject">Subject</Label>
            <Input
              id="admin-contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject of your message"
              disabled={isSending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-contact-message">Message</Label>
            <Textarea
              id="admin-contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              disabled={isSending}
            />
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
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
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
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    className="h-full"
  >
    <Card className="flex flex-col h-full hover:shadow-xl transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        {Icon && <Icon className={`h-6 w-6 text-${color.split(' ')[0].split('-')[1]}-600`} />}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const AppointmentList = ({ title, appointments, icon: Icon, emptyMessage, emptyActionText, onEmptyAction, emptyActionIcon: EmptyActionIcon }) => (
  <Card className="col-span-1 md:col-span-2 lg:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center text-xl font-semibold">
        {Icon && <Icon className="w-5 h-5 mr-2 text-primary" />} {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {appointments && appointments.length > 0 ? (
        <ul className="space-y-4">
          {appointments.map(app => (
            <li key={app.id} className="border-b pb-2 last:pb-0 last:border-b-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{app.patient_name}</p>
                  <p className="text-sm text-gray-600">
                    {app.date} at {app.time}
                    {app.status && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${app.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{app.status}</span>}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{emptyMessage}</p>
          {onEmptyAction && emptyActionText && (
            <Button variant="outline" onClick={onEmptyAction}>
              {EmptyActionIcon && <EmptyActionIcon className="w-4 h-4 mr-2" />} {emptyActionText}
            </Button>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

const DoctorDashboard = () => {
  const { user, API_BASE_URL, token, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);

  const [isContactAdminModalOpen, setIsContactAdminModalOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchAppointments();

    const hasVisited = localStorage.getItem('hasVisitedDashboard');
    if (!hasVisited) {
      setShowWelcomePopup(true);
      localStorage.setItem('hasVisitedDashboard', 'true');
    }
  }, [user, token, API_BASE_URL, navigate, logout]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/profile_doctor.php?action=get_appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setAppointments(data.appointments || []);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredToday = [];
        const filteredUpcoming = [];

        data.appointments.forEach(app => {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);

          if (appDate.getTime() === today.getTime()) {
            filteredToday.push(app);
          } else if (appDate > today) {
            filteredUpcoming.push(app);
          }
        });

        setTodayAppointments(filteredToday);
        setUpcomingAppointments(filteredUpcoming);
        setTotalPatients(new Set(data.appointments.map(a => a.patient_id)).size);
        setThisMonthEarnings(calculateThisMonthEarnings(data.appointments));
      } else {
        setError(data.message || "Failed to load appointments.");
        toast({
          title: "Error loading appointments",
          description: data.message || "Could not fetch your appointments.",
          variant: "destructive",
        });
        if (data.message && (data.message.includes("Invalid token") || data.message.includes("expired"))) {
          logout();
        }
      }
    } catch (err) {
      setError("Network error when loading appointments.");
      toast({
        title: "Network Error",
        description: "Could not connect to the server to fetch appointments.",
        variant: "destructive",
      });
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateThisMonthEarnings = (appointments) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let earnings = 0;
    appointments.forEach(app => {
      const appDate = new Date(app.date);
      if (appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear && (app.status === 'Confirmed' || app.status === 'confirmed')) {
        earnings += parseFloat(app.consultation_fee || 0);
      }
    });
    return earnings.toFixed(2);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenContactAdminModal = () => {
    setIsContactAdminModalOpen(true);
  };

  const handleCloseContactAdminModal = () => {
    setIsContactAdminModalOpen(false);
  };

  const handleSendAdminEmail = async (toEmailPlaceholder, subject, message, recipientType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/send_contact_email.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          senderName: user?.name || 'Doctor User',
          senderEmail: user?.email,
          subject, 
          message, 
          recipientType 
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Message Sent!",
          description: data.message,
        });
        return { success: true };
      } else {
        toast({
          title: "Error Sending Message",
          description: data.message || "Could not send your message to the administrator. Try again.",
          variant: "destructive",
        });
        if (data.message && (data.message.includes("Invalid token") || data.message.includes("expired"))) {
          logout();
        }
        return { success: false };
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server to send the message.",
        variant: "destructive",
      });
      console.error("Error sending contact email to admin:", error);
      return { success: false };
    }
  };

  return (
    <>
      <Helmet>
        <title>Doctor's Dashboard - MedBooking</title>
        <meta name="description" content="Doctor's dashboard to manage schedule and profile." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader showBackButton={false} showThemeToggle={true} /> 

        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-4xl font-extrabold text-center text-foreground mb-6">
              Welcome,  <span className="gradient-text">{user?.name || 'Dr.'}</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Appointments Today" value={todayAppointments.length} icon={Clock} color="from-blue-600 to-cyan-600" delay={0.1} />
              <StatCard title="Upcoming Appointments" value={upcomingAppointments.length} icon={Calendar} color="from-green-600 to-green-700" delay={0.2} />
              <StatCard title="This Month's Earnings" value={`€${thisMonthEarnings}`} icon={DollarSign} color="from-purple-600 to-purple-700" delay={0.3} />
              <StatCard title="Total Patients" value={totalPatients} icon={Users} color="from-orange-600 to-orange-700" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
              <QuickActionCard
                title="Manage Schedule"
                description="Set your hours"
                icon={Calendar}
                color="from-blue-600 to-purple-600"
                onClick={() => navigate('/doctor/schedule')}
                delay={0.1}
              />
              <QuickActionCard
                title="Manage Appointments"
                description="View and cancel appointments"
                icon={ListChecks}
                color="from-cyan-500 to-blue-500"
                onClick={() => navigate('/doctor/manage-appointments')}
                delay={0.2}
              />
              <QuickActionCard
                title="Financial Report"
                description="Track your earnings"
                icon={DollarSign}
                color="from-green-600 to-blue-600"
                onClick={() => navigate('/doctor/finances')}
                delay={0.3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
              <QuickActionCard
                title="My Profile"
                description="Update your information"
                icon={User}
                color="from-purple-600 to-pink-600"
                onClick={() => navigate('/doctor/profile')}
                delay={0.4}
              />
              <QuickActionCard
                title="Terms of Service"
                description="Review the platform rules"
                icon={Book}
                color="from-gray-600 to-gray-800"
                onClick={() => setIsTermsModalOpen(true)}
                delay={0.5}
              />
              <QuickActionCard
                title="Contact Support"
                description="Send a message to the administrator"
                icon={HelpCircle}
                color="from-gray-600 to-gray-800"
                onClick={handleOpenContactAdminModal}
                delay={0.6}
              />
            </div>

            <AppointmentList
              title="Today's Appointments"
              appointments={todayAppointments}
              icon={Clock}
              emptyMessage="No appointments scheduled for today."
              emptyActionText="Set Hours"
              onEmptyAction={() => navigate('/doctor/schedule')}
              emptyActionIcon={Calendar}
            />

            <div className="text-center mt-8">
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <ContactAdminModal
        isOpen={isContactAdminModalOpen}
        onClose={handleCloseContactAdminModal}
        onSendEmail={handleSendAdminEmail}
      />
      <AlertDialog open={showWelcomePopup} onOpenChange={setShowWelcomePopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome, Doctor!</AlertDialogTitle>
            <AlertDialogDescription>
              Please note: 
              <li> Connect to your Google account into up-right menu to schedule appointments and teleconsultations via Google Meet. </li>
              <li> Upload your PDF file containing your medical credentials and send us a message to remain active for patients to view. </li> 
              <li> Keep your profile up to date with WhatsApp number and provide your bank details for deposits after scheduled appointments.</li>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWelcomePopup(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DoctorTermsModal />
      </Dialog>
    </>
  );
};

export default DoctorDashboard;