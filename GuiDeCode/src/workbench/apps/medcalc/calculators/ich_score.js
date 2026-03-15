export default {
  id: 'ich_score',
  name: 'ICH Score',
  shortDescription: '30-day mortality prediction in spontaneous intracerebral hemorrhage.',
  system: 'neurology',
  specialty: ['Neurology', 'Neurosurgery', 'Emergency Medicine', 'Critical Care'],
  tags: ['ICH', 'intracerebral hemorrhage', 'stroke', 'mortality', 'prognosis'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Hemphill JC et al.',
  creatorYear: '2001',
  description: 'The ICH Score is a validated clinical grading scale for predicting 30-day mortality in patients with spontaneous intracerebral hemorrhage. It uses 5 clinical and radiographic variables.',
  whyUse: 'Simple, rapid bedside tool validated in multiple cohorts. Guides prognosis discussions and helps stratify patients for intensive care vs. palliative approaches.',
  whenToUse: [
    'Adults with spontaneous (non-traumatic) intracerebral hemorrhage on CT',
    'Goal-of-care discussions and prognostication',
    'Triaging ICU vs. step-down level of care',
  ],
  nextSteps: 'Score 0: 0% 30-day mortality. Score 1: 13%. Score 2: 26%. Score 3: 72%. Score 4: 97%. Score 5: 100%. Use alongside clinical judgment and family discussions.',
  pearls: [
    'Score was derived to predict 30-day mortality, not functional outcome.',
    'Do Not Resuscitate orders placed early may be a confounding factor (self-fulfilling prophecy).',
    'GCS score is the most impactful variable.',
    'Infratentorial location (cerebellum/brainstem) adds 1 point.',
  ],
  evidence: 'Hemphill et al. Stroke 2001. Validated in 152 patients; AUC 0.97 for 30-day mortality. Multiple external validation studies confirmed predictive accuracy.',
  formula: `GCS 3-4: +2 | GCS 5-12: +1 | GCS 13-15: 0
ICH volume ≥30 cm³: +1
IVH present: +1
Infratentorial origin: +1
Age ≥80: +1
Total: 0-6`,
  references: [
    { text: 'Hemphill JC et al. The ICH Score: a simple, reliable grading scale for intracerebral hemorrhage. Stroke. 2001;32(4):891-897.', url: 'https://pubmed.ncbi.nlm.nih.gov/11283388/' },
    { text: 'Broderick J et al. Guidelines for the Management of Spontaneous Intracerebral Hemorrhage. Stroke. 2007;38(6):2001-2023.', url: 'https://pubmed.ncbi.nlm.nih.gov/17478736/' },
  ],
  links: [
    { title: 'MDCalc — ICH Score', url: 'https://www.mdcalc.com/calc/402/ich-score', description: 'Interactive ICH Score calculator' },
  ],
  interpretations: [
    { range: '0', label: '0% 30-day mortality', action: 'Excellent prognosis; aggressive management appropriate' },
    { range: '1', label: '13% 30-day mortality', action: 'Good prognosis; full treatment recommended' },
    { range: '2', label: '26% 30-day mortality', action: 'Moderate risk; individualize treatment goals' },
    { range: '3', label: '72% 30-day mortality', action: 'High risk; early goals-of-care discussion' },
    { range: '4', label: '97% 30-day mortality', action: 'Very high risk; comfort-focused care discussion' },
    { range: '5-6', label: '100% 30-day mortality', action: 'Near-certain mortality; palliative approach' },
  ],
  fields: [
    {
      key: 'gcs', label: 'GCS Score', type: 'select',
      options: [
        { value: 2, label: 'GCS 3-4 (+2)' },
        { value: 1, label: 'GCS 5-12 (+1)' },
        { value: 0, label: 'GCS 13-15 (0)' },
      ],
    },
    {
      key: 'volume', label: 'ICH Volume', type: 'select',
      options: [{ value: 1, label: '≥30 cm³ (+1)' }, { value: 0, label: '<30 cm³ (0)' }],
    },
    {
      key: 'ivh', label: 'Intraventricular Hemorrhage (IVH)', type: 'select',
      options: [{ value: 1, label: 'Yes (+1)' }, { value: 0, label: 'No (0)' }],
    },
    {
      key: 'infratentorial', label: 'Infratentorial Origin (cerebellum/brainstem)', type: 'select',
      options: [{ value: 1, label: 'Yes (+1)' }, { value: 0, label: 'No (0)' }],
    },
    {
      key: 'age', label: 'Age ≥80 years', type: 'select',
      options: [{ value: 1, label: 'Yes (+1)' }, { value: 0, label: 'No (0)' }],
    },
  ],
  calculate(fields) {
    const score = ['gcs','volume','ivh','infratentorial','age'].reduce((s, k) => s + parseFloat(fields[k] || 0), 0)
    const mortalityMap = { 0: '0%', 1: '13%', 2: '26%', 3: '72%', 4: '97%', 5: '100%', 6: '100%' }
    const mortality = mortalityMap[score] || '100%'
    const breakdown = [
      { label: 'GCS', value: `+${fields.gcs}` },
      { label: 'ICH Volume', value: `+${fields.volume}` },
      { label: 'IVH', value: `+${fields.ivh}` },
      { label: 'Infratentorial', value: `+${fields.infratentorial}` },
      { label: 'Age ≥80', value: `+${fields.age}` },
    ]
    let action = ''
    if (score <= 1) action = 'Full aggressive management recommended'
    else if (score === 2) action = 'Individualize treatment goals'
    else if (score === 3) action = 'Early goals-of-care discussion'
    else action = 'Palliative / comfort-focused care discussion'
    return {
      result: score,
      unit: `/ 6 — 30-day mortality: ${mortality}`,
      interpretation: action,
      breakdown,
    }
  },
}
