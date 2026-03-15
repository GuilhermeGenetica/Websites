export default {
  id: 'grace',
  name: 'GRACE Score (ACS)',
  shortDescription: 'Global Registry of Acute Coronary Events — in-hospital and 6-month mortality',
  system: 'cardiovascular',
  specialty: ['Cardiology', 'Emergency Medicine', 'Critical Care'],
  tags: ['GRACE', 'ACS', 'NSTEMI', 'STEMI', 'mortality', 'cardiac', 'risk'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Eagle KA, Granger CB et al.',
  creatorYear: '2004',
  description: 'The GRACE score estimates in-hospital and 6-month mortality in patients with acute coronary syndromes (NSTEMI, STEMI, UA). It uses 8 variables including age, heart rate, systolic BP, creatinine, Killip class, cardiac arrest at admission, ST-segment deviation, and elevated cardiac enzymes. It has the highest discriminatory power among ACS risk scores.',
  whyUse: 'Superior discrimination to TIMI for ACS mortality prediction. Recommended by ESC guidelines as the preferred ACS risk score. Guides invasive strategy timing and intensity of treatment.',
  whenToUse: [
    'Risk stratification after ACS diagnosis (NSTEMI, STEMI, UA)',
    'Guides timing of invasive strategy (immediate, early, delayed)',
    'In-hospital and post-discharge mortality estimation',
  ],
  nextSteps: 'Low risk (< 109): Conservative or elective invasive strategy. Intermediate (109-140): Early invasive within 72h. High risk (> 140): Urgent invasive strategy within 24h. Very high risk (> 140 + refractory symptoms): Immediate invasive < 2h.',
  pearls: [
    'GRACE has the best c-statistic (~0.83) among ACS risk models.',
    'Can be used for both STEMI and NSTEMI — unlike TIMI which has separate scores.',
    'The simplified GRACE (8 variables) is most commonly used; original had 9.',
    'ESC 2023 NSTE-ACS guidelines recommend GRACE for risk assessment and timing of angiography.',
    'Online GRACE 2.0 calculator provides more precise estimates than the point-based system.',
    'Cardiac arrest at admission is a powerful predictor — scores +39 points.',
  ],
  evidence: 'Derived from the GRACE registry (>40,000 patients from 14 countries). Validated externally in multiple populations. ESC Class I recommendation for NSTE-ACS risk stratification.',
  formula: 'Simplified scoring based on 8 variables:\nAge, HR, SBP, Creatinine, Killip class,\nCardiac arrest, ST deviation, Elevated enzymes\nTotal range: ~1-263 (in-hospital mortality)',
  references: [
    { text: 'Fox KA et al. Prediction of risk of death and myocardial infarction in the six months after presentation with acute coronary syndrome: prospective multinational observational study (GRACE). BMJ. 2006;333(7578):1091.', url: 'https://pubmed.ncbi.nlm.nih.gov/17032691/' },
    { text: 'Granger CB et al. Predictors of hospital mortality in the GRACE registry. Arch Intern Med. 2003;163(19):2345-2353.', url: 'https://pubmed.ncbi.nlm.nih.gov/14581255/' },
  ],
  links: [
    { title: 'MDCalc — GRACE Score', url: 'https://www.mdcalc.com/calc/1099/grace-acs-risk-mortality-calculator', description: 'Interactive GRACE ACS calculator' },
    { title: 'GRACE 2.0 Calculator', url: 'https://www.outcomes-umassmed.org/grace/', description: 'Official GRACE calculator' },
  ],
  interpretations: [
    { range: '1-108', label: 'Low risk (< 1% in-hospital mortality)', action: 'Non-invasive testing or elective angiography' },
    { range: '109-140', label: 'Intermediate risk (1-3% mortality)', action: 'Early invasive strategy within 72 hours' },
    { range: '141-200', label: 'High risk (> 3% mortality)', action: 'Urgent invasive strategy within 24 hours' },
    { range: '>200', label: 'Very high risk', action: 'Immediate invasive strategy (<2h) if refractory symptoms/instability' },
  ],
  fields: [
    { key: 'age', label: 'Age', type: 'number', min: 18, max: 120, step: 1, placeholder: 'years', hint: 'years' },
    { key: 'hr', label: 'Heart Rate', type: 'number', min: 20, max: 250, step: 1, placeholder: 'bpm', hint: 'bpm' },
    { key: 'sbp', label: 'Systolic Blood Pressure', type: 'number', min: 40, max: 300, step: 1, placeholder: 'mmHg', hint: 'mmHg' },
    { key: 'creatinine', label: 'Serum Creatinine', type: 'number', min: 0.1, max: 30, step: 0.01, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'killip', label: 'Killip Class', type: 'score_picker', options: [{ value: 1, label: 'Class I — No HF (0 pts)' }, { value: 2, label: 'Class II — Rales, S3, JVD (+20)' }, { value: 3, label: 'Class III — Pulmonary edema (+39)' }, { value: 4, label: 'Class IV — Cardiogenic shock (+59)' }] },
    { key: 'cardiac_arrest', label: 'Cardiac arrest at admission', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+39)' }] },
    { key: 'st_deviation', label: 'ST-segment deviation', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+28)' }] },
    { key: 'elevated_enzymes', label: 'Elevated cardiac enzymes/troponin', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+14)' }] },
  ],
  calculate: (vals) => {
    const age = parseFloat(vals.age)
    const hr = parseFloat(vals.hr)
    const sbp = parseFloat(vals.sbp)
    const cr = parseFloat(vals.creatinine)
    const killip = parseInt(vals.killip)
    const arrest = parseInt(vals.cardiac_arrest)
    const st = parseInt(vals.st_deviation)
    const enzymes = parseInt(vals.elevated_enzymes)
    if (!age || !hr || !sbp || !cr || !killip || arrest === undefined || arrest === null || st === undefined || st === null || enzymes === undefined || enzymes === null) return null
    let agePoints = 0
    if (age < 30) agePoints = 0
    else if (age < 40) agePoints = 8
    else if (age < 50) agePoints = 25
    else if (age < 60) agePoints = 41
    else if (age < 70) agePoints = 58
    else if (age < 80) agePoints = 75
    else if (age < 90) agePoints = 91
    else agePoints = 100
    let hrPoints = 0
    if (hr < 50) hrPoints = 0
    else if (hr < 70) hrPoints = 3
    else if (hr < 90) hrPoints = 9
    else if (hr < 110) hrPoints = 15
    else if (hr < 150) hrPoints = 24
    else if (hr < 200) hrPoints = 38
    else hrPoints = 46
    let sbpPoints = 0
    if (sbp < 80) sbpPoints = 58
    else if (sbp < 100) sbpPoints = 53
    else if (sbp < 120) sbpPoints = 43
    else if (sbp < 140) sbpPoints = 34
    else if (sbp < 160) sbpPoints = 24
    else if (sbp < 200) sbpPoints = 10
    else sbpPoints = 0
    let crPoints = 0
    if (cr < 0.4) crPoints = 1
    else if (cr < 0.8) crPoints = 4
    else if (cr < 1.2) crPoints = 7
    else if (cr < 1.6) crPoints = 10
    else if (cr < 2.0) crPoints = 13
    else if (cr < 4.0) crPoints = 21
    else crPoints = 28
    const killipPoints = { 1: 0, 2: 20, 3: 39, 4: 59 }
    const kp = killipPoints[killip] || 0
    const arrestPoints = arrest === 1 ? 39 : 0
    const stPoints = st === 1 ? 28 : 0
    const enzymePoints = enzymes === 1 ? 14 : 0
    const total = agePoints + hrPoints + sbpPoints + crPoints + kp + arrestPoints + stPoints + enzymePoints
    let risk = ''
    let mortality = ''
    if (total <= 108) { risk = 'Low risk'; mortality = '< 1%' }
    else if (total <= 140) { risk = 'Intermediate risk'; mortality = '1-3%' }
    else if (total <= 200) { risk = 'High risk'; mortality = '3-10%' }
    else { risk = 'Very high risk'; mortality = '> 10%' }
    return {
      result: String(total),
      unit: 'points',
      interpretation: `${risk} — estimated in-hospital mortality: ${mortality}`,
      breakdown: [
        { label: 'Age', value: `${agePoints} pts` },
        { label: 'Heart Rate', value: `${hrPoints} pts` },
        { label: 'Systolic BP', value: `${sbpPoints} pts` },
        { label: 'Creatinine', value: `${crPoints} pts` },
        { label: 'Killip Class', value: `${kp} pts` },
        { label: 'Cardiac Arrest', value: `${arrestPoints} pts` },
        { label: 'ST Deviation', value: `${stPoints} pts` },
        { label: 'Elevated Enzymes', value: `${enzymePoints} pts` },
      ],
    }
  },
}
