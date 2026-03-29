import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';

const PaymentError = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { message } = location.state || { message: 'An unknown error occurred during processing. Please try again.' };

  const handleTryAgain = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    navigate('/patient/dashboard');
  };

  return (
    <>
      <Helmet>
        <title>Payment Error - MedBooking</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-red-200 bg-red-50 text-center shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-red-800">
                  An Error Occurred
                </CardTitle>
                <CardDescription className="text-red-700">
                  We could not complete your appointment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white border border-red-200 rounded-md p-4">
                  <p className="text-sm text-gray-700">{message}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleTryAgain}
                    variant="outline"
                    className="flex-1 border-gray-400"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={handleGoToDashboard}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PaymentError;
