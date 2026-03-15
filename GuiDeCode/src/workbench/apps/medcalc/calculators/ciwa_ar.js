export default {
  id: 'ciwa_ar',
  name: 'CIWA-Ar',
  shortDescription: 'Clinical Institute Withdrawal Assessment for Alcohol — revised',
  system: 'psychiatry',
  specialty: ['Emergency Medicine', 'Internal Medicine', 'Psychiatry', 'Critical Care'],
  tags: ['alcohol', 'withdrawal', 'CIWA', 'delirium tremens', 'benzodiazepine', 'detox'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Sullivan JT et al.',
  creatorYear: '1989',
  description: 'The CIWA-Ar is a 10-item assessment tool used to quantify the severity of alcohol withdrawal and guide symptom-triggered benzodiazepine therapy. It evaluates nausea/vomiting, tremor, paroxysmal sweats, anxiety, agitation, tactile/auditory/visual disturbances, headache, and orientation. Scores guide dosing of benzodiazepines (typically chlordiazepoxide, lorazepam, or diazepam).',
  whyUse: 'Standardizes alcohol withdrawal assessment. Enables symptom-triggered therapy (reduces total benzodiazepine use vs. fixed-dose schedules). Identifies patients at risk for severe withdrawal and delirium tremens.',
  whenToUse: [
    'Suspected or confirmed alcohol withdrawal',
    'Inpatient monitoring of alcohol withdrawal every 1-4 hours',
    'Guiding benzodiazepine dosing in withdrawal protocols',
  ],
  nextSteps: 'Score < 10: Mild withdrawal, may not require medication. Score 10-18: Moderate withdrawal, initiate symptom-triggered benzodiazepines. Score > 20: Severe withdrawal, higher doses, consider ICU. Score > 35: Risk of seizures and delirium tremens, aggressive treatment.',
  pearls: [
    'Symptom-triggered therapy (give benzos only when CIWA ≥ 10) is preferred over fixed-dose schedules.',
    'Assess CIWA every 1-4 hours during active withdrawal; increase frequency if scores rising.',
    'CIWA cannot be reliably used in intubated, sedated, or severely altered patients.',
    'Peak withdrawal typically occurs 24-72 hours after last drink; delirium tremens at 48-96 hours.',
    'Seizures can occur before CIWA scores are high — maintain clinical vigilance.',
    'Consider thiamine (100-500 mg IV) and folate supplementation in all alcohol withdrawal patients.',
  ],
  evidence: 'Developed by Sullivan et al. (Br J Addiction, 1989). Extensively validated. Symptom-triggered therapy shown to reduce treatment duration, total benzodiazepine dose, and ICU admissions (Saitz et al., JAMA 1994).',
  formula: 'Sum of 10 items (0-7 each, except orientation 0-4):\nNausea/Vomiting (0-7), Tremor (0-7), Paroxysmal Sweats (0-7),\nAnxiety (0-7), Agitation (0-7), Tactile disturbances (0-7),\nAuditory disturbances (0-7), Visual disturbances (0-7),\nHeadache (0-7), Orientation/clouding (0-4)\nTotal: 0-67',
  references: [
    { text: 'Sullivan JT et al. Assessment of alcohol withdrawal: the revised clinical institute withdrawal assessment for alcohol scale (CIWA-Ar). Br J Addiction. 1989;84(11):1353-1357.', url: 'https://pubmed.ncbi.nlm.nih.gov/2597811/' },
    { text: 'Saitz R et al. Individualized treatment for alcohol withdrawal. JAMA. 1994;272(7):519-523.', url: 'https://pubmed.ncbi.nlm.nih.gov/8046805/' },
  ],
  links: [
    { title: 'MDCalc — CIWA-Ar', url: 'https://www.mdcalc.com/calc/1736/ciwa-ar-alcohol-withdrawal', description: 'Interactive CIWA-Ar calculator' },
  ],
  interpretations: [
    { range: '0-9', label: 'Mild withdrawal', action: 'May not require pharmacotherapy; monitor every 4-8 hours' },
    { range: '10-18', label: 'Moderate withdrawal', action: 'Symptom-triggered benzodiazepine therapy; monitor every 1-2 hours' },
    { range: '19-35', label: 'Severe withdrawal', action: 'Aggressive benzodiazepine dosing; consider ICU admission; monitor hourly' },
    { range: '>35', label: 'Very severe — delirium tremens risk', action: 'ICU required; high-dose benzodiazepines; consider phenobarbital or propofol if refractory' },
  ],
  fields: [
    { key: 'nausea', label: 'Nausea and Vomiting', type: 'score_picker', options: [{ value: 0, label: 'None (0)' }, { value: 1, label: 'Mild nausea, no vomiting (1)' }, { value: 4, label: 'Intermittent nausea/dry heaves (4)' }, { value: 7, label: 'Constant nausea, frequent dry heaves/vomiting (7)' }] },
    { key: 'tremor', label: 'Tremor (arms extended, fingers spread)', type: 'score_picker', options: [{ value: 0, label: 'No tremor (0)' }, { value: 1, label: 'Not visible, can be felt (1)' }, { value: 4, label: 'Moderate, with arms extended (4)' }, { value: 7, label: 'Severe, even without arms extended (7)' }] },
    { key: 'sweats', label: 'Paroxysmal Sweats', type: 'score_picker', options: [{ value: 0, label: 'No sweats visible (0)' }, { value: 1, label: 'Barely perceptible sweating, moist palms (1)' }, { value: 4, label: 'Beads of sweat obvious on forehead (4)' }, { value: 7, label: 'Drenching sweats (7)' }] },
    { key: 'anxiety', label: 'Anxiety', type: 'score_picker', options: [{ value: 0, label: 'No anxiety, at ease (0)' }, { value: 1, label: 'Mildly anxious (1)' }, { value: 4, label: 'Moderately anxious or guarded (4)' }, { value: 7, label: 'Equivalent to acute panic states (7)' }] },
    { key: 'agitation', label: 'Agitation', type: 'score_picker', options: [{ value: 0, label: 'Normal activity (0)' }, { value: 1, label: 'Somewhat more than normal activity (1)' }, { value: 4, label: 'Moderately fidgety and restless (4)' }, { value: 7, label: 'Paces or constantly thrashes about (7)' }] },
    { key: 'tactile', label: 'Tactile Disturbances', type: 'score_picker', options: [{ value: 0, label: 'None (0)' }, { value: 1, label: 'Mild itching, burning, numbness (1)' }, { value: 4, label: 'Moderate hallucinations (4)' }, { value: 7, label: 'Continuous tactile hallucinations (7)' }] },
    { key: 'auditory', label: 'Auditory Disturbances', type: 'score_picker', options: [{ value: 0, label: 'Not present (0)' }, { value: 1, label: 'Mildly startled by sounds (1)' }, { value: 4, label: 'Moderate hallucinations (4)' }, { value: 7, label: 'Continuous auditory hallucinations (7)' }] },
    { key: 'visual', label: 'Visual Disturbances', type: 'score_picker', options: [{ value: 0, label: 'Not present (0)' }, { value: 1, label: 'Mild sensitivity to light (1)' }, { value: 4, label: 'Moderate hallucinations (4)' }, { value: 7, label: 'Continuous visual hallucinations (7)' }] },
    { key: 'headache', label: 'Headache / Fullness in Head', type: 'score_picker', options: [{ value: 0, label: 'Not present (0)' }, { value: 1, label: 'Very mild (1)' }, { value: 4, label: 'Moderately severe (4)' }, { value: 7, label: 'Extremely severe (7)' }] },
    { key: 'orientation', label: 'Orientation and Clouding of Sensorium', type: 'score_picker', options: [{ value: 0, label: 'Oriented, can do serial additions (0)' }, { value: 1, label: 'Cannot do serial additions or uncertain about date (1)' }, { value: 2, label: 'Date uncertain by more than 2 days (2)' }, { value: 3, label: 'Disoriented in date by > 2 days (3)' }, { value: 4, label: 'Disoriented in place and/or person (4)' }] },
  ],
  calculate: (vals) => {
    const fields = ['nausea', 'tremor', 'sweats', 'anxiety', 'agitation', 'tactile', 'auditory', 'visual', 'headache', 'orientation']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let severity = ''
    if (score < 10) severity = 'Mild withdrawal — may not require pharmacotherapy'
    else if (score <= 18) severity = 'Moderate withdrawal — symptom-triggered benzodiazepines recommended'
    else if (score <= 35) severity = 'Severe withdrawal — aggressive treatment, consider ICU'
    else severity = 'Very severe — high risk of delirium tremens and seizures'
    return {
      result: String(score),
      unit: 'points (0-67)',
      interpretation: severity,
    }
  },
}
