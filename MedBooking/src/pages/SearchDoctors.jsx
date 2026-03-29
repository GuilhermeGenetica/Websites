import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import DoctorCard from './DoctorCard';
import AppHeader from '@/components/shared/AppHeader';

const SearchDoctors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { API_BASE_URL, token } = useAuth();

  const [specialty, setSpecialty] = useState('');
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [medicalSpecialties, setMedicalSpecialties] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchMedicalSpecialties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get_specialties.php`);
        const data = await response.json();
        if (data.success) {
          setMedicalSpecialties(data.specialties);
        } else {
          toast({ title: "Error", description: data.message || "Could not load specialties.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Error fetching specialties:", err);
        toast({ title: "Network Error", description: "Could not connect to the server to load specialties.", variant: "destructive" });
      }
    };
    fetchMedicalSpecialties();
  }, [API_BASE_URL, toast]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get_countries.php`);
        const data = await response.json();
        if (data.success) {
          setCountries(data.countries);
        } else {
          toast({ title: "Error", description: data.message || "Could not load countries.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Error fetching countries:", err);
        toast({ title: "Network Error", description: "Could not connect to the server to load countries.", variant: "destructive" });
      }
    };
    fetchCountries();
  }, [API_BASE_URL, toast]);

  useEffect(() => {
    const fetchStates = async () => {
      if (countryId) {
        try {
          const response = await fetch(`${API_BASE_URL}/get_states.php?country_id=${countryId}`);
          const data = await response.json();
          if (data.success) {
            setStates(data.states);
            setCities([]);
            setCityId('');
          } else {
            toast({ title: "Error", description: data.message || "Could not load states.", variant: "destructive" });
          }
        } catch (err) {
          console.error("Error fetching states:", err);
          toast({ title: "Network Error", description: "Could not connect to the server to load states.", variant: "destructive" });
        }
      } else {
        setStates([]);
        setCities([]);
        setCityId('');
      }
    };
    fetchStates();
  }, [countryId, API_BASE_URL, toast]);

  useEffect(() => {
    const fetchCities = async () => {
      if (stateId) {
        try {
          const response = await fetch(`${API_BASE_URL}/get_cities.php?state_id=${stateId}`);
          const data = await response.json();
          if (data.success) {
            setCities(data.cities);
          } else {
            toast({ title: "Error", description: data.message || "Could not load cities.", variant: "destructive" });
          }
        } catch (err) {
          console.error("Error fetching cities:", err);
          toast({ title: "Network Error", description: "Could not connect to the server to load cities.", variant: "destructive" });
        }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [stateId, API_BASE_URL, toast]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (specialty) queryParams.append('specialty', specialty);
      if (countryId) queryParams.append('country_id', countryId);
      if (stateId) queryParams.append('state_id', stateId);
      if (cityId) queryParams.append('city_id', cityId);

      const url = `${API_BASE_URL}/profile_doctor.php?action=get_public_doctors&${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const activeAndApprovedDoctors = data.doctors.filter(doctor => doctor.is_active && doctor.is_approved);
        setDoctors(activeAndApprovedDoctors);

        if (activeAndApprovedDoctors.length === 0) {
          toast({ title: "No doctors found", description: "Your search returned no results.", variant: "info" });
        }
      } else {
        setError(data.message || "Could not fetch doctors.");
        toast({ title: "Search Error", description: data.message || "Could not fetch doctors.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Network error when fetching doctors.");
      toast({ title: "Network Error", description: "Could not connect to the server to fetch doctors.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [specialty, countryId, stateId, cityId, API_BASE_URL, toast, token]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <>
      <Helmet>
        <title>Search Doctors - MedBooking</title>
        <meta name="description" content="Find and schedule appointments with specialized doctors." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Search Doctors</h1>
            </div>

            <Card className="p-6 shadow-lg rounded-lg bg-card">
              <CardTitle className="mb-4 text-xl flex items-center"><Filter className="w-5 h-5 mr-2" /> Search Filters</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Specialties</SelectItem>
                      {medicalSpecialties.map(s => (
                        <SelectItem key={s.id} value={s.specialty_name}>
                          {s.specialty_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={countryId} onValueChange={setCountryId}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Countries</SelectItem>
                      {countries.map(c => (
                        <SelectItem key={c.country_id} value={String(c.country_id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={stateId} onValueChange={setStateId} disabled={!countryId || states.length === 0}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {states.map(s => (
                        <SelectItem key={s.state_id} value={String(s.state_id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select value={cityId} onValueChange={setCityId} disabled={!stateId || cities.length === 0}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Cities</SelectItem>
                      {cities.map(c => (
                        <SelectItem key={c.city_id} value={String(c.city_id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full mt-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Searching...' : <><Search className="w-4 h-4 mr-2" /> Search Doctors</>}
              </Button>
            </Card>

            <div className="space-y-6">
              {loading && <p className="text-center text-gray-700">Loading doctors...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && !error && doctors.length > 0 ? (
                doctors.map(doctor => (
                  <DoctorCard
                    key={doctor.doctor_id}
                    doctor={doctor}
                    onBook={(doctorId) => navigate(`/patient/book-appointment/${doctorId}`)}
                  />
                ))
              ) : (
                !loading && !error && <p className="text-center text-gray-600">No doctors found with the selected criteria.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SearchDoctors;
