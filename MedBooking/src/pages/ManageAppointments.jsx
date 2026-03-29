import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AppHeader from '@/components/shared/AppHeader';
import { format, isBefore, startOfToday, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Video, Trash2, XCircle, Printer, Calendar as CalendarIcon, X, Info } from 'lucide-react';
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

const ManageAppointments = () => {
    const { token, API_BASE_URL } = useAuth();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const fetchAppointments = useCallback(async (date) => {
        setLoading(true);
        const dateString = format(date, 'yyyy-MM-dd');
        try {
            const response = await fetch(`${API_BASE_URL}/get_doctor_appointments.php?date=${dateString}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setAppointments(data.appointments || []);
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Failed to fetch appointments.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [token, API_BASE_URL, toast]);

    useEffect(() => {
        fetchAppointments(selectedDate);
    }, [selectedDate, fetchAppointments]);
    
    const handleGenerateReport = async () => {
        if (!fromDate || !toDate) {
            toast({ title: "Error", description: "Please select both 'from' and 'to' dates.", variant: "destructive" });
            return;
        }
        if (new Date(fromDate) > new Date(toDate)) {
            toast({ title: "Error", description: "'From' date cannot be after 'To' date.", variant: "destructive" });
            return;
        }

        setReportLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_doctor_appointments.php?startDate=${fromDate}&endDate=${toDate}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                openReportInNewTab(data.appointments);
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Failed to fetch report data.", variant: "destructive" });
        } finally {
            setReportLoading(false);
        }
    };
    
    const openReportInNewTab = (reportAppointments) => {
        const reportContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Report</title>
                <style>
                    body { font-family: sans-serif; margin: 2rem; background-color: #fff; color: #333; }
                    .header { 
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 2rem;
                    }
                    .header-title {
                        text-align: center;
                        flex-grow: 1;
                    }
                    .header h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
                    .header p { font-size: 1rem; color: #666; }
                    .report-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                    .report-table th, .report-table td { 
                        border: 1px solid #ddd; 
                        padding: 12px; 
                        text-align: left;
                    }
                    .report-table thead th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                        color: #555;
                    }
                    .text-gray-500 { color: #6b7280; }
                    .bg-gray-100 { background-color: #f3f4f6; }
                    .button {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .print-button {
                        background-color: #007bff;
                        color: white;
                    }
                    .close-button {
                        background-color: #6c757d;
                        color: white;
                    }
                    @media print {
                        .buttons-container {
                            display: none;
                        }
                    }
                </style>
                <script>
                    function handlePrint() {
                        window.print();
                    }
                    function handleClose() {
                        window.close();
                    }
                </script>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="buttons-container">
                            <button class="button print-button" onclick="handlePrint()">Print</button>
                            <button class="button close-button" onclick="handleClose()">Close</button>
                        </div>
                        <div class="header-title">
                            <h1>Appointment Report</h1>
                            <p>Period: ${format(parseISO(fromDate), 'MMM dd, yyyy')} to ${format(parseISO(toDate), 'MMM dd, yyyy')}</p>
                        </div>
                        <div style="width: 150px;"></div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Patient Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportAppointments.length > 0 ? (
                                    reportAppointments.map(app => {
                                        const appointmentDateTime = parseISO(`${app.appointment_date}T${app.appointment_time}`);
                                        const isPast = isBefore(appointmentDateTime, new Date());
                                        const rowClass = isPast ? 'text-gray-500 bg-gray-100' : '';
                                        return `
                                            <tr class="${rowClass}">
                                                <td>${format(appointmentDateTime, 'yyyy-MM-dd')}</td>
                                                <td>${format(appointmentDateTime, 'HH:mm')}</td>
                                                <td>${app.patient_name}</td>
                                            </tr>
                                        `;
                                    }).join('')
                                ) : (
                                    `
                                        <tr>
                                            <td colspan="3" style="text-align: center; padding: 2rem;">No appointments found in this period.</td>
                                        </tr>
                                    `
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(reportContent);
            newWindow.document.close();
        } else {
            toast({ title: "Error", description: "Pop-up blocked. Please disable your pop-up blocker to view the report.", variant: "destructive" });
        }
    };

    const handleAction = async (endpoint, appointmentId, successMessage) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ appointment_id: appointmentId }),
            });
            const data = await response.json();
            if (data.success) {
                toast({ title: "Success", description: successMessage });
                fetchAppointments(selectedDate);
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Failed to complete the action.", variant: "destructive" });
        }
    };

    const handleCancel = (appointmentId) => handleAction('cancel_appointment.php', appointmentId, 'Appointment canceled successfully.');
    const handleDelete = (appointmentId) => handleAction('delete_appointment.php', appointmentId, 'Appointment deleted successfully.');

    return (
        <>
            <Helmet><title>Manage Appointments</title></Helmet>
            <div className="min-h-screen bg-background text-foreground">
                <AppHeader showBackButton={true} />
                <div className="container mx-auto px-4 py-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto space-y-8">
                        <h1 className="text-4xl font-bold text-center">Manage Appointments</h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-1">
                                <Card>
                                    <CardHeader><CardTitle>Select a Date</CardTitle></CardHeader>
                                    <CardContent>
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            className="rounded-md border"
                                            locale={enUS}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Appointments for {format(selectedDate, "MMMM dd, yyyy", { locale: enUS })}</CardTitle>
                                        <CardDescription>List of appointments for the selected day.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <p>Loading...</p>
                                        ) : appointments.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Time</TableHead>
                                                        <TableHead>Patient</TableHead>
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
                                                    {appointments.map((app) => {
                                                        const isPast = isBefore(new Date(`${app.appointment_date}T${app.appointment_time}`), startOfToday());
                                                        return (
                                                            <TableRow key={app.appointment_id} className={isPast ? 'text-muted-foreground' : ''}>
                                                                <TableCell>{app.appointment_time.substring(0, 5)}</TableCell>
                                                                <TableCell>
                                                                    <Link to={`/doctor/patient-profile/${app.patient_id}`} className="text-blue-600 hover:underline">
                                                                        {app.patient_name}
                                                                    </Link>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {app.google_meet_link && app.status !== 'Canceled' && app.consultation_type === 'online' ? (
                                                                        <a href={app.google_meet_link} target="_blank" rel="noopener noreferrer">
                                                                            <Button variant="outline" size="sm"><Video className="w-4 h-4 mr-2" />Google Meet</Button>
                                                                        </a>
                                                                    ) : 'N/A'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {app.jitsi_meet_link && app.status !== 'Canceled' && app.consultation_type === 'online' ? (
                                                                        <a href={app.jitsi_meet_link} target="_blank" rel="noopener noreferrer">
                                                                            <Button variant="outline" size="sm"><Video className="w-4 h-4 mr-2" />Jitsi Meet</Button>
                                                                        </a>
                                                                    ) : 'N/A'}
                                                                </TableCell>
                                                                <TableCell className="text-right space-x-2">
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="outline" size="sm" disabled={isPast || app.status === 'Canceled'}>
                                                                                <XCircle className="w-4 h-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader><AlertDialogTitle>Cancel Appointment?</AlertDialogTitle><AlertDialogDescription>This action will cancel the appointment and remove the event from your calendar. The patient will be notified. Do you want to continue?</AlertDialogDescription></AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Go Back</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => handleCancel(app.appointment_id)}>Confirm Cancellation</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="destructive" size="sm">
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle><AlertDialogDescription>This action is irreversible and will permanently delete this appointment record. Do you want to continue?</AlertDialogDescription></AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Go Back</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => handleDelete(app.appointment_id)}>Confirm and Delete</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">No appointments found for this date.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Appointment Reports</CardTitle>
                                <CardDescription>Generate a list of appointments for a specific period.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex-1 w-full">
                                    <label htmlFor="from-date" className="block text-sm font-medium mb-1">From</label>
                                    <Input type="date" id="from-date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                                </div>
                                <div className="flex-1 w-full">
                                    <label htmlFor="to-date" className="block text-sm font-medium mb-1">To</label>
                                    <Input type="date" id="to-date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                                </div>
                                <div className="pt-6">
                                    <Button onClick={handleGenerateReport} disabled={reportLoading}>
                                        {reportLoading ? 'Generating...' : 'Generate Report'}
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

export default ManageAppointments;