import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const fields = [
  { value: 'age', label: 'Age', type: 'number' },
  { value: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  { value: 'height', label: 'Height (cm)', type: 'number' },
  { value: 'weight', label: 'Weight (kg)', type: 'number' },
  { value: 'bmi', label: 'BMI', type: 'number' },
  { value: 'ethnicity', label: 'Ethnicity', type: 'select', options: ['White', 'Black/African Descent', 'Asian', 'Hispanic/Latino', 'Native American/Indigenous', 'Pacific Islander', 'Multiple Ethnicities', 'Other', 'Prefer not to say'] },
  { value: 'activityLevel', label: 'Activity Level', type: 'select', options: ['Sedentary (Little or no exercise)', 'Lightly Active (Light exercise 1-3 days/week)', 'Moderately Active (Moderate exercise 3-5 days/week)', 'Very Active (Intense exercise 6-7 days/week)', 'Extremely Active (Daily intense workouts or physical job)'] },
  { value: 'sleepHours', label: 'Sleep Hours', type: 'number' },
  { value: 'stressLevel', label: 'Stress Level (1-10)', type: 'number' },
  { value: 'diet', label: 'Primary Diet', type: 'select', options: ['Mediterranean', 'Keto', 'Paleo', 'Vegetarian', 'Vegan', 'Standard Western Diet', 'Other'] },
  { value: 'smokingStatus', label: 'Smoking Status', type: 'select', options: ['Never smoked', 'Former smoker (quit >6 months ago)', 'Occasional smoker (<1 cigarette/day)', 'Daily smoker'] },
  { value: 'alcoholConsumption', label: 'Alcohol Consumption', type: 'select', options: ['Never', 'Rare (<1 drink/week)', 'Social (1-3 drinks/week)', 'Regular (4-7 drinks/week)', 'High (>7 drinks/week)'] },
  { value: 'hemoglobin', label: 'Hemoglobin', type: 'number' },
  { value: 'hematocrit', label: 'Hematocrit', type: 'number' },
  { value: 'rbc', label: 'RBC', type: 'number' },
  { value: 'mcv', label: 'MCV', type: 'number' },
  { value: 'mch', label: 'MCH', type: 'number' },
  { value: 'mchc', label: 'MCHC', type: 'number' },
  { value: 'rdw', label: 'RDW', type: 'number' },
  { value: 'wbc', label: 'WBC', type: 'number' },
  { value: 'neutrophils', label: 'Neutrophils', type: 'number' },
  { value: 'lymphocytes', label: 'Lymphocytes', type: 'number' },
  { value: 'monocytes', label: 'Monocytes', type: 'number' },
  { value: 'eosinophils', label: 'Eosinophils', type: 'number' },
  { value: 'basophils', label: 'Basophils', type: 'number' },
  { value: 'platelets', label: 'Platelets', type: 'number' },
  { value: 'vitaminD', label: 'Vitamin D (25-OH)', type: 'number' },
  { value: 'vitaminB12', label: 'Vitamin B12', type: 'number' },
  { value: 'folate', label: 'Folate (B9)', type: 'number' },
  { value: 'vitaminB6', label: 'Vitamin B6 (P5P)', type: 'number' },
  { value: 'ferritin', label: 'Ferritin', type: 'number' },
  { value: 'serumIron', label: 'Serum Iron', type: 'number' },
  { value: 'tibc', label: 'TIBC', type: 'number' },
  { value: 'transferrinSat', label: 'Transferrin Saturation', type: 'number' },
  { value: 'serumMagnesium', label: 'Magnesium (Serum)', type: 'number' },
  { value: 'rBCMagnesium', label: 'Magnesium (RBC)', type: 'number' },
  { value: 'serumZinc', label: 'Zinc (Serum)', type: 'number' },
  { value: 'copper', label: 'Copper', type: 'number' },
  { value: 'selenium', label: 'Selenium', type: 'number' },
  { value: 'totalCalcium', label: 'Calcium (Total)', type: 'number' },
  { value: 'totalProtein', label: 'Protein (Total)', type: 'number' },
  { value: 'albumin', label: 'Albumin', type: 'number' },
  { value: 'homocysteine', label: 'Homocysteine', type: 'number' },
  { value: 'hsCRP', label: 'hs-CRP', type: 'number' },
  { value: 'fibrinogen', label: 'Fibrinogen', type: 'number' },
  { value: 'totalCholesterol', label: 'Total Cholesterol', type: 'number' },
  { value: 'ldl', label: 'LDL', type: 'number' },
  { value: 'hdl', label: 'HDL', type: 'number' },
  { value: 'triglycerides', label: 'Triglycerides', type: 'number' },
  { value: 'apoB', label: 'ApoB', type: 'number' },
  { value: 'lipoproteinA', label: 'Lipoprotein(a)', type: 'number' },
  { value: 'fastingGlucose', label: 'Fasting Glucose', type: 'number' },
  { value: 'hba1c', label: 'HbA1c', type: 'number' },
  { value: 'fastingInsulin', label: 'Fasting Insulin', type: 'number' },
  { value: 'homaIR', label: 'HOMA-IR', type: 'number' },
  { value: 'uricAcid', label: 'Uric Acid', type: 'number' },
  { value: 'alt', label: 'ALT', type: 'number' },
  { value: 'ast', label: 'AST', type: 'number' },
  { value: 'ggt', label: 'GGT', type: 'number' },
  { value: 'alkalinePhosphatase', label: 'Alkaline Phosphatase', type: 'number' },
  { value: 'creatinine', label: 'Creatinine', type: 'number' },
  { value: 'eGFR', label: 'eGFR', type: 'number' },
  { value: 'bun', label: 'BUN', type: 'number' },
  { value: 'sodium', label: 'Sodium', type: 'number' },
  { value: 'potassium', label: 'Potassium', type: 'number' },
  { value: 'tsh', label: 'TSH', type: 'number' },
  { value: 'freeT4', label: 'Free T4', type: 'number' },
  { value: 'freeT3', label: 'Free T3', type: 'number' },
  { value: 'tpoAb', label: 'TPO Ab', type: 'number' },
  { value: 'thyroglobulinAb', label: 'Thyroglobulin Ab', type: 'number' },
  { value: 'cortisolAM', label: 'Cortisol (AM)', type: 'number' },
  { value: 'dheas', label: 'DHEA-S', type: 'number' },
  { value: 'totalTestosterone', label: 'Total Testosterone', type: 'number' },
  { value: 'shbg', label: 'SHBG', type: 'number' },
  { value: 'estradiol', label: 'Estradiol (E2)', type: 'number' },
  { value: 'progesterone', label: 'Progesterone', type: 'number' },
  { value: 'geneticVariants', label: 'Genetic Variants', type: 'text' },
];

const operators = {
  number: [
    { value: 'equals', label: 'is equal to' },
    { value: 'notEquals', label: 'is not equal to' },
    { value: 'greaterThan', label: 'is greater than' },
    { value: 'lessThan', label: 'is less than' },
    { value: 'greaterThanOrEqual', label: 'is greater than or equal to' },
    { value: 'lessThanOrEqual', label: 'is less than or equal to' },
    { value: 'between', label: 'is between' }
  ],
  text: [
    { value: 'equals', label: 'is equal to' },
    { value: 'notEquals', label: 'is not equal to' },
    { value: 'contains', label: 'contains' },
    { value: 'notContains', label: 'does not contain' }
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'notEquals', label: 'is not' }
  ]
};

const RuleCondition = ({ condition, onChange, onDelete }) => {
  const selectedField = fields.find(f => f.value === condition.field) || fields[0];
  const fieldType = selectedField.type;
  
  const handleFieldChange = (newField) => {
    const newSelectedField = fields.find(f => f.value === newField);
    const defaultOperator = operators[newSelectedField.type][0].value;
    onChange({
      ...condition,
      field: newField,
      operator: defaultOperator,
      value: newSelectedField.type === 'between' ? [0, 0] : ['']
    });
  };
  
  const handleOperatorChange = (newOperator) => {
    const value = newOperator === 'between' ? [condition.value[0] || 0, condition.value[1] || 0] : [condition.value[0] || ''];
    onChange({ ...condition, operator: newOperator, value });
  };
  
  const handleValueChange = (index, newValue) => {
    const newValues = [...condition.value];
    newValues[index] = newValue;
    onChange({ ...condition, value: newValues });
  };

  const renderValueInput = () => {
    const { operator } = condition;
    if (operator === 'between') {
      return (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            value={condition.value[0] || ''}
            onChange={(e) => handleValueChange(0, e.target.value)}
            className="w-24"
          />
          <span>and</span>
          <Input
            type="number"
            value={condition.value[1] || ''}
            onChange={(e) => handleValueChange(1, e.target.value)}
            className="w-24"
          />
        </div>
      );
    }

    if (fieldType === 'select') {
       return (
        <Select value={condition.value[0] || ''} onValueChange={(val) => handleValueChange(0, val)}>
            <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select value..." />
            </SelectTrigger>
            <SelectContent>
                {selectedField.options.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
            </SelectContent>
        </Select>
       );
    }
    
    return (
      <Input
        type={fieldType === 'number' ? 'number' : 'text'}
        value={condition.value[0] || ''}
        onChange={(e) => handleValueChange(0, e.target.value)}
        className="w-48"
      />
    );
  };
  
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {fields.map(field => (
            <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select operator..." />
        </SelectTrigger>
        <SelectContent>
          {operators[fieldType].map(op => (
            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {renderValueInput()}

      <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive h-8 w-8 ml-auto">
        <Trash2 className="h-4 w-4"/>
      </Button>
    </div>
  );
};

export default RuleCondition;