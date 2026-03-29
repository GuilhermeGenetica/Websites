// src/pages/PatientInfoCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AppHeader from '@/components/shared/AppHeader';
import { User, Mail, Phone, MapPin, BriefcaseMedical, Cake, VenetianMask } from 'lucide-react';
import { format } from 'date-fns';

const PatientInfoCard = () => {
    const { patientId } = useParams();
    const { token, API_BASE_URL } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPatientProfile = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_patient_details_for_doctor.php?patient_id=${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setProfile(data.profile);
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not fetch patient profile.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [patientId, token, API_BASE_URL, toast]);

    useEffect(() => {
        fetchPatientProfile();
    }, [fetchPatientProfile]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading patient profile...</div>;
    }

    if (!profile) {
        return <div className="flex justify-center items-center min-h-screen">Profile not found.</div>;
    }

    const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

    // SOLUTION: Construct the full image URL with cache-busting param ?v=
    const imageUrl = profile.profile_picture_url
        ? `${API_BASE_URL.replace('/api', '')}/${profile.profile_picture_url}?v=${profile.updated_at || ''}`
        : null;

    return (
        <>
            <Helmet><title>Profile of {profile.full_name}</title></Helmet>
            <div className="min-h-screen bg-background text-foreground">
                <AppHeader showBackButton={true} />
                <div className="container mx-auto px-4 py-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto space-y-8">
                        <Card>
                            <CardHeader className="text-center">
                                <Avatar className="w-24 h-24 mx-auto mb-4">
                                    {/* Use the full, cache-busted image URL */}
                                    <AvatarImage src={imageUrl} alt={profile.full_name} />
                                    <AvatarFallback className="text-3xl">{getInitials(profile.full_name)}</AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-3xl">{profile.full_name}</CardTitle>
                                <CardDescription>{profile.email}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <InfoSection icon={User} title="Personal Information">
                                    <InfoItem icon={Phone} label="Phone" value={profile.phone_number || 'N/A'} />
                                    <InfoItem icon={Phone} label="WhatsApp" value={profile.whatsapp_number || 'N/A'} />
                                    <InfoItem icon={Cake} label="Date of Birth" value={profile.date_of_birth ? format(new Date(profile.date_of_birth), 'dd/MM/yyyy') : 'N/A'} />
                                    <InfoItem icon={VenetianMask} label="Gender" value={profile.gender || 'N/A'} />
                                </InfoSection>
                                <InfoSection icon={MapPin} title="Location">
                                    <InfoItem label="City" value={profile.city_name || 'N/A'} />
                                    <InfoItem label="State" value={profile.state_name || 'N/A'} />
                                    <InfoItem label="Country" value={profile.country_name || 'N/A'} />
                                    <InfoItem label="Nationality" value={profile.nationality || 'N/A'} />
                                </InfoSection>
                                <InfoSection icon={BriefcaseMedical} title="Clinical Information">
                                    <InfoBlock label="Medical History" value={profile.medical_history} />
                                    <InfoBlock label="Allergies" value={profile.allergies} />
                                    <InfoBlock label="Current Medications" value={profile.medications} />
                                </InfoSection>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

const InfoSection = ({ icon: Icon, title, children }) => (
    <div className="border-t pt-4">
        <h3 className="text-lg font-semibold flex items-center mb-3"><Icon className="w-5 h-5 mr-2 text-primary" />{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">{children}</div>
    </div>
);

const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p>{value}</p>
    </div>
);

const InfoBlock = ({ label, value }) => (
    <div className="md:col-span-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="whitespace-pre-wrap">{value || 'No information provided.'}</p>
    </div>
);

export default PatientInfoCard;
