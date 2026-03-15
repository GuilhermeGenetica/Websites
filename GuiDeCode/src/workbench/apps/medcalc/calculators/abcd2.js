export default {
  id: 'abcd2',
  name: 'ABCD² Score',
  shortDescription: 'Stroke risk stratification after transient ischemic attack (TIA)',
  system: 'neurology',
  specialty: ['Emergency Medicine', 'Neurology', 'Internal Medicine'],
  tags: ['TIA', 'stroke', 'ABCD2', 'transient ischemic attack', 'cerebrovascular'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Johnston SC et al.',
  creatorYear: '2007',
  description: 'The ABCD² score estimates the short-term risk (2, 7, and 90 days) of stroke following a transient ischemic attack. It uses five factors: Age, Blood pressure, Clinical features, Duration of symptoms, and Diabetes to stratify patients into risk categories and guide urgency of evaluation.',
  whyUse: 'Risk-stratifies TIA patients for urgent vs. outpatient workup. Identifies patients who need emergent imaging and hospital admission. Guides timing of carotid imaging and antiplatelet initiation.',
  whenToUse: [
    'After confirmed or suspected TIA',
    'ED disposition decisions for TIA patients',
    'Determining urgency of neurology consultation and imaging',
  ],
  nextSteps: 'Score 0-3: Low risk (~1% 2-day stroke risk). Score 4-5: Moderate risk (~4%). Score 6-7: High risk (~8%). All TIA patients need urgent workup; high-score patients need admission and emergent evaluation.',
  pearls: [
    'ABCD² should NOT be used alone to decide on discharge — all TIA patients need urgent workup.',
    'AHA/ASA recommends evaluation within 24-48 hours for all TIA patients regardless of score.',
    'Additional high-risk features not in ABCD²: dual TIA (crescendo), AF, carotid stenosis, DWI positive.',
    'The score does not account for etiology — always investigate underlying cause.',
    'Combination with imaging (DWI-MRI, carotid imaging) improves risk prediction.',
  ],
  evidence: 'Derived and validated by Johnston et al. (Lancet 2007) from pooled data of >4,800 TIA patients. 2-day stroke risk ranges from 1% (score 0-3) to 8.1% (score 6-7). Subsequent studies suggest ABCD² alone has limited ability to identify all high-risk patients.',
  formula: 'A = Age ≥ 60 (+1)\nB = BP ≥ 140/90 at presentation (+1)\nC = Clinical: unilateral weakness (+2), speech disturbance without weakness (+1)\nD = Duration: ≥ 60 min (+2), 10-59 min (+1)\nD = Diabetes (+1)\nTotal: 0-7',
  references: [
    { text: 'Johnston SC et al. Validation and refinement of scores to predict very early stroke risk after transient ischaemic attack. Lancet. 2007;369(9558):283-292.', url: 'https://pubmed.ncbi.nlm.nih.gov/17258668/' },
  ],
  links: [
    { title: 'MDCalc — ABCD2', url: 'https://www.mdcalc.com/calc/715/abcd2-score-tia', description: 'Interactive ABCD2 calculator' },
  ],
  interpretations: [
    { range: '0-3', label: 'Low risk (~1.0% 2-day stroke risk)', action: 'Urgent outpatient workup within 24-48h; antiplatelet therapy' },
    { range: '4-5', label: 'Moderate risk (~4.1% 2-day stroke risk)', action: 'Consider admission; urgent imaging and neurology consult' },
    { range: '6-7', label: 'High risk (~8.1% 2-day stroke risk)', action: 'Hospital admission; emergent MRI/CTA, carotid imaging, cardiology workup' },
  ],
  fields: [
    { key: 'age', label: 'Age ≥ 60 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'bp', label: 'BP ≥ 140/90 mmHg at initial evaluation', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    {
      key: 'clinical', label: 'Clinical features', type: 'score_picker',
      options: [
        { value: 0, label: 'Other symptoms (0)' },
        { value: 1, label: 'Speech disturbance without weakness (+1)' },
        { value: 2, label: 'Unilateral weakness (+2)' },
      ],
    },
    {
      key: 'duration', label: 'Duration of symptoms', type: 'score_picker',
      options: [
        { value: 0, label: '< 10 minutes (0)' },
        { value: 1, label: '10-59 minutes (+1)' },
        { value: 2, label: '≥ 60 minutes (+2)' },
      ],
    },
    { key: 'diabetes', label: 'Diabetes mellitus', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['age', 'bp', 'clinical', 'duration', 'diabetes']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 3) interp = 'Low risk (~1.0% 2-day stroke risk) — urgent outpatient workup'
    else if (score <= 5) interp = 'Moderate risk (~4.1% 2-day stroke risk) — consider admission'
    else interp = 'High risk (~8.1% 2-day stroke risk) — hospital admission recommended'
    return {
      result: String(score),
      unit: 'points (0-7)',
      interpretation: interp,
    }
  },
}
