import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DateSelection from '@/components/booking/DateSelection';
import TimeSelection from '@/components/booking/TimeSelection';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const DateTimeSelection = ({ doctorId, doctorSchedule, onDateTimeSelected }) => {
  const { toast } = useToast();
  const { token, API_BASE_URL } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  const timeToMinutes = (time) => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const fetchBookedSlots = async (date) => {
    setLoadingSlots(true);
    const dateString = format(date, 'yyyy-MM-dd');
    try {
      const response = await fetch(`${API_BASE_URL}/get_booked_slots.php?doctor_id=${doctorId}&date=${dateString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setBookedSlots(data.bookedSlots || []);
      } else {
        toast({
          title: "Warning",
          description: "Could not verify already booked time slots.",
          variant: "warning",
        });
        setBookedSlots([]);
      }
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server to check appointments.",
        variant: "destructive",
      });
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setAvailableTimes([]);
    onDateTimeSelected({ date: date, time: null });

    if (doctorSchedule && date) {
      fetchBookedSlots(date);

      const dateString = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      let slots = [];

      if (doctorSchedule.dates[dateString] && doctorSchedule.dates[dateString].timeSlots) {
        slots = doctorSchedule.dates[dateString].timeSlots.map(slot => slot.time);
      } else {
        const matchingRecurring = doctorSchedule.recurring.find(r => r && Array.isArray(r.daysOfWeek) && r.daysOfWeek.includes(dayOfWeek));
        
        if (matchingRecurring) {
          const startMinutes = timeToMinutes(matchingRecurring.startTime);
          const endMinutes = timeToMinutes(matchingRecurring.endTime);
          const interval = parseInt(matchingRecurring.interval);
          if (!isNaN(startMinutes) && !isNaN(endMinutes) && !isNaN(interval) && interval > 0) {
            for (let m = startMinutes; m < endMinutes; m += interval) {
                slots.push(minutesToTime(m));
            }
          }
        }
      }
      setAvailableTimes(slots);
    }
  }, [doctorSchedule, doctorId, token, API_BASE_URL, onDateTimeSelected, toast]);

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    onDateTimeSelected({ date: selectedDate, time: time });
  };

  return (
    <div className="space-y-6">
      <DateSelection
        doctorSchedule={doctorSchedule}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />
      {selectedDate && (
        <TimeSelection
          availableTimes={availableTimes}
          bookedSlots={bookedSlots}
          selectedTime={selectedTime}
          onTimeSelect={handleTimeSelect}
          selectedDate={selectedDate}
          isLoading={loadingSlots}
        />
      )}
    </div>
  );
};

export default DateTimeSelection;
