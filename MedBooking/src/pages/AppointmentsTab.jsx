import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, DollarSign, Banknote, ArrowUp, ArrowDown } from 'lucide-react';
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

const SortableHeader = ({ children, sortConfig, setSortConfig, sortKey }) => {
  const direction = sortConfig.key === sortKey ? sortConfig.direction : null;
  
  const onSort = () => {
    let newDirection = 'ascending';
    if (direction === 'ascending') {
      newDirection = 'descending';
    }
    setSortConfig({ key: sortKey, direction: newDirection });
  };

  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
      <Button variant="ghost" size="sm" onClick={onSort} className="px-0 hover:bg-transparent">
        {children}
        {direction === 'ascending' && <ArrowUp className="w-4 h-4 ml-1" />}
        {direction === 'descending' && <ArrowDown className="w-4 h-4 ml-1" />}
      </Button>
    </th>
  );
};

const AppointmentsTab = ({ appointments, loading, error, onForceCompletion, onConfirmManualPayout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'appointment_date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const processedAppointments = useMemo(() => {
    let filtered = appointments.filter(app =>
      (app.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.doctor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'appointment_date') {
        aValue = new Date(a.appointment_date + 'T' + a.appointment_time).getTime();
        bValue = new Date(b.appointment_date + 'T' + b.appointment_time).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [appointments, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedAppointments.length / recordsPerPage);
  const paginatedAppointments = processedAppointments.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Clock className="w-5 h-5 mr-2" /> Appointments Overview</CardTitle>
        <CardDescription>Monitor appointments and release funds if necessary.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Search by patient or doctor..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>
        {loading && appointments.length === 0 ? (
          <p>Loading appointments...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : processedAppointments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary">
                  <tr>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="appointment_date">Date</SortableHeader>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="patient_name">Patient</SortableHeader>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="doctor_name">Doctor</SortableHeader>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="status">Appt. Status</SortableHeader>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="payment_status">Pay Status</SortableHeader>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="transfer_status">Transfer Status</SortableHeader>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {paginatedAppointments.map((app) => (
                    <tr key={app.appointment_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{app.appointment_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{app.patient_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{app.doctor_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{app.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{app.payment_status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{app.transfer_status || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {app.status === 'confirmed' && app.payment_status === 'paid' && (app.transfer_status === 'pending' || app.transfer_status === 'manual_pending') && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" title="Force Release Funds">
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Force Release Funds?</AlertDialogTitle><AlertDialogDescription>This will manually complete the appointment and release the payment (automatic or manual). Use this only if the patient forgot to confirm.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onForceCompletion(app.appointment_id)}>Confirm Release</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {app.transfer_status === 'awaiting_admin_payout' && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" title="Confirm Manual Payout" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                                <Banknote className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Confirm Manual Payout?</AlertDialogTitle><AlertDialogDescription>This confirms you have manually paid the doctor (e.g., bank transfer). This action is irreversible and marks the payment as 'released'.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onConfirmManualPayout(app.payment_record_id)}>Confirm Payout</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
             <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          </>
        ) : (
          <p>No appointments found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentsTab;