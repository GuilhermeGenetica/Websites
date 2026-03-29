import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Star, Phone } from 'lucide-react';

const DoctorInfoCard = ({ doctor }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Doctor Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src="" alt={doctor.name} />
            <AvatarFallback className="text-xl">{doctor.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{doctor.name}</h2>
              <p className="text-blue-600 font-medium text-lg">{doctor.specialty}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{doctor.city}, {doctor.country}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>{doctor.rating || 'N/A'}</span>
              </div>
            </div>
            <p className="text-gray-600">{doctor.about}</p>
            <div className="flex flex-wrap gap-2">
              {doctor.languages?.map(lang => (
                <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {lang}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              <p>Education: {doctor.education}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Phone className="w-4 h-4" />
                <span>WhatsApp for consultation: {doctor.whatsapp}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">€{doctor.consultationFee}</p>
            <p className="text-sm text-gray-500">per consultation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorInfoCard;
