import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Calendar, Clock, Phone, Home, Stethoscope, XCircle, CreditCard, Printer, Globe, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (amount, currencyCode) => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
        }).format(amount);
    } catch (e) {
        return `${currencyCode.toUpperCase()} ${amount.toFixed(2)}`;
    }
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { API_BASE_URL } = useAuth();

  const { appointment, doctor, paymentIntentId, paymentStatus } = location.state || {};

  const [isLoading, setIsLoading] = useState(true);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(paymentStatus);

  useEffect(() => {
    if (!appointment || !doctor) {
      toast({
        title: "Redirection Error",
        description: "Could not load appointment or payment details.",
        variant: "destructive"
      });
      navigate('/patient/dashboard');
      return;
    }

    if (currentPaymentStatus === 'succeeded') {
      toast({
        title: "Confirmations sent!",
        description: "A confirmation email has been sent to you and the doctor."
      });
      setIsLoading(false);
    } else if (['requires_payment_method', 'requires_action', 'canceled'].includes(currentPaymentStatus)) {
      toast({
        title: "Payment Pending or Failed",
        description: "There was a problem with your payment. Please try again or contact support.",
        variant: "destructive"
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }

  }, [appointment, doctor, navigate, toast, currentPaymentStatus]);

  const handlePrintReceipt = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking payment status...</p>
        </div>
      </div>
    );
  }

  if (!appointment || !doctor) {
    return null;
  }

  const isSuccess = currentPaymentStatus === 'succeeded';
  const imageUrl = doctor.profile_picture_url
    ? `${API_BASE_URL.replace('/api', '')}/${doctor.profile_picture_url}?v=${doctor.updated_at || ''}`
    : undefined;

  return (
    <>
      <Helmet>
        <title>{isSuccess ? 'Payment Confirmed' : 'Payment Pending/Failed'} - MedBooking</title>
        <meta name="description" content={`Your appointment was ${isSuccess ? 'successfully scheduled' : 'not scheduled due to a payment issue'} on the MedBooking platform`} />
        <style type="text/css" media="print">
          {`
            @media print {
              body {
                background: white !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              header, #pdf-buttons-container {
                display: none !important;
              }
              .no-print {
                display: none !important;
              }
              main {
                padding-top: 0 !important;
              }
              .container {
                 padding: 0 !important;
                 margin: 0 !important;
                 max-width: 100% !important;
              }
              .card-print {
                 box-shadow: none !important;
                 border: 1px solid #e5e7eb !important;
              }
            }
          `}
        </style>
      </Helmet>

      <div className={`min-h-screen ${isSuccess ? 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50' : 'bg-gradient-to-br from-red-50 via-pink-50 to-orange-50'}`}>
        <header className="bg-white shadow-sm border-b no-print">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">MedBooking</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className={`w-20 h-20 ${isSuccess ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6 no-print`}>
                {isSuccess ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {isSuccess ? 'Payment Confirmed!' : 'Payment Pending/Failed'}
              </h1>
              <p className="text-xl text-gray-600">
                {isSuccess ? 'Your appointment has been successfully scheduled' : 'There was a problem with your payment.'}
              </p>
            </motion.div>

            <Card className={`card-print ${isSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <CardHeader>
                <CardTitle className={isSuccess ? "text-green-800" : "text-red-800"}>Appointment Details</CardTitle>
                <CardDescription className={isSuccess ? "text-green-600" : "text-red-600"}>
                  {isSuccess ? 'Save this information for your reference' : 'Please review and try again.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={imageUrl} alt={doctor.name} />
                    <AvatarFallback className="text-lg">{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
                    <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                    <p className="text-gray-600">{doctor.city}, {doctor.country}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(appointment.amount || 0, appointment.currency || 'EUR')}
                    </p>
                    <p className="text-sm text-gray-500">{isSuccess ? 'Paid' : 'Unpaid'}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className={`w-5 h-5 ${isSuccess ? 'text-green-600' : 'text-red-600'}`} />
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p className="text-gray-600">
                        {new Date(appointment.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className={`w-5 h-5 ${isSuccess ? 'text-green-600' : 'text-red-600'}`} />
                    <div>
                      <p className="font-medium text-gray-900">Time</p>
                      <p className="text-gray-600">{appointment.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {appointment.consultation_type === 'online' ? 
                        <Globe className={`w-5 h-5 ${isSuccess ? 'text-green-600' : 'text-red-600'}`} /> : 
                        <Building className={`w-5 h-5 ${isSuccess ? 'text-green-600' : 'text-red-600'}`} />
                    }
                    <div>
                      <p className="font-medium text-gray-900">Type</p>
                      <p className="text-gray-600 capitalize">{appointment.consultation_type}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 card-print">
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">How will the appointment be?</p>
                      <p className="text-blue-800 text-sm leading-relaxed">
                        {appointment.consultation_type === 'online' && (
                            <>
                                Your appointment will be <strong>Online</strong>. After booking and payment, you and Dr. <strong>{doctor.name}</strong> will receive a confirmation email with the video call link.
                            </>
                        )}
                        {appointment.consultation_type === 'in-person' && (
                            <>
                                Your appointment will be <strong>In-person</strong>. The address of the doctor's clinic is: <strong>{doctor.address || 'Contact the doctor for the address.'}</strong>.
                            </>
                        )}
                        <br /><br />
                        You can contact the doctor via WhatsApp{' '}
                        {doctor.whatsapp ? (
                          <a href={`https://wa.me/${doctor.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                            ({doctor.whatsapp})
                          </a>
                        ) : (
                          '(not provided)'
                        )}{' '}
                        or email{' '}
                        <strong>({doctor.email || 'N/A'})</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 card-print">
                  <p className="text-yellow-800 text-sm">
                    <strong>Important:</strong> {isSuccess ? 'Confirmations have been sent via email to you and the doctor. You must confirm the consultation after it occurs in your "My Appointments" panel to release the payment to the doctor.' : 'If the problem persists, contact support or try to book again.'}
                    {isSuccess && ' If you need to reschedule or cancel, please contact us at least 24 hours in advance.'}
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 card-print">
                  <p className="text-red-800 text-sm font-medium mb-2">
                    <strong>Cancellation and Refunds</strong>
                  </p>
                  <ul className="list-disc pl-5 text-red-800 text-sm space-y-1">
                    <li>Cancel up to 24h before: 90% refund with a 10% fee for technical costs.</li>
                    <li>Urgent cancellation 24h before or 24h after: 50% refund with a 50% fee.</li>
                    <li>Cancellation requests after 24 hours of the appointment: no refund.</li>
                    <li>Request via email/platform forms — response in 7 business days.</li>
                  </ul>
                </div>

              </CardContent>
            </Card>

            <Card className="card-print">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{paymentIntentId || appointment.paymentId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>Stripe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`${isSuccess ? 'text-green-600' : 'text-red-600'} font-medium`}>{isSuccess ? 'Confirmed' : 'Failed / Pending'}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-3">
                  <span>Total {isSuccess ? 'Paid' : 'Due'}:</span>
                  <span className={`${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(appointment.amount || 0, appointment.currency || 'EUR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div id="pdf-buttons-container" className="flex flex-col sm:flex-row gap-4 no-print">
              <Button
                onClick={() => navigate('/patient/dashboard')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              {isSuccess && (
                <Button
                  variant="outline"
                  onClick={handlePrintReceipt}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              )}
              {!isSuccess && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default PaymentSuccess;
