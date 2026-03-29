import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowLeft, User, Save, Upload, Loader2, CheckCircle, DollarSign } from 'lucide-react';
import axios from 'axios';

const ProfilePage = () => {
  const { user, checkAuthStatus, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    dob: '',
    location: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.full_name || '',
        email: user.email || '',
        dob: user.dob || '',
        location: user.location || '',
      });
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    const formData = new FormData();
    formData.append('action', 'update_profile');
    formData.append('fullName', profileData.fullName);
    formData.append('email', profileData.email);
    formData.append('dob', profileData.dob);
    formData.append('location', profileData.location);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const response = await axios.post('/api/user.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: "Profile Updated",
        description: response.data.message,
      });
      await checkAuthStatus(); // Reload user data
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "An error occurred while saving the profile.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "The new passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingPassword(true);

    const formData = new FormData();
    formData.append('action', 'update_password');
    formData.append('currentPassword', passwordData.currentPassword);
    formData.append('newPassword', passwordData.newPassword);

    try {
      const response = await axios.post('/api/user.php', formData);
      toast({
        title: "Password Updated",
        description: response.data.message,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "An error occurred while updating the password.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };
  
  if (authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <>
      <Helmet>
        <title>My Profile - NutraGenius</title>
      </Helmet>
      
      <ThemeToggle />

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-8">Manage Your Profile</h1>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="pt-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Profile Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-16 h-16 text-muted-foreground" />
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                      />
                      <Button size="icon" className="absolute bottom-0 right-0 rounded-full gold-bg h-8 w-8" onClick={() => fileInputRef.current.click()}>
                        <Upload className="h-4 w-4"/>
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold">{profileData.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{profileData.email}</p>
                    
                    {/* ** ADDED: Payment Status Display ** */}
                    <div className="mt-4 w-full px-4">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Status</Label>
                      {user?.has_paid ? (
                        <span className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full">
                          <CheckCircle className="h-4 w-4" /> Paid
                        </span>
                      ) : (
                        <span className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400 px-3 py-1 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                          <DollarSign className="h-4 w-4" /> Payment Required
                        </span>
                      )}
                    </div>
                    {/* ** End of Added Section ** */}

                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSave} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" name="fullName" value={profileData.fullName} onChange={handleProfileChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" value={profileData.email} onChange={handleProfileChange} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dob">Date of Birth</Label>
                          <Input id="dob" name="dob" type="date" value={profileData.dob || ''} onChange={handleProfileChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" name="location" placeholder="e.g., Lisbon, Portugal" value={profileData.location || ''} onChange={handleProfileChange} />
                        </div>
                      </div>
                      <Button type="submit" disabled={isSavingProfile} className="gold-bg">
                        {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>For your security, we recommend using a strong password.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSave} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} required/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} required/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} required/>
                      </div>
                       <Button type="submit" disabled={isSavingPassword} className="gold-bg">
                        {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        {isSavingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
