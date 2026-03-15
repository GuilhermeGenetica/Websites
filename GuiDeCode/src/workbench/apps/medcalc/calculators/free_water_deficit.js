export default {
  id: 'free_water_deficit',
  name: 'Free Water Deficit',
  shortDescription: 'Estimates free water deficit for hypernatremia correction',
  system: 'nephrology',
  specialty: ['Internal Medicine', 'Critical Care', 'Nephrology', 'Emergency Medicine'],
  tags: ['hypernatremia', 'sodium', 'dehydration', 'free water', 'fluid replacement'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard physiological formula',
  creatorYear: '1950s',
  description: 'Calculates the estimated free water deficit in hypernatremic patients. This guides the volume of hypotonic fluid (D5W or half-normal saline) needed to correct serum sodium to normal levels. Correction must be done slowly to prevent cerebral edema.',
  whyUse: 'Essential for managing hypernatremia. Guides volume and rate of hypotonic fluid replacement. Prevents both under-correction and overly rapid correction (cerebral edema risk).',
  whenToUse: [
    'Hypernatremia (Na > 145 mEq/L)',
    'Dehydration with elevated sodium',
    'Planning free water replacement in ICU patients',
  ],
  nextSteps: 'Replace deficit over 48-72 hours. Do NOT correct faster than 10-12 mEq/L per 24 hours (chronic hypernatremia) or 1 mEq/L per hour (acute < 24h). Account for ongoing losses. Recheck Na every 4-6 hours.',
  pearls: [
    'This formula estimates ONLY the deficit — add ongoing losses (urine, insensible, GI).',
    'Rate of correction: ≤ 10-12 mEq/L per 24h for chronic (> 48h) hypernatremia.',
    'Acute hypernatremia (< 24h) can be corrected faster: 1-2 mEq/L per hour.',
    'Total body water (TBW) fraction varies: 0.6 (young males), 0.5 (elderly males, young females), 0.45 (elderly females).',
    'D5W is preferred for pure free water replacement; 0.45% NS provides half free water.',
    'Recheck sodium frequently during correction — adjust rate accordingly.',
  ],
  evidence: 'Based on fundamental physiology of body water distribution. Widely used in nephrology and critical care practice. Endorsed by UpToDate, clinical nephrology textbooks, and critical care guidelines.',
  formula: 'Free Water Deficit (L) = TBW × [(Serum Na / 140) - 1]\nTBW = Weight (kg) × correction factor\nCorrection factors: 0.6 (young male), 0.5 (elderly male/young female), 0.45 (elderly female)',
  references: [
    { text: 'Adrogué HJ, Madias NE. Hypernatremia. N Engl J Med. 2000;342(20):1493-1499.', url: 'https://pubmed.ncbi.nlm.nih.gov/10816188/' },
  ],
  links: [
    { title: 'MDCalc — Free Water Deficit', url: 'https://www.mdcalc.com/calc/113/free-water-deficit-hypernatremia', description: 'Interactive free water deficit calculator' },
  ],
  interpretations: [
    { range: '<2', label: 'Mild deficit', action: 'Oral free water if patient can drink; or IV D5W/0.45% NS' },
    { range: '2-5', label: 'Moderate deficit', action: 'IV hypotonic fluids; correct over 48-72h; monitor Na q4-6h' },
    { range: '>5', label: 'Severe deficit', action: 'ICU monitoring; careful IV correction; Na q2-4h; assess for ongoing losses' },
  ],
  fields: [
    { key: 'weight', label: 'Body Weight', type: 'number', min: 1, max: 300, step: 0.1, placeholder: 'kg', hint: 'kg' },
    { key: 'sodium', label: 'Serum Sodium', type: 'number', min: 140, max: 200, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    {
      key: 'tbw_factor', label: 'Patient type (TBW factor)', type: 'score_picker',
      options: [
        { value: 0.6, label: 'Young male (0.6)' },
        { value: 0.5, label: 'Elderly male / Young female (0.5)' },
        { value: 0.45, label: 'Elderly female (0.45)' },
      ],
    },
  ],
  calculate: (vals) => {
    const wt = parseFloat(vals.weight)
    const na = parseFloat(vals.sodium)
    const tbwf = parseFloat(vals.tbw_factor)
    if (!wt || !na || !tbwf || na <= 140) return null
    const tbw = wt * tbwf
    const deficit = tbw * ((na / 140) - 1)
    const corrRate = deficit / 48
    return {
      result: deficit.toFixed(1),
      unit: 'liters',
      interpretation: `Replace ${deficit.toFixed(1)} L of free water over 48-72 hours (max correction 10-12 mEq/L per 24h)`,
      detail: `TBW: ${tbw.toFixed(1)} L, Current Na: ${na} mEq/L, Target Na: 140 mEq/L`,
      breakdown: [
        { label: 'Free Water Deficit', value: `${deficit.toFixed(1)} L` },
        { label: 'TBW', value: `${tbw.toFixed(1)} L` },
        { label: 'Suggested rate (over 48h)', value: `~${(corrRate * 1000 / 24).toFixed(0)} mL/hr D5W` },
      ],
    }
  },
}
