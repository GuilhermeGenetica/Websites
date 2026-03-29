import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, MapPin, GraduationCap, Stethoscope, Globe, Plus, Trash2, Upload, FileText, X, Building, Link as LinkIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';

const DoctorProfileForm = ({
  ProfileSection,
  profileData,
  countries,
  states,
  cities,
  medicalSpecialties,
  availableLanguages,
  documentInputRef,
  API_BASE_URL,
  handleInputChange,
  handleLocationChange,
  handleDynamicListChange,
  addDynamicListItem,
  removeDynamicListItem,
  handleFileSelectAndUpload,
  handleDeleteDocument
}) => {
  return (
    <div className="space-y-8">
      <ProfileSection icon={User} title="Personal Information" description="Basic data for identification and contact">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="full_name">Full Name *</Label><Input id="full_name" value={profileData.full_name || ''} onChange={(e) => handleInputChange('full_name', e.target.value)} placeholder="Dr. Your full name" /></div>
          <div className="space-y-2"><Label htmlFor="email">E-mail *</Label><Input id="email" type="email" value={profileData.email || ''} disabled /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="whatsapp_number">WhatsApp * (for appointments)</Label><Input id="whatsapp_number" value={profileData.whatsapp_number || ''} onChange={(e) => handleInputChange('whatsapp_number', e.target.value)} placeholder="+351 123 456 789" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="date_of_birth">Date of Birth</Label><Input id="date_of_birth" type="date" value={profileData.date_of_birth || ''} onChange={(e) => handleInputChange('date_of_birth', e.target.value)} /></div>
            <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={profileData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </ProfileSection>

      <ProfileSection icon={Stethoscope} title="Professional Information" description="Data about your training and specialization">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label htmlFor="crm_number">Medical License Number *</Label><Input id="crm_number" value={profileData.crm_number || ''} onChange={(e) => handleInputChange('crm_number', e.target.value)} /></div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialty *</Label>
            <Select value={profileData.specialization || ''} onValueChange={(value) => handleInputChange('specialization', value)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{medicalSpecialties.map(s => <SelectItem key={s.id} value={s.specialty_name}>{s.specialty_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="sub_specialty">Subspecialty</Label><Input id="sub_specialty" value={profileData.sub_specialty || ''} onChange={(e) => handleInputChange('sub_specialty', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
                <Label htmlFor="consultation_fee">Consultation Fee</Label>
                <Input id="consultation_fee" type="number" step="0.01" value={profileData.consultation_fee || ''} onChange={(e) => handleInputChange('consultation_fee', e.target.value)} placeholder="e.g., 150.00" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="fee_currency">Currency</Label>
                <Select value={profileData.fee_currency || 'EUR'} onValueChange={(value) => handleInputChange('fee_currency', value)}>
                    <SelectTrigger id="fee_currency">
                        <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="space-y-2"><Label htmlFor="bio">About You</Label><Textarea id="bio" value={profileData.bio || ''} onChange={(e) => handleInputChange('bio', e.target.value)} /></div>
      </ProfileSection>

      <ProfileSection icon={FileText} title="My Document" description="⚠️ Upload your professional license or other relevant document here (PDF only). For your medical profile to be active for patients to view and search, you need to upload your medical card or active registration with your country's medical association, your medical diploma, and your specialty certificate. Scan these documents into a single file in the order mentioned before and attach them here to your profile. You should contact us via email to inform us that you have uploaded your certificates. We will validate their status within 7 days and respond to your email with the validation status.">
        {!profileData.document_url ? (
            <div>
                <Button type="button" onClick={() => documentInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                </Button>
                <Input 
                    type="file" ref={documentInputRef} className="hidden" accept="application/pdf"
                    onChange={(e) => handleFileSelectAndUpload(e, 'document', 'upload_document')}
                />
            </div>
        ) : (
            <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Document uploaded</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={`${API_BASE_URL.replace('/api', '')}/${profileData.document_url}`} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Document?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Are you sure you want to delete your document?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteDocument}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        )}
      </ProfileSection>

      <ProfileSection icon={Globe} title="Languages" description="List the languages you speak fluently">
        {profileData.languages.map((languageId, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select value={languageId} onValueChange={(value) => handleDynamicListChange('languages', index, value)}>
              <SelectTrigger><SelectValue placeholder="Select a language" /></SelectTrigger>
              <SelectContent>{availableLanguages.map(lang => <SelectItem key={lang.id} value={String(lang.id)}>{lang.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="destructive" size="icon" onClick={() => removeDynamicListItem('languages', index)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addDynamicListItem('languages')}><Plus className="h-4 w-4 mr-2" />Add Language</Button>
      </ProfileSection>

      <ProfileSection icon={Globe} title="Countries of Practice" description="List the countries where you are licensed to practice">
        {profileData.countriesOfPractice.map((countryId, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select value={countryId} onValueChange={(value) => handleDynamicListChange('countriesOfPractice', index, value)}>
              <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.country_id} value={String(c.country_id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="destructive" size="icon" onClick={() => removeDynamicListItem('countriesOfPractice', index)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addDynamicListItem('countriesOfPractice')}><Plus className="h-4 w-4 mr-2" />Add Country</Button>
      </ProfileSection>

      <ProfileSection icon={MapPin} title="Main Office Address">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="address_street">Street</Label><Input id="address_street" value={profileData.address_street || ''} onChange={(e) => handleInputChange('address_street', e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="address_number">Number</Label><Input id="address_number" value={profileData.address_number || ''} onChange={(e) => handleInputChange('address_number', e.target.value)} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="address_complement">Complement</Label><Input id="address_complement" value={profileData.address_complement || ''} onChange={(e) => handleInputChange('address_complement', e.target.value)} placeholder="Apt, suite, etc." /></div>
            <div className="space-y-2"><Label htmlFor="address_district">District / Neighborhood</Label><Input id="address_district" value={profileData.address_district || ''} onChange={(e) => handleInputChange('address_district', e.target.value)} /></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2"><Label htmlFor="country_id">Country</Label><Select value={String(profileData.country_id || '')} onValueChange={(value) => handleLocationChange('country_id', value)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{countries.map(c => <SelectItem key={c.country_id} value={String(c.country_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="state_id">State / District</Label><Select value={String(profileData.state_id || '')} onValueChange={(value) => handleLocationChange('state_id', value)} disabled={!states.length}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{states.map(s => <SelectItem key={s.state_id} value={String(s.state_id)}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="city_id">City</Label><Select value={String(profileData.city_id || '')} onValueChange={(value) => handleLocationChange('city_id', value)} disabled={!cities.length}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{cities.map(c => <SelectItem key={c.city_id} value={String(c.city_id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="address_zip_code">ZIP / Postal Code</Label><Input id="address_zip_code" value={profileData.address_zip_code || ''} onChange={(e) => handleInputChange('address_zip_code', e.target.value)} /></div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="full_address">
                Full Office or Job Address (auto-generated or manual override). 
                <br />
                ⚠️ Please ensure this field below is completely filled out and includes all important details for your office's location. This is how patients will locate you for in-person appointments.
            </Label>
            <Textarea id="full_address" value={profileData.full_address || ''} onChange={(e) => handleInputChange('full_address', e.target.value)} placeholder="A full, formatted address for display." />
        </div>
      </ProfileSection>

      <ProfileSection icon={Building} title="Additional Clinic Information">
          <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="clinic_address">Secondary Clinic Address</Label><Input id="clinic_address" value={profileData.clinic_address || ''} onChange={(e) => handleInputChange('clinic_address', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="clinic_phone">Secondary Clinic Phone</Label><Input id="clinic_phone" value={profileData.clinic_phone || ''} onChange={(e) => handleInputChange('clinic_phone', e.target.value)} /></div>
          </div>
      </ProfileSection>

      <ProfileSection icon={GraduationCap} title="Academic & Professional Background">
          <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="education">Education / Degree</Label><Input id="education" value={profileData.education || ''} onChange={(e) => handleInputChange('education', e.target.value)} placeholder="e.g., MD, PhD" /></div>
              <div className="space-y-2"><Label htmlFor="university">University</Label><Input id="university" value={profileData.university || ''} onChange={(e) => handleInputChange('university', e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="graduation_year">Graduation Year</Label><Input id="graduation_year" type="number" value={profileData.graduation_year || ''} onChange={(e) => handleInputChange('graduation_year', e.target.value)} placeholder="YYYY" /></div>
          <div className="space-y-2"><Label htmlFor="certifications">All Certifications</Label><Textarea id="certifications" value={profileData.certifications || ''} onChange={(e) => handleInputChange('certifications', e.target.value)} placeholder="List any relevant certifications, one per line." /></div>
          <div className="space-y-2"><Label htmlFor="awards">Awards and Publications</Label><Textarea id="awards" value={profileData.awards || ''} onChange={(e) => handleInputChange('awards', e.target.value)} placeholder="List any awards or recognitions, one per line." /></div>
      </ProfileSection>

      <ProfileSection icon={LinkIcon} title="Online Presence">
          <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="website">Website</Label><Input id="website" value={profileData.website || ''} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://your-website.com" /></div>
              <div className="space-y-2"><Label htmlFor="linkedin">LinkedIn Profile URL</Label><Input id="linkedin" value={profileData.linkedin || ''} onChange={(e) => handleInputChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/your-profile" /></div>
          </div>
      </ProfileSection>
    </div>
  );
};

export default DoctorProfileForm;