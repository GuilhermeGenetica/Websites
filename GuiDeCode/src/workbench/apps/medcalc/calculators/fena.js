export default {
  id: 'fena',
  name: 'FENa',
  shortDescription: 'Fractional Excretion of Sodium — differentiates prerenal from intrinsic AKI',
  system: 'nephrology',
  specialty: ['Nephrology', 'Internal Medicine', 'Critical Care', 'Emergency Medicine'],
  tags: ['FENa', 'AKI', 'acute kidney injury', 'prerenal', 'renal failure', 'sodium'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Espinel CH',
  creatorYear: '1976',
  description: 'The Fractional Excretion of Sodium (FENa) helps differentiate prerenal azotemia from intrinsic acute kidney injury (AKI). It measures the percentage of filtered sodium that is excreted in urine. In prerenal states, the kidney avidly reabsorbs sodium (FENa < 1%), while in intrinsic renal damage (ATN), sodium reabsorption is impaired (FENa > 2%).',
  whyUse: 'Key tool for AKI differential diagnosis. Guides fluid management decisions: volume-responsive (prerenal) vs. intrinsic injury. Simple calculation from readily available labs.',
  whenToUse: [
    'Acute kidney injury of unclear etiology',
    'Distinguishing prerenal azotemia from acute tubular necrosis',
    'Oliguria workup to guide fluid resuscitation vs. diuresis',
  ],
  nextSteps: 'FENa < 1%: Prerenal — trial of IV fluids. FENa 1-2%: Indeterminate — consider clinical context. FENa > 2%: Intrinsic AKI (likely ATN) — avoid excessive fluids, nephrology consult.',
  pearls: [
    'FENa is unreliable if patient has received diuretics — use FEUrea instead (< 35% = prerenal).',
    'FENa < 1% can occur in early obstruction, contrast nephropathy, myoglobinuria, and acute GN.',
    'Chronic CKD patients may have FENa > 1% at baseline due to impaired concentrating ability.',
    'Spot urine samples are adequate — 24-hour collection not needed.',
    'In patients on diuretics, FEUrea is the preferred alternative.',
    'Hepatorenal syndrome has FENa < 1% despite intrinsic-appearing injury.',
  ],
  evidence: 'Described by Espinel (Am J Med, 1976). Extensively validated as a bedside tool for AKI differentiation. Limitations recognized in the setting of diuretics, CKD, and certain intrinsic causes that mimic prerenal physiology.',
  formula: 'FENa (%) = (UNa × PCr) / (PNa × UCr) × 100\nUNa = urine sodium, PNa = plasma sodium\nUCr = urine creatinine, PCr = plasma creatinine',
  references: [
    { text: 'Espinel CH. The FENa test. Use in the differential diagnosis of acute renal failure. JAMA. 1976;236(6):579-581.', url: 'https://pubmed.ncbi.nlm.nih.gov/947239/' },
  ],
  links: [
    { title: 'MDCalc — FENa', url: 'https://www.mdcalc.com/calc/60/fractional-excretion-sodium-fena', description: 'Interactive FENa calculator' },
  ],
  interpretations: [
    { range: '<1', label: 'Prerenal azotemia', action: 'Volume resuscitation; identify and treat underlying cause (dehydration, heart failure, hemorrhage)' },
    { range: '1-2', label: 'Indeterminate', action: 'Clinical correlation needed; consider mixed etiology or early ATN' },
    { range: '>2', label: 'Intrinsic renal injury (likely ATN)', action: 'Avoid excessive fluids; nephrology consult; supportive care' },
  ],
  fields: [
    { key: 'una', label: 'Urine Sodium (UNa)', type: 'number', min: 1, max: 300, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'ucr', label: 'Urine Creatinine (UCr)', type: 'number', min: 1, max: 500, step: 0.1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'pna', label: 'Plasma Sodium (PNa)', type: 'number', min: 100, max: 180, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'pcr', label: 'Plasma Creatinine (PCr)', type: 'number', min: 0.1, max: 30, step: 0.01, placeholder: 'mg/dL', hint: 'mg/dL' },
  ],
  calculate: (vals) => {
    const una = parseFloat(vals.una)
    const ucr = parseFloat(vals.ucr)
    const pna = parseFloat(vals.pna)
    const pcr = parseFloat(vals.pcr)
    if (!una || !ucr || !pna || !pcr) return null
    const fena = (una * pcr) / (pna * ucr) * 100
    let interp = ''
    if (fena < 1) interp = 'Prerenal azotemia — consider volume resuscitation'
    else if (fena <= 2) interp = 'Indeterminate — clinical correlation required'
    else interp = 'Intrinsic renal injury (likely ATN)'
    return {
      result: fena.toFixed(2),
      unit: '%',
      interpretation: interp,
      detail: `UNa: ${una}, UCr: ${ucr}, PNa: ${pna}, PCr: ${pcr}`,
    }
  },
}
