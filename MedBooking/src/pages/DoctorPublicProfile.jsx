// src/pages/DoctorPublicProfile.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Stethoscope, GraduationCap, Globe, MapPin, Link, Award, Mail, BarChart3, Building2, BookUser, ShieldCheck, Languages } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';

const DoctorPublicProfile = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { API_BASE_URL } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const formatCurrency = (amount, currencyCode) => {
    if (amount === null || amount === undefined) return '';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode || 'USD',
        }).format(amount);
    } catch (e) {
        return `${currencyCode} ${parseFloat(amount).toFixed(2)}`;
    }
  };

  const cleanAndSplit = (data) => {
    if (Array.isArray(data)) {
      return data.map(item => String(item).trim()).filter(item => item.length > 0);
    }
    if (typeof data === 'string' && data) {
      return data.replace(/\*/g, '').split(/[\n;]/).map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  };

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/get_public_doctor_profile.php?doctor_id=${doctorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setDoctor(data.doctor);
        } else {
          setError(data.message || "Could not load the doctor's profile.");
          toast({ title: "Error", description: data.message || "Could not load the doctor's profile.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Error fetching doctor profile:", err);
        setError("Network error when loading the doctor's profile.");
        toast({ title: "Network Error", description: "Could not connect to the server to load the profile.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [doctorId, API_BASE_URL, toast]);

  const handleContactClick = () => {
    if (doctor && doctor.email) {
      window.location.href = `mailto:${doctor.email}`;
    } else {
      toast({
        title: "Contact Not Available",
        description: "This doctor has not made their contact information available.",
        variant: "info",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground text-lg">Loading doctor's profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Profile</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">The doctor's profile with ID {doctorId} was not found.</p>
        <Button onClick={() => navigate('/patient/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const imageUrl = doctor.profile_picture_url
    ? `${API_BASE_URL.replace('/api', '')}/${doctor.profile_picture_url}?v=${doctor.updated_at || ''}`
    : `https://via.placeholder.com/150/2563eb/e0e0e0?text=${getInitials(doctor.full_name)}`;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <Helmet>
        <title>Public Profile - Dr. {doctor.full_name}</title>
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="flex items-center mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Doctor's Profile</h1>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 shadow-lg">
                    <AvatarImage src={imageUrl} alt={doctor.full_name} />
                    <AvatarFallback>{getInitials(doctor.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-4xl font-extrabold text-primary">Dr. {doctor.full_name}</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-1">
                      {doctor.specialization || "Specialty Not Defined"}
                      {doctor.sub_specialization && ` - ${doctor.sub_specialization}`}
                    </CardDescription>
                    {doctor.crm_number && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center md:justify-start">
                            <ShieldCheck className="w-4 h-4 mr-1.5"/>
                            License: {doctor.crm_number}
                        </p>
                    )}
                    {doctor.consultation_fee && (
                      <p className="text-2xl font-semibold text-green-600 mt-2">
                        {formatCurrency(doctor.consultation_fee, doctor.fee_currency)}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {doctor.bio && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><BookUser className="w-5 h-5 mr-2 text-primary" /> About</h3>
                      <p className="text-foreground leading-relaxed">{doctor.bio}</p>
                    </div>
                  )}

                  {(doctor.education || doctor.university || doctor.graduation_year) && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><GraduationCap className="w-5 h-5 mr-2 text-primary" /> Academic Background</h3>
                      <ul className="list-disc list-inside text-foreground/80 space-y-1">
                        {doctor.education && <li>{doctor.education}</li>}
                        {doctor.university && <li>{doctor.university}{doctor.graduation_year && `, ${doctor.graduation_year}`}</li>}
                      </ul>
                    </div>
                  )}
                  
                  {doctor.certifications && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><Award className="w-5 h-5 mr-2 text-primary" /> Certifications</h3>
                      <ul className="list-disc list-inside text-foreground/80 space-y-1">
                        {cleanAndSplit(doctor.certifications).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {doctor.awards && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><Award className="w-5 h-5 mr-2 text-primary" /> Awards and Honors</h3>
                      <ul className="list-disc list-inside text-foreground/80 space-y-1">
                        {cleanAndSplit(doctor.awards).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {doctor.countries_of_practice && Array.isArray(doctor.countries_of_practice) && doctor.countries_of_practice.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><Globe className="w-5 h-5 mr-2 text-primary" /> Countries of Practice</h3>
                      <div className="flex flex-wrap gap-2">
                          {doctor.countries_of_practice.map((item, index) => (
                              <span key={index} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">{item}</span>
                          ))}
                      </div>
                    </div>
                  )}

                   {doctor.languages && Array.isArray(doctor.languages) && doctor.languages.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><Languages className="w-5 h-5 mr-2 text-primary" /> Languages</h3>
                      <div className="flex flex-wrap gap-2">
                          {doctor.languages.map((item, index) => (
                              <span key={index} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">{item}</span>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {doctor.website && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><Link className="w-5 h-5 mr-2 text-primary" /> Professional Website</h3>
                      <a href={doctor.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{doctor.website}</a>
                    </div>
                  )}

                  {doctor.linkedin && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center"><Link className="w-5 h-5 mr-2 text-primary" /> LinkedIn Profile</h3>
                      <a href={doctor.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{doctor.linkedin}</a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="sticky top-24">
                <div className="flex justify-center mb-6">
                  <Button size="lg" onClick={() => navigate(`/patient/book-appointment/${doctorId}`)} className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-lg">
                    Schedule Appointment
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><MapPin className="w-5 h-5 mr-2" /> Location</CardTitle>
                    <CardDescription>Main service location.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {doctor.clinic_address ? (
                         <p className="text-foreground flex items-start">
                           <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" /> <span>{doctor.clinic_address}</span>
                         </p>
                      ) : (doctor.city_name || doctor.country_name) ? (
                         <p className="text-foreground flex items-center">
                           <Globe className="w-4 h-4 mr-2" />
                           {doctor.city_name}{doctor.city_name && doctor.country_name ? ', ' : ''}{doctor.country_name}
                         </p>
                      ) : (
                         <p className="text-muted-foreground">Location not provided.</p>
                      )}
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center"><Mail className="w-5 h-5 mr-2" /> Contact</CardTitle>
                    <CardDescription>You can contact the doctor via email to ask questions about the appointment.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={handleContactClick} className="flex items-center justify-center w-full">
                      <Mail className="w-4 h-4 mr-2" /> Contact Doctor
                    </Button>
                    <p className="text-muted-foreground text-xs mt-4 text-center">
                        (WhatsApp and other direct contacts are provided through the platform after scheduling the appointment).
                    </p>
                  </CardContent>
                </Card>
              </div>

            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DoctorPublicProfile;