export default {
  id: 'osmolality',
  name: 'Serum Osmolality (Calculated) & Osmolar Gap',
  shortDescription: 'Calculated serum osmolality and osmolar gap for toxic alcohol evaluation',
  system: 'nephrology',
  specialty: ['Emergency Medicine', 'Nephrology', 'Toxicology', 'Critical Care'],
  tags: ['osmolality', 'osmolar gap', 'toxic alcohol', 'methanol', 'ethylene glycol', 'electrolytes'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Smithline N, Gardner KD',
  creatorYear: '1976',
  description: 'Calculates estimated serum osmolality from sodium, glucose, and BUN. When compared to measured osmolality, the osmolar gap (OG) can identify the presence of unmeasured osmotically active substances such as toxic alcohols (methanol, ethylene glycol), ethanol, or other osmoles.',
  whyUse: 'Screens for toxic alcohol ingestion. Evaluates hyponatremia etiology (true vs. pseudohyponatremia). Osmolar gap > 10 suggests unmeasured osmoles requiring urgent evaluation.',
  whenToUse: [
    'Suspected toxic alcohol ingestion (methanol, ethylene glycol)',
    'Anion gap metabolic acidosis of unclear etiology',
    'Hyponatremia workup',
    'Altered mental status with suspected poisoning',
  ],
  nextSteps: 'Osmolar gap > 10: Consider toxic alcohols (methanol, ethylene glycol, isopropanol). Order specific levels. Consider fomepizole if suspicion is high. Osmolar gap > 25 is highly suggestive.',
  pearls: [
    'Normal osmolar gap is -10 to +10 mOsm/kg.',
    'A normal osmolar gap does NOT exclude toxic alcohol — late in poisoning, the parent compound is metabolized.',
    'Ethanol contributes to osmolar gap: each 100 mg/dL adds ~22 mOsm/kg.',
    'If ethanol level is known, include it in the calculation for a more accurate gap.',
    'Diabetic ketoacidosis can cause an elevated osmolar gap (acetone, β-hydroxybutyrate).',
    'Measured osmolality must be obtained by freezing point depression (not vapor pressure) for accuracy.',
  ],
  evidence: 'Osmolar gap described by Smithline and Gardner (1976). Widely used in toxicology. Sensitivity for toxic alcohol detection varies; should always be combined with clinical assessment and specific levels when available.',
  formula: 'Calculated Osm = 2×Na + Glucose/18 + BUN/2.8\n(+ EtOH/4.6 if ethanol included)\nOsmolar Gap = Measured Osm - Calculated Osm\nNormal gap: -10 to +10 mOsm/kg',
  references: [
    { text: 'Smithline N, Gardner KD. Gaps — anionic and osmolal. JAMA. 1976;236(14):1594-1597.', url: 'https://pubmed.ncbi.nlm.nih.gov/989116/' },
    { text: 'Kraut JA, Kurtz I. Toxic alcohol ingestions: clinical features, diagnosis, and management. Clin J Am Soc Nephrol. 2008;3(1):208-225.', url: 'https://pubmed.ncbi.nlm.nih.gov/18045860/' },
  ],
  links: [
    { title: 'MDCalc — Serum Osmolality', url: 'https://www.mdcalc.com/calc/91/serum-osmolality-osmolarity', description: 'Interactive osmolality calculator' },
  ],
  interpretations: [
    { range: '<275', label: 'Hypo-osmolar', action: 'Evaluate for hyponatremia; check volume status' },
    { range: '275-295', label: 'Normal osmolality', action: 'Normal range' },
    { range: '>295', label: 'Hyperosmolar', action: 'Evaluate: hyperglycemia, uremia, dehydration, toxic alcohols' },
  ],
  fields: [
    { key: 'sodium', label: 'Sodium (Na⁺)', type: 'number', min: 100, max: 180, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'glucose', label: 'Glucose', type: 'number', min: 10, max: 2000, step: 1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'bun', label: 'BUN', type: 'number', min: 1, max: 200, step: 0.1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'ethanol', label: 'Ethanol level (optional)', type: 'number', min: 0, max: 1000, step: 1, placeholder: 'mg/dL', hint: 'mg/dL — leave blank if not measured', required: false },
    { key: 'measured_osm', label: 'Measured Osmolality (optional, for gap)', type: 'number', min: 100, max: 500, step: 1, placeholder: 'mOsm/kg', hint: 'mOsm/kg — leave blank if not available', required: false },
  ],
  calculate: (vals) => {
    const na = parseFloat(vals.sodium)
    const glu = parseFloat(vals.glucose)
    const bun = parseFloat(vals.bun)
    if (!na || !glu || !bun) return null
    let calcOsm = 2 * na + glu / 18 + bun / 2.8
    const etoh = parseFloat(vals.ethanol)
    if (etoh && etoh > 0) calcOsm += etoh / 4.6
    const measOsm = parseFloat(vals.measured_osm)
    let gap = null
    let gapText = ''
    if (measOsm && measOsm > 0) {
      gap = measOsm - calcOsm
      if (gap > 10) gapText = 'Elevated osmolar gap — consider toxic alcohols'
      else if (gap < -10) gapText = 'Negative gap — possible lab error or low-molecular-weight substances'
      else gapText = 'Normal osmolar gap'
    }
    let interp = ''
    if (calcOsm < 275) interp = 'Calculated hypo-osmolality'
    else if (calcOsm <= 295) interp = 'Calculated osmolality within normal range'
    else interp = 'Calculated hyperosmolality'
    if (gap !== null && gap > 10) interp = gapText
    const breakdown = [{ label: 'Calculated Osmolality', value: `${calcOsm.toFixed(1)} mOsm/kg` }]
    if (etoh && etoh > 0) breakdown.push({ label: 'EtOH contribution', value: `${(etoh / 4.6).toFixed(1)} mOsm/kg` })
    if (gap !== null) breakdown.push({ label: 'Osmolar Gap', value: `${gap.toFixed(1)} mOsm/kg` })
    return {
      result: gap !== null ? gap.toFixed(1) : calcOsm.toFixed(1),
      unit: gap !== null ? 'mOsm/kg (gap)' : 'mOsm/kg',
      interpretation: interp,
      breakdown: breakdown,
    }
  },
}
