// src/pages/PatientProfile.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Save, User, Phone, MapPin, BriefcaseMedical, Upload, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AppHeader from '@/components/shared/AppHeader';
import { Textarea } from '@/components/ui/textarea';

const PatientProfile = () => {
  const { user, token, updateUser, API_BASE_URL, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    whatsapp_number: '',
    date_of_birth: '',
    gender: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_district: '',
    address_zip_code: '',
    full_address: '',
    country_id: '',
    state_id: '',
    city_id: '',
    nationality: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: '',
    medications: '',
    profile_picture_url: '',
    updated_at: '',
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/profile_patient.php?action=get_profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const profile = data.profile;
        setProfileData(prevProfileData => {
            const sanitizedProfile = Object.keys(prevProfileData).reduce((acc, key) => {
              acc[key] = profile[key] === null || profile[key] === undefined ? '' : profile[key];
              return acc;
            }, {});
            return sanitizedProfile;
        });
      } else {
        toast({ title: "Error loading profile", description: data.message, variant: "destructive" });
        if (response.status === 401) logout();
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [token, API_BASE_URL, toast, logout]);

  useEffect(() => {
    fetchPatientProfile();
  }, [fetchPatientProfile]);

  useEffect(() => {
    const fetchCountries = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/profile_patient.php?action=get_countries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) setCountries(data.countries);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountries();
  }, [API_BASE_URL, token]);

  useEffect(() => {
    const fetchStates = async (countryId) => {
      if (!token || !countryId) {
        setStates([]);
        setCities([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/profile_patient.php?action=get_states&country_id=${countryId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) setStates(data.states);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchStates(profileData.country_id);
  }, [profileData.country_id, API_BASE_URL, token]);

  useEffect(() => {
    const fetchCities = async (stateId) => {
      if (!token || !stateId) {
        setCities([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/profile_patient.php?action=get_cities&state_id=${stateId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) setCities(data.cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };
    fetchCities(profileData.state_id);
  }, [profileData.state_id, API_BASE_URL, token]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleLocationChange = (field, value) => {
    const newProfileData = { ...profileData, [field]: value };
    if (field === 'country_id') {
      newProfileData.state_id = '';
      newProfileData.city_id = '';
      setStates([]);
      setCities([]);
    }
    if (field === 'state_id') {
      newProfileData.city_id = '';
      setCities([]);
    }
    setProfileData(newProfileData);
  };

  const handleFileSelectAndUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await fetch(`${API_BASE_URL}/profile_patient.php?action=upload_profile_picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ title: "Avatar Updated!", description: "Your new profile picture has been saved." });
        const newTimestamp = new Date().getTime();
        setProfileData(prev => ({ 
            ...prev, 
            profile_picture_url: data.filePath,
            updated_at: newTimestamp 
        }));
        updateUser({ ...user, profile_picture_url: data.filePath, updated_at: newTimestamp });
      } else {
        toast({ title: "Upload Error", description: data.message || "Could not upload the image.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server to upload the image.", variant: "destructive" });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/profile_patient.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const newTimestamp = new Date().getTime();
        setProfileData(prev => ({ ...prev, updated_at: newTimestamp }));
        updateUser({ 
            ...user,
            name: profileData.full_name, 
            email: profileData.email, 
            profile_picture_url: profileData.profile_picture_url,
            updated_at: newTimestamp
        });
        toast({ title: "Profile updated!", description: data.message });
      } else {
        toast({ title: "Error saving profile", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    }
  };

  const handleDeleteProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile_patient.php`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Profile Deleted",
          description: "Your profile has been permanently deleted.",
        });
        logout();
        navigate('/');
      } else {
        toast({
          title: "Error Deleting Profile",
          description: data.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server to delete the profile.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return age > 0 ? `${age} years` : '';
  };

  const imageUrl = useMemo(() => {
    if (!profileData.profile_picture_url) {
      return '';
    }
    if (profileData.profile_picture_url.startsWith('http')) {
      return profileData.profile_picture_url;
    }
    return `${API_BASE_URL.replace('/api', '')}/${profileData.profile_picture_url}?v=${profileData.updated_at || ''}`;
  }, [profileData.profile_picture_url, profileData.updated_at, API_BASE_URL]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading profile...</div>;
  }

  return (
    <>
      <Helmet>
        <title>{profileData.full_name ? `Profile of ${profileData.full_name}` : 'My Profile'} - MedBooking</title>
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader showBackButton={true} showThemeToggle={true} />
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={imageUrl} alt={profileData.full_name} />
                  <AvatarFallback className="text-2xl">{getInitials(profileData.full_name)}</AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <Input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleFileSelectAndUpload}
                />
              </div>

                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {profileData.full_name ? (
                      <span className="gradient-text">{profileData.full_name}</span>
                    ) : (
                      'My Profile'
                    )}
                  </h1>
                  <p className="text-muted-foreground">Keep your information updated</p>
                </div>

            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <Card>
                <CardHeader><div className="flex items-center space-x-2"><User className="w-5 h-5 text-primary" /><CardTitle>Personal Information</CardTitle></div><CardDescription>Basic data for identification and contact</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="full_name">Full Name *</Label><Input id="full_name" value={profileData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="email">E-mail *</Label><Input id="email" type="email" value={profileData.email} disabled /></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="phone_number">Phone</Label><Input id="phone_number" value={profileData.phone_number} onChange={(e) => handleInputChange('phone_number', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="whatsapp_number">WhatsApp *</Label><Input id="whatsapp_number" value={profileData.whatsapp_number} onChange={(e) => handleInputChange('whatsapp_number', e.target.value)} /></div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="date_of_birth">Date of Birth</Label><Input id="date_of_birth" type="date" value={profileData.date_of_birth} onChange={(e) => handleInputChange('date_of_birth', e.target.value)} /><p className="text-sm text-muted-foreground">{calculateAge(profileData.date_of_birth)}</p></div>
                    <div className="space-y-2"><Label htmlFor="gender">Gender</Label><Select value={profileData.gender} onValueChange={(value) => handleInputChange('gender', value)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label htmlFor="nationality">Nationality</Label><Input id="nationality" value={profileData.nationality} onChange={(e) => handleInputChange('nationality', e.target.value)} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center space-x-2"><MapPin className="w-5 h-5 text-primary" /><CardTitle>Address</CardTitle></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="address_street">Street</Label><Input id="address_street" value={profileData.address_street} onChange={(e) => handleInputChange('address_street', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="address_number">Number</Label><Input id="address_number" value={profileData.address_number} onChange={(e) => handleInputChange('address_number', e.target.value)} /></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="address_complement">Complement</Label><Input id="address_complement" value={profileData.address_complement} onChange={(e) => handleInputChange('address_complement', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="address_district">District</Label><Input id="address_district" value={profileData.address_district} onChange={(e) => handleInputChange('address_district', e.target.value)} /></div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2"><Label htmlFor="country_id">Country</Label><Select value={String(profileData.country_id)} onValueChange={(value) => handleLocationChange('country_id', value)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{countries.map(c => <SelectItem key={c.country_id} value={String(c.country_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-2"><Label htmlFor="state_id">State</Label><Select value={String(profileData.state_id)} onValueChange={(value) => handleLocationChange('state_id', value)} disabled={states.length === 0}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{states.map(s => <SelectItem key={s.state_id} value={String(s.state_id)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-2"><Label htmlFor="city_id">City</Label><Select value={String(profileData.city_id)} onValueChange={(value) => handleLocationChange('city_id', value)} disabled={cities.length === 0}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{cities.map(c => <SelectItem key={c.city_id} value={String(c.city_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                   <div className="space-y-2"><Label htmlFor="address_zip_code">Postal Code</Label><Input id="address_zip_code" value={profileData.address_zip_code} onChange={(e) => handleInputChange('address_zip_code', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="full_address">Full Address (Editable)</Label><Textarea id="full_address" value={profileData.full_address} onChange={(e) => handleInputChange('full_address', e.target.value)} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center space-x-2"><Phone className="w-5 h-5 text-primary" /><CardTitle>Emergency Contact</CardTitle></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="emergency_contact_name">Name</Label><Input id="emergency_contact_name" value={profileData.emergency_contact_name} onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="emergency_contact_phone">Phone</Label><Input id="emergency_contact_phone" value={profileData.emergency_contact_phone} onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center space-x-2"><BriefcaseMedical className="w-5 h-5 text-primary" /><CardTitle>Medical Information</CardTitle></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="medical_history">Medical History</Label><Textarea id="medical_history" value={profileData.medical_history} onChange={(e) => handleInputChange('medical_history', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="allergies">Allergies</Label><Textarea id="allergies" value={profileData.allergies} onChange={(e) => handleInputChange('allergies', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="medications">Current Medications</Label><Textarea id="medications" value={profileData.medications} onChange={(e) => handleInputChange('medications', e.target.value)} /></div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"><Save className="w-4 h-4 mr-2" />Save Profile</Button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-destructive/30">
              <div className="flex justify-between items-center">
                  <div>
                      <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete this Profile
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteProfile} 
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Yes, delete my profile
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PatientProfile;