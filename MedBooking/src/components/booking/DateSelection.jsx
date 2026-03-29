import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

const DateSelection = ({ doctorSchedule, selectedDate, onDateSelect, setAvailableSlots, setSelectedTime }) => {

  const handleDateSelectInternal = (date) => {
    onDateSelect(date);

    const dateString = format(date, 'yyyy-MM-dd');
    const scheduleForSelectedDate = doctorSchedule?.dates[dateString];

    if (scheduleForSelectedDate && scheduleForSelectedDate.timeSlots) {
      const availableTimes = scheduleForSelectedDate.timeSlots
        .filter(slot => !slot.booked)
        .map(slot => slot.time);
      setAvailableSlots(availableTimes);
    } else {
      setAvailableSlots([]);
    }
    setSelectedTime(null);
  };

  const isDateSelectable = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const scheduleEntry = doctorSchedule?.dates[dateString];
    
    return scheduleEntry && scheduleEntry.timeSlots && scheduleEntry.timeSlots.some(slot => !slot.booked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>Select the Date</span>
          </CardTitle>
          <CardDescription>
            Choose an available date from the doctor's schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelectInternal}
            disabled={(date) => !isDateSelectable(date)}
            className="rounded-md border mx-auto"
            locale={enUS}
          />
          {!selectedDate && (
            <p className="text-center text-muted-foreground mt-4">
              Please select a date to see available times.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DateSelection;
