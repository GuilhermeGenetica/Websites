export default {
  id: 'nexus_cspine',
  name: 'NEXUS C-Spine Rule',
  shortDescription: 'Identifies trauma patients who do NOT need cervical spine imaging',
  system: 'surgery_trauma',
  specialty: ['Emergency Medicine', 'Trauma Surgery'],
  tags: ['NEXUS', 'c-spine', 'cervical spine', 'trauma', 'imaging', 'clearance'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Hoffman JR et al.',
  creatorYear: '2000',
  description: 'The NEXUS (National Emergency X-Radiography Utilization Study) criteria identify alert, stable trauma patients who do not require cervical spine imaging. If ALL five criteria are met (absent), the c-spine can be clinically cleared without radiography. Sensitivity > 99% for clinically significant c-spine injury.',
  whyUse: 'Safely reduces unnecessary c-spine imaging in low-risk trauma patients. Saves time, cost, and radiation exposure. Validated in > 34,000 patients.',
  whenToUse: [
    'Blunt trauma patients presenting to the ED',
    'Decision on c-spine imaging after trauma',
    'Clinical c-spine clearance',
  ],
  nextSteps: 'All criteria absent (NEXUS negative): C-spine can be cleared clinically — no imaging needed. Any criterion present: C-spine imaging required (CT preferred over plain films in most settings).',
  pearls: [
    'ALL five criteria must be ABSENT to clear the c-spine.',
    'NEXUS applies to blunt trauma only — not penetrating trauma.',
    'Intoxicated patients cannot have midline tenderness reliably assessed — image them.',
    'Canadian C-Spine Rule has slightly higher sensitivity and specificity in ambulatory patients.',
    'NEXUS may miss injuries in the elderly — consider lower threshold for imaging in patients > 65.',
    'Distracting injury is subjective — err on the side of imaging if uncertain.',
  ],
  evidence: 'Hoffman et al. (N Engl J Med, 2000). Prospective study of 34,069 patients. Sensitivity 99.6% (missed 8 of 818 injuries; only 2 clinically significant). NPV 99.9%.',
  formula: 'C-spine imaging NOT needed if ALL absent:\n1. No posterior midline cervical tenderness\n2. No focal neurological deficit\n3. Normal alertness\n4. No intoxication\n5. No painful distracting injury',
  references: [
    { text: 'Hoffman JR et al. Validity of a set of clinical criteria to rule out injury to the cervical spine in patients with blunt trauma. N Engl J Med. 2000;343(2):94-99.', url: 'https://pubmed.ncbi.nlm.nih.gov/10891516/' },
  ],
  links: [
    { title: 'MDCalc — NEXUS C-Spine', url: 'https://www.mdcalc.com/calc/696/nexus-criteria-c-spine-imaging', description: 'Interactive NEXUS criteria' },
  ],
  interpretations: [
    { range: '0', label: 'NEXUS NEGATIVE — low risk', action: 'C-spine can be cleared clinically; no imaging needed' },
    { range: '1-5', label: 'NEXUS POSITIVE — cannot clear', action: 'C-spine imaging required (CT preferred)' },
  ],
  fields: [
    { key: 'tenderness', label: 'Posterior midline cervical tenderness', type: 'score_picker', options: [{ value: 0, label: 'Absent' }, { value: 1, label: 'Present (+1)' }] },
    { key: 'neuro_deficit', label: 'Focal neurological deficit', type: 'score_picker', options: [{ value: 0, label: 'Absent' }, { value: 1, label: 'Present (+1)' }] },
    { key: 'alertness', label: 'Decreased alertness (GCS < 15)', type: 'score_picker', options: [{ value: 0, label: 'Alert (GCS 15)' }, { value: 1, label: 'Decreased alertness (+1)' }] },
    { key: 'intoxication', label: 'Intoxication', type: 'score_picker', options: [{ value: 0, label: 'Not intoxicated' }, { value: 1, label: 'Intoxicated (+1)' }] },
    { key: 'distracting', label: 'Painful distracting injury', type: 'score_picker', options: [{ value: 0, label: 'Absent' }, { value: 1, label: 'Present (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['tenderness', 'neuro_deficit', 'alertness', 'intoxication', 'distracting']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score === 0) interp = 'NEXUS NEGATIVE — c-spine can be cleared clinically without imaging'
    else interp = `NEXUS POSITIVE (${score} criterion${score > 1 ? 'a' : ''} present) — c-spine imaging required`
    return {
      result: score === 0 ? 'CLEAR' : 'IMAGE',
      unit: `${score}/5 criteria present`,
      interpretation: interp,
    }
  },
}
