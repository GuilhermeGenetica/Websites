// src/pages/DoctorCard.jsx
import React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Stethoscope, Mail, Globe, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const DoctorCard = ({ doctor, onBook }) => {
  const { API_BASE_URL } = useAuth();
  const { toast } = useToast();

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleContactClick = () => {
    if (doctor.email) {
      window.location.href = `mailto:${doctor.email}`;
    } else {
      toast({
        title: "Contact Not Available",
        description: "This doctor has not made their contact information available.",
        variant: "info",
      });
    }
  };

  const imageUrl = doctor.profile_picture_url
    ? `${API_BASE_URL.replace('/api', '')}/${doctor.profile_picture_url}?v=${doctor.updated_at || ''}`
    : null;

  return (
    <Card className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 shadow-sm hover:shadow-md transition-shadow">
      <Avatar className="w-16 h-16">
        <AvatarImage src={imageUrl} alt={doctor.full_name} />
        <AvatarFallback>{getInitials(doctor.full_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-center sm:text-left">
        <Link to={`/doctor-profile/${doctor.doctor_id}`} className="hover:underline">
          <CardTitle className="text-lg font-bold text-primary">{doctor.full_name}</CardTitle>
        </Link>
        <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start">
          <Stethoscope className="w-4 h-4 mr-1" /> {doctor.specialization}
          {doctor.sub_specialization && ` - ${doctor.sub_specialization}`}
        </p>
        
        {/* --- MODIFICATION START --- */}
        {/* Verifica o novo campo 'next_available_date' que vem do backend */}
        {doctor.next_available_date ? (
          <div 
            className="flex items-center justify-center sm:justify-start text-sm text-green-600 mt-1"
            // O atributo 'title' cria o tooltip nativo no hover
            title={`Next available date: ${doctor.next_available_date}`}
          >
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5 flex-shrink-0 animate-pulse"></span>
            Available for scheduling
          </div>
        ) : (
          <div 
            className="flex items-center justify-center sm:justify-start text-sm text-red-600 mt-1"
            title="This doctor currently has no dates for scheduling."
          >
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-1.5 flex-shrink-0"></span>
            Unavailable
          </div>
        )}
        {/* --- MODIFICATION END --- */}

        {/*
        {doctor.state_name && doctor.country_name && (
          <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start">
            <MapPin className="w-4 h-4 mr-1" /> {doctor.city_name}, {doctor.state_name}, {doctor.country_name}
          </p>
        )} 
         
        */}

        {doctor.countries_of_practice && doctor.countries_of_practice.length > 0 && (
          <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start mt-1"> {/* Adicionado mt-1 para espaçamento */}
            <Globe className="w-4 h-4 mr-1" /> {doctor.countries_of_practice.join(', ')}
          </p>
        )}

        {doctor.languages && doctor.languages.length > 0 && (
          <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start">
            <Languages className="w-4 h-4 mr-1" /> {doctor.languages.join(', ')}
          </p>
        )}
      </div>
      <div className="flex flex-col space-y-2 w-full sm:w-auto">
        <Button onClick={() => onBook(doctor.doctor_id)} className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 w-full">Schedule</Button>
        <Button variant="outline" onClick={handleContactClick} className="flex items-center justify-center w-full">
          <Mail className="w-4 h-4 mr-1" /> Contact
        </Button>
      </div>
    </Card>
  );
};

export default DoctorCard;