export default {
  id: 'harris_benedict',
  name: 'Harris-Benedict (BMR/TEE)',
  shortDescription: 'Basal metabolic rate and total energy expenditure estimation',
  system: 'nutrition',
  specialty: ['Nutrition', 'Internal Medicine', 'Critical Care', 'Endocrinology'],
  tags: ['BMR', 'calories', 'nutrition', 'energy', 'Harris-Benedict', 'metabolic rate', 'TEE'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Harris JA, Benedict FG / Roza AM, Shizgal HM (revised)',
  creatorYear: '1919 / 1984',
  description: 'The Harris-Benedict equation estimates Basal Metabolic Rate (BMR) based on sex, weight, height, and age. Multiplied by an activity factor, it provides Total Energy Expenditure (TEE). The revised (Roza-Shizgal 1984) version is more commonly used. This calculator provides both the original and revised equations, plus the Mifflin-St Jeor equation for comparison.',
  whyUse: 'Foundation for nutritional planning. Guides caloric prescriptions for weight maintenance, loss, or gain. Essential for calculating ICU/TPN nutritional targets. Simple bedside estimation without calorimetry.',
  whenToUse: [
    'Nutritional assessment and caloric target setting',
    'TPN/enteral nutrition prescription',
    'Weight management counseling',
    'ICU nutritional planning (with stress/activity factors)',
  ],
  nextSteps: 'Multiply BMR by activity factor for TEE. ICU patients: use stress factor 1.2-1.5 depending on condition. For weight loss: create 500-1000 kcal/day deficit. For TPN: calculate protein, carbohydrate, and lipid targets based on TEE.',
  pearls: [
    'Harris-Benedict tends to overestimate by ~5% in obese patients.',
    'Mifflin-St Jeor is considered more accurate for overweight/obese individuals.',
    'In critically ill patients, indirect calorimetry is the gold standard when available.',
    'ICU stress factors: 1.2 (mild stress), 1.3-1.5 (moderate-severe), up to 2.0 (burns > 40% TBSA).',
    'Use adjusted body weight for obese patients: ABW = IBW + 0.25 × (Actual - IBW).',
    'Protein needs are separate: 0.8 g/kg/day (normal), 1.2-2.0 g/kg/day (critical illness).',
  ],
  evidence: 'Original Harris-Benedict (1919) derived from healthy volunteers. Revised by Roza and Shizgal (1984). Mifflin-St Jeor (1990) shown to be most accurate in a 2005 ADA evidence analysis. All equations have ±10-15% error vs. indirect calorimetry.',
  formula: 'Revised Harris-Benedict (Roza-Shizgal 1984):\nMale BMR = 88.362 + (13.397 × wt kg) + (4.799 × ht cm) - (5.677 × age)\nFemale BMR = 447.593 + (9.247 × wt kg) + (3.098 × ht cm) - (4.330 × age)\n\nMifflin-St Jeor:\nMale = (10 × wt) + (6.25 × ht) - (5 × age) + 5\nFemale = (10 × wt) + (6.25 × ht) - (5 × age) - 161\n\nTEE = BMR × Activity Factor',
  references: [
    { text: 'Harris JA, Benedict FG. A biometric study of human basal metabolism. Proc Natl Acad Sci USA. 1918;4(12):370-373.', url: 'https://pubmed.ncbi.nlm.nih.gov/16576330/' },
    { text: 'Mifflin MD et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
  ],
  links: [
    { title: 'MDCalc — Harris-Benedict', url: 'https://www.mdcalc.com/calc/75/basal-energy-expenditure', description: 'Interactive BMR calculator' },
  ],
  interpretations: [
    { range: '<1200', label: 'Low BMR', action: 'Verify inputs; very low-calorie diets (< 1200 kcal) require medical supervision' },
    { range: '1200-1800', label: 'Typical range (smaller individuals)', action: 'Standard nutritional planning' },
    { range: '1800-2500', label: 'Typical range (average adults)', action: 'Standard nutritional planning' },
    { range: '>2500', label: 'High BMR (larger/younger individuals)', action: 'Expected for large or very active individuals' },
  ],
  fields: [
    { key: 'weight', label: 'Weight', type: 'number', min: 20, max: 400, step: 0.1, placeholder: 'kg', hint: 'kg' },
    { key: 'height', label: 'Height', type: 'number', min: 100, max: 250, step: 0.1, placeholder: 'cm', hint: 'cm' },
    { key: 'age', label: 'Age', type: 'number', min: 15, max: 120, step: 1, placeholder: 'years', hint: 'years' },
    { key: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
    {
      key: 'activity', label: 'Activity Level', type: 'score_picker',
      options: [
        { value: 1.0, label: 'Bedrest / Comatose (1.0)' },
        { value: 1.2, label: 'Sedentary / Minimal (1.2)' },
        { value: 1.375, label: 'Light exercise 1-3 days/wk (1.375)' },
        { value: 1.55, label: 'Moderate exercise 3-5 days/wk (1.55)' },
        { value: 1.725, label: 'Heavy exercise 6-7 days/wk (1.725)' },
        { value: 1.9, label: 'Very heavy / Athlete (1.9)' },
      ],
    },
  ],
  calculate: (vals) => {
    const wt = parseFloat(vals.weight)
    const ht = parseFloat(vals.height)
    const age = parseFloat(vals.age)
    const sex = vals.sex
    const af = parseFloat(vals.activity)
    if (!wt || !ht || !age || !sex || !af) return null
    let hbBMR, msjBMR
    if (sex === 'male') {
      hbBMR = 88.362 + (13.397 * wt) + (4.799 * ht) - (5.677 * age)
      msjBMR = (10 * wt) + (6.25 * ht) - (5 * age) + 5
    } else {
      hbBMR = 447.593 + (9.247 * wt) + (3.098 * ht) - (4.330 * age)
      msjBMR = (10 * wt) + (6.25 * ht) - (5 * age) - 161
    }
    const tee = hbBMR * af
    const msjTEE = msjBMR * af
    return {
      result: Math.round(hbBMR).toLocaleString(),
      unit: 'kcal/day (BMR)',
      interpretation: `TEE (Harris-Benedict): ~${Math.round(tee).toLocaleString()} kcal/day with activity factor ${af}`,
      breakdown: [
        { label: 'Harris-Benedict BMR', value: `${Math.round(hbBMR)} kcal/day` },
        { label: 'Mifflin-St Jeor BMR', value: `${Math.round(msjBMR)} kcal/day` },
        { label: 'TEE (H-B × AF)', value: `${Math.round(tee)} kcal/day` },
        { label: 'TEE (MSJ × AF)', value: `${Math.round(msjTEE)} kcal/day` },
        { label: 'Protein target (0.8-1.2 g/kg)', value: `${Math.round(wt * 0.8)}-${Math.round(wt * 1.2)} g/day` },
      ],
    }
  },
}
