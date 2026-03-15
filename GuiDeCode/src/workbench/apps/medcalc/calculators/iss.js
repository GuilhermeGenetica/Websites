export default {
  id: 'iss',
  name: 'ISS — Injury Severity Score',
  shortDescription: 'Anatomical scoring system for trauma severity based on AIS regions.',
  system: 'surgery_trauma',
  specialty: ['Emergency Medicine', 'Trauma Surgery', 'Critical Care', 'Orthopedics'],
  tags: ['ISS', 'trauma', 'injury severity', 'AIS', 'ATLS', 'mortality', 'triage'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Baker SP et al.',
  creatorYear: '1974',
  description: 'The Injury Severity Score (ISS) is an anatomical scoring system for trauma patients. It uses the Abbreviated Injury Scale (AIS) to score injuries in 6 body regions, then sums the squares of the three most severely injured regions.',
  whyUse: 'Standard research and trauma registry metric. ISS ≥16 defines major trauma. Predicts mortality, hospital LOS, and resource utilization.',
  whenToUse: [
    'Trauma patients with injuries in multiple body regions',
    'Trauma registry and epidemiological research',
    'Benchmarking trauma center performance',
    'Triage and resource allocation decisions',
  ],
  nextSteps: 'ISS <9: Minor trauma. ISS 9-15: Moderate. ISS 16-24: Severe. ISS ≥25: Critical. ISS = 75 if any AIS = 6 (unsurvivable). Consider TRISS for mortality prediction combining ISS with RTS and age.',
  pearls: [
    'Only the highest AIS in each body region counts.',
    'ISS = sum of squares of the 3 highest AIS region scores.',
    'AIS = 6 in any region automatically sets ISS = 75.',
    'ISS does not account for multiple injuries in the same body region.',
    'New Injury Severity Score (NISS) = sum of squares of 3 highest AIS regardless of region (may be superior).',
  ],
  evidence: 'Baker et al. J Trauma 1974. Validated against mortality in thousands of trauma patients. ISS ≥16 = major trauma threshold widely adopted.',
  formula: `ISS = AIS_region1² + AIS_region2² + AIS_region3² (three most severely injured regions)
AIS scale: 1=Minor, 2=Moderate, 3=Serious, 4=Severe, 5=Critical, 6=Unsurvivable (→ISS=75)
Regions: Head/Neck, Face, Chest, Abdomen, Extremities, External`,
  references: [
    { text: 'Baker SP et al. The injury severity score: a method for describing patients with multiple injuries and evaluating emergency care. J Trauma. 1974;14(3):187-196.', url: 'https://pubmed.ncbi.nlm.nih.gov/4814394/' },
    { text: 'Copes WS et al. The Injury Severity Score revisited. J Trauma. 1988;28(1):69-77.', url: 'https://pubmed.ncbi.nlm.nih.gov/3123707/' },
  ],
  links: [
    { title: 'MDCalc — ISS', url: 'https://www.mdcalc.com/calc/1982/injury-severity-score-iss', description: 'Interactive ISS calculator' },
    { title: 'AAAM — AIS Reference', url: 'https://www.aaam.org/abbreviated-injury-scale-ais/', description: 'Official AIS reference' },
  ],
  interpretations: [
    { range: '0-8', label: 'Minor trauma', action: 'Low mortality; standard care' },
    { range: '9-15', label: 'Moderate trauma', action: 'Increased monitoring; possible surgical intervention' },
    { range: '16-24', label: 'Severe trauma', action: 'Major trauma; trauma team activation; ICU likely' },
    { range: '25-74', label: 'Critical trauma', action: 'High mortality risk; immediate surgery/ICU; trauma center' },
    { range: '75', label: 'Maximum score (AIS 6 in any region)', action: 'Unsurvivable injury pattern; palliative consideration' },
  ],
  fields: [
    {
      key: 'head_neck', label: 'Head & Neck — Worst AIS', type: 'select',
      options: [{ value: 0, label: 'No injury (0)' }, { value: 1, label: '1 — Minor' }, { value: 2, label: '2 — Moderate' }, { value: 3, label: '3 — Serious' }, { value: 4, label: '4 — Severe' }, { value: 5, label: '5 — Critical' }, { value: 6, label: '6 — Unsurvivable' }],
    },
    {
      key: 'face', label: 'Face — Worst AIS', type: 'select',
      options: [{ value: 0, label: 'No injury (0)' }, { value: 1, label: '1 — Minor' }, { value: 2, label: '2 — Moderate' }, { value: 3, label: '3 — Serious' }, { value: 4, label: '4 — Severe' }, { value: 5, label: '5 — Critical' }, { value: 6, label: '6 — Unsurvivable' }],
    },
    {
      key: 'chest', label: 'Chest (Thorax) — Worst AIS', type: 'select',
      options: [{ value: 0, label: 'No injury (0)' }, { value: 1, label: '1 — Minor' }, { value: 2, label: '2 — Moderate' }, { value: 3, label: '3 — Serious' }, { value: 4, label: '4 — Severe' }, { value: 5, label: '5 — Critical' }, { value: 6, label: '6 — Unsurvivable' }],
    },
    {
      key: 'abdomen', label: 'Abdomen / Pelvic contents — Worst AIS', type: 'select',
      options: [{ value: 0, label: 'No injury (0)' }, { value: 1, label: '1 — Minor' }, { value: 2, label: '2 — Moderate' }, { value: 3, label: '3 — Serious' }, { value: 4, label: '4 — Severe' }, { value: 5, label: '5 — Critical' }, { value: 6, label: '6 — Unsurvivable' }],
    },
    {
      key: 'extremities', label: 'Extremities / Pelvic girdle — Worst AIS', type: 'select',
      options: [{ value: 0, label: 'No injury (0)' }, { value: 1, label: '1 — Minor' }, { value: 2, label: '2 — Moderate' }, { value: 3, label: '3 — Serious' }, { value: 4, label: '4 — Severe' }, { value: 5, label: '5 — Critical' }, { value: 6, label: '6 — Unsurvivable' }],
    },
    {
      key: 'external', label: 'External (skin/burns) — Worst AIS', type: 'select',
      options: [{ value: 0, label: 'No injury (0)' }, { value: 1, label: '1 — Minor' }, { value: 2, label: '2 — Moderate' }, { value: 3, label: '3 — Serious' }, { value: 4, label: '4 — Severe' }, { value: 5, label: '5 — Critical' }, { value: 6, label: '6 — Unsurvivable' }],
    },
  ],
  calculate(fields) {
    const regions = ['head_neck','face','chest','abdomen','extremities','external']
    const scores = regions.map(r => parseFloat(fields[r] || 0))
    if (scores.some(s => s === 6)) {
      return {
        result: 75,
        unit: '/ 75',
        interpretation: 'Maximum ISS (AIS 6 in one region) — Unsurvivable injury. Mortality approaches 100%.',
        breakdown: regions.map((r, i) => ({ label: r.replace('_', ' '), value: `AIS ${scores[i]}` })),
      }
    }
    const sorted = [...scores].sort((a, b) => b - a).slice(0, 3)
    const iss = sorted.reduce((s, v) => s + v * v, 0)
    let severity, action
    if (iss < 9) { severity = 'Minor trauma'; action = 'Standard care' }
    else if (iss < 16) { severity = 'Moderate trauma'; action = 'Increased monitoring' }
    else if (iss < 25) { severity = 'Severe trauma (major)'; action = 'Trauma team; ICU admission likely' }
    else { severity = 'Critical trauma'; action = 'High mortality risk; immediate surgery/ICU; consider trauma center transfer' }
    const breakdown = [
      ...regions.map((r, i) => ({ label: r.replace('_', ' '), value: `AIS ${scores[i]} (${scores[i]*scores[i]} pts²)` })),
      { label: 'Top 3 AIS² sum', value: sorted.map(v => v + '²=' + v*v).join(' + ') + ` = ${iss}` },
    ]
    return {
      result: iss,
      unit: '/ 75',
      interpretation: `${severity}: ${action}`,
      breakdown,
    }
  },
}
