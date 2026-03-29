import React, { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, User, Phone, MapPin, GraduationCap, Stethoscope, Globe, Plus, Trash2, Upload, FileText, X, Briefcase, Award, Link as LinkIcon, Building, DollarSign, Banknote, BadgeCheck, BadgeAlert, Loader2, ExternalLink } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AppHeader from '@/components/shared/AppHeader';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DoctorProfileForm from './DoctorProfileForm';
import DoctorFinancialsForm from './DoctorFinancialsForm';
import { useDoctorProfile } from './useDoctorProfile';

const ProfileSection = ({ icon: Icon, title, description, children }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5 text-primary" />
        <CardTitle>{title}</CardTitle>
      </div>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
);

const DoctorProfile = () => {
  const hookData = useDoctorProfile();
  const { profileData, isLoading, avatarInputRef, API_BASE_URL, getInitials, handleFileSelectAndUpload, handleSave, handleDeleteProfile } = hookData;

  // --- CORREÇÃO (FIX) ---
  // O Hook useMemo (para calcular imageUrl) TEM de ser chamado antes de qualquer
  // 'return' condicional (como o 'if (isLoading)').
  // Movi este bloco para cima, para obedecer às Regras dos Hooks do React.
  const imageUrl = useMemo(() => {
    // Adicionada uma verificação de segurança para o caso de profileData ainda não estar carregado
    if (!profileData || !profileData.profile_picture_url) {
      return undefined;
    }
    if (profileData.profile_picture_url.startsWith('http')) {
      return profileData.profile_picture_url;
    }
    // Assegura que API_BASE_URL existe antes de tentar o replace
    const baseUrl = API_BASE_URL || '';
    return `${baseUrl.replace('/api', '')}/${profileData.profile_picture_url}?v=${profileData.updated_at || ''}`;
  }, [profileData, API_BASE_URL]); // A dependência de 'profileData' é mais segura
  // --- FIM DA CORREÇÃO ---

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading profile...</div>;
  }

  // O 'useMemo' estava aqui em baixo, o que causava o erro #310.
  // Foi movido para cima (antes do 'if (isLoading)').

  return (
    <>
      {/* O Helmet foi removido porque não estava a ser importado 
        e não estava presente no ficheiro original que enviou.
        Se precisar dele, adicione "import { Helmet } from 'react-helmet';" 
        no topo do ficheiro.
      */}
      {/* <Helmet>
        <title>{profileData.full_name ? `Profile of ${profileData.full_name}` : 'My Profile'} - MedBooking</title>
      </Helmet> 
      */}
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader showBackButton={true} showThemeToggle={true} />
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto space-y-8">
            
            <div className="text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={imageUrl} alt={profileData.full_name} />
                  <AvatarFallback className="text-2xl">{getInitials(profileData.full_name)}</AvatarFallback>
                </Avatar>
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <Input 
                    type="file" 
                    ref={avatarInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/gif"
                    onChange={(e) => handleFileSelectAndUpload(e, 'profile_picture', 'upload_profile_picture')}
                />
              </div>
              
              <h1 className="text-3xl font-bold">
                <span className="gradient-text">
                  {profileData.full_name || 'My Professional Profile'}
                </span>
              </h1>
              <p className="text-muted-foreground">Keep your information full updated to attract more patients</p>

            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Doctor Profile</TabsTrigger>
                  <TabsTrigger value="financials">Financial Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-6">
                  <DoctorProfileForm {...hookData} ProfileSection={ProfileSection} />
                </TabsContent>
                <TabsContent value="financials" className="mt-6">
                  <DoctorFinancialsForm {...hookData} ProfileSection={ProfileSection} />
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button type="button" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"><Save className="w-4 h-4 mr-2" />Save Profile</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm Changes</AlertDialogTitle><AlertDialogDescription>Are you sure you want to save the changes to your profile?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleSave}>Save</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="mt-12 pt-8 border-t border-destructive/30">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" />Delete this Profile</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove your data from our servers.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Yes, delete my profile</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>

            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DoctorProfile;