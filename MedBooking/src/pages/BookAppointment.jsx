import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Stethoscope, Globe, MapPin, Phone, Mail, Calendar as CalendarIcon, Clock, Building, ShieldAlert } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import AppHeader from '@/components/shared/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#fa755a", iconColor: "#fa755a" },
  },
};

const getInitials = (name = '') => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const formatCurrency = (amount, currencyCode) => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    } catch (e) {
        return `${currencyCode} ${amount.toFixed(2)}`;
    }
};

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, API_BASE_URL } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  
  const [doctor, setDoctor] = useState(null);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [errorInitialData, setErrorInitialData] = useState(null);
  const [doctorSchedule, setDoctorSchedule] = useState({ dates: {}, recurring: [] });
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [consultationType, setConsultationType] = useState(null);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);

  const [consultationFee, setConsultationFee] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [tempAppointmentId] = useState(uuidv4());

  // --- MODIFICAÇÕES ACRESCENTADAS ---
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  // --- FIM DAS MODIFICAÇÕES ---

  const timeSectionRef = useRef(null);
  const summarySectionRef = useRef(null);
  const paymentSectionRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) {
        setErrorInitialData("Authentication token missing.");
        setLoadingInitialData(false);
        navigate('/'); 
        return;
      }
      setLoadingInitialData(true);
      setErrorInitialData(null);
      try {
        const doctorDetailsResponse = await fetch(`${API_BASE_URL}/get_public_doctor_profile.php?doctor_id=${doctorId}`);
        const doctorDetailsData = await doctorDetailsResponse.json();
        if (doctorDetailsResponse.ok && doctorDetailsData.success) {
          setDoctor(doctorDetailsData.doctor);
          setConsultationFee(parseFloat(doctorDetailsData.doctor.consultation_fee) || 0);
          setCurrency(doctorDetailsData.doctor.fee_currency ? doctorDetailsData.doctor.fee_currency.toUpperCase() : 'EUR');
        } else {
          throw new Error(doctorDetailsData.message || "Could not load doctor's details.");
        }

        const doctorScheduleResponse = await fetch(`${API_BASE_URL}/get_doctor_schedule.php?doctor_id=${doctorId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const doctorScheduleData = await doctorScheduleResponse.json();
        if (doctorScheduleResponse.ok && doctorScheduleData.success) {
          const fetchedDates = (typeof doctorScheduleData.schedule.dates === 'object' && doctorScheduleData.schedule.dates !== null && !Array.isArray(doctorScheduleData.schedule.dates))
                               ? doctorScheduleData.schedule.dates
                               : {};
          setDoctorSchedule({
            dates: fetchedDates,
            recurring: doctorScheduleData.schedule.recurring || []
          });
        } else {
           throw new Error(doctorScheduleData.message || "Could not load doctor's schedule.");
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setErrorInitialData(error.message);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoadingInitialData(false);
      }
    };
    fetchInitialData();
  }, [doctorId, token, API_BASE_URL, toast, navigate]);

  // --- NOVA FUNÇÃO ACRESCENTADA ---
  const fetchBookedSlotsForDate = async (date) => {
    if (!date || !doctorId || !token) return;
    setLoadingTimes(true);
    setBookedSlots([]);
    const dateString = format(date, 'yyyy-MM-dd');
    try {
      const response = await fetch(`${API_BASE_URL}/get_booked_slots.php?doctor_id=${doctorId}&date=${dateString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBookedSlots(data.bookedSlots || []);
      } else {
        toast({ title: "Error", description: data.message || "Could not fetch booked slots.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not verify open slots.", variant: "destructive" });
    } finally {
      setLoadingTimes(false);
    }
  };
  // --- FIM DA NOVA FUNÇÃO ---
  
  const handleDateSelect = (date) => {
    if (!date) return;
    const dateString = format(date, 'yyyy-MM-dd');
    const type = doctorSchedule.dates[dateString]?.consultation_type || 'online';

    setSelectedDate(date);
    setSelectedTime(null);
    setConsultationType(type);
    setIsBookingConfirmed(false);

    // --- MODIFICAÇÃO ACRESCENTADA ---
    fetchBookedSlotsForDate(date);
    // --- FIM DA MODIFICAÇÃO ---
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setIsBookingConfirmed(false);
  };
  
  const handleConfirmAndPay = () => {
    if (!selectedDate || !selectedTime) {
      toast({ title: "Missing selection", description: "Please select a date and time for the appointment.", variant: "destructive" });
      return;
    }
    setIsBookingConfirmed(true);
  };

  useEffect(() => {
    if (selectedDate && timeSectionRef.current) {
      setTimeout(() => timeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime && summarySectionRef.current) {
        setTimeout(() => summarySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [selectedTime]);

  useEffect(() => {
    if (isBookingConfirmed && paymentSectionRef.current) {
        setTimeout(() => paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [isBookingConfirmed]);

  const handleBooking = async () => {
    if (!stripe || !elements || !user || !doctor || !selectedDate || !selectedTime) {
      toast({ title: "System Error", description: "Incomplete data to process payment.", variant: "destructive" });
      return;
    }
    setIsProcessingPayment(true);
    
    try {
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { email: user.email, name: user.name },
      });

      if (error) throw new Error(error.message || "An error occurred while processing your card.");

      const response = await fetch(`${API_BASE_URL}/create_payment_intent.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          doctor_id: doctorId,
          appointmentId: tempAppointmentId,
          currency: currency,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to initiate payment.");

      const { clientSecret } = data;
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id
      });

      if (confirmError) throw new Error(confirmError.message || "Could not confirm your payment.");
      
      if (paymentIntent.status === 'succeeded') {
        const registerAppointmentResponse = await fetch(`${API_BASE_URL}/register_appointment.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            doctor_id: doctor.doctor_id,
            patient_id: user.id,
            appointment_date: format(selectedDate, 'yyyy-MM-dd'),
            appointment_time: selectedTime,
            consultation_fee: consultationFee,
            currency: currency,
            stripe_payment_intent_id: paymentIntent.id,
            status: 'confirmed',
            consultation_type: consultationType,
          }),
        });
        const registerAppointmentData = await registerAppointmentResponse.json();
        if (!registerAppointmentResponse.ok || !registerAppointmentData.success) {
            throw new Error(registerAppointmentData.message || "Payment made, but failed to register appointment.");
        }
        toast({ title: "Appointment Scheduled!", description: "Your appointment has been scheduled and payment processed successfully.", variant: "success" });
        
        navigate('/payment-success', {
          state: {
            appointment: {
              date: format(selectedDate, 'yyyy-MM-dd'),
              time: selectedTime,
              amount: consultationFee,
              currency: currency,
              paymentId: paymentIntent.id,
              consultation_type: consultationType,
            },
            doctor: {
              id: doctor.doctor_id,
              name: doctor.full_name,
              specialty: doctor.specialization,
              city: doctor.city_name || '',
              country: doctor.country_name || '',
              whatsapp: doctor.whatsapp_number || '',
              address: doctor.clinic_address || '',
              phone: doctor.clinic_phone || '',
              email: doctor.email || '',
              profile_picture_url: doctor.profile_picture_url || '',
              updated_at: doctor.updated_at || ''
            },
            paymentIntentId: paymentIntent.id,
            paymentStatus: paymentIntent.status,
          }
        });

      } else {
        navigate('/payment-error', { state: { message: `Payment was not successful. Status: ${paymentIntent.status}` } });
      }
    } catch (error) {
      console.error("handleBooking Error:", error);
      toast({ title: "Scheduling Error", description: error.message, variant: "destructive" });
      navigate('/payment-error', { state: { message: error.message } });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // --- MODIFICAÇÃO NA LÓGICA DE FILTRAGEM ---
  const availableTimeSlots = selectedDate
    ? (doctorSchedule.dates[format(selectedDate, 'yyyy-MM-dd')]?.timeSlots || [])
        .filter(slot => 
            !slot.booked && 
            !bookedSlots.includes(slot.time)
        )
    : [];
  // --- FIM DA MODIFICAÇÃO ---
  
  const enabledDays = Object.keys(doctorSchedule.dates)
    .map(dateStr => parseISO(dateStr))
    .filter(date => isBefore(startOfDay(new Date()), date) || format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

  if (loadingInitialData) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  
  if (errorInitialData) {
      return (
        <>
            <Helmet><title>Error Scheduling</title></Helmet>
            <div className="min-h-screen bg-background text-foreground">
                <AppHeader showBackButton={true} /> 
                <div className="container mx-auto px-4 py-8 flex items-center justify-center" style={{ minHeight: '80vh' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md mx-auto space-y-4 text-center">
                        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
                        <h1 className="text-3xl font-bold text-center">Unable to Schedule</h1>
                        <p className="text-lg text-muted-foreground">{errorInitialData}</p>
                        <Button onClick={() => navigate(-1) || navigate('/')}>Go Back</Button>
                    </motion.div>
                </div>
            </div>
        </>
      );
  }
  
  if (!doctor) return <div className="min-h-screen flex items-center justify-center"><p>Doctor not found.</p></div>;

  const imageUrl = doctor.profile_picture_url
    ? `${API_BASE_URL.replace('/api', '')}/${doctor.profile_picture_url}?v=${doctor.updated_at || ''}`
    : undefined;

  return (
    <>
      <Helmet><title>Schedule with {doctor.full_name}</title></Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader showBackButton={true} /> 
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold text-center">Schedule Appointment</h1>
            
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={imageUrl} alt={doctor.full_name} />
                    <AvatarFallback className="text-xl">{getInitials(doctor.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <a href={`/doctor-profile/${doctor.doctor_id}`} className="hover:underline">
                      <CardTitle className="text-xl font-bold text-primary">{doctor.full_name}</CardTitle>
                    </a>
                    <p className="text-md text-gray-600 flex items-center mt-1"><Stethoscope className="w-4 h-4 mr-2" /> {doctor.specialization}{doctor.sub_specialization && ` - ${doctor.sub_specialization}`}</p>
                    {doctor.city_name && doctor.country_name && (<p className="text-sm text-gray-600 flex items-center mt-1"><MapPin className="w-4 h-4 mr-2" /> {doctor.city_name}, {doctor.country_name}</p>)}
                    {doctor.languages && Array.isArray(doctor.languages) && doctor.languages.length > 0 && (<p className="text-sm text-gray-600 flex items-center mt-1"><Globe className="w-4 h-4 mr-2" /> {doctor.languages.join(', ')}</p>)}
                  </div>
                  <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(consultationFee, currency)}</p>
                      <p className="text-sm text-muted-foreground">Consultation Fee</p>
                  </div>
                </div>
                <div className="border-t mt-4 pt-4 space-y-2">
                    {doctor.clinic_address && (<p className="text-sm text-gray-600 flex items-center"><MapPin className="w-4 h-4 mr-2 flex-shrink-0" /> {doctor.clinic_address}</p>)}
                    {doctor.whatsapp_number && (<p className="text-sm text-gray-600 flex items-center"><Phone className="w-4 h-4 mr-2 flex-shrink-0" /> {doctor.whatsapp_number} (WhatsApp)</p>)}
                    {doctor.email && (<p className="text-sm text-gray-600 flex items-center"><Mail className="w-4 h-4 mr-2 flex-shrink-0" /> {doctor.email}</p>)}
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><CalendarIcon className="w-5 h-5 mr-2" />1. Select a Date</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                    {enabledDays.length > 0 ? (
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => !enabledDays.some(enabledDate => format(enabledDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))}
                            fromDate={new Date()}
                            className="rounded-md border"
                        />
                    ) : (
                        <div className="text-center p-4 text-muted-foreground">
                            This doctor does not have available dates for future appointments at this time.
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedDate && (
                <motion.div ref={timeSectionRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Clock className="w-5 h-5 mr-2" />2. Select a Time</CardTitle>
                            <CardDescription className="!mt-2 flex items-center gap-2">
                                Consultation type for {format(selectedDate, 'MM/dd/yyyy')}:
                                {consultationType === 'online' ? <Globe className="w-4 h-4 text-blue-500" /> : <Building className="w-4 h-4 text-orange-500" />}
                                <span className="font-semibold capitalize text-primary">{consultationType === 'online' ? 'Online' : 'In-person'}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* --- MODIFICAÇÃO PARA LOADING STATE --- */}
                            {loadingTimes ? (
                                <p className="text-center text-muted-foreground">Loading available times...</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {availableTimeSlots.length > 0 ? availableTimeSlots.map(slot => (
                                        <Button key={slot.time} variant={selectedTime === slot.time ? "default" : "outline"} onClick={() => handleTimeSelect(slot.time)}>
                                            {slot.time}
                                        </Button>
                                    )) : <p className="col-span-full text-center text-muted-foreground">No available time slots for this day.</p>}
                                </div>
                            )}
                            {/* --- FIM DA MODIFICAÇÃO --- */}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {selectedDate && selectedTime && (
                <motion.div ref={summarySectionRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Stethoscope className="w-5 h-5 mr-2" />3. Booking Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <p><strong>Doctor:</strong> {doctor.full_name}</p>
                                <p><strong>Date:</strong> {format(selectedDate, 'EEEE, d MMMM, yyyy', { locale: enUS })}</p>
                                <p><strong>Time:</strong> {selectedTime}</p>
                                <p><strong>Type:</strong> <span className="capitalize font-medium">{consultationType}</span></p>
                                <p className="text-lg font-bold"><strong>Total:</strong> {formatCurrency(consultationFee, currency)}</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleConfirmAndPay} className="w-full">Confirm and Proceed to Payment</Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}

            {isBookingConfirmed && (
              <motion.div ref={paymentSectionRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="shadow-lg">
                  <CardHeader><CardTitle className="flex items-center"><CreditCard className="w-5 h-5 mr-2" />4. Payment Details</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Enter your card details to confirm.</p>
                    <div className="mb-6 p-3 border rounded-md bg-white"><CardElement options={CARD_ELEMENT_OPTIONS} /></div>
                    <Button onClick={handleBooking} className="w-full" disabled={!stripe || isProcessingPayment}>
                      {isProcessingPayment ? 'Processing...' : `Pay ${formatCurrency(consultationFee, currency)} and Schedule`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BookAppointment;