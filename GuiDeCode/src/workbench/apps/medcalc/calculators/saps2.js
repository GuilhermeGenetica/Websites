export default {
  id: 'saps2',
  name: 'SAPS II',
  shortDescription: 'Simplified Acute Physiology Score II — ICU mortality prediction.',
  system: 'critical_care',
  specialty: ['Critical Care', 'Intensive Care Unit', 'Internal Medicine'],
  tags: ['SAPS', 'ICU', 'severity', 'mortality', 'prognosis', 'critical care'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Le Gall JR et al.',
  creatorYear: '1993',
  description: 'SAPS II (Simplified Acute Physiology Score II) is a severity-of-illness scoring system used in ICUs to predict hospital mortality. It is based on 17 variables collected within the first 24 hours of ICU admission.',
  whyUse: 'No primary diagnosis required. Widely used in Europe and internationally as an ICU benchmarking and mortality prediction tool.',
  whenToUse: [
    'ICU patients within first 24 hours of admission',
    'Benchmarking ICU performance',
    'Research and quality improvement',
    'Complementary to APACHE II/SOFA',
  ],
  nextSteps: 'Calculate logit = -7.7631 + 0.0737×score + 0.9971×ln(score+1). Predicted mortality = e^logit / (1+e^logit). Use for benchmarking, not individual prognostication.',
  pearls: [
    'Use worst values in first 24 hours of ICU stay.',
    'Score alone predicts group mortality; individual predictions require caution.',
    'More granular than APACHE II for some physiologic derangements.',
    'Does not require primary diagnosis for calculation (unlike APACHE II).',
  ],
  evidence: 'Le Gall et al. JAMA 1993. Derived in 13,152 ICU patients across 137 units (Europe/North America). AUC 0.86 for hospital mortality.',
  formula: `17 variables: age, HR, SBP, temp, PaO2/FiO2 (if ventilated), urine output, BUN, WBC, K+, Na+, HCO3-, bilirubin, GCS, chronic disease type, admission type
Predicted mortality: logit = -7.7631 + 0.0737×SAPS + 0.9971×ln(SAPS+1)
Probability = e^logit / (1+e^logit)`,
  references: [
    { text: 'Le Gall JR et al. A new simplified acute physiology score (SAPS II) based on a European/North American multicenter study. JAMA. 1993;270(24):2957-2963.', url: 'https://pubmed.ncbi.nlm.nih.gov/8254858/' },
  ],
  links: [
    { title: 'MDCalc — SAPS II', url: 'https://www.mdcalc.com/calc/1232/simplified-acute-physiology-score-saps-ii', description: 'Interactive SAPS II calculator' },
  ],
  interpretations: [
    { range: '0-30', label: 'Low severity', action: 'Predicted mortality <10%' },
    { range: '31-50', label: 'Moderate severity', action: 'Predicted mortality 10-40%' },
    { range: '51-70', label: 'High severity', action: 'Predicted mortality 40-70%' },
    { range: '71-163', label: 'Very high severity', action: 'Predicted mortality >70%' },
  ],
  fields: [
    { key: 'age', label: 'Age', type: 'select', options: [{ value: 0, label: '<40 (0)' }, { value: 7, label: '40-59 (+7)' }, { value: 12, label: '60-69 (+12)' }, { value: 15, label: '70-74 (+15)' }, { value: 16, label: '75-79 (+16)' }, { value: 18, label: '≥80 (+18)' }] },
    { key: 'hr', label: 'Heart Rate (worst)', type: 'select', options: [{ value: 11, label: '<40 bpm (+11)' }, { value: 2, label: '40-69 bpm (+2)' }, { value: 0, label: '70-119 bpm (0)' }, { value: 4, label: '120-159 bpm (+4)' }, { value: 7, label: '≥160 bpm (+7)' }] },
    { key: 'sbp', label: 'Systolic BP (worst)', type: 'select', options: [{ value: 13, label: '<70 mmHg (+13)' }, { value: 5, label: '70-99 mmHg (+5)' }, { value: 0, label: '100-199 mmHg (0)' }, { value: 2, label: '≥200 mmHg (+2)' }] },
    { key: 'temp', label: 'Temperature (worst)', type: 'select', options: [{ value: 0, label: '<39°C (0)' }, { value: 3, label: '≥39°C (+3)' }] },
    { key: 'pao2_fio2', label: 'PaO₂/FiO₂ (if ventilated or CPAP)', type: 'select', options: [{ value: 11, label: '<100 (+11)' }, { value: 9, label: '100-199 (+9)' }, { value: 6, label: '200-299 (+6)' }, { value: 0, label: '≥300 or not ventilated (0)' }] },
    { key: 'urine', label: 'Urine output (L/day)', type: 'select', options: [{ value: 11, label: '<0.5 L/day (+11)' }, { value: 4, label: '0.5-0.999 L/day (+4)' }, { value: 0, label: '≥1 L/day (0)' }] },
    { key: 'bun', label: 'BUN (worst)', type: 'select', options: [{ value: 0, label: '<28 mg/dL (<10 mmol/L) (0)' }, { value: 6, label: '28-83 mg/dL (10-29.9 mmol/L) (+6)' }, { value: 10, label: '≥84 mg/dL (≥30 mmol/L) (+10)' }] },
    { key: 'wbc', label: 'WBC (worst)', type: 'select', options: [{ value: 12, label: '<1 ×10³/mm³ (+12)' }, { value: 0, label: '1-19.9 ×10³/mm³ (0)' }, { value: 3, label: '≥20 ×10³/mm³ (+3)' }] },
    { key: 'k', label: 'Potassium (worst)', type: 'select', options: [{ value: 3, label: '<3 mEq/L (+3)' }, { value: 0, label: '3-4.9 mEq/L (0)' }, { value: 3, label: '≥5 mEq/L (+3)' }] },
    { key: 'na', label: 'Sodium (worst)', type: 'select', options: [{ value: 5, label: '<125 mEq/L (+5)' }, { value: 1, label: '125-144 mEq/L (+1)' }, { value: 0, label: '≥145 mEq/L (0)' }] },
    { key: 'hco3', label: 'HCO₃⁻ (worst)', type: 'select', options: [{ value: 6, label: '<15 mEq/L (+6)' }, { value: 3, label: '15-19 mEq/L (+3)' }, { value: 0, label: '≥20 mEq/L (0)' }] },
    { key: 'bili', label: 'Bilirubin (worst)', type: 'select', options: [{ value: 0, label: '<4 mg/dL (<68.4 µmol/L) (0)' }, { value: 4, label: '4-5.9 mg/dL (68.4-102 µmol/L) (+4)' }, { value: 9, label: '≥6 mg/dL (≥102 µmol/L) (+9)' }] },
    { key: 'gcs', label: 'GCS (worst)', type: 'select', options: [{ value: 26, label: '<6 (+26)' }, { value: 13, label: '6-8 (+13)' }, { value: 7, label: '9-10 (+7)' }, { value: 5, label: '11-13 (+5)' }, { value: 0, label: '14-15 (0)' }] },
    { key: 'chronic', label: 'Chronic disease', type: 'select', options: [{ value: 0, label: 'None (0)' }, { value: 9, label: 'Metastatic cancer (+9)' }, { value: 10, label: 'Hematologic malignancy (+10)' }, { value: 17, label: 'AIDS (+17)' }] },
    { key: 'admission', label: 'Admission type', type: 'select', options: [{ value: 0, label: 'Elective surgery (0)' }, { value: 6, label: 'Medical (+6)' }, { value: 8, label: 'Emergency surgery (+8)' }] },
  ],
  calculate(fields) {
    const keys = ['age','hr','sbp','temp','pao2_fio2','urine','bun','wbc','k','na','hco3','bili','gcs','chronic','admission']
    const score = keys.reduce((s, k) => s + parseFloat(fields[k] || 0), 0)
    const logit = -7.7631 + 0.0737 * score + 0.9971 * Math.log(score + 1)
    const mortality = (Math.exp(logit) / (1 + Math.exp(logit)) * 100).toFixed(1)
    let severity
    if (score <= 30) severity = 'Low severity'
    else if (score <= 50) severity = 'Moderate severity'
    else if (score <= 70) severity = 'High severity'
    else severity = 'Very high severity'
    return {
      result: score,
      unit: '/ 163 points',
      interpretation: `${severity} — Predicted hospital mortality: ${mortality}%`,
      detail: 'Calculated using SAPS II logistic regression: logit = -7.7631 + 0.0737×score + 0.9971×ln(score+1)',
    }
  },
}
