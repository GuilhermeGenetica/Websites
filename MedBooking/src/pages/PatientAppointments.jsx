import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AppHeader from '@/components/shared/AppHeader';
import { format, isFuture, parseISO, isPast } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Video, Trash2, XCircle, MessageSquare, Globe, Building, CheckCheck, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PatientAppointments = () => {
    const { token, API_BASE_URL } = useAuth();
    const { toast } = useToast();
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [pastAppointments, setPastAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_patient_appointments.php`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                const now = new Date();
                const upcoming = [];
                const past = [];

                (data.appointments || []).forEach(app => {
                    const appDateTime = parseISO(`${app.appointment_date}T${app.appointment_time}`);
                    if (isFuture(appDateTime) && app.status !== 'cancelled' && app.status !== 'failed') {
                        upcoming.push(app);
                    } else {
                        past.push(app);
                    }
                });
                setUpcomingAppointments(upcoming.sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`) - new Date(`${b.appointment_date}T${b.appointment_time}`)));
                setPastAppointments(past.sort((a, b) => new Date(`${b.appointment_date}T${b.appointment_time}`) - new Date(`${a.appointment_date}T${a.appointment_time}`)));
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not fetch appointments.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [token, API_BASE_URL, toast]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleAction = async (endpoint, appointmentId, successMessage, method = 'POST') => {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ appointment_id: appointmentId }),
            });
            const data = await response.json();
            if (data.success) {
                toast({ title: "Success", description: successMessage });
                fetchAppointments();
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: `Could not complete the action.`, variant: "destructive" });
        }
    };

    const handleCancel = (appointmentId) => handleAction('cancel_appointment.php', appointmentId, 'Appointment canceled successfully.');
    const handleDelete = (appointmentId) => handleAction('delete_patient_appointment.php', appointmentId, 'Appointment record deleted successfully.');
    const handleConfirmCompletion = (appointmentId) => handleAction('confirm_completion_patient.php', appointmentId, 'Appointment confirmed. Payment will be released to the doctor.');

    const AppointmentTable = ({ title, appointments, isUpcoming }) => (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                {appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tel. WhatsApp</TableHead>
                                    <TableHead>Google Meet</TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            Jitsi Meet
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0">
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="space-y-2">
                                                    <h4 className="font-semibold">Secure and Encrypted Video Consultation</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Jitsi Meet is a free, open-source, and encrypted video platform. Your consultation is private.
                                                    </p>
                                                    <p className="text-sm font-medium">How to connect securely:</p>
                                                    <ol className="list-decimal list-inside text-sm space-y-1">
                                                        <li>Click the "Jitsi Meet" link to open the room.</li>
                                                        <li>Once inside, click the "Security" icon (a shield) in the bottom right.</li>
                                                        <li>Select "Add password" and set a password.</li>
                                                        <li>Share this password with the other participant (e.g., via WhatsApp) to ensure your consultation is private.</li>
                                                    </ol>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.map((app) => (
                                    <TableRow key={app.appointment_id}>
                                        <TableCell>{format(parseISO(app.appointment_date), 'MM/dd/yyyy', { locale: enUS })}</TableCell>
                                        <TableCell>{app.appointment_time.substring(0, 5)}</TableCell>
                                        <TableCell className="font-medium">
                                            <Link to={`/doctor-profile/${app.doctor_id}`} className="text-blue-600 hover:underline">
                                                {app.doctor_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {app.consultation_type === 'online' ? <Globe className="w-4 h-4 text-blue-500" /> : <Building className="w-4 h-4 text-orange-500" />}
                                                <span className="capitalize">{app.consultation_type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                app.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                app.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                app.status === 'cancelled' || app.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {app.whatsapp_number ? (
                                                <a 
                                                  href={`https://wa.me/${app.whatsapp_number.replace(/\D/g, '')}`} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer" 
                                                  className="flex items-center text-green-600 hover:underline"
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    {app.whatsapp_number}
                                                </a>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {app.google_meet_link && app.status !== 'cancelled' && app.consultation_type === 'online' ? (
                                                <a href={app.google_meet_link} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm"><Video className="w-4 h-4 mr-2" />Google Meet</Button>
                                                </a>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {app.jitsi_meet_link && app.status !== 'cancelled' && app.consultation_type === 'online' ? (
                                                <a href={app.jitsi_meet_link} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm"><Video className="w-4 h-4 mr-2" />Jitsi Meet</Button>
                                                </a>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {isUpcoming && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" title="Cancel Appointment" disabled={app.status === 'cancelled'}>
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Cancel Appointment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. The doctor will be notified. Do you want to continue?</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Back</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleCancel(app.appointment_id)}>Confirm Cancellation</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                            
                                            {!isUpcoming && app.status === 'confirmed' && isPast(parseISO(`${app.appointment_date}T${app.appointment_time}`)) && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="default" size="sm" title="Confirm Completion" className="bg-green-600 hover:bg-green-700">
                                                            <CheckCheck className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Confirm Consultation Completion?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                By clicking confirm, you certify that the consultation with Dr. {app.doctor_name} was completed. This action is final and will release the payment to the doctor.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleConfirmCompletion(app.appointment_id)}>Confirm Completion</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" title="Delete Record"><Trash2 className="w-4 h-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the record of this appointment from your history. This action is irreversible.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Back</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(app.appointment_id)}>Confirm and Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No appointments in this category.</p>
                )}
            </CardContent>
        </Card>
    );

    return (
        <>
            <Helmet><title>My Appointments</title></Helmet>
            <div className="min-h-screen bg-background text-foreground">
                <AppHeader showBackButton={true} />
                <div className="container mx-auto px-4 py-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto space-y-8">
                        <h1 className="text-4xl font-bold text-center">My Appointments</h1>
                        {loading ? (
                            <p className="text-center">Loading appointments...</p>
                        ) : (
                            <div className="space-y-8">
                                <AppointmentTable title="Upcoming Appointments" appointments={upcomingAppointments} isUpcoming={true} />
                                <AppointmentTable title="Past Appointments" appointments={pastAppointments} isUpcoming={false} />
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default PatientAppointments;