import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, LogOut, Calendar, DollarSign, ArrowLeft, Link as LinkIcon, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/shared/ThemeToggle';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
    const result = await onSendEmail(subject, message);
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


const AppHeader = ({ showBackButton = false }) => {
  const { user, userType, logout, token, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isContactAdminModalOpen, setIsContactAdminModalOpen] = useState(false);

  const checkGoogleConnectionStatus = useCallback(async () => {
    if (userType !== 'doctor' || !token) {
      setIsCheckingStatus(false);
      return;
    }

    setIsCheckingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get_google_connection_status.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setIsGoogleConnected(data.isConnected);
      }
    } catch (error) {
      console.error("Error checking Google status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [userType, token, API_BASE_URL]);

  useEffect(() => {
    checkGoogleConnectionStatus();
  }, [checkGoogleConnectionStatus]);

  const handleGoogleConnect = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/google_auth_initiate.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.redirect_url) {
        const popup = window.open(data.redirect_url, 'google-auth', 'width=600,height=700');
        const timer = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(timer);
            checkGoogleConnectionStatus();
          }
        }, 1000);
      } else {
        throw new Error(data.message || 'Could not initiate connection with Google.');
      }
    } catch (error) {
      toast({ title: "Connection Error", description: error.message, variant: "destructive" });
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/disconnect_google.php`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
            toast({ title: "Success", description: "Disconnected from Google Calendar." });
            setIsGoogleConnected(false);
        } else {
            throw new Error(data.message || 'Could not disconnect.');
        }
    } catch (error) {
        toast({ title: "Disconnection Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSendAdminEmail = async (subject, message) => {
      try {
        const response = await fetch(`${API_BASE_URL}/send_contact_email.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            senderName: user?.name || 'Authenticated User',
            senderEmail: user?.email,
            subject, 
            message 
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

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out", description: "See you later!" });
    navigate('/');
  };

  const getMenuItems = () => {
    if (userType === 'doctor') {
      return [
        { label: 'My Profile', icon: User, action: () => navigate('/doctor/profile') },
        { label: 'My Schedule', icon: Calendar, action: () => navigate('/doctor/schedule') },
        { label: 'Finances', icon: DollarSign, action: () => navigate('/doctor/finances') },
        { label: 'Contact Support', icon: HelpCircle, action: () => setIsContactAdminModalOpen(true) },
      ];
    }
    if (userType === 'patient') {
      return [
        { label: 'My Profile', icon: User, action: () => navigate('/patient/profile') },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userImageUrl = user?.profile_picture_url
    ? `${API_BASE_URL.replace('/api', '')}/${user.profile_picture_url}?v=${user.updated_at || ''}`
    : undefined;

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate(userType ? `/${userType}/dashboard` : '/')}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">MedBooking</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-foreground/80 hidden sm:inline">
                {userType === 'doctor' ? 'Dr.' : ''} {user?.name}
              </span>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userImageUrl} alt={user?.name} />
                      <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  {menuItems.map((item, index) => (
                    <DropdownMenuItem key={index} onClick={item.action}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                  
                  {userType === 'doctor' && (
                    <>
                      <DropdownMenuSeparator />
                      {isGoogleConnected ? (
                         <DropdownMenuItem onClick={handleGoogleDisconnect} className="text-red-600 focus:text-red-600">
                             <XCircle className="mr-2 h-4 w-4" />
                             <span>Disconnect Google</span>
                         </DropdownMenuItem>
                      ) : (
                         <DropdownMenuItem onClick={handleGoogleConnect} disabled={isCheckingStatus}>
                             <LinkIcon className="mr-2 h-4 w-4" />
                             <span>{isCheckingStatus ? 'Checking...' : 'Connect Google'}</span>
                         </DropdownMenuItem>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <ContactAdminModal
        isOpen={isContactAdminModalOpen}
        onClose={() => setIsContactAdminModalOpen(false)}
        onSendEmail={handleSendAdminEmail}
      />
    </>
  );
};

export default AppHeader;