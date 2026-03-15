export default {
  id: 'psi',
  name: 'PSI / PORT Score',
  shortDescription: 'Pneumonia Severity Index for community-acquired pneumonia risk stratification.',
  system: 'respiratory',
  specialty: ['Pulmonology', 'Emergency Medicine', 'Internal Medicine', 'Infectious Disease'],
  tags: ['pneumonia', 'CAP', 'PSI', 'PORT', 'severity', 'hospitalization'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Fine MJ et al.',
  creatorYear: '1997',
  description: 'The Pneumonia Severity Index (PSI), also known as the PORT Score, stratifies adults with community-acquired pneumonia (CAP) into five risk classes to guide site-of-care decisions (outpatient vs. inpatient vs. ICU).',
  whyUse: 'Validated in >50,000 patients; identifies low-risk patients suitable for outpatient treatment, reducing unnecessary hospitalization.',
  whenToUse: [
    'Adults (≥18 years) presenting with community-acquired pneumonia',
    'Determining need for hospitalization vs. outpatient management',
    'Complementary to CURB-65 for risk stratification',
  ],
  nextSteps: 'Class I-II: outpatient treatment. Class III: short hospitalization or observation. Class IV-V: inpatient; Class V consider ICU.',
  pearls: [
    'Class I patients are <50y, no comorbidities, normal mental status, and normal vital signs — no point calculation needed.',
    'PSI is more complex than CURB-65 but better validated for low-risk identification.',
    'Does not replace clinical judgment; consider social factors for site-of-care decisions.',
  ],
  evidence: 'Fine et al. NEJM 1997. Validated in 38,039 patients across 3 cohorts. AUC 0.82-0.89 for 30-day mortality.',
  formula: `Demographic: Age (years) for men; Age-10 for women; +10 if NH resident
Comorbidity: +30 neoplasm; +20 liver disease; +10 CHF; +10 cerebrovascular; +10 renal disease
Exam: +20 altered mental status; +20 RR≥30; +20 SBP<90; +15 temp<35 or ≥40°C; +10 HR≥125
Labs: +30 pH<7.35; +20 BUN≥30mg/dL (11mmol/L); +10 Na<130; +10 glucose≥250mg/dL (14mmol/L); +10 Hct<30%; +10 PaO2<60mmHg or SaO2<90%; +10 pleural effusion`,
  references: [
    { text: 'Fine MJ et al. A prediction rule to identify low-risk patients with community-acquired pneumonia. NEJM. 1997;336(4):243-250.', url: 'https://pubmed.ncbi.nlm.nih.gov/8995086/' },
    { text: 'Mandell LA et al. IDSA/ATS Consensus Guidelines on CAP. CID. 2007;44(Suppl 2):S27-72.', url: 'https://pubmed.ncbi.nlm.nih.gov/17278083/' },
  ],
  links: [
    { title: 'MDCalc — PSI/PORT Score', url: 'https://www.mdcalc.com/calc/33/psi-port-score-pneumonia-severity-index-cap', description: 'Interactive PSI calculator' },
  ],
  interpretations: [
    { range: '0-50', label: 'Class I-II — Very Low Risk', action: 'Outpatient treatment; mortality <1%' },
    { range: '51-70', label: 'Class III — Low Risk', action: 'Outpatient or brief inpatient; mortality ~2.8%' },
    { range: '71-90', label: 'Class IV — Moderate Risk', action: 'Inpatient treatment; mortality ~8.2%' },
    { range: '91-130', label: 'Class V — High Risk', action: 'Inpatient; consider ICU; mortality ~29.2%' },
    { range: '>130', label: 'Class V — Very High Risk', action: 'ICU consideration; mortality >29%' },
  ],
  fields: [
    { key: 'age', label: 'Age', type: 'number', unit: 'years', min: 18, max: 120, placeholder: 'e.g. 65' },
    { key: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
    { key: 'nursing_home', label: 'Nursing home resident', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'neoplasm', label: 'Active neoplasm', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 30, label: 'Yes (+30)' }] },
    { key: 'liver', label: 'Liver disease', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 20, label: 'Yes (+20)' }] },
    { key: 'chf', label: 'Congestive heart failure', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'cerebro', label: 'Cerebrovascular disease', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'renal', label: 'Renal disease', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'mental_status', label: 'Altered mental status', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 20, label: 'Yes (+20)' }] },
    { key: 'rr', label: 'Respiratory rate ≥30/min', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 20, label: 'Yes (+20)' }] },
    { key: 'sbp', label: 'SBP <90 mmHg', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 20, label: 'Yes (+20)' }] },
    { key: 'temp', label: 'Temp <35°C or ≥40°C', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 15, label: 'Yes (+15)' }] },
    { key: 'hr', label: 'Heart rate ≥125 bpm', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'ph', label: 'Arterial pH <7.35', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 30, label: 'Yes (+30)' }] },
    { key: 'bun', label: 'BUN ≥30 mg/dL (11 mmol/L)', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 20, label: 'Yes (+20)' }] },
    { key: 'sodium', label: 'Sodium <130 mEq/L', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'glucose', label: 'Glucose ≥250 mg/dL (14 mmol/L)', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'hematocrit', label: 'Hematocrit <30%', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'pao2', label: 'PaO₂ <60 mmHg or SaO₂ <90%', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
    { key: 'effusion', label: 'Pleural effusion on CXR', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 10, label: 'Yes (+10)' }] },
  ],
  calculate(fields) {
    const age = parseFloat(fields.age)
    const sex = fields.sex
    let score = sex === 'female' ? age - 10 : age
    const additive = [
      'nursing_home','neoplasm','liver','chf','cerebro','renal',
      'mental_status','rr','sbp','temp','hr','ph','bun',
      'sodium','glucose','hematocrit','pao2','effusion',
    ]
    additive.forEach(k => { score += parseFloat(fields[k] || 0) })
    let riskClass, interp, action
    if (score <= 50) { riskClass = 'I-II'; interp = 'Very Low Risk'; action = 'Outpatient treatment; 30-day mortality <1%' }
    else if (score <= 70) { riskClass = 'III'; interp = 'Low Risk'; action = 'Outpatient or short observation; mortality ~2.8%' }
    else if (score <= 90) { riskClass = 'IV'; interp = 'Moderate Risk'; action = 'Inpatient; mortality ~8.2%' }
    else if (score <= 130) { riskClass = 'V'; interp = 'High Risk'; action = 'Inpatient / ICU consideration; mortality ~29.2%' }
    else { riskClass = 'V'; interp = 'Very High Risk'; action = 'ICU; mortality >29%' }
    return {
      result: score,
      unit: `points — Class ${riskClass}`,
      interpretation: `${interp}: ${action}`,
      detail: 'Age contribution: ' + (sex === 'female' ? `${age} - 10 = ${age - 10} pts` : `${age} pts`),
    }
  },
}
