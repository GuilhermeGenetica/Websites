import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// *** MODIFICATION START ***
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Clock, Plus, Trash2, Save, Repeat, Calendar as CalendarIcon, Globe, Building } from 'lucide-react';
// *** MODIFICATION END ***
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import AppHeader from '@/components/shared/AppHeader';

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, API_BASE_URL } = useAuth();
  
  const [schedule, setSchedule] = useState({ dates: {}, recurring: [] });
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedInterval, setSelectedInterval] = useState('30');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [recurringDays, setRecurringDays] = useState([]);
  const [recurringMonth, setRecurringMonth] = useState('');
  const [recurringYear, setRecurringYear] = useState(new Date().getFullYear().toString());
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  // *** MODIFICATION START ***
  const [defaultConsultationType, setDefaultConsultationType] = useState('online');
  // *** MODIFICATION END ***

  const intervals = [{ value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '45', label: '45 minutes' }, { value: '60', label: '60 minutes' }];
  const weekdays = [{ id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' }, { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' }, { id: 0, label: 'Sun' }];
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('en-US', { month: 'long' }) }));
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + i).toString());

  const fetchDoctorSchedule = async () => {
    if (!user || !user.id || !token) {
      console.warn("User or token not available, cannot fetch schedule.");
      setLoadingSchedule(false);
      return;
    }
    setLoadingSchedule(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get_doctor_schedule.php`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const fetchedSchedule = data.schedule || {};
        const fetchedDates = fetchedSchedule.dates;
        const finalDates = (typeof fetchedDates === 'object' && fetchedDates !== null && !Array.isArray(fetchedDates))
                           ? fetchedDates
                           : {};
        
        // *** MODIFICATION START: Ensure every date has a consultation_type ***
        Object.keys(finalDates).forEach(date => {
            if (!finalDates[date].consultation_type) {
                finalDates[date].consultation_type = 'online'; // Default to online if not set
            }
        });
        // *** MODIFICATION END ***

        setSchedule({
          dates: finalDates,
          recurring: fetchedSchedule.recurring || []
        });
        toast({ title: "Schedule loaded!", description: "Your schedule has been loaded successfully." });
      } else {
        toast({ title: "Error loading schedule", description: data.message || "Could not load the schedule.", variant: "destructive" });
        setSchedule({ dates: {}, recurring: [] });
      }
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
      toast({ title: "Network Error", description: "Could not connect to the server to load the schedule.", variant: "destructive" });
      setSchedule({ dates: {}, recurring: [] });
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchDoctorSchedule();
  }, [user, token, API_BASE_URL]);

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const generateTimeSlots = (start, end, interval) => {
    const slots = [];
    for (let minutes = timeToMinutes(start); minutes < timeToMinutes(end); minutes += parseInt(interval)) {
      slots.push({ time: minutesToTime(minutes), booked: false });
    }
    return slots;
  };

  const handleAddSchedule = () => {
    if (selectedDates.length === 0) {
      toast({ title: "Error", description: "Please select at least one date.", variant: "destructive" });
      return;
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      toast({ title: "Error", description: "The start time must be before the end time.", variant: "destructive" });
      return;
    }
    
    const newTimeSlots = generateTimeSlots(startTime, endTime, selectedInterval);
    
    const newScheduleDates = {}; 
    if (typeof schedule.dates === 'object' && schedule.dates !== null && !Array.isArray(schedule.dates)) {
      Object.assign(newScheduleDates, schedule.dates);
    }

    selectedDates.forEach(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      newScheduleDates[dateString] = { 
        startTime, 
        endTime, 
        interval: selectedInterval, 
        timeSlots: newTimeSlots,
        // *** MODIFICATION START ***
        consultation_type: defaultConsultationType 
        // *** MODIFICATION END ***
      };
    });

    setSchedule(prevSchedule => ({
        ...prevSchedule,
        dates: newScheduleDates
    }));

    toast({ title: "Times added!", description: `Availability created for the selected dates.` });
    setSelectedDates([]);
  };

  const handleAddRecurring = () => {
    if (recurringDays.length === 0 || recurringMonth === '' || recurringYear === '') {
      toast({ title: "Error", description: "Select days, month, and year for recurrence.", variant: "destructive" });
      return;
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      toast({ title: "Error", description: "The start time must be before the end time.", variant: "destructive" });
      return;
    }
    
    const year = parseInt(recurringYear);
    const month = parseInt(recurringMonth);
    const daysInMonth = getDaysInMonth(new Date(year, month));
    
    const newTimeSlots = generateTimeSlots(startTime, endTime, selectedInterval);
    
    const newScheduleDates = {}; 
    if (typeof schedule.dates === 'object' && schedule.dates !== null && !Array.isArray(schedule.dates)) {
      Object.assign(newScheduleDates, schedule.dates);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = getDay(currentDate);
      if (recurringDays.includes(dayOfWeek)) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        newScheduleDates[dateString] = { 
          startTime, 
          endTime, 
          interval: selectedInterval, 
          timeSlots: newTimeSlots,
          // *** MODIFICATION START ***
          consultation_type: defaultConsultationType
          // *** MODIFICATION END ***
        };
      }
    }

    // This part for recurring rules is complex, for now we just add the dates
    // A more robust implementation would handle recurring rules separately
    setSchedule(prevSchedule => ({
        ...prevSchedule,
        dates: newScheduleDates
    }));

    toast({ title: "Recurring times added!", description: `Availability created based on recurrence.` });
  };

  // *** MODIFICATION START: New handler for changing individual date's type ***
  const handleConsultationTypeChange = (dateString, newType) => {
    setSchedule(prevSchedule => {
        const newDates = { ...prevSchedule.dates };
        if (newDates[dateString]) {
            newDates[dateString].consultation_type = newType;
        }
        return { ...prevSchedule, dates: newDates };
    });
  };
  // *** MODIFICATION END ***

  const handleSaveSchedule = async () => {
    if (!user || !user.id || !token) {
      toast({ title: "Error", description: "You are not logged in or your token is invalid.", variant: "destructive" });
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/update_doctor_schedule.php`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule: schedule
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "Schedule saved!", description: data.message || "Your schedule settings have been saved successfully." });
        fetchDoctorSchedule(); 
      } else {
        toast({ title: "Error saving schedule", description: data.message || "Could not save the schedule.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving doctor schedule:", error);
      toast({ title: "Network Error", description: "Could not connect to the server to save the schedule.", variant: "destructive" });
    }
  };

  const handleRemoveDate = (dateString) => {
    const newScheduleDates = { ...schedule.dates };
    if (newScheduleDates[dateString]) {
      delete newScheduleDates[dateString];
      setSchedule(prevSchedule => ({
        ...prevSchedule,
        dates: newScheduleDates
      }));
      toast({ title: "Date removed", description: `Availability for ${format(new Date(dateString + 'T00:00:00'), 'MM/dd/yyyy', { locale: enUS })} has been removed.` });
    }
  };

  const scheduledDates = Object.keys(schedule.dates || {}).sort();

  if (loadingSchedule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground text-lg">Loading schedule...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Schedule - MedBooking</title>
        <meta name="description" content="Set your office hours on the MedBooking platform" />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader showBackButton={true} showThemeToggle={true} />
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Manage Schedule</h1>
                <p className="text-xl text-muted-foreground">Set your office hours and view your appointments</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button><Save className="w-4 h-4 mr-2" />Save Schedule</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will save all your time settings. Do you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSaveSchedule}>Save</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <Card>
                <CardHeader><div className="flex items-center space-x-2"><Plus className="w-5 h-5 text-primary" /><CardTitle>Add Specific Dates</CardTitle></div><CardDescription>Select one or more dates to open your schedule</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <Calendar mode="multiple" selected={selectedDates} onSelect={setSelectedDates} className="rounded-md border" />
                  
                  {/* *** MODIFICATION START: Radio group for consultation type *** */}
                  <div className="pt-4 border-t">
                      <Label className="text-base font-semibold">Default Consultation Type</Label>
                      <p className="text-sm text-muted-foreground mb-3">This will be the default for all new dates you add.</p>
                      <RadioGroup defaultValue="online" value={defaultConsultationType} onValueChange={setDefaultConsultationType} className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="online" id="r-online" />
                              <Label htmlFor="r-online">Online</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="in-person" id="r-in-person" />
                              <Label htmlFor="r-in-person">In-person</Label>
                          </div>
                      </RadioGroup>
                  </div>
                  {/* *** MODIFICATION END *** */}

                  <Button onClick={handleAddSchedule} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Selected Dates</Button>
                </CardContent>
              </Card>
              <div className="space-y-8">
                <Card>
                  <CardHeader><div className="flex items-center space-x-2"><Repeat className="w-5 h-5 text-primary" /><CardTitle>Add Recurring Times</CardTitle></div><CardDescription>Set a default time for specific days of a month</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select value={recurringMonth} onValueChange={setRecurringMonth}><SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Select value={recurringYear} onValueChange={setRecurringYear}><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                      </div>
                    </div>
                    <div>
                      <Label>Days of the week</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {weekdays.map(day => (
                          <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox id={`day-${day.id}`} checked={recurringDays.includes(day.id)} onCheckedChange={() => setRecurringDays(prev => prev.includes(day.id) ? prev.filter(d => d !== day.id) : [...prev, day.id])} />
                            <Label htmlFor={`day-${day.id}`}>{day.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddRecurring} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Recurrence</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><div className="flex items-center space-x-2"><Clock className="w-5 h-5 text-primary" /><CardTitle>Time Settings</CardTitle></div><CardDescription>Applied to all added dates and recurrences</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2"><Label htmlFor="interval">Interval between Appointments</Label><Select value={selectedInterval} onValueChange={setSelectedInterval}><SelectTrigger><SelectValue placeholder="Select interval" /></SelectTrigger><SelectContent>{intervals.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="startTime">Start Time</Label><Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="endTime">End Time</Label><Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <Card>
              <CardHeader><div className="flex items-center space-x-2"><CalendarIcon className="w-5 h-5 text-primary" /><CardTitle>Schedule Overview</CardTitle></div><CardDescription>Specific dates with configured times</CardDescription></CardHeader>
              <CardContent>
                {scheduledDates.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                    {scheduledDates.map(dateString => {
                      const dateData = schedule.dates[dateString];
                      return (
                      // *** MODIFICATION START: Updated overview item ***
                      <div key={dateString} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-secondary gap-4">
                        <div className="flex-grow">
                          <p className="font-semibold">{format(new Date(dateString + 'T00:00:00'), 'MM/dd/yyyy', { locale: enUS })} - {dateData.startTime} to {dateData.endTime}</p>
                          <p className="text-xs text-muted-foreground">
                            Times: {dateData.timeSlots.filter(slot => !slot.booked).length} available of {dateData.timeSlots.length}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <RadioGroup 
                                value={dateData.consultation_type || 'online'} 
                                onValueChange={(newType) => handleConsultationTypeChange(dateString, newType)} 
                                className="flex space-x-3"
                            >
                                <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="online" id={`r-online-${dateString}`} />
                                    <Label htmlFor={`r-online-${dateString}`} className="text-xs">Online</Label>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="in-person" id={`r-in-person-${dateString}`} />
                                    <Label htmlFor={`r-in-person-${dateString}`} className="text-xs">In-person</Label>
                                </div>
                            </RadioGroup>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveDate(dateString)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      // *** MODIFICATION END ***
                    )})}
                  </div>
                ) : (
                  <div className="text-center py-8"><p className="text-muted-foreground">No specific dates configured.</p></div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DoctorSchedule;
