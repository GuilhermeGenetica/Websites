import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

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

const PatientsTab = ({ patients, loading, error, onToggleStatus, onDeleteUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const processedPatients = useMemo(() => {
    let filtered = patients.filter(patient =>
      (patient.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (patient.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
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
  }, [patients, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedPatients.length / recordsPerPage);
  const paginatedPatients = processedPatients.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Users className="w-5 h-5 mr-2" /> Registered Patients</CardTitle>
        <CardDescription>Activate, deactivate, or remove patients from the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>
        {loading && patients.length === 0 ? (
          <p>Loading patients...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : processedPatients.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary">
                  <tr>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="full_name">Name</SortableHeader>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="email">E-mail</SortableHeader>
                    <SortableHeader sortConfig={sortConfig} setSortConfig={setSortConfig} sortKey="is_active">Status</SortableHeader>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {paginatedPatients.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          to={`/admin/user-details/patient/${patient.patient_id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {patient.full_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{patient.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {patient.is_active ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                        <Button variant="outline" size="sm" title={patient.is_active ? "Deactivate" : "Activate"} onClick={() => onToggleStatus('patient', patient.patient_id, patient.is_active)}>
                          {patient.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button variant="destructive" size="sm" title="Delete Permanently" onClick={() => onDeleteUser('patient', patient.patient_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
          <p>No patients registered.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientsTab;