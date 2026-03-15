export default {
  id: 'timi_nstemi',
  name: 'TIMI Score (NSTEMI/UA)',
  shortDescription: 'Risk stratification for unstable angina and NSTEMI',
  system: 'cardiovascular',
  specialty: ['Cardiology', 'Emergency Medicine', 'Internal Medicine'],
  tags: ['TIMI', 'ACS', 'NSTEMI', 'unstable angina', 'chest pain', 'cardiac'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Antman EM et al.',
  creatorYear: '2000',
  description: 'The TIMI Risk Score for UA/NSTEMI predicts the risk of death, new or recurrent MI, or need for urgent revascularization within 14 days. It uses seven variables scored 0-1 each, producing a simple bedside risk estimate that guides the intensity of anti-ischemic therapy and invasive strategy timing.',
  whyUse: 'Rapid bedside ACS risk stratification. Guides early invasive vs. conservative strategy decisions. Validated in multiple large trials (TACTICS-TIMI 18, PRISM-PLUS). Widely recommended by ACC/AHA guidelines.',
  whenToUse: [
    'Patients presenting with unstable angina or NSTEMI',
    'Decision on timing of invasive strategy (early vs. delayed)',
    'Risk communication with patients and families',
  ],
  nextSteps: 'Score 0-2: Low risk (~4-8% event rate), consider conservative strategy. Score 3-4: Intermediate risk (~13-20%), early invasive strategy benefits. Score 5-7: High risk (~26-41%), urgent invasive strategy strongly recommended.',
  pearls: [
    'TIMI is for NSTEMI/UA only — do not use for STEMI (use TIMI STEMI score separately).',
    'Each 1-point increase correlates with ~5% increase in 14-day event rate.',
    'Score ≥ 3 generally favors early invasive approach (catheterization within 24-72h).',
    'Troponin elevation alone (even marginally) scores +1.',
    'Aspirin use within 7 days reflects refractoriness to aspirin therapy, not just chronic use.',
    'GRACE score is an alternative with greater discriminatory power but more complex to calculate.',
  ],
  evidence: 'Derived from TIMI 11B trial (Antman et al., JAMA 2000). Validated in PRISM-PLUS, TACTICS-TIMI 18, and ESSENCE trials. ACC/AHA Class I recommendation for risk stratification in NSTE-ACS.',
  formula: 'One point each (total 0-7):\n1. Age ≥ 65\n2. ≥ 3 CAD risk factors (FHx, HTN, DM, hyperlipidemia, smoking)\n3. Known CAD (≥ 50% stenosis)\n4. ASA use in past 7 days\n5. ≥ 2 anginal episodes in 24h\n6. ST deviation ≥ 0.5mm\n7. Elevated cardiac biomarkers',
  references: [
    { text: 'Antman EM et al. The TIMI risk score for unstable angina/non-ST elevation MI. JAMA. 2000;284(7):835-842.', url: 'https://pubmed.ncbi.nlm.nih.gov/10938172/' },
  ],
  links: [
    { title: 'MDCalc — TIMI NSTEMI', url: 'https://www.mdcalc.com/calc/111/timi-risk-score-ua-nstemi', description: 'Interactive TIMI UA/NSTEMI calculator' },
  ],
  interpretations: [
    { range: '0-1', label: 'Low risk (~4-8% 14-day events)', action: 'Conservative strategy may be appropriate; serial troponins, stress testing' },
    { range: '2', label: 'Low-intermediate risk (~8-13%)', action: 'Consider early invasive strategy; monitor closely' },
    { range: '3-4', label: 'Intermediate risk (~13-20%)', action: 'Early invasive strategy recommended (cath within 24-72h)' },
    { range: '5-7', label: 'High risk (~26-41%)', action: 'Urgent invasive strategy; aggressive antithrombotic therapy' },
  ],
  fields: [
    { key: 'age65', label: 'Age ≥ 65 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'risk_factors', label: '≥ 3 CAD risk factors (FHx, HTN, DM, hyperlipidemia, active smoking)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'known_cad', label: 'Known CAD (stenosis ≥ 50%)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'asa_use', label: 'ASA use in past 7 days', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'angina', label: '≥ 2 anginal episodes in past 24 hours', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'st_deviation', label: 'ST deviation ≥ 0.5 mm on ECG', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'biomarkers', label: 'Elevated cardiac biomarkers (troponin)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['age65', 'risk_factors', 'known_cad', 'asa_use', 'angina', 'st_deviation', 'biomarkers']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const riskTable = { 0: '~4.7%', 1: '~4.7%', 2: '~8.3%', 3: '~13.2%', 4: '~19.9%', 5: '~26.2%', 6: '~40.9%', 7: '~40.9%' }
    let interp = ''
    if (score <= 1) interp = 'Low risk — conservative strategy may be appropriate'
    else if (score <= 2) interp = 'Low-intermediate risk — consider early invasive approach'
    else if (score <= 4) interp = 'Intermediate risk — early invasive strategy recommended'
    else interp = 'High risk — urgent invasive strategy strongly recommended'
    return {
      result: String(score),
      unit: 'points (0-7)',
      interpretation: interp,
      detail: `14-day event rate (death/MI/urgent revasc): ${riskTable[score] || '>40%'}`,
    }
  },
}
