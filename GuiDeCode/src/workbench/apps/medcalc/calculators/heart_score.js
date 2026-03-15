export default {
  id: 'heart_score',
  name: 'HEART Score',
  shortDescription: 'Risk stratification for acute coronary syndrome in chest pain patients',
  system: 'cardiovascular',
  specialty: ['Emergency Medicine', 'Cardiology', 'Internal Medicine'],
  tags: ['ACS', 'chest pain', 'HEART', 'myocardial infarction', 'cardiac', 'MACE'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Six AJ et al.',
  creatorYear: '2008',
  description: 'The HEART Score is designed for risk stratification of patients presenting with chest pain in the emergency department. It predicts the 6-week risk of major adverse cardiac events (MACE) including acute MI, PCI, CABG, and death. It uses five elements: History, ECG, Age, Risk factors, and Troponin.',
  whyUse: 'Identifies low-risk chest pain patients who can be safely discharged from the ED. Reduces unnecessary admissions and testing. Simple, validated, and widely adopted in ED protocols.',
  whenToUse: [
    'Chest pain evaluation in the emergency department',
    'Risk stratification for acute coronary syndrome',
    'Disposition decisions for chest pain patients',
  ],
  nextSteps: 'Score 0-3: Low risk (~1.6% MACE), consider early discharge. Score 4-6: Moderate risk (~12% MACE), admit for observation and further workup. Score 7-10: High risk (~65% MACE), early invasive strategy.',
  pearls: [
    'Low HEART score (0-3) has been validated for safe ED discharge with <2% MACE at 6 weeks.',
    'Troponin should be at presentation (and ideally serial) — high-sensitivity troponin improves accuracy.',
    'The History component is subjective — consider using a structured approach.',
    'HEART Pathway combines HEART score with serial troponins for further risk reduction.',
    'Does not replace clinical judgment — always consider the overall clinical picture.',
  ],
  evidence: 'Validated in multiple studies including HEART-GPS, HEART Pathway, and large multicenter retrospective analyses. A meta-analysis (Poldervaart et al., 2017) confirmed that HEART 0-3 identifies low-risk patients with MACE rate ~1-2%.',
  formula: 'H = History (0-2)\nE = ECG (0-2)\nA = Age (0-2)\nR = Risk factors (0-2)\nT = Troponin (0-2)\nTotal: 0-10',
  references: [
    { text: 'Six AJ et al. Chest pain in the emergency room: value of the HEART score. Neth Heart J. 2008;16(6):191-196.', url: 'https://pubmed.ncbi.nlm.nih.gov/18665203/' },
    { text: 'Poldervaart JM et al. Comparison of the HEART score with the TIMI and GRACE scores for prediction of MACE in chest pain patients at the ED. Int J Cardiol. 2017;227:656-661.', url: 'https://pubmed.ncbi.nlm.nih.gov/27810290/' },
  ],
  links: [
    { title: 'MDCalc — HEART Score', url: 'https://www.mdcalc.com/calc/1752/heart-score-major-cardiac-events', description: 'Interactive HEART score calculator' },
  ],
  interpretations: [
    { range: '0-3', label: 'Low risk (~1.6% MACE)', action: 'Consider early discharge with outpatient follow-up' },
    { range: '4-6', label: 'Moderate risk (~12% MACE)', action: 'Admit for observation, serial troponins, further workup' },
    { range: '7-10', label: 'High risk (~65% MACE)', action: 'Admit, cardiology consult, early invasive strategy' },
  ],
  fields: [
    {
      key: 'history', label: 'History', type: 'score_picker',
      options: [
        { value: 0, label: 'Slightly suspicious (0)' },
        { value: 1, label: 'Moderately suspicious (1)' },
        { value: 2, label: 'Highly suspicious (2)' },
      ],
    },
    {
      key: 'ecg', label: 'ECG', type: 'score_picker',
      options: [
        { value: 0, label: 'Normal (0)' },
        { value: 1, label: 'Non-specific repolarization abnormality (1)' },
        { value: 2, label: 'Significant ST deviation (2)' },
      ],
    },
    {
      key: 'age', label: 'Age', type: 'score_picker',
      options: [
        { value: 0, label: '< 45 years (0)' },
        { value: 1, label: '45-64 years (1)' },
        { value: 2, label: '≥ 65 years (2)' },
      ],
    },
    {
      key: 'risk_factors', label: 'Risk Factors (HTN, DM, smoking, hyperlipidemia, obesity, family hx)', type: 'score_picker',
      options: [
        { value: 0, label: 'No known risk factors (0)' },
        { value: 1, label: '1-2 risk factors (1)' },
        { value: 2, label: '≥ 3 risk factors or hx of atherosclerotic disease (2)' },
      ],
    },
    {
      key: 'troponin', label: 'Troponin', type: 'score_picker',
      options: [
        { value: 0, label: '≤ normal limit (0)' },
        { value: 1, label: '1-3× normal limit (1)' },
        { value: 2, label: '> 3× normal limit (2)' },
      ],
    },
  ],
  calculate: (vals) => {
    const fields = ['history', 'ecg', 'age', 'risk_factors', 'troponin']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 3) interp = 'Low risk (~1.6% MACE) — consider early discharge'
    else if (score <= 6) interp = 'Moderate risk (~12% MACE) — admit for observation'
    else interp = 'High risk (~65% MACE) — early invasive strategy'
    return {
      result: String(score),
      unit: 'points (0-10)',
      interpretation: interp,
      breakdown: [
        { label: 'History', value: String(vals.history) },
        { label: 'ECG', value: String(vals.ecg) },
        { label: 'Age', value: String(vals.age) },
        { label: 'Risk Factors', value: String(vals.risk_factors) },
        { label: 'Troponin', value: String(vals.troponin) },
      ],
    }
  },
}
