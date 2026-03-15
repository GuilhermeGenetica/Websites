export default {
  id: 'bicarbonate_replacement',
  name: 'Bicarbonate Replacement',
  shortDescription: 'Calculates NaHCO₃ deficit and replacement dose for metabolic acidosis.',
  system: 'nephrology',
  specialty: ['Nephrology', 'Critical Care', 'Emergency Medicine', 'Internal Medicine'],
  tags: ['bicarbonate', 'NaHCO3', 'metabolic acidosis', 'base deficit', 'replacement', 'electrolytes'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Clinical Pharmacology Consensus',
  creatorYear: '2000',
  description: 'Calculates the bicarbonate deficit and sodium bicarbonate replacement dose for patients with metabolic acidosis. Uses the standard formula: Deficit = 0.4 × weight × (target HCO₃ - measured HCO₃).',
  whyUse: 'Quantifies NaHCO₃ needs and prevents over- or under-replacement. Rapid estimation tool for emergency and ICU settings.',
  whenToUse: [
    'Symptomatic metabolic acidosis (pH <7.2 or HCO₃ <15 mEq/L)',
    'Severe hyperchloremic acidosis (e.g., diarrhea, RTA, post-resuscitation)',
    'DKA with bicarbonate supplementation consideration (pH <6.9)',
    'Planning NaHCO₃ infusion rate and volume',
  ],
  nextSteps: 'Replace 50% of deficit over first 2-4 hours; reassess ABG. Each 50 mEq NaHCO₃ ampoule = 50 mEq in ~50 mL. Mix in D5W (not NS) to avoid hyperchloremia. Monitor Na⁺, K⁺, and pH closely.',
  pearls: [
    'NaHCO₃ is controversial in most causes of metabolic acidosis — evidence best for hyperchloremic acidosis.',
    'Generally avoid if pH >7.2 in lactic acidosis (may worsen intracellular acidosis).',
    'Each 50 mEq ampule also delivers 50 mEq of Na⁺ — watch for hypernatremia.',
    'Target HCO₃ typically 15-18 mEq/L (partial correction), NOT full normalization.',
    'Treat underlying cause simultaneously.',
    'Hypocalcemia and hypokalemia may worsen after bicarbonate administration.',
  ],
  evidence: 'Based on standard physiology: bicarbonate space ≈ 40-50% of body weight for severe acidosis. Cooper et al. Crit Care Med 2000.',
  formula: `HCO₃ deficit (mEq) = 0.4 × weight (kg) × [target HCO₃ - measured HCO₃]
Volume of 8.4% NaHCO₃ (mL) = deficit mEq (since 8.4% = 1 mEq/mL)
Volume of 4.2% NaHCO₃ (mL) = deficit × 2 (since 4.2% = 0.5 mEq/mL)
Number of 50 mEq ampules = deficit / 50`,
  references: [
    { text: 'Cooper DJ et al. Bicarbonate-based versus acetate-based dialysate in ICU patients. Crit Care Med. 2000.', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
    { text: 'Kraut JA, Madias NE. Treatment of acute metabolic acidosis. Kidney Int. 2012;81(10):1030-1042.', url: 'https://pubmed.ncbi.nlm.nih.gov/22297679/' },
  ],
  links: [
    { title: 'MDCalc — Bicarbonate Deficit', url: 'https://www.mdcalc.com/calc/3813/bicarbonate-deficit-in-metabolic-acidosis', description: 'Interactive bicarbonate deficit calculator' },
  ],
  interpretations: [],
  fields: [
    { key: 'weight', label: 'Body Weight', type: 'number', unit: 'kg', min: 1, max: 300, placeholder: 'e.g. 70' },
    { key: 'hco3_measured', label: 'Measured HCO₃⁻', type: 'number', unit: 'mEq/L', min: 1, max: 35, step: 0.5, placeholder: 'e.g. 10' },
    { key: 'hco3_target', label: 'Target HCO₃⁻ (typically 15-18)', type: 'number', unit: 'mEq/L', min: 10, max: 24, step: 0.5, placeholder: 'e.g. 15' },
    { key: 'fraction', label: 'Replace (% of deficit to give now)', type: 'select', options: [{ value: 0.5, label: '50% (recommended — reassess after)' }, { value: 1.0, label: '100% (full replacement — caution)' }, { value: 0.25, label: '25% (conservative)' }] },
  ],
  calculate(fields) {
    const wt = parseFloat(fields.weight)
    const hco3m = parseFloat(fields.hco3_measured)
    const hco3t = parseFloat(fields.hco3_target)
    const frac = parseFloat(fields.fraction)
    const deficit = 0.4 * wt * (hco3t - hco3m)
    const toReplace = deficit * frac
    const vol_84 = toReplace.toFixed(1)
    const vol_42 = (toReplace * 2).toFixed(1)
    const ampules = Math.ceil(toReplace / 50)
    const breakdown = [
      { label: 'Total HCO₃ deficit', value: deficit.toFixed(1) + ' mEq' },
      { label: 'Dose to administer now', value: toReplace.toFixed(1) + ' mEq' },
      { label: '8.4% NaHCO₃ volume', value: vol_84 + ' mL' },
      { label: '4.2% NaHCO₃ volume', value: vol_42 + ' mL' },
      { label: '50 mEq ampules needed', value: ampules + ' ampule(s)' },
      { label: 'Na⁺ load with replacement', value: toReplace.toFixed(1) + ' mEq Na⁺' },
    ]
    return {
      result: toReplace.toFixed(1),
      unit: 'mEq NaHCO₃ to administer now',
      interpretation: `Administer ${toReplace.toFixed(0)} mEq (= ${vol_84} mL of 8.4% NaHCO₃ or ${ampules} × 50 mEq ampule(s)) over 2-4 hours. Recheck ABG/HCO₃ before further replacement.`,
      breakdown,
    }
  },
}
