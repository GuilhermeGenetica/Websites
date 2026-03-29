import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import LandingPage from '@/pages/LandingPage';
import PatientDashboard from '@/pages/PatientDashboard';
import DoctorDashboard from '@/pages/DoctorDashboard';
import PatientProfile from '@/pages/PatientProfile';
import DoctorProfile from '@/pages/DoctorProfile';
import SearchDoctors from '@/pages/SearchDoctors';
import BookAppointment from '@/pages/BookAppointment';
import DoctorSchedule from '@/pages/DoctorSchedule';
import DoctorFinances from '@/pages/DoctorFinances';
import PaymentSuccess from '@/pages/PaymentSuccess';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword'; 
import PaymentError from '@/pages/PaymentError';
import AdminDashboard from '@/pages/AdminDashboard'; 
import DoctorPublicProfile from '@/pages/DoctorPublicProfile';
import PatientAppointments from '@/pages/PatientAppointments';
import ManageAppointments from '@/pages/ManageAppointments';
import PatientInfoCard from '@/pages/PatientInfoCard';
import UserDetails from '@/pages/UserDetails';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const AppContent = () => {
  const { theme } = useAuth();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Add check for Stripe key availability
  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: Stripe publishable key (VITE_STRIPE_PUBLIC_KEY) is not configured.
        Please check the .env file in the project root.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/search-doctors" element={<SearchDoctors />} />      
        <Route path="/patient/book-appointment/:doctorId" element={<Elements stripe={stripePromise}><BookAppointment /></Elements>} /> 
        <Route path="/patient/my-appointments" element={<PatientAppointments />} /> 
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/doctor/schedule" element={<DoctorSchedule />} />
        <Route path="/doctor/finances" element={<DoctorFinances />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-error" element={<PaymentError />} /> 
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/user-details/:userType/:userId" element={<UserDetails />} />
        <Route path="/doctor-profile/:doctorId" element={<DoctorPublicProfile />} />
        <Route path="/doctor/manage-appointments" element={<ManageAppointments />} />
        <Route path="/doctor/patient-profile/:patientId" element={<PatientInfoCard />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

