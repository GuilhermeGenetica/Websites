export default {
  id: 'ett_size',
  name: 'Pediatric ETT Size',
  shortDescription: 'Endotracheal tube size estimation by age for pediatric intubation',
  system: 'pediatrics',
  specialty: ['Pediatric Emergency Medicine', 'Anesthesia', 'Critical Care', 'Pediatrics'],
  tags: ['ETT', 'intubation', 'pediatric', 'airway', 'tube size', 'endotracheal'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Cole F / Standard pediatric formulas',
  creatorYear: '1957',
  description: 'Estimates the appropriate uncuffed and cuffed endotracheal tube (ETT) size for pediatric patients based on age. Also calculates depth of insertion (lip-to-tip). These are ESTIMATES — always have one size above and below available. Cuffed tubes are now preferred in most settings.',
  whyUse: 'Rapid estimation of appropriate tube size in pediatric emergencies. Essential for airway management preparation. Ensures correct equipment is ready before intubation attempt.',
  whenToUse: [
    'Preparing for pediatric intubation',
    'Equipment selection in pediatric emergency',
    'Pre-procedural airway assessment',
  ],
  nextSteps: 'Always have tubes 0.5 mm above and below calculated size available. Confirm placement with ETCO₂, bilateral breath sounds, and CXR. Use cuffed tubes with cuff pressure monitoring (< 20-25 cmH₂O). Secure tube at calculated insertion depth.',
  pearls: [
    'Cuffed ETTs are now preferred even in young children (AHA/PALS guidelines).',
    'Uncuffed formula: (age/4) + 4. Cuffed formula: (age/4) + 3.5.',
    'Neonates: term = 3.5 uncuffed (3.0 cuffed); preterm = 2.5-3.0.',
    'Insertion depth (oral): 3 × ETT internal diameter (e.g., 4.0 tube → 12 cm at lip).',
    'The little finger rule is unreliable — use the formula.',
    'Always have suction, smaller tube, and LMA available as backup.',
  ],
  evidence: 'Original formula by Cole (Anesthesiology, 1957). Modified over decades. AHA/PALS and ASA guidelines support cuffed tubes in children > 1 year. Formula accuracy: correct size in ~50-75% of cases — always prepare alternatives.',
  formula: 'Uncuffed ETT (mm ID) = (Age in years / 4) + 4\nCuffed ETT (mm ID) = (Age in years / 4) + 3.5\nInsertion depth (cm, oral) = 3 × ETT ID\nAlternative depth: (age/2) + 12 cm',
  references: [
    { text: 'Kleinman ME et al. Pediatric Advanced Life Support: 2010 AHA Guidelines for CPR and ECC. Circulation. 2010;122(suppl 3):S876-S908.', url: 'https://pubmed.ncbi.nlm.nih.gov/20956230/' },
  ],
  links: [
    { title: 'MDCalc — Pediatric ETT Size', url: 'https://www.mdcalc.com/calc/3972/endotracheal-tube-ett-size-pediatrics', description: 'Interactive pediatric ETT calculator' },
  ],
  interpretations: [],
  fields: [
    { key: 'age', label: 'Age', type: 'number', min: 0, max: 18, step: 0.5, placeholder: 'years', hint: 'years (0 for newborn)' },
    {
      key: 'patient_type', label: 'Patient type (for neonates)', type: 'score_picker',
      options: [
        { value: 'child', label: 'Child (≥ 1 year)' },
        { value: 'term', label: 'Neonate — Term (≥ 37 weeks)' },
        { value: 'preterm', label: 'Neonate — Preterm (< 37 weeks)' },
      ],
    },
  ],
  calculate: (vals) => {
    const age = parseFloat(vals.age)
    const type = vals.patient_type
    if (age === undefined || age === null || !type) return null
    let uncuffed, cuffed, depth
    if (type === 'preterm') {
      uncuffed = 2.5
      cuffed = 2.5
      depth = 7
    } else if (type === 'term' || age < 1) {
      uncuffed = 3.5
      cuffed = 3.0
      depth = 10
    } else {
      uncuffed = (age / 4) + 4
      cuffed = (age / 4) + 3.5
      depth = 3 * cuffed
    }
    const uncuffedRound = Math.round(uncuffed * 2) / 2
    const cuffedRound = Math.round(cuffed * 2) / 2
    return {
      result: cuffedRound.toFixed(1),
      unit: 'mm ID (cuffed)',
      interpretation: `Cuffed: ${cuffedRound.toFixed(1)} mm | Uncuffed: ${uncuffedRound.toFixed(1)} mm | Depth: ~${Math.round(depth)} cm at lip`,
      detail: `Have sizes ${(cuffedRound - 0.5).toFixed(1)} and ${(cuffedRound + 0.5).toFixed(1)} available as backup`,
      breakdown: [
        { label: 'Cuffed ETT', value: `${cuffedRound.toFixed(1)} mm` },
        { label: 'Uncuffed ETT', value: `${uncuffedRound.toFixed(1)} mm` },
        { label: 'Insertion depth (oral)', value: `~${Math.round(depth)} cm` },
        { label: 'Have available', value: `${(cuffedRound - 0.5).toFixed(1)} to ${(cuffedRound + 0.5).toFixed(1)} mm` },
      ],
    }
  },
}
