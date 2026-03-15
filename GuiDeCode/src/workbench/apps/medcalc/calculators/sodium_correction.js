export default {
  id: 'sodium_correction',
  name: 'Sodium Correction Rate (Adrogué-Madias)',
  shortDescription: 'Estimates the effect of 1L of IV fluid on serum sodium for safe correction',
  system: 'nephrology',
  specialty: ['Nephrology', 'Internal Medicine', 'Emergency Medicine', 'Critical Care'],
  tags: ['sodium', 'hyponatremia', 'hypernatremia', 'Adrogue', 'correction', 'electrolytes'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Adrogué HJ, Madias NE',
  creatorYear: '2000',
  description: 'The Adrogué-Madias formula estimates the change in serum sodium produced by 1 liter of any infusate. This guides safe correction of both hyponatremia and hypernatremia by selecting appropriate fluids and infusion rates to stay within safe correction limits (typically ≤ 8-10 mEq/L per 24 hours for hyponatremia).',
  whyUse: 'Prevents osmotic demyelination syndrome (ODS) from overly rapid hyponatremia correction. Prevents cerebral edema from overly rapid hypernatremia correction. Guides fluid selection and rate.',
  whenToUse: [
    'Hyponatremia requiring correction',
    'Hypernatremia requiring correction',
    'Planning IV fluid therapy for sodium disorders',
  ],
  nextSteps: 'Hyponatremia: Correct ≤ 8-10 mEq/L per 24h (≤ 6-8 if high ODS risk). Check Na every 2-4h during active correction. Hypernatremia: Correct ≤ 10-12 mEq/L per 24h. If overcorrecting, give DDAVP to slow correction.',
  pearls: [
    'Safe hyponatremia correction: ≤ 8-10 mEq/L in 24h, ≤ 18 mEq/L in 48h.',
    'High ODS risk (alcoholism, malnutrition, hypokalemia, liver disease): limit to ≤ 6-8 mEq/L per 24h.',
    'This formula estimates change per LITER — adjust for actual volume infused.',
    'Total body water (TBW) = Weight × 0.6 (males) or 0.5 (females).',
    'Common infusate Na: 3% NaCl = 513 mEq/L, NS = 154 mEq/L, LR = 130 mEq/L, D5W = 0, half-NS = 77 mEq/L.',
    'Always account for ongoing losses and K replacement (K raises Na when correcting hyponatremia).',
  ],
  evidence: 'Adrogué and Madias (N Engl J Med, 2000). Widely adopted in nephrology practice. Multiple clinical guidelines recommend formula-based correction planning with frequent Na monitoring.',
  formula: 'ΔNa per 1L infusate = (Infusate Na - Serum Na) / (TBW + 1)\nTBW = Weight × correction factor (0.6 male, 0.5 female, 0.45 elderly female)',
  references: [
    { text: 'Adrogué HJ, Madias NE. Hyponatremia. N Engl J Med. 2000;342(21):1581-1589.', url: 'https://pubmed.ncbi.nlm.nih.gov/10824078/' },
  ],
  links: [
    { title: 'MDCalc — Sodium Correction Rate', url: 'https://www.mdcalc.com/calc/480/sodium-correction-rate-hyponatremia-hypernatremia', description: 'Interactive sodium correction calculator' },
  ],
  interpretations: [],
  fields: [
    { key: 'serum_na', label: 'Current Serum Sodium', type: 'number', min: 100, max: 180, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'weight', label: 'Body Weight', type: 'number', min: 1, max: 300, step: 0.1, placeholder: 'kg', hint: 'kg' },
    {
      key: 'tbw_factor', label: 'Patient type (TBW factor)', type: 'score_picker',
      options: [
        { value: 0.6, label: 'Male (0.6)' },
        { value: 0.5, label: 'Female / Elderly male (0.5)' },
        { value: 0.45, label: 'Elderly female (0.45)' },
      ],
    },
    {
      key: 'infusate', label: 'IV Fluid (infusate Na)', type: 'score_picker',
      options: [
        { value: 513, label: '3% Hypertonic Saline (513 mEq/L)' },
        { value: 154, label: '0.9% Normal Saline (154 mEq/L)' },
        { value: 130, label: 'Lactated Ringer (130 mEq/L)' },
        { value: 77, label: '0.45% Half-Normal Saline (77 mEq/L)' },
        { value: 0, label: 'D5W (0 mEq/L)' },
      ],
    },
    { key: 'target_change', label: 'Desired Na change in 24h', type: 'number', min: 1, max: 20, step: 1, placeholder: 'mEq/L', hint: 'mEq/L (recommend ≤ 8-10)' },
  ],
  calculate: (vals) => {
    const serumNa = parseFloat(vals.serum_na)
    const wt = parseFloat(vals.weight)
    const tbwf = parseFloat(vals.tbw_factor)
    const infusateNa = parseFloat(vals.infusate)
    const targetChange = parseFloat(vals.target_change)
    if (!serumNa || !wt || !tbwf || infusateNa === undefined || infusateNa === null || !targetChange) return null
    const tbw = wt * tbwf
    const deltaNaPerL = (infusateNa - serumNa) / (tbw + 1)
    const volumeNeeded = (targetChange / Math.abs(deltaNaPerL)) * 1000
    const ratePerHr = volumeNeeded / 24
    const infusateNames = { 513: '3% NaCl', 154: '0.9% NS', 130: 'LR', 77: '0.45% NS', 0: 'D5W' }
    return {
      result: deltaNaPerL.toFixed(1),
      unit: 'mEq/L per liter infused',
      interpretation: `Each 1L of ${infusateNames[infusateNa] || 'fluid'} will change Na by ${deltaNaPerL >= 0 ? '+' : ''}${deltaNaPerL.toFixed(1)} mEq/L`,
      breakdown: [
        { label: 'ΔNa per 1L infusate', value: `${deltaNaPerL >= 0 ? '+' : ''}${deltaNaPerL.toFixed(1)} mEq/L` },
        { label: 'Volume for target change', value: `~${Math.round(volumeNeeded)} mL over 24h` },
        { label: 'Suggested rate', value: `~${Math.round(ratePerHr)} mL/hr` },
        { label: 'TBW', value: `${tbw.toFixed(1)} L` },
        { label: 'Target Na', value: `${(serumNa + (deltaNaPerL > 0 ? targetChange : -targetChange)).toFixed(0)} mEq/L` },
      ],
    }
  },
}
