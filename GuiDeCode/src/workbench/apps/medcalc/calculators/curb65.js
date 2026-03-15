export default {
  id: 'curb65',
  name: 'CURB-65',
  shortDescription: 'Community-acquired pneumonia severity score for disposition decisions',
  system: 'respiratory',
  specialty: ['Emergency Medicine', 'Pulmonology', 'Internal Medicine', 'Infectious Disease'],
  tags: ['pneumonia', 'CAP', 'respiratory', 'CURB-65', 'mortality'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Lim WS et al. (British Thoracic Society)',
  creatorYear: '2003',
  description: 'CURB-65 is a clinical prediction rule for estimating mortality of community-acquired pneumonia (CAP) and guiding site-of-care decisions (outpatient vs. inpatient vs. ICU). It uses five simple criteria: Confusion, Urea, Respiratory rate, Blood pressure, and age ≥ 65.',
  whyUse: 'Simple bedside tool for pneumonia severity assessment. Guides admission decisions for CAP. Recommended by BTS and NICE guidelines. Requires only basic clinical and lab data.',
  whenToUse: [
    'Patients diagnosed with community-acquired pneumonia',
    'Disposition decision: outpatient vs. hospital vs. ICU',
    'Risk stratification at time of ED presentation',
  ],
  nextSteps: 'Score 0-1: Consider outpatient treatment. Score 2: Short inpatient stay or hospital-supervised outpatient. Score 3-5: Hospitalize; score 4-5 consider ICU admission.',
  pearls: [
    'CRB-65 (without urea) can be used when lab results are unavailable — useful in primary care.',
    'CURB-65 may underestimate severity in young patients with severe sepsis.',
    'Does not account for comorbidities, social factors, or oxygenation — use clinical judgment alongside.',
    'PSI/PORT Score is an alternative that accounts for more variables but is more complex.',
    'Consider ICU admission criteria separately (ATS/IDSA major/minor criteria).',
  ],
  evidence: 'Derived from a multicentre study of 1,068 patients (Lim et al., Thorax 2003). Validated internationally. BTS/NICE recommended for CAP severity assessment. 30-day mortality ranges from <1% (score 0) to >40% (score 5).',
  formula: 'One point for each:\nC = Confusion (new onset)\nU = Urea > 7 mmol/L (BUN > 19.6 mg/dL)\nR = Respiratory rate ≥ 30/min\nB = Blood pressure (SBP < 90 or DBP ≤ 60 mmHg)\n65 = Age ≥ 65 years',
  references: [
    { text: 'Lim WS et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-382.', url: 'https://pubmed.ncbi.nlm.nih.gov/12728155/' },
    { text: 'BTS Guidelines for the Management of Community Acquired Pneumonia in Adults. Thorax. 2009;64(Suppl III):iii1-iii55.', url: 'https://pubmed.ncbi.nlm.nih.gov/19783532/' },
  ],
  links: [
    { title: 'MDCalc — CURB-65', url: 'https://www.mdcalc.com/calc/324/curb-65-score-pneumonia-severity', description: 'Interactive CURB-65 calculator' },
  ],
  interpretations: [
    { range: '0', label: 'Low risk (~0.6% mortality)', action: 'Consider outpatient treatment with oral antibiotics' },
    { range: '1', label: 'Low risk (~2.7% mortality)', action: 'Outpatient or short observation; clinical judgment' },
    { range: '2', label: 'Moderate risk (~6.8% mortality)', action: 'Consider short inpatient stay or closely supervised outpatient' },
    { range: '3', label: 'High risk (~14% mortality)', action: 'Hospitalize; IV antibiotics; consider ICU if deteriorating' },
    { range: '4-5', label: 'Highest risk (~27-57% mortality)', action: 'Urgent hospitalization; assess for ICU admission' },
  ],
  fields: [
    { key: 'confusion', label: 'Confusion (new mental confusion)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'urea', label: 'Urea > 7 mmol/L (BUN > 19.6 mg/dL)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'rr', label: 'Respiratory rate ≥ 30/min', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'bp', label: 'Blood pressure: SBP < 90 or DBP ≤ 60 mmHg', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'age65', label: 'Age ≥ 65 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['confusion', 'urea', 'rr', 'bp', 'age65']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    let mortality = ''
    if (score === 0) { interp = 'Low risk — outpatient treatment appropriate'; mortality = '~0.6%' }
    else if (score === 1) { interp = 'Low risk — consider outpatient or short observation'; mortality = '~2.7%' }
    else if (score === 2) { interp = 'Moderate risk — consider hospitalization'; mortality = '~6.8%' }
    else if (score === 3) { interp = 'High risk — hospitalize, IV antibiotics'; mortality = '~14%' }
    else { interp = 'Highest risk — ICU admission consideration'; mortality = '~27-57%' }
    return {
      result: String(score),
      unit: 'points (0-5)',
      interpretation: interp,
      detail: `30-day mortality: ${mortality}`,
    }
  },
}
