export default {
  id: 'feurea',
  name: 'FEUrea',
  shortDescription: 'Fractional Excretion of Urea — AKI differential when on diuretics',
  system: 'nephrology',
  specialty: ['Nephrology', 'Internal Medicine', 'Critical Care'],
  tags: ['FEUrea', 'AKI', 'prerenal', 'diuretics', 'kidney', 'urea'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Carvounis CP et al.',
  creatorYear: '2002',
  description: 'The Fractional Excretion of Urea (FEUrea) differentiates prerenal azotemia from intrinsic AKI, and unlike FENa, it remains accurate in patients receiving diuretics. Urea reabsorption is not significantly affected by loop diuretics, making FEUrea the preferred test when FENa is unreliable.',
  whyUse: 'Accurate in patients on diuretics (where FENa is unreliable). Differentiates prerenal from intrinsic AKI. Simple spot urine and blood test calculation.',
  whenToUse: [
    'AKI workup in patients receiving diuretics',
    'When FENa results are unreliable due to diuretic use',
    'Oliguria workup in diuretic-treated patients',
  ],
  nextSteps: 'FEUrea < 35%: Prerenal — trial of IV fluids. FEUrea > 50%: Intrinsic AKI — avoid excessive fluids. FEUrea 35-50%: Indeterminate — clinical correlation needed.',
  pearls: [
    'FEUrea < 35% suggests prerenal azotemia even in patients on diuretics.',
    'FEUrea > 50% suggests intrinsic renal injury (ATN).',
    'Unlike FENa, diuretics do NOT significantly affect urea handling.',
    'BUN and urine urea are both measured in mg/dL for this calculation.',
    'Can use alongside FENa for additional confidence when diuretics have not been given.',
  ],
  evidence: 'Validated by Carvounis et al. (Kidney Int, 2002) in 102 patients with AKI. FEUrea < 35% had sensitivity 85% and specificity 92% for prerenal AKI in patients on diuretics.',
  formula: 'FEUrea (%) = (Urine Urea × Plasma Creatinine) / (Plasma Urea × Urine Creatinine) × 100',
  references: [
    { text: 'Carvounis CP et al. Significance of the fractional excretion of urea in the differential diagnosis of acute renal failure. Kidney Int. 2002;62(6):2223-2229.', url: 'https://pubmed.ncbi.nlm.nih.gov/12427149/' },
  ],
  links: [
    { title: 'MDCalc — FEUrea', url: 'https://www.mdcalc.com/calc/62/fractional-excretion-urea-feurea', description: 'Interactive FEUrea calculator' },
  ],
  interpretations: [
    { range: '<35', label: 'Prerenal azotemia', action: 'Volume resuscitation; treat underlying cause' },
    { range: '35-50', label: 'Indeterminate', action: 'Clinical correlation; may be mixed etiology' },
    { range: '>50', label: 'Intrinsic renal injury (ATN)', action: 'Avoid excessive fluids; supportive care; nephrology consult' },
  ],
  fields: [
    { key: 'urine_urea', label: 'Urine Urea (UUrea)', type: 'number', min: 1, max: 5000, step: 1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'plasma_urea', label: 'Plasma BUN', type: 'number', min: 1, max: 200, step: 0.1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'urine_cr', label: 'Urine Creatinine (UCr)', type: 'number', min: 1, max: 500, step: 0.1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'plasma_cr', label: 'Plasma Creatinine (PCr)', type: 'number', min: 0.1, max: 30, step: 0.01, placeholder: 'mg/dL', hint: 'mg/dL' },
  ],
  calculate: (vals) => {
    const uurea = parseFloat(vals.urine_urea)
    const purea = parseFloat(vals.plasma_urea)
    const ucr = parseFloat(vals.urine_cr)
    const pcr = parseFloat(vals.plasma_cr)
    if (!uurea || !purea || !ucr || !pcr) return null
    const feurea = (uurea * pcr) / (purea * ucr) * 100
    let interp = ''
    if (feurea < 35) interp = 'Prerenal azotemia — volume responsive (reliable even on diuretics)'
    else if (feurea <= 50) interp = 'Indeterminate — clinical correlation needed'
    else interp = 'Intrinsic renal injury (likely ATN)'
    return {
      result: feurea.toFixed(1),
      unit: '%',
      interpretation: interp,
    }
  },
}
