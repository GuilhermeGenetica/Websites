export default {
  id: 'apgar',
  name: 'APGAR Score',
  shortDescription: 'Rapid assessment of newborn clinical status at birth',
  system: 'pediatrics',
  specialty: ['Pediatrics', 'Neonatology', 'Obstetrics'],
  tags: ['newborn', 'neonatal', 'APGAR', 'birth', 'delivery', 'resuscitation'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Virginia Apgar',
  creatorYear: '1953',
  description: 'The APGAR score provides a standardized assessment of newborn status at 1 and 5 minutes after birth. It evaluates five components: Appearance (skin color), Pulse (heart rate), Grimace (reflex irritability), Activity (muscle tone), and Respiration. It guides the need for immediate resuscitative interventions.',
  whyUse: 'Universal standard for newborn assessment. Quick bedside tool to determine need for resuscitation. Tracks response to resuscitation interventions. Part of every delivery documentation.',
  whenToUse: [
    'Every delivery at 1 and 5 minutes of life',
    'Extended scoring at 10, 15, 20 minutes if score remains < 7',
    'Assessment of resuscitation response',
  ],
  nextSteps: 'Score 7-10: Normal, routine care. Score 4-6: Some resuscitation needed (stimulation, O2, PPV). Score 0-3: Aggressive resuscitation (intubation, chest compressions, medications).',
  pearls: [
    'APGAR is an assessment tool, NOT an indication for resuscitation — NRP algorithms guide actual interventions.',
    'Low 1-minute APGAR prompts intervention; 5-minute score is more predictive of outcomes.',
    'Score < 7 at 5 minutes: continue scoring every 5 minutes up to 20 minutes.',
    'APGAR does not predict long-term neurological outcome when used in isolation.',
    'Premature infants tend to have lower scores without necessarily being "sicker".',
    'Named as both an acronym AND after Dr. Virginia Apgar.',
  ],
  evidence: 'Published by Virginia Apgar in 1953. Universally adopted worldwide. Validated as a rapid clinical assessment tool. Low 5-minute APGAR associated with increased neonatal mortality, but poor predictor of long-term CP or developmental outcome.',
  formula: 'Sum of 5 components (0-2 each):\nAppearance, Pulse, Grimace, Activity, Respiration\nTotal: 0-10',
  references: [
    { text: 'Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32(4):260-267.', url: 'https://pubmed.ncbi.nlm.nih.gov/13083014/' },
    { text: 'American Academy of Pediatrics. The Apgar Score. Pediatrics. 2015;136(4):819-822.', url: 'https://pubmed.ncbi.nlm.nih.gov/26416932/' },
  ],
  links: [
    { title: 'MDCalc — APGAR Score', url: 'https://www.mdcalc.com/calc/23/apgar-score', description: 'Interactive APGAR calculator' },
  ],
  interpretations: [
    { range: '0-3', label: 'Critically depressed', action: 'Immediate aggressive resuscitation per NRP algorithm' },
    { range: '4-6', label: 'Moderately depressed', action: 'Stimulation, suctioning, oxygen, positive-pressure ventilation as needed' },
    { range: '7-10', label: 'Reassuring', action: 'Routine newborn care; skin-to-skin contact' },
  ],
  fields: [
    {
      key: 'appearance', label: 'Appearance (Skin Color)', type: 'score_picker',
      options: [
        { value: 0, label: 'Blue/pale all over (0)' },
        { value: 1, label: 'Acrocyanosis (body pink, extremities blue) (1)' },
        { value: 2, label: 'Completely pink (2)' },
      ],
    },
    {
      key: 'pulse', label: 'Pulse (Heart Rate)', type: 'score_picker',
      options: [
        { value: 0, label: 'Absent (0)' },
        { value: 1, label: '< 100 bpm (1)' },
        { value: 2, label: '≥ 100 bpm (2)' },
      ],
    },
    {
      key: 'grimace', label: 'Grimace (Reflex Irritability)', type: 'score_picker',
      options: [
        { value: 0, label: 'No response (0)' },
        { value: 1, label: 'Grimace/feeble cry (1)' },
        { value: 2, label: 'Cry, cough, sneeze (2)' },
      ],
    },
    {
      key: 'activity', label: 'Activity (Muscle Tone)', type: 'score_picker',
      options: [
        { value: 0, label: 'Limp (0)' },
        { value: 1, label: 'Some flexion (1)' },
        { value: 2, label: 'Active motion (2)' },
      ],
    },
    {
      key: 'respiration', label: 'Respiration', type: 'score_picker',
      options: [
        { value: 0, label: 'Absent (0)' },
        { value: 1, label: 'Slow/irregular (1)' },
        { value: 2, label: 'Good cry (2)' },
      ],
    },
  ],
  calculate: (vals) => {
    const fields = ['appearance', 'pulse', 'grimace', 'activity', 'respiration']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 3) interp = 'Critically depressed — immediate resuscitation'
    else if (score <= 6) interp = 'Moderately depressed — active intervention needed'
    else interp = 'Reassuring — routine care'
    return {
      result: String(score),
      unit: 'points (0-10)',
      interpretation: interp,
      breakdown: [
        { label: 'Appearance', value: String(vals.appearance) },
        { label: 'Pulse', value: String(vals.pulse) },
        { label: 'Grimace', value: String(vals.grimace) },
        { label: 'Activity', value: String(vals.activity) },
        { label: 'Respiration', value: String(vals.respiration) },
      ],
    }
  },
}
