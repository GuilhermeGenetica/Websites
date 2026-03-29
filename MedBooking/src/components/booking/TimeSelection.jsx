import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const TimeSelection = ({ availableTimes, bookedSlots, selectedTime, onTimeSelect, selectedDate, isLoading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Select the Time</span>
          </CardTitle>
          <CardDescription>
            Available times for {format(selectedDate, "EEEE, MMMM dd, yyyy", { locale: enUS })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Checking times...</p>
            </div>
          ) : availableTimes.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {availableTimes.map(time => {
                const isBooked = bookedSlots.includes(time);
                
                if (isBooked) {
                  return (
                    <div key={time} title="Time slot taken">
                      <Button
                        variant="outline"
                        className="w-full bg-red-500/20 border-red-500/30 text-muted-foreground cursor-not-allowed hover:bg-red-500/20"
                        disabled
                      >
                        {time}
                      </Button>
                    </div>
                  );
                }

                return (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`${selectedTime === time ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => onTimeSelect(time)}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No available times for this date.</p>
              <p className="text-sm text-muted-foreground mt-1">Please select another date.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TimeSelection;
