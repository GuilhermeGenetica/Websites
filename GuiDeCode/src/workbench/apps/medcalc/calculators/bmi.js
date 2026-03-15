export default {
  id: 'bmi',
  name: 'Body Mass Index (BMI)',
  shortDescription: 'Classifies weight status based on height and weight',
  system: 'utilities',
  specialty: ['General Practice', 'Endocrinology', 'Nutrition', 'Primary Care'],
  tags: ['obesity', 'weight', 'body mass', 'screening'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Adolphe Quetelet',
  creatorYear: '1832',
  description: 'The Body Mass Index (BMI) is a simple metric derived from height and weight, widely used to classify individuals into weight categories. While it does not directly measure body fat, it correlates with more direct measures of body fat and is used as a screening tool for weight-related health problems. BMI is used globally by the WHO and many national health organizations as a first-line screening tool.',
  whyUse: 'Quick, universally recognized screening tool for weight-related health risks. Required for many clinical protocols, medication dosing adjustments, and surgical risk assessments.',
  whenToUse: [
    'Routine health screening and wellness visits',
    'Assessment before surgical procedures',
    'Nutritional assessment and counseling',
    'Eligibility for bariatric surgery evaluation (BMI ≥ 40 or ≥ 35 with comorbidities)',
    'Medication dosing that requires weight classification',
  ],
  nextSteps: 'For BMI ≥ 25, consider waist circumference measurement, metabolic panel, and lifestyle counseling. For BMI ≥ 30, evaluate for obesity-related comorbidities and discuss treatment options. For BMI < 18.5, evaluate for underlying causes of low weight.',
  pearls: [
    'BMI does not distinguish between muscle and fat mass — athletes may have elevated BMI with low body fat.',
    'In elderly patients, BMI may underestimate adiposity due to loss of height and lean mass.',
    'Asian populations have higher metabolic risk at lower BMI cutoffs (overweight ≥ 23, obesity ≥ 27.5 per WHO Asia-Pacific).',
    'BMI should be complemented with waist circumference for better cardiovascular risk assessment.',
    'In children and adolescents, use age- and sex-specific BMI percentiles instead of fixed cutoffs.',
  ],
  evidence: 'BMI correlates with body fat percentage (r ≈ 0.7–0.8) and predicts all-cause mortality in a J-shaped curve. Large meta-analyses (Lancet 2016, >10 million participants) confirmed increased mortality risk at BMI < 20 and BMI > 25. WHO classification adopted in 1995 and revised in 2000.',
  formula: 'BMI = weight (kg) / [height (m)]²',
  references: [
    { text: 'WHO. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894. 2000.', url: 'https://www.who.int/nutrition/publications/obesity/WHO_TRS_894/en/' },
    { text: 'Global BMI Mortality Collaboration. Body-mass index and all-cause mortality. Lancet. 2016;388(10046):776-786.', url: 'https://pubmed.ncbi.nlm.nih.gov/27423262/' },
  ],
  links: [
    { title: 'MDCalc — BMI Calculator', url: 'https://www.mdcalc.com/calc/29/body-mass-index-bmi-body-surface-area-bsa', description: 'Interactive BMI and BSA calculator' },
    { title: 'WHO — BMI Classification', url: 'https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index', description: 'Official WHO BMI classification tables' },
    { title: 'CDC — BMI for Adults', url: 'https://www.cdc.gov/bmi/adult-calculator/index.html', description: 'CDC adult BMI calculator and interpretation' },
  ],
  interpretations: [
    { range: '<18.5', label: 'Underweight', action: 'Evaluate for nutritional deficiency, malabsorption, or chronic illness' },
    { range: '18.5-24.9', label: 'Normal weight', action: 'Encourage healthy lifestyle maintenance' },
    { range: '25-29.9', label: 'Overweight', action: 'Lifestyle counseling; assess waist circumference and metabolic risk' },
    { range: '30-34.9', label: 'Obesity Class I', action: 'Structured weight management; screen for comorbidities' },
    { range: '35-39.9', label: 'Obesity Class II', action: 'Intensive intervention; consider pharmacotherapy' },
    { range: '≥40', label: 'Obesity Class III (Morbid)', action: 'Bariatric surgery evaluation; multidisciplinary management' },
  ],
  fields: [
    { key: 'weight', label: 'Weight', type: 'number', min: 1, max: 500, step: 0.1, placeholder: 'kg', hint: 'kg' },
    { key: 'height', label: 'Height', type: 'number', min: 30, max: 300, step: 0.1, placeholder: 'cm', hint: 'cm' },
  ],
  calculate: (vals) => {
    const w = parseFloat(vals.weight)
    const h = parseFloat(vals.height) / 100
    if (!w || !h || h <= 0) return null
    const bmi = w / (h * h)
    let category = ''
    if (bmi < 18.5) category = 'Underweight'
    else if (bmi < 25) category = 'Normal weight'
    else if (bmi < 30) category = 'Overweight'
    else if (bmi < 35) category = 'Obesity Class I'
    else if (bmi < 40) category = 'Obesity Class II'
    else category = 'Obesity Class III (Morbid)'
    return {
      result: bmi.toFixed(1),
      unit: 'kg/m²',
      interpretation: category,
      detail: `Weight: ${w} kg, Height: ${(h * 100).toFixed(0)} cm (${h.toFixed(2)} m)`,
    }
  },
}
