import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Stethoscope, Globe, Languages } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DoctorResultCard = ({ doctor, onBookNowClick }) => {
  const { API_BASE_URL } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'Dr';
    const names = name.replace('Dr.', '').trim().split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0] ? names[0].substring(0, 2) : 'Dr';
  };

  const imageUrl = doctor.profile_picture_url
    ? `${API_BASE_URL.replace('/api', '')}/${doctor.profile_picture_url}`
    : null;
    
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover={{ y: -5 }}>
      <Card className="h-full flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border-t-4 border-primary">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-16 h-16 border-2 border-primary/50">
              <AvatarImage src={imageUrl} alt={`Dr. ${doctor.full_name}`} />
              <AvatarFallback className="text-lg bg-secondary text-secondary-foreground">{getInitials(doctor.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">Dr. {doctor.full_name}</h3>
              <p className="text-sm text-primary font-medium flex items-center">
                <Stethoscope className="w-4 h-4 mr-1.5" />
                {doctor.specialization}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 flex-grow">
            {doctor.bio ? `${doctor.bio.substring(0, 100)}...` : 'A dedicated professional committed to patient health and well-being.'}
          </p>

          <div className="space-y-2 text-sm mb-6">
            {doctor.countries_of_practice && doctor.countries_of_practice.length > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Globe className="w-4 h-4 mr-2 text-primary/80" />
                <span>Practices in: {doctor.countries_of_practice.join(', ')}</span>
              </div>
            )}
            {doctor.languages && doctor.languages.length > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Languages className="w-4 h-4 mr-2 text-primary/80" />
                <span>Speaks: {doctor.languages.join(', ')}</span>
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            <Button onClick={onBookNowClick} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Sign Up to Book
            </Button>
            <p className="text-xs text-center mt-2 text-muted-foreground">
              Access schedule and book appointments after signing up.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DoctorResultCard;
