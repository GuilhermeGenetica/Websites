import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const BookingSummary = ({ doctor, selectedDate, selectedTime, onConfirmBooking }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Consultation Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Doctor</p>
                <p className="text-lg font-semibold">{doctor.name}</p>
                <p className="text-blue-600">{doctor.specialty}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date and Time</p>
                <p className="text-lg font-semibold">
                  {format(selectedDate, "EEEE, MMMM dd, yyyy", { locale: enUS })}
                </p>
                <p className="text-blue-600">{selectedTime}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultation Fee</p>
                <p className="text-3xl font-bold text-blue-600">€{doctor.consultationFee}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Some consultation could be held online. 
                  Make sure your phone number is active in WhatsApp. 
                </p>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <Button 
              onClick={onConfirmBooking}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay and Confirm Consultation - €{doctor.consultationFee}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Secure payment processed by Stripe
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BookingSummary;
