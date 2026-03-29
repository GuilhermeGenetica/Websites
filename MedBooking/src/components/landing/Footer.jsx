import React, { useState } from 'react';
import { Stethoscope, Mail, MapPin, Users, Send, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

// --- MODAL COMPONENTS (CONTENT UPDATED) ---
// (Mantendo todos os seus componentes de modal intactos)

const HowItWorksModal = () => (
  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-primary">How MedBooking Works</DialogTitle>
      <DialogDescription>
        A secure and simple process for global appointment scheduling.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-6 text-foreground pt-4">
      <section>
        <h3 className="text-xl font-semibold mb-3 text-primary flex items-center"><Users className="w-5 h-5 mr-2" /> For Patients</h3>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>1. Find Your Doctor:</strong> Search our global network of verified medical professionals by specialty, country, or language.</li>
          <li><strong>2. Book Securely:</strong> Select an available time slot (for online or in-person consultations) and confirm your appointment.</li>
          <li><strong>3. Pay Securely:</strong> Make your payment via Stripe. MedBooking secures the payment until after your consultation is complete.</li>
          <li><strong>4. Connect:</strong> You will receive an email confirmation with all appointment details and the doctor's contact information to arrange the teleconsultation link (if online) or confirm the in-person visit.</li>
        </ul>
      </section>
      <section>
        <h3 className="text-xl font-semibold mb-3 text-primary flex items-center"><Stethoscope className="w-5 h-5 mr-2" /> For Doctors</h3>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>1. Register & Submit:</strong> Create your account and submit your professional credentials (medical license, diploma, specialty certificate) for verification.</li>
          <li><strong>2. Manual Verification:</strong> Our team manually reviews your documents to ensure all credentials are valid and in good standing before activating your profile.</li>
          <li><strong>3. Build Your Profile:</strong> Once approved, set up your public profile, configure your schedule (for online or in-person appointments), and set your consultation fee.</li>
          <li><strong>4. Receive Bookings:</strong> Patients book and pay for your services directly through the platform. You receive instant notifications.</li>
          <li><strong>5. Get Paid:</strong> After the appointment is marked as completed, 90% of your consultation fee is transferred to your nominated bank account. The 10% platform fee is retained by MedBooking.</li>
        </ul>
      </section>
    </div>
     <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </DialogClose>
  </DialogContent>
);

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
      <p>MedBooking is NOT a healthcare provider, telemedicine full service, or medical clinic at this time. We do NOT provide medical advice as platform, diagnosis, or even treatment. Our platform is a scheduling and facilitation service designed to connect patients with independent, verified medical professionals.</p>
      <p>Any and all medical care, advice, or teleconsultation services are provided solely by the independent doctors registered on our platform. MedBooking does not store or have access to any patient medical full records, clinical notes, or fukl personal health information (PHI) exchanged during a consultation.</p>

      <ul className="list-disc list-inside space-y-2 mt-4">
        <li><strong>Role of the Platform:</strong> MedBooking acts as a technology facilitator to help patients find and book appointments with doctors. We also provide a secure payment processing service.</li>
        <li><strong>Doctor's Responsibility:</strong> Registered doctors are independent contractors, not employees of MedBooking. Each doctor is solely responsible for their medical license, compliance with all local, national, and international laws governing their medical practice (including telemedicine), and the quality of the medical care they provide. The doctor is responsible for providing the patient with the tool and link for any online consultation (e.g., Google Meet, Zoom, WhatsApp).</li>
        <li><strong>Doctor Verification:</strong> We perform a manual verification of doctors' credentials (such as medical license and specialty) upon registration. However, we do not guarantee the continuous accuracy of such information or the professional competence of any doctor.</li>
        <li><strong>Payment and Fees:</strong> Patients pay the full consultation fee to MedBooking at the time of booking. MedBooking holds these funds and releases 90% of the fee to the doctor after the appointment is confirmed as completed. MedBooking retains a 10% service and processing fee.</li>
        <li><strong>Cancellation and Refund Policy:</strong> All cancellation and refund requests must be submitted through our official support contact form.
          <ul className="list-circle list-inside ml-6 mt-1">
            <li>Cancellations made more than 24 hours before the scheduled appointment time are eligible for a refund of the consultation fee, minus a 20% processing and administrative fee.</li>
            <li>Cancellations made within 24 hours of the appointment, or failure to attend (no-show), are not eligible for a refund.</li>
          </ul>
        </li>
        <li><strong>No Medical Records:</strong> We are not a medical records system. We do not store, manage, or have access to any clinical notes, diagnoses, or patient histories. We are not responsible for the accuracy of the information provided by patients on this platform; however, we offer a space for patients to present themselves to healthcare professionals in a way that suits them. This data is managed exclusively by the patient and their chosen doctor.</li>
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
      <p>We DO NOT collect, store, or process any Personal Health Information (PHI), medical records, clinical notes, symptoms, or diagnoses. We are not responsible for the accuracy of the information provided by patients on this platform; however, we offer a space for patients to present themselves to healthcare professionals in a way that suits them. Your medical information is confidential and shared only between you and your doctor. </p>
      
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

const DoctorRegistrationModal = () => (
  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-primary">Join MedBooking (For Doctors)</DialogTitle>
      <DialogDescription>
        Build your global profile and connect with patients worldwide.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-6 text-foreground pt-4">
      <section>
        <h3 className="text-xl font-semibold mb-3">Why Join MedBooking?</h3>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Build Your Brand:</strong> Our platform acts as a powerful marketing tool for your personal practice, clinic, or hospital.</li>
          <li><strong>Global Reach:</strong> Access a worldwide patient base seeking both online and in-person consultations.</li>
          <li><strong>Secure Payments:</strong> We handle the entire payment process. Patients pay upfront, securing your booking and eliminating no-show losses.</li>
          <li><strong>Verified Professionals:</strong> Be part of an exclusive, trusted network of manually verified medical professionals.</li>
        </ul>
      </section>
      <section>
        <h3 className="text-xl font-semibold mb-3">How It Works</h3>
        <ul className="list-decimal list-inside space-y-2">
          <li><strong>Sign Up:</strong> Complete your registration.</li>
          <li><strong>Submit Credentials:</strong> Upload your medical license, specialty certificates, and other required documents.</li>
          <li><strong>Manual Verification:</strong> Our team will review your documents. You will be notified via email once your profile is approved and activated.</li>
          <li><strong>Get Paid:</strong> Receive 90% of your consultation fee transferred to your bank account after each completed appointment.</li>
        </ul>
      </section>
    </div>
     <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </DialogClose>
  </DialogContent>
);

const SupportModal = () => (
  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-primary">Help and Support Center</DialogTitle>
      <DialogDescription>
        We are here to help! Find answers or get in touch with us.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-6 text-foreground pt-4">
      <section>
        <h3 className="text-xl font-semibold mb-3">Contact Support</h3>
        <p>
          For all inquiries, including technical support, billing questions, cancellation requests, and refund processing, please use our official contact form.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please access the form by clicking "Contact Support" in the main footer. This ensures your request is logged and handled by the correct team.
        </p>
      </section>
      <section>
        <h3 className="text-xl font-semibold mb-3">Important Reminders</h3>
         <ul className="list-disc list-inside space-y-2">
            <li><strong>Medical Advice:</strong> MedBooking cannot provide any medical advice. Please book a consultation with a doctor.</li>
            <li><strong>Consultation Tool:</strong> The doctor is responsible for providing the teleconsultation tool and link (e.g., Google Meet, Zoom, WhatsApp) for online appointments.</li>
            <li><strong>Verification:</strong> Doctor profile activation is pending manual verification of credentials, which may take several business days.</li>
         </ul>
      </section>
    </div>
     <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </DialogClose>
  </DialogContent>
);

const ContactFormModal = () => {
    const { toast } = useToast();
    const { API_BASE_URL } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSending, setIsSending] = useState(false);

    // This API call logic is preserved as-is to avoid breaking the system
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const response = await fetch(`${API_BASE_URL}/send_contact_email.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientType: 'admin',
                    subject: formData.subject,
                    message: `Message from: ${formData.name} (${formData.email})\n\n${formData.message}`,
                    senderName: formData.name,
                    senderEmail: formData.email,
                }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                toast({ title: "Message Sent!", description: "Thank you for contacting us. We will respond as soon as possible." });
                setFormData({ name: '', email: '', subject: '', message: '' });
                // The modal will be closed by the Dialog's onOpenChange handler
            } else {
                throw new Error(result.message || 'Failed to send message.');
            }
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    return (
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary">Contact Us</DialogTitle>
                <DialogDescription>Fill out the form below and our team will get back to you.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={handleInputChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={formData.email} onChange={handleInputChange} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" value={formData.subject} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" rows={5} value={formData.message} onChange={handleInputChange} required placeholder="Please describe your question or issue in detail..." /></div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSending}>
                    {isSending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                </Button>
            </form>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogClose>
        </DialogContent>
    );
};


// --- MAIN FOOTER COMPONENT ---

const Footer = () => {
  // Central state to manage which modal is open. `null` means no modal is open.
  const [activeModal, setActiveModal] = useState(null);

  // A map of modal keys to their respective components.
  const modals = {
    'howItWorks': <HowItWorksModal />,
    'terms': <TermsOfUseModal />,
    'privacy': <PrivacyPolicyModal />,
    'forDoctors': <DoctorRegistrationModal />,
    'help': <SupportModal />,
    'contact': <ContactFormModal />,
  };

  // Helper function to create a link that opens a modal.
  const ModalTriggerLink = ({ modalKey, children }) => (
    <a 
      href="#" 
      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
      onClick={(e) => {
        e.preventDefault();
        console.log(`Opening modal: ${modalKey}`); // Log for debugging
        setActiveModal(modalKey);
      }}
    >
      {children}
    </a>
  );

  return (
    <footer id="contact" className="bg-background border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Brand and mission */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
                <Stethoscope className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">MedBooking</span>
            </div>
            <p className="text-muted-foreground">
              Connecting patients and verified doctors worldwide for accessible and efficient healthcare scheduling.
            </p>
          </div>

          {/* Column 2: Platform and Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Information</h3>
            <ul className="space-y-2">
              <li><ModalTriggerLink modalKey="howItWorks">How It Works</ModalTriggerLink></li>
              <li><ModalTriggerLink modalKey="terms">Terms of Service</ModalTriggerLink></li>
              <li><ModalTriggerLink modalKey="privacy">Privacy Policy</ModalTriggerLink></li>
            </ul>
          </div>

          {/* Column 3: For Doctors and Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li><ModalTriggerLink modalKey="forDoctors">For Doctors</ModalTriggerLink></li>
              <li><ModalTriggerLink modalKey="help">Help Center</ModalTriggerLink></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
            <div className="space-y-3 text-muted-foreground">
              <div 
                className="flex items-start space-x-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                    console.log("Opening modal: contact");
                    setActiveModal('contact');
                }}
              >
                  <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>Contact & Support</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                {/* UPDATED LOCATION */}
                <span>Global Services 🌐</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ============== INÍCIO DO BLOCO ADICIONADO ============== */}
      {/* Wrapper para o copyright, dentro do container para alinhamento */}
      <div className="container mx-auto px-4">
        <div className="border-t pt-8 pb-8 text-center text-sm text-muted-foreground">
          <p>
            <a 
              href={process.env.VITE_APP_URL_BOOKING || "https://medbooking.app"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary"
            >
              MedBooking Global
            </a> a <a 
              href={process.env.VITE_APP_URL_HOLDING || "https://holdingcomp.com"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary"
            >
              HoldingComp
            </a> Company.
            <br />
            Created by <a 
              href={process.env.VITE_APP_URL_WEBMASTER || "https://onenetweb.com"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary"
            >
              OnNetWeb
            </a>. All Rights Reserved.
            <a href="/admin/dashboard" className="hover:text-primary ml-2">
              Admin Access
            </a>
          </p>
        </div>
      </div>
      {/* ============== FIM DO BLOCO ADICIONADO ============== */}


      {/* This Dialog component handles rendering the currently active modal */}
      <Dialog open={activeModal !== null} onOpenChange={(isOpen) => {
        if (!isOpen) {
          console.log("Closing modal via onOpenChange"); // Log for debugging
          setActiveModal(null);
        }
      }}>
        {/* Render the content of the active modal. If no modal is active, this will be empty. */}
        {activeModal && modals[activeModal]}
      </Dialog>
    </footer>
  );
};

export default Footer;