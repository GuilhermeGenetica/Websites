export default {
  id: 'spesi',
  name: 'sPESI (Simplified PESI)',
  shortDescription: 'Simplified Pulmonary Embolism Severity Index for 30-day mortality risk',
  system: 'cardiovascular',
  specialty: ['Emergency Medicine', 'Pulmonology', 'Internal Medicine'],
  tags: ['PE', 'pulmonary embolism', 'PESI', 'sPESI', 'mortality', 'risk stratification'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Jimenez D et al.',
  creatorYear: '2010',
  description: 'The simplified Pulmonary Embolism Severity Index (sPESI) stratifies patients with confirmed PE into low-risk and non-low-risk categories for 30-day mortality. A score of 0 identifies patients who may be candidates for outpatient treatment. It simplifies the original PESI from 11 variables to 6 binary criteria.',
  whyUse: 'Identifies low-risk PE patients suitable for outpatient management. Simpler than original PESI while maintaining similar predictive accuracy. Guides disposition decisions: inpatient vs. outpatient anticoagulation.',
  whenToUse: [
    'After confirmed diagnosis of pulmonary embolism',
    'Disposition decision: inpatient vs. outpatient treatment',
    'Risk stratification to guide escalation of care',
  ],
  nextSteps: 'sPESI = 0: Low risk (30-day mortality ~1%). Consider outpatient treatment if no other contraindications, adequate follow-up, and no RV dysfunction on imaging. sPESI ≥ 1: Non-low risk — admit for monitoring and treatment.',
  pearls: [
    'sPESI = 0 identifies low-risk patients with ~1% 30-day mortality.',
    'Before discharging PE patients, also check: RV function (echo/CT), troponin, BNP, social factors.',
    'ESC guidelines recommend sPESI + RV assessment + biomarkers for complete risk stratification.',
    'Outpatient PE treatment requires: sPESI 0, no RV dysfunction, adequate follow-up, no high bleeding risk.',
    'Massive PE (hemodynamic instability) does NOT need sPESI — it is automatically high-risk.',
    'Cannot be used for suspected PE — only for CONFIRMED PE.',
  ],
  evidence: 'Derived and validated by Jimenez et al. (Arch Intern Med 2010) in 995 patients. Externally validated in multiple cohorts. Endorsed by ESC 2019 PE guidelines for initial risk stratification.',
  formula: 'One point each for:\n• Age > 80 years\n• Cancer (active or within 6 months)\n• Heart failure or chronic lung disease\n• Heart rate ≥ 110 bpm\n• Systolic BP < 100 mmHg\n• SpO₂ < 90%\nScore 0 = low risk; ≥ 1 = non-low risk',
  references: [
    { text: 'Jimenez D et al. Simplification of the Pulmonary Embolism Severity Index for prognostication in patients with acute symptomatic PE. Arch Intern Med. 2010;170(15):1383-1389.', url: 'https://pubmed.ncbi.nlm.nih.gov/20696966/' },
    { text: 'Konstantinides SV et al. 2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism. Eur Heart J. 2020;41(4):543-603.', url: 'https://pubmed.ncbi.nlm.nih.gov/31504429/' },
  ],
  links: [
    { title: 'MDCalc — sPESI', url: 'https://www.mdcalc.com/calc/1304/simplified-pesi-pulmonary-embolism-severity-index', description: 'Interactive sPESI calculator' },
  ],
  interpretations: [
    { range: '0', label: 'Low risk (~1% 30-day mortality)', action: 'Consider outpatient treatment if no RV dysfunction, stable, adequate follow-up' },
    { range: '1', label: 'Non-low risk (~10.9% 30-day mortality)', action: 'Inpatient admission; assess RV function, troponin, BNP for further stratification' },
    { range: '2-6', label: 'Non-low risk (increasing mortality)', action: 'Inpatient monitoring; consider ICU if hemodynamically unstable' },
  ],
  fields: [
    { key: 'age80', label: 'Age > 80 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'cancer', label: 'Active cancer', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'cardiopulm', label: 'Heart failure or chronic lung disease', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'hr110', label: 'Heart rate ≥ 110 bpm', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'sbp', label: 'Systolic BP < 100 mmHg', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'spo2', label: 'SpO₂ < 90%', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['age80', 'cancer', 'cardiopulm', 'hr110', 'sbp', 'spo2']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score === 0) interp = 'Low risk (~1.0% 30-day mortality) — consider outpatient management'
    else interp = `Non-low risk (${score} point${score > 1 ? 's' : ''}) — inpatient management recommended`
    return {
      result: String(score),
      unit: 'points (0-6)',
      interpretation: interp,
    }
  },
}
