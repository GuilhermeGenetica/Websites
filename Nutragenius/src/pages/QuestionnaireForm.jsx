import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const QuestionnaireForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: '', genderOther: '', height: '', weight: '', ethnicity: '', ethnicityOther: '',
    activityLevel: '', sleepHours: '', stressLevel: '', diet: '', dietOther: '', smokingStatus: '', alcoholConsumption: '',
    healthGoals: [], healthConcerns: [], medicalConditions: '', currentMedications: '', currentSupplements: '', allergies: '',
    hemoglobin: '', hematocrit: '', rbc: '', mcv: '', mch: '', mchc: '', rdw: '', wbc: '', neutrophils: '', lymphocytes: '', monocytes: '', eosinophils: '', basophils: '', platelets: '',
    vitaminD: '', vitaminB12: '', folate: '', vitaminB6: '', ferritin: '', serumIron: '', tibc: '', transferrinSat: '', serumMagnesium: '', rBCMagnesium: '', serumZinc: '', copper: '', selenium: '', totalCalcium: '', totalProtein: '', albumin: '', homocysteine: '', hsCRP: '', fibrinogen: '',
    totalCholesterol: '', ldl: '', hdl: '', triglycerides: '', apoB: '', lipoproteinA: '',
    fastingGlucose: '', hba1c: '', fastingInsulin: '', homaIR: '', uricAcid: '',
    alt: '', ast: '', ggt: '', alkalinePhosphatase: '', creatinine: '', eGFR: '', bun: '', sodium: '', potassium: '',
    tsh: '', freeT4: '', freeT3: '', tpoAb: '', thyroglobulinAb: '', cortisolAM: '', dheas: '', totalTestosterone: '', shbg: '', estradiol: '', progesterone: '',
    geneticVariants: '', geneticReport: ''
  });

  const fetchQuestionnaireData = useCallback(async () => {
    if (user) {
        setLoading(true);
        try {
            const response = await axios.get('/api/questionnaire.php');
            if (response.data) {
                // Ensure array fields are arrays even if null in DB
                const fetchedData = response.data;
                fetchedData.healthGoals = Array.isArray(fetchedData.healthGoals) ? fetchedData.healthGoals : [];
                fetchedData.healthConcerns = Array.isArray(fetchedData.healthConcerns) ? fetchedData.healthConcerns : [];
                setFormData(prev => ({ ...prev, ...fetchedData }));
            } else {
                setFormData(prev => ({...prev, fullName: user.full_name || ''}));
            }
        } catch (error) {
            toast({
                title: 'Error Loading Data',
                description: 'Could not fetch your saved assessment data.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }
  }, [user, toast]);

  useEffect(() => {
    fetchQuestionnaireData();
  }, [fetchQuestionnaireData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to save data.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      await axios.post('/api/questionnaire.php', formData);
      toast({
        title: "Success!",
        description: "Your assessment has been saved successfully to your profile.",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error Saving Data",
        description: error.response?.data?.error || "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Loading your assessment...</p>
        </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Health Assessment Questionnaire - NutraGenius</title>
        <meta name="description" content="Complete your comprehensive health assessment including demographics, lifestyle, laboratory results, and genetic information" />
      </Helmet>

      <ThemeToggle />

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-2xl p-8 border-2 gold-border"
          >
            <h1 className="text-4xl font-bold mb-2 text-center">Health Profile Assessment</h1>
            <p className="text-muted-foreground text-center mb-8">Complete all sections for comprehensive analysis</p>

            <form onSubmit={handleSubmit} className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold mb-6 gold-accent border-b-2 gold-border pb-2">
                  STEP 1 OF 3: Personal Profile
                </h2>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Demographics & Lifestyle</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Gender *</Label>
                    <div className="space-y-2 mt-2">
                      {['Male', 'Female', 'Other', 'Prefer not to say'].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`gender-${option}`}
                            name="gender"
                            value={option}
                            checked={formData.gender === option}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`gender-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                      {formData.gender === 'Other' && (
                        <Input
                          placeholder="Please specify"
                          value={formData.genderOther}
                          onChange={(e) => handleInputChange('genderOther', e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="height">Height (cm) *</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="weight">Weight (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Ethnicity</Label>
                    <div className="space-y-2 mt-2">
                      {['White', 'Black/African Descent', 'Asian', 'Hispanic/Latino', 'Native American/Indigenous', 'Pacific Islander', 'Multiple Ethnicities', 'Other', 'Prefer not to say'].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`ethnicity-${option}`}
                            name="ethnicity"
                            value={option}
                            checked={formData.ethnicity === option}
                            onChange={(e) => handleInputChange('ethnicity', e.target.value)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`ethnicity-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                      {formData.ethnicity === 'Other' && (
                        <Input
                          placeholder="Please specify"
                          value={formData.ethnicityOther}
                          onChange={(e) => handleInputChange('ethnicityOther', e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Activity Level *</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        'Sedentary (Little or no exercise)',
                        'Lightly Active (Light exercise 1-3 days/week)',
                        'Moderately Active (Moderate exercise 3-5 days/week)',
                        'Very Active (Intense exercise 6-7 days/week)',
                        'Extremely Active (Daily intense workouts or physical job)'
                      ].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`activity-${option}`}
                            name="activityLevel"
                            value={option}
                            checked={formData.activityLevel === option}
                            onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`activity-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="sleepHours">Average Sleep per Night (hours)</Label>
                      <Input
                        id="sleepHours"
                        type="number"
                        step="0.5"
                        value={formData.sleepHours}
                        onChange={(e) => handleInputChange('sleepHours', e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stressLevel">Average Stress Level (1-10)</Label>
                      <Input
                        id="stressLevel"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.stressLevel}
                        onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Primary Diet</Label>
                    <div className="space-y-2 mt-2">
                      {['Mediterranean', 'Keto', 'Paleo', 'Vegetarian', 'Vegan', 'Standard Western Diet', 'Other'].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`diet-${option}`}
                            name="diet"
                            value={option}
                            checked={formData.diet === option}
                            onChange={(e) => handleInputChange('diet', e.target.value)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`diet-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                      {formData.diet === 'Other' && (
                        <Input
                          placeholder="Please describe"
                          value={formData.dietOther}
                          onChange={(e) => handleInputChange('dietOther', e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Smoking Status</Label>
                    <div className="space-y-2 mt-2">
                      {['Never smoked', 'Former smoker (quit >6 months ago)', 'Occasional smoker (<1 cigarette/day)', 'Daily smoker'].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`smoking-${option}`}
                            name="smokingStatus"
                            value={option}
                            checked={formData.smokingStatus === option}
                            onChange={(e) => handleInputChange('smokingStatus', e.target.value)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`smoking-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Alcohol Consumption</Label>
                    <div className="space-y-2 mt-2">
                      {['Never', 'Rare (<1 drink/week)', 'Social (1-3 drinks/week)', 'Regular (4-7 drinks/week)', 'High (>7 drinks/week)'].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`alcohol-${option}`}
                            name="alcoholConsumption"
                            value={option}
                            checked={formData.alcoholConsumption === option}
                            onChange={(e) => handleInputChange('alcoholConsumption', e.target.value)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`alcohol-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mt-8">
                  <h3 className="text-xl font-semibold">Health Goals & Concerns</h3>

                  <div>
                    <Label>Primary Health Goals (Select all that apply)</Label>
                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                      {[
                        'Weight Loss', 'Muscle Gain', 'Weight Maintenance', 'Energy Optimization',
                        'Immune Support', 'Cardiovascular Health', 'Brain Health (Cognition)',
                        'Bone Health', 'Digestive Health', 'Sleep Improvement', 'Stress Management',
                        'Athletic Performance', 'Longevity & Anti-aging', 'Skin Health',
                        'Fertility & Pregnancy Support', 'Women\'s Health (General)', 'Other'
                      ].map(goal => (
                        <div key={goal} className="flex items-center space-x-2">
                          <Checkbox
                            id={`goal-${goal}`}
                            checked={formData.healthGoals.includes(goal)}
                            onCheckedChange={() => handleCheckboxChange('healthGoals', goal)}
                          />
                          <Label htmlFor={`goal-${goal}`} className="font-normal cursor-pointer">
                            {goal}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Specific Health Concerns (Select all that apply)</Label>
                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                      {[
                        'High Cholesterol', 'High Blood Pressure', 'Diabetes/Pre-diabetes',
                        'Inflammation', 'Digestive Issues (IBS, bloating)', 'Anxiety/Depression',
                        'Insomnia', 'Joint Pain', 'Chronic Fatigue', 'Brain Fog/Memory Issues',
                        'Autoimmune Conditions', 'Hormonal Imbalance', 'Cancer History/Support',
                        'Rare Genetic Condition', 'Other'
                      ].map(concern => (
                        <div key={concern} className="flex items-center space-x-2">
                          <Checkbox
                            id={`concern-${concern}`}
                            checked={formData.healthConcerns.includes(concern)}
                            onCheckedChange={() => handleCheckboxChange('healthConcerns', concern)}
                          />
                          <Label htmlFor={`concern-${concern}`} className="font-normal cursor-pointer">
                            {concern}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="medicalConditions">Diagnosed Medical Conditions</Label>
                    <Textarea
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                      placeholder="List any diagnosed conditions (e.g., Hypothyroidism, Hypertension, Diabetes...)"
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentMedications">Current Medications</Label>
                    <Textarea
                      id="currentMedications"
                      value={formData.currentMedications}
                      onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                      placeholder="List all prescribed and over-the-counter medications with dosages"
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentSupplements">Current Supplements</Label>
                    <Textarea
                      id="currentSupplements"
                      value={formData.currentSupplements}
                      onChange={(e) => handleInputChange('currentSupplements', e.target.value)}
                      placeholder="List all supplements and dosages"
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Allergies & Intolerances</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      placeholder="List any known allergies to medications, foods, or supplements"
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 gold-accent border-b-2 gold-border pb-2">
                  STEP 2 OF 3: Laboratory Results
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Complete Blood Count (CBC)</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="hemoglobin">Hemoglobin (g/dL)</Label>
                        <Input
                          id="hemoglobin"
                          type="number"
                          step="0.1"
                          value={formData.hemoglobin}
                          onChange={(e) => handleInputChange('hemoglobin', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 13.5-17.5 | F 12.0-15.5</p>
                      </div>
                      <div>
                        <Label htmlFor="hematocrit">Hematocrit (%)</Label>
                        <Input
                          id="hematocrit"
                          type="number"
                          step="0.1"
                          value={formData.hematocrit}
                          onChange={(e) => handleInputChange('hematocrit', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 41-53 | F 36-46</p>
                      </div>
                      <div>
                        <Label htmlFor="rbc">RBC (x10⁶/µL)</Label>
                        <Input
                          id="rbc"
                          type="number"
                          step="0.1"
                          value={formData.rbc}
                          onChange={(e) => handleInputChange('rbc', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 4.5-5.9 | F 4.1-5.1</p>
                      </div>
                      <div>
                        <Label htmlFor="mcv">MCV (fL)</Label>
                        <Input
                          id="mcv"
                          type="number"
                          step="0.1"
                          value={formData.mcv}
                          onChange={(e) => handleInputChange('mcv', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 80-100</p>
                      </div>
                      <div>
                        <Label htmlFor="mch">MCH (pg)</Label>
                        <Input
                          id="mch"
                          type="number"
                          step="0.1"
                          value={formData.mch}
                          onChange={(e) => handleInputChange('mch', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 27-33</p>
                      </div>
                      <div>
                        <Label htmlFor="mchc">MCHC (g/dL)</Label>
                        <Input
                          id="mchc"
                          type="number"
                          step="0.1"
                          value={formData.mchc}
                          onChange={(e) => handleInputChange('mchc', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 32-36</p>
                      </div>
                      <div>
                        <Label htmlFor="rdw">RDW (%)</Label>
                        <Input
                          id="rdw"
                          type="number"
                          step="0.1"
                          value={formData.rdw}
                          onChange={(e) => handleInputChange('rdw', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 11.5-14.5</p>
                      </div>
                      <div>
                        <Label htmlFor="wbc">WBC (x10³/µL)</Label>
                        <Input
                          id="wbc"
                          type="number"
                          step="0.1"
                          value={formData.wbc}
                          onChange={(e) => handleInputChange('wbc', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 4.0-11.0</p>
                      </div>
                      <div>
                        <Label htmlFor="neutrophils">Neutrophils (%)</Label>
                        <Input
                          id="neutrophils"
                          type="number"
                          step="0.1"
                          value={formData.neutrophils}
                          onChange={(e) => handleInputChange('neutrophils', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 40-70</p>
                      </div>
                      <div>
                        <Label htmlFor="lymphocytes">Lymphocytes (%)</Label>
                        <Input
                          id="lymphocytes"
                          type="number"
                          step="0.1"
                          value={formData.lymphocytes}
                          onChange={(e) => handleInputChange('lymphocytes', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 20-50</p>
                      </div>
                      <div>
                        <Label htmlFor="monocytes">Monocytes (%)</Label>
                        <Input
                          id="monocytes"
                          type="number"
                          step="0.1"
                          value={formData.monocytes}
                          onChange={(e) => handleInputChange('monocytes', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 2-8</p>
                      </div>
                      <div>
                        <Label htmlFor="eosinophils">Eosinophils (%)</Label>
                        <Input
                          id="eosinophils"
                          type="number"
                          step="0.1"
                          value={formData.eosinophils}
                          onChange={(e) => handleInputChange('eosinophils', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 1-4</p>
                      </div>
                      <div>
                        <Label htmlFor="basophils">Basophils (%)</Label>
                        <Input
                          id="basophils"
                          type="number"
                          step="0.1"
                          value={formData.basophils}
                          onChange={(e) => handleInputChange('basophils', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 0.5-1</p>
                      </div>
                      <div>
                        <Label htmlFor="platelets">Platelets (x10³/µL)</Label>
                        <Input
                          id="platelets"
                          type="number"
                          step="1"
                          value={formData.platelets}
                          onChange={(e) => handleInputChange('platelets', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 150-450</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">General Health & Micronutrients</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vitaminD">Vitamin D (ng/mL)</Label>
                        <Input
                          id="vitaminD"
                          type="number"
                          step="0.1"
                          value={formData.vitaminD}
                          onChange={(e) => handleInputChange('vitaminD', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 30-50</p>
                      </div>
                      <div>
                        <Label htmlFor="vitaminB12">Vitamin B12 (pg/mL)</Label>
                        <Input
                          id="vitaminB12"
                          type="number"
                          step="1"
                          value={formData.vitaminB12}
                          onChange={(e) => handleInputChange('vitaminB12', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 200-900</p>
                      </div>
                      <div>
                        <Label htmlFor="folate">Folate (ng/mL)</Label>
                        <Input
                          id="folate"
                          type="number"
                          step="0.1"
                          value={formData.folate}
                          onChange={(e) => handleInputChange('folate', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 3-17</p>
                      </div>
                      <div>
                        <Label htmlFor="vitaminB6">Vitamin B6 (ng/mL)</Label>
                        <Input
                          id="vitaminB6"
                          type="number"
                          step="0.1"
                          value={formData.vitaminB6}
                          onChange={(e) => handleInputChange('vitaminB6', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 5.0-50.0</p>
                      </div>
                      <div>
                        <Label htmlFor="ferritin">Ferritin (ng/mL)</Label>
                        <Input
                          id="ferritin"
                          type="number"
                          step="1"
                          value={formData.ferritin}
                          onChange={(e) => handleInputChange('ferritin', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 30-400 | F 15-150</p>
                      </div>
                      <div>
                        <Label htmlFor="serumIron">Serum Iron (µg/dL)</Label>
                        <Input
                          id="serumIron"
                          type="number"
                          step="1"
                          value={formData.serumIron}
                          onChange={(e) => handleInputChange('serumIron', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 65-175 | F 50-170</p>
                      </div>
                      <div>
                        <Label htmlFor="tibc">TIBC (µg/dL)</Label>
                        <Input
                          id="tibc"
                          type="number"
                          step="1"
                          value={formData.tibc}
                          onChange={(e) => handleInputChange('tibc', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 250-450</p>
                      </div>
                      <div>
                        <Label htmlFor="transferrinSat">Transferrin Sat (%)</Label>
                        <Input
                          id="transferrinSat"
                          type="number"
                          step="1"
                          value={formData.transferrinSat}
                          onChange={(e) => handleInputChange('transferrinSat', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 20-50</p>
                      </div>
                      <div>
                        <Label htmlFor="serumMagnesium">Serum Magnesium (mg/dL)</Label>
                        <Input
                          id="serumMagnesium"
                          type="number"
                          step="0.1"
                          value={formData.serumMagnesium}
                          onChange={(e) => handleInputChange('serumMagnesium', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 1.7-2.2</p>
                      </div>
                      <div>
                        <Label htmlFor="rBCMagnesium">RBC Magnesium (mg/dL)</Label>
                        <Input
                          id="rBCMagnesium"
                          type="number"
                          step="0.1"
                          value={formData.rBCMagnesium}
                          onChange={(e) => handleInputChange('rBCMagnesium', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 4.2-6.8</p>
                      </div>
                      <div>
                        <Label htmlFor="serumZinc">Serum Zinc (µg/dL)</Label>
                        <Input
                          id="serumZinc"
                          type="number"
                          step="1"
                          value={formData.serumZinc}
                          onChange={(e) => handleInputChange('serumZinc', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 70-120</p>
                      </div>
                      <div>
                        <Label htmlFor="copper">Copper (µg/dL)</Label>
                        <Input
                          id="copper"
                          type="number"
                          step="1"
                          value={formData.copper}
                          onChange={(e) => handleInputChange('copper', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 70-140</p>
                      </div>
                      <div>
                        <Label htmlFor="selenium">Selenium (ng/mL)</Label>
                        <Input
                          id="selenium"
                          type="number"
                          step="1"
                          value={formData.selenium}
                          onChange={(e) => handleInputChange('selenium', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 70-150</p>
                      </div>
                      <div>
                        <Label htmlFor="totalCalcium">Total Calcium (mg/dL)</Label>
                        <Input
                          id="totalCalcium"
                          type="number"
                          step="0.1"
                          value={formData.totalCalcium}
                          onChange={(e) => handleInputChange('totalCalcium', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 8.5-10.5</p>
                      </div>
                      <div>
                        <Label htmlFor="totalProtein">Total Protein (g/dL)</Label>
                        <Input
                          id="totalProtein"
                          type="number"
                          step="0.1"
                          value={formData.totalProtein}
                          onChange={(e) => handleInputChange('totalProtein', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 6.0-8.3</p>
                      </div>
                      <div>
                        <Label htmlFor="albumin">Albumin (g/dL)</Label>
                        <Input
                          id="albumin"
                          type="number"
                          step="0.1"
                          value={formData.albumin}
                          onChange={(e) => handleInputChange('albumin', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 3.5-5.5</p>
                      </div>
                      <div>
                        <Label htmlFor="homocysteine">Homocysteine (µmol/L)</Label>
                        <Input
                          id="homocysteine"
                          type="number"
                          step="0.1"
                          value={formData.homocysteine}
                          onChange={(e) => handleInputChange('homocysteine', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 5-15</p>
                      </div>
                      <div>
                        <Label htmlFor="hsCRP">hs-CRP (mg/L)</Label>
                        <Input
                          id="hsCRP"
                          type="number"
                          step="0.1"
                          value={formData.hsCRP}
                          onChange={(e) => handleInputChange('hsCRP', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;3</p>
                      </div>
                      <div>
                        <Label htmlFor="fibrinogen">Fibrinogen (mg/dL)</Label>
                        <Input
                          id="fibrinogen"
                          type="number"
                          step="1"
                          value={formData.fibrinogen}
                          onChange={(e) => handleInputChange('fibrinogen', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 200-400</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Lipid Panel</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="totalCholesterol">Total Cholesterol (mg/dL)</Label>
                        <Input
                          id="totalCholesterol"
                          type="number"
                          step="1"
                          value={formData.totalCholesterol}
                          onChange={(e) => handleInputChange('totalCholesterol', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;200</p>
                      </div>
                      <div>
                        <Label htmlFor="ldl">LDL (mg/dL)</Label>
                        <Input
                          id="ldl"
                          type="number"
                          step="1"
                          value={formData.ldl}
                          onChange={(e) => handleInputChange('ldl', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;100</p>
                      </div>
                      <div>
                        <Label htmlFor="hdl">HDL (mg/dL)</Label>
                        <Input
                          id="hdl"
                          type="number"
                          step="1"
                          value={formData.hdl}
                          onChange={(e) => handleInputChange('hdl', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M &gt;40 | F &gt;50</p>
                      </div>
                      <div>
                        <Label htmlFor="triglycerides">Triglycerides (mg/dL)</Label>
                        <Input
                          id="triglycerides"
                          type="number"
                          step="1"
                          value={formData.triglycerides}
                          onChange={(e) => handleInputChange('triglycerides', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;150</p>
                      </div>
                      <div>
                        <Label htmlFor="apoB">ApoB (mg/dL)</Label>
                        <Input
                          id="apoB"
                          type="number"
                          step="1"
                          value={formData.apoB}
                          onChange={(e) => handleInputChange('apoB', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 60-130</p>
                      </div>
                      <div>
                        <Label htmlFor="lipoproteinA">Lipoprotein(a) (mg/dL)</Label>
                        <Input
                          id="lipoproteinA"
                          type="number"
                          step="1"
                          value={formData.lipoproteinA}
                          onChange={(e) => handleInputChange('lipoproteinA', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;30</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Metabolic Health</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="fastingGlucose">Fasting Glucose (mg/dL)</Label>
                        <Input
                          id="fastingGlucose"
                          type="number"
                          step="1"
                          value={formData.fastingGlucose}
                          onChange={(e) => handleInputChange('fastingGlucose', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 70-99</p>
                      </div>
                      <div>
                        <Label htmlFor="hba1c">HbA1c (%)</Label>
                        <Input
                          id="hba1c"
                          type="number"
                          step="0.1"
                          value={formData.hba1c}
                          onChange={(e) => handleInputChange('hba1c', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 4-5.6</p>
                      </div>
                      <div>
                        <Label htmlFor="fastingInsulin">Fasting Insulin (µIU/mL)</Label>
                        <Input
                          id="fastingInsulin"
                          type="number"
                          step="0.1"
                          value={formData.fastingInsulin}
                          onChange={(e) => handleInputChange('fastingInsulin', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 2-20</p>
                      </div>
                      <div>
                        <Label htmlFor="homaIR">HOMA-IR</Label>
                        <Input
                          id="homaIR"
                          type="number"
                          step="0.1"
                          value={formData.homaIR}
                          onChange={(e) => handleInputChange('homaIR', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;2.5</p>
                      </div>
                      <div>
                        <Label htmlFor="uricAcid">Uric Acid (mg/dL)</Label>
                        <Input
                          id="uricAcid"
                          type="number"
                          step="0.1"
                          value={formData.uricAcid}
                          onChange={(e) => handleInputChange('uricAcid', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 3.5-7.2 | F 2.6-6.0</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Liver & Kidney Function</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="alt">ALT (U/L)</Label>
                        <Input
                          id="alt"
                          type="number"
                          step="1"
                          value={formData.alt}
                          onChange={(e) => handleInputChange('alt', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 7-56</p>
                      </div>
                      <div>
                        <Label htmlFor="ast">AST (U/L)</Label>
                        <Input
                          id="ast"
                          type="number"
                          step="1"
                          value={formData.ast}
                          onChange={(e) => handleInputChange('ast', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 10-40</p>
                      </div>
                      <div>
                        <Label htmlFor="ggt">GGT (U/L)</Label>
                        <Input
                          id="ggt"
                          type="number"
                          step="1"
                          value={formData.ggt}
                          onChange={(e) => handleInputChange('ggt', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 9-48</p>
                      </div>
                      <div>
                        <Label htmlFor="alkalinePhosphatase">Alkaline Phosphatase (U/L)</Label>
                        <Input
                          id="alkalinePhosphatase"
                          type="number"
                          step="1"
                          value={formData.alkalinePhosphatase}
                          onChange={(e) => handleInputChange('alkalinePhosphatase', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 30-120</p>
                      </div>
                      <div>
                        <Label htmlFor="creatinine">Creatinine (mg/dL)</Label>
                        <Input
                          id="creatinine"
                          type="number"
                          step="0.1"
                          value={formData.creatinine}
                          onChange={(e) => handleInputChange('creatinine', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 0.7-1.3 | F 0.6-1.1</p>
                      </div>
                      <div>
                        <Label htmlFor="eGFR">eGFR (mL/min/1.73m²)</Label>
                        <Input
                          id="eGFR"
                          type="number"
                          step="1"
                          value={formData.eGFR}
                          onChange={(e) => handleInputChange('eGFR', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: ≥90</p>
                      </div>
                      <div>
                        <Label htmlFor="bun">BUN (mg/dL)</Label>
                        <Input
                          id="bun"
                          type="number"
                          step="1"
                          value={formData.bun}
                          onChange={(e) => handleInputChange('bun', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 7-20</p>
                      </div>
                      <div>
                        <Label htmlFor="sodium">Sodium (mmol/L)</Label>
                        <Input
                          id="sodium"
                          type="number"
                          step="1"
                          value={formData.sodium}
                          onChange={(e) => handleInputChange('sodium', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 135-145</p>
                      </div>
                      <div>
                        <Label htmlFor="potassium">Potassium (mmol/L)</Label>
                        <Input
                          id="potassium"
                          type="number"
                          step="0.1"
                          value={formData.potassium}
                          onChange={(e) => handleInputChange('potassium', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 3.5-5.0</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Hormonal & Thyroid Panel (Optional)</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="tsh">TSH (µIU/mL)</Label>
                        <Input
                          id="tsh"
                          type="number"
                          step="0.01"
                          value={formData.tsh}
                          onChange={(e) => handleInputChange('tsh', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 0.4-4.0</p>
                      </div>
                      <div>
                        <Label htmlFor="freeT4">Free T4 (ng/dL)</Label>
                        <Input
                          id="freeT4"
                          type="number"
                          step="0.1"
                          value={formData.freeT4}
                          onChange={(e) => handleInputChange('freeT4', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 0.8-1.8</p>
                      </div>
                      <div>
                        <Label htmlFor="freeT3">Free T3 (pg/mL)</Label>
                        <Input
                          id="freeT3"
                          type="number"
                          step="0.1"
                          value={formData.freeT3}
                          onChange={(e) => handleInputChange('freeT3', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 2.3-4.2</p>
                      </div>
                      <div>
                        <Label htmlFor="tpoAb">TPO Ab (IU/mL)</Label>
                        <Input
                          id="tpoAb"
                          type="number"
                          step="0.1"
                          value={formData.tpoAb}
                          onChange={(e) => handleInputChange('tpoAb', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;9.0</p>
                      </div>
                      <div>
                        <Label htmlFor="thyroglobulinAb">Thyroglobulin Ab (IU/mL)</Label>
                        <Input
                          id="thyroglobulinAb"
                          type="number"
                          step="0.1"
                          value={formData.thyroglobulinAb}
                          onChange={(e) => handleInputChange('thyroglobulinAb', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: &lt;4.0</p>
                      </div>
                      <div>
                        <Label htmlFor="cortisolAM">Cortisol AM (µg/dL)</Label>
                        <Input
                          id="cortisolAM"
                          type="number"
                          step="0.1"
                          value={formData.cortisolAM}
                          onChange={(e) => handleInputChange('cortisolAM', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: 5-23</p>
                      </div>
                      <div>
                        <Label htmlFor="dheas">DHEA-S (µg/dL)</Label>
                        <Input
                          id="dheas"
                          type="number"
                          step="1"
                          value={formData.dheas}
                          onChange={(e) => handleInputChange('dheas', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Varies by age/sex</p>
                      </div>
                      <div>
                        <Label htmlFor="totalTestosterone">Total Testosterone (ng/dL)</Label>
                        <Input
                          id="totalTestosterone"
                          type="number"
                          step="1"
                          value={formData.totalTestosterone}
                          onChange={(e) => handleInputChange('totalTestosterone', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 300-1000 | F 15-70</p>
                      </div>
                      <div>
                        <Label htmlFor="shbg">SHBG (nmol/L)</Label>
                        <Input
                          id="shbg"
                          type="number"
                          step="1"
                          value={formData.shbg}
                          onChange={(e) => handleInputChange('shbg', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Ref: M 15-55 | F 18-145</p>
                      </div>
                      <div>
                        <Label htmlFor="estradiol">Estradiol (pg/mL)</Label>
                        <Input
                          id="estradiol"
                          type="number"
                          step="1"
                          value={formData.estradiol}
                          onChange={(e) => handleInputChange('estradiol', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Varies by cycle/sex</p>
                      </div>
                      <div>
                        <Label htmlFor="progesterone">Progesterone (ng/mL)</Label>
                        <Input
                          id="progesterone"
                          type="number"
                          step="0.1"
                          value={formData.progesterone}
                          onChange={(e) => handleInputChange('progesterone', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Varies by cycle/sex</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 gold-accent border-b-2 gold-border pb-2">
                  STEP 3 OF 3: Genetic Data (Optional)
                </h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="geneticVariants">Genetic Variants (Manual Entry)</Label>
                    <Textarea
                      id="geneticVariants"
                      value={formData.geneticVariants}
                      onChange={(e) => handleInputChange('geneticVariants', e.target.value)}
                      placeholder="Enter genetic variants one per line (e.g., MTHFR C677T (T;T), APOE e3/e4)"
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="geneticReport">Complete Genetic Report (Optional)</Label>
                    <Textarea
                      id="geneticReport"
                      value={formData.geneticReport}
                      onChange={(e) => handleInputChange('geneticReport', e.target.value)}
                      placeholder="Paste your complete genetic analysis report here..."
                      className="mt-2"
                      rows={8}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-center pt-8">
                <Button
                  type="submit"
                  size="lg"
                  className="gold-bg hover:bg-yellow-500 text-lg px-12 py-6 rounded-xl font-semibold shadow-2xl transform hover:scale-105 transition-all"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  {isSaving ? 'Saving...' : 'Save Assessment Data'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};


export default QuestionnaireForm;