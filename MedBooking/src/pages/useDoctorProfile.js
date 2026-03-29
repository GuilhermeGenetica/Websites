import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useDoctorProfile = () => {
    const { user, token, updateUser, API_BASE_URL, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const avatarInputRef = useRef(null);
    const documentInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        full_name: '', email: '', phone_number: '', whatsapp_number: '',
        crm_number: '', specialization: '', sub_specialty: '', education: '',
        university: '', graduation_year: '', address_street: '', address_number: '',
        address_complement: '', address_district: '', address_zip_code: '',
        full_address: '', city_id: '', state_id: '', country_id: '',
        languages: [], bio: '', consultation_fee: '', fee_currency: 'EUR',
        website: '',
        linkedin: '', certifications: '', awards: '',
        countriesOfPractice: [''], profile_picture_url: '', document_url: '',
        date_of_birth: '', gender: '', clinic_address: '', clinic_phone: '',
        bank_payment_details: '',
        stripe_connect_id: '',
        stripe_onboarding_complete: false,
        updated_at: '',
    });

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [medicalSpecialties, setMedicalSpecialties] = useState([]);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);
    const [isStripeLoading, setIsStripeLoading] = useState(false);

    const getInitials = (name) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const fetchStripeStatus = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/stripe_connect.php?action=get-account-status`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setProfileData(prev => ({
                    ...prev,
                    stripe_onboarding_complete: data.status.onboarding_complete
                }));
                if (data.status.onboarding_complete) {
                     toast({ title: "Stripe Account Verified", description: "Your Stripe account is fully set up and ready to receive payments." });
                } else {
                     toast({ title: "Stripe Setup Pending", description: "Your Stripe account onboarding is not yet complete.", variant: "destructive" });
                }
            }
        } catch (error) {
            console.error("Error fetching Stripe status:", error);
            toast({ title: "Error", description: "Could not verify Stripe account status.", variant: "destructive" });
        }
    }, [token, API_BASE_URL, toast]);


    useEffect(() => {
        const loadProfile = async () => {
            if (isProfileLoaded || !user || !token) {
                if (!user || !token) {
                    navigate('/');
                }
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/profile_doctor.php?action=get_profile`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                const responseText = await response.text();
                const data = JSON.parse(responseText);

                if (response.ok && data.success) {
                    const fetchedProfile = data.profile;
                    
                    const sanitizedProfile = Object.keys(profileData).reduce((acc, key) => {
                        if (key === 'fee_currency') {
                            acc[key] = fetchedProfile[key] || 'EUR';
                        } else {
                            acc[key] = fetchedProfile[key] ?? profileData[key];
                        }
                        return acc;
                    }, {});

                    sanitizedProfile.languages = Array.isArray(fetchedProfile.languages) && fetchedProfile.languages.length > 0 ? fetchedProfile.languages.map(String) : [''];
                    sanitizedProfile.countriesOfPractice = Array.isArray(fetchedProfile.countriesOfPractice) && fetchedProfile.countriesOfPractice.length > 0 ? fetchedProfile.countriesOfPractice.map(String) : [''];
                    sanitizedProfile.stripe_onboarding_complete = (fetchedProfile.stripe_onboarding_complete ?? false);
                   
                    setProfileData(sanitizedProfile);
                    setIsProfileLoaded(true);
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get('stripe_return') === 'true') {
                        toast({ title: "Stripe Onboarding", description: "Checking Stripe account status..." });
                        fetchStripeStatus();
                        navigate('/doctor/dashboard', { replace: true });
                    }

                } else {
                    toast({ title: "Error loading profile", description: data.message || "Could not load your information.", variant: "destructive" });
                    if (response.status === 401 || response.status === 403) {
                        logout();
                    }
                }
            } catch (error) {
                toast({ title: "Network or Parsing Error", description: "Could not connect or process server response.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, [user, token, navigate, API_BASE_URL, toast, logout, isProfileLoaded, profileData, fetchStripeStatus]);

    useEffect(() => {
        const fetchData = async (endpoint, setter, name) => {
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json();
                if (data.success) {
                    setter(data[name]);
                } else {
                    console.error(`Error fetching ${name} from backend:`, data.message);
                }
            } catch (error) {
                console.error(`Network error while fetching ${name}:`, error);
            }
        };
        fetchData('profile_doctor.php?action=get_countries', setCountries, 'countries');
        fetchData('profile_doctor.php?action=get_medical_specialties', setMedicalSpecialties, 'specialties');
        fetchData('profile_doctor.php?action=get_languages', setAvailableLanguages, 'languages');
    }, [API_BASE_URL, token]);

    useEffect(() => {
        const fetchStates = async (countryId) => {
            if (!token || !countryId) { setStates([]); setCities([]); return; }
            try {
                const response = await fetch(`${API_BASE_URL}/profile_doctor.php?action=get_states&country_id=${countryId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json();
                if (data.success) {
                    setStates(data.states);
                }
            } catch (error) { console.error("Network error fetching states:", error); }
        };
        if (profileData.country_id) fetchStates(profileData.country_id);
    }, [profileData.country_id, API_BASE_URL, token]);

    useEffect(() => {
        const fetchCities = async (stateId) => {
            if (!token || !stateId) { setCities([]); return; }
            try {
                const response = await fetch(`${API_BASE_URL}/profile_doctor.php?action=get_cities&state_id=${stateId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json();
                if (data.success) {
                    setCities(data.cities);
                }
            } catch (error) { console.error("Network error fetching cities:", error); }
        };
        if (profileData.state_id) fetchCities(profileData.state_id);
    }, [profileData.state_id, API_BASE_URL, token]);

    const handleInputChange = (field, value) => setProfileData(prev => ({ ...prev, [field]: value }));

    const handleLocationChange = (field, value) => {
        const newProfileData = { ...profileData, [field]: value };
        if (field === 'country_id') {
            newProfileData.state_id = ''; newProfileData.city_id = '';
            setStates([]); setCities([]);
        }
        if (field === 'state_id') {
            newProfileData.city_id = ''; setCities([]);
        }
        setProfileData(newProfileData);
    };

    const handleDynamicListChange = (listName, index, value) => {
        const newList = [...profileData[listName]];
        newList[index] = value;
        setProfileData(prev => ({ ...prev, [listName]: newList }));
    };

    const addDynamicListItem = (listName) => {
        setProfileData(prev => ({ ...prev, [listName]: [...prev[listName], ''] }));
    };


    const removeDynamicListItem = (listName, index) => {
        const newList = profileData[listName].filter((_, i) => i !== index);
        setProfileData(prev => ({ ...prev, [listName]: newList.length > 0 ? newList : [''] }));
    };

    const handleFileSelectAndUpload = async (event, fileKey, action) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append(fileKey, file);
        formData.append('action', action);

        try {
            const response = await fetch(`${API_BASE_URL}/profile_doctor.php`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (response.ok && data.success) {
                toast({ title: "Success", description: data.message });
                const dbColumn = action === 'upload_profile_picture' ? 'profile_picture_url' : 'document_url';
                
                const newTimestamp = new Date().getTime();
                setProfileData(prev => ({ 
                    ...prev, 
                    [dbColumn]: data.filePath,
                    updated_at: newTimestamp
                }));
                
                if (action === 'upload_profile_picture') {
                    updateUser({ ...user, profile_picture_url: data.filePath, updated_at: newTimestamp });
                }
                
            } else {
                toast({ title: "Upload Failed", description: data.message || "An error occurred.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not connect to the server for upload.", variant: "destructive" });
        }
    };

    const handleDeleteDocument = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/profile_doctor.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'delete_document' })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                toast({ title: "Document Deleted", description: "Your document has been removed." });
                setProfileData(prev => ({ ...prev, document_url: '' }));
            } else {
                toast({ title: "Deletion Failed", description: data.message || "Could not delete the document.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not connect to the server to delete the document.", variant: "destructive" });
        }
    };

    const handleSave = async () => {
        if (!profileData.full_name || !profileData.email || !profileData.crm_number || !profileData.specialization) {
            toast({ title: "Error", description: "Name, email, CRM, and specialty are required", variant: "destructive" });
            return;
        }
        if (!profileData.whatsapp_number) {
            toast({ title: "Attention", description: "WhatsApp is required to receive appointment confirmations", variant: "destructive" });
            return;
        }

        try {
            const dataToSend = {
                ...profileData,
                graduation_year: profileData.graduation_year ? parseInt(profileData.graduation_year, 10) : null,
                consultation_fee: profileData.consultation_fee === '' ? null : parseFloat(profileData.consultation_fee),
                languages: profileData.languages.filter(id => id && id !== ''),
                countriesOfPractice: profileData.countriesOfPractice.filter(id => id && id !== ''),
            };
            
            const response = await fetch(`${API_BASE_URL}/profile_doctor.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dataToSend),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                const newTimestamp = new Date().getTime();
                updateUser({ 
                    ...user,
                    name: profileData.full_name, 
                    email: profileData.email, 
                    profile_picture_url: profileData.profile_picture_url,
                    updated_at: newTimestamp
                });
                setProfileData(prev => ({ ...prev, updated_at: newTimestamp }));
                
                toast({ title: "Profile updated!", description: data.message || "Your information has been saved successfully" });
            } else {
                toast({ title: "Error saving profile", description: data.message || "Could not save your information.", variant: "destructive" });
                if (response.status === 401 || response.status === 403) {
                    logout();
                }
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not connect to the server to save.", variant: "destructive" });
        }
    };

    const handleDeleteProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/profile_doctor.php?action=delete_profile`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok && data.success) {
                toast({
                    title: "Profile Deleted",
                    description: "Your profile has been successfully removed. You will be logged out.",
                });
                setTimeout(() => {
                    logout();
                    navigate('/');
                }, 2500);
            } else {
                toast({ title: "Deletion Failed", description: data.message || "Could not delete your profile.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not connect to the server to delete the profile.", variant: "destructive" });
        }
    };

    const handleStripeConnect = async () => {
        setIsStripeLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stripe_connect.php?action=create-account-link`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok && data.success && data.url) {
                window.location.href = data.url;
            } else {
                toast({ title: "Stripe Error", description: data.message || "Could not create Stripe connection link.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not connect to Stripe.", variant: "destructive" });
        } finally {
            setIsStripeLoading(false);
        }
    };

    return {
        profileData,
        countries,
        states,
        cities,
        medicalSpecialties,
        availableLanguages,
        isLoading,
        isStripeLoading,
        avatarInputRef,
        documentInputRef,
        API_BASE_URL,
        getInitials,
        handleInputChange,
        handleLocationChange,
        handleDynamicListChange,
        addDynamicListItem,
        removeDynamicListItem,
        handleFileSelectAndUpload,
        handleDeleteDocument,
        handleSave,
        handleDeleteProfile,
        handleStripeConnect
    };
};