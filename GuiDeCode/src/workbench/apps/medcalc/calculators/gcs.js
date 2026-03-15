export default {
  id: 'gcs',
  name: 'Glasgow Coma Scale (GCS)',
  shortDescription: 'Standardized assessment of consciousness level after brain injury',
  system: 'neurology',
  specialty: ['Emergency Medicine', 'Neurology', 'Neurosurgery', 'Critical Care'],
  tags: ['coma', 'consciousness', 'brain injury', 'trauma', 'GCS', 'neuro'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Teasdale G, Jennett B',
  creatorYear: '1974',
  description: 'The Glasgow Coma Scale (GCS) is the most widely used scoring system for quantifying the level of consciousness in acute medical and trauma patients. It evaluates three components: eye opening, verbal response, and motor response. The total score ranges from 3 (deep coma) to 15 (fully alert). GCS is integral to trauma assessment, ICU monitoring, and prognostication after head injury.',
  whyUse: 'Universal language for describing level of consciousness. Required component of trauma assessment (ATLS). Guides intubation decisions (GCS ≤ 8). Prognostic indicator after traumatic brain injury.',
  whenToUse: [
    'Initial assessment of trauma or head injury patients',
    'ICU monitoring of neurological status',
    'Decision-making for intubation (GCS ≤ 8 = protect airway)',
    'Serial assessment to detect neurological deterioration',
    'Triage and severity classification of traumatic brain injury',
  ],
  nextSteps: 'GCS 13-15: Mild TBI. GCS 9-12: Moderate TBI, consider CT and close monitoring. GCS 3-8: Severe TBI, intubate and secure airway, urgent CT, neurosurgical consultation.',
  pearls: [
    'Always report individual components (e.g., E3V4M5 = 12) rather than just the total.',
    'GCS ≤ 8 is the classic threshold for intubation ("GCS 8, intubate").',
    'Motor component alone is the strongest predictor of outcome.',
    'GCS cannot be reliably assessed in intubated/sedated patients — document "T" for verbal if intubated.',
    'Asymmetric motor response: always score the BEST response observed.',
    'Alcohol and drugs confound GCS — reassess after metabolic clearance.',
  ],
  evidence: 'Original publication in Lancet 1974. Updated GCS-Pupils (GCS-P) in 2018 adds pupil reactivity. Validated in thousands of studies as predictor of TBI outcome. IMPACT and CRASH models incorporate GCS for TBI prognostication.',
  formula: 'GCS = Eye (1-4) + Verbal (1-5) + Motor (1-6)\nTotal range: 3-15\nSevere: 3-8 | Moderate: 9-12 | Mild: 13-15',
  references: [
    { text: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness: a practical scale. Lancet. 1974;2(7872):81-84.', url: 'https://pubmed.ncbi.nlm.nih.gov/4136544/' },
    { text: 'Teasdale G et al. The Glasgow Coma Scale at 40 years: standing the test of time. Lancet Neurol. 2014;13(8):844-854.', url: 'https://pubmed.ncbi.nlm.nih.gov/25030516/' },
  ],
  links: [
    { title: 'MDCalc — Glasgow Coma Scale', url: 'https://www.mdcalc.com/calc/64/glasgow-coma-scale-score-gcs', description: 'Interactive GCS calculator' },
    { title: 'GCS Official Site', url: 'https://www.glasgowcomascale.org/', description: 'Official GCS resource by Sir Graham Teasdale' },
  ],
  interpretations: [
    { range: '3', label: 'Deep coma / unresponsive', action: 'Secure airway, intubate, urgent imaging, neurosurgical consult' },
    { range: '4-5', label: 'Severe impairment', action: 'Intubate, ICU admission, urgent CT, consider ICP monitoring' },
    { range: '6-8', label: 'Severe TBI (comatose)', action: 'Intubate (GCS ≤ 8), ICU, CT head, neurosurgery consult' },
    { range: '9-12', label: 'Moderate TBI', action: 'CT head, close neurological monitoring, consider ICU' },
    { range: '13-14', label: 'Mild TBI', action: 'CT if indicated (Canadian CT Head Rule), observation' },
    { range: '15', label: 'Fully alert and oriented', action: 'Standard assessment; imaging only if clinical concern' },
  ],
  fields: [
    {
      key: 'eye', label: 'Eye Opening', type: 'score_picker',
      options: [
        { value: 1, label: 'None (1)' },
        { value: 2, label: 'To pressure (2)' },
        { value: 3, label: 'To voice (3)' },
        { value: 4, label: 'Spontaneous (4)' },
      ],
    },
    {
      key: 'verbal', label: 'Verbal Response', type: 'score_picker',
      options: [
        { value: 1, label: 'None (1)' },
        { value: 2, label: 'Incomprehensible sounds (2)' },
        { value: 3, label: 'Inappropriate words (3)' },
        { value: 4, label: 'Confused (4)' },
        { value: 5, label: 'Oriented (5)' },
      ],
    },
    {
      key: 'motor', label: 'Motor Response', type: 'score_picker',
      options: [
        { value: 1, label: 'None (1)' },
        { value: 2, label: 'Extension (decerebrate) (2)' },
        { value: 3, label: 'Abnormal flexion (decorticate) (3)' },
        { value: 4, label: 'Withdrawal (4)' },
        { value: 5, label: 'Localizing pain (5)' },
        { value: 6, label: 'Obeys commands (6)' },
      ],
    },
  ],
  calculate: (vals) => {
    const fields = ['eye', 'verbal', 'motor']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const e = parseInt(vals.eye) || 0
    const v = parseInt(vals.verbal) || 0
    const m = parseInt(vals.motor) || 0
    const score = e + v + m
    let severity = ''
    if (score <= 8) severity = 'Severe TBI — intubate and protect airway'
    else if (score <= 12) severity = 'Moderate TBI — close monitoring required'
    else if (score <= 14) severity = 'Mild TBI — observe, consider CT'
    else severity = 'Normal — fully alert and oriented'
    return {
      result: String(score),
      unit: 'points (3-15)',
      interpretation: severity,
      detail: `E${e}V${v}M${m} = ${score}`,
      breakdown: [
        { label: 'Eye Opening (E)', value: String(e) },
        { label: 'Verbal Response (V)', value: String(v) },
        { label: 'Motor Response (M)', value: String(m) },
      ],
    }
  },
}
