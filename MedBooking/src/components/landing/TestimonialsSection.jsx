import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from 'lucide-react';

const patientTestimonials = [
  {
    quote: "Finding a specialist who spoke my language while I was abroad was a lifesaver. The process was so simple and fast. Highly recommended!",
    name: "Elena Rodriguez",
    role: "Patient from Spain",
    avatar: "https://placehold.co/100x100/E5A00D/1A202C?text=ER"
  },
  {
    quote: "I needed a second opinion from a cardiologist in Germany. MedBooking made it possible without leaving my home in Canada. Incredible platform.",
    name: "John Smith",
    role: "Patient from Canada",
    avatar: "https://placehold.co/100x100/005A5B/F9F9F7?text=JS"
  },
];

const doctorTestimonials = [
  {
    quote: "This platform has optimized my schedule and connected me with patients from three different continents. It's the future of private practice.",
    name: "Dr. Anika Sharma",
    role: "Dermatologist in India",
    avatar: "https://placehold.co/100x100/007A7B/F9F9F7?text=AS"
  },
  {
    quote: "As a psychiatrist, offering consultations to expatriates has been very rewarding. The platform is secure, professional, and very easy to use.",
    name: "Dr. Ben Carter",
    role: "Psychiatrist in the UK",
    avatar: "https://placehold.co/100x100/2D3748/E2E8F0?text=BC"
  },
];

const TestimonialCard = ({ quote, name, role, avatar }) => (
  <Card className="bg-card/80 border-l-4 border-accent h-full">
    <CardContent className="p-6 flex flex-col h-full">
      <div className="flex mb-2">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-accent fill-current" />)}
      </div>
      <p className="text-muted-foreground italic mb-4 flex-grow">"{quote}"</p>
      <div className="flex items-center mt-auto">
        <Avatar className="h-12 w-12 mr-4">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Section to display testimonials from patients and doctors.
 */
const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-background section-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Stories of Health and Connection
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users are saying about their experience on our global platform.
          </p>
        </motion.div>

        <Tabs defaultValue="patients" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-10">
            <TabsTrigger value="patients">What Patients Say</TabsTrigger>
            <TabsTrigger value="doctors">What Doctors Say</TabsTrigger>
          </TabsList>
          <TabsContent value="patients">
            <div className="grid md:grid-cols-2 gap-8">
              {patientTestimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="doctors">
            <div className="grid md:grid-cols-2 gap-8">
              {doctorTestimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default TestimonialsSection;