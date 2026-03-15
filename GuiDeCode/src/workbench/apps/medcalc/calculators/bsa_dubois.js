export default {
  id: 'bsa_dubois',
  name: 'BSA — Du Bois Formula',
  shortDescription: 'Body Surface Area estimation for drug dosing',
  system: 'utilities',
  specialty: ['Oncology', 'Pharmacology', 'Pediatrics', 'Critical Care'],
  tags: ['BSA', 'body surface area', 'chemotherapy', 'drug dosing'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Du Bois & Du Bois',
  creatorYear: '1916',
  description: 'The Du Bois formula is one of the oldest and most widely used methods for estimating body surface area. BSA is a critical parameter in oncology for chemotherapy dosing, in nephrology for GFR indexing, and in critical care for hemodynamic calculations. The Mosteller formula is also commonly used as a simpler alternative.',
  whyUse: 'BSA-based dosing is standard for most chemotherapy regimens and is used in cardiac output indexing, GFR normalization, and burn area estimation.',
  whenToUse: [
    'Chemotherapy dose calculation (mg/m²)',
    'Cardiac index calculation (CI = CO / BSA)',
    'GFR normalization to 1.73 m²',
    'Burn percentage estimation reference',
  ],
  nextSteps: 'Apply BSA to the relevant dosing protocol. For chemotherapy, verify with institutional dose capping policies (many cap at BSA = 2.0 m²).',
  pearls: [
    'Du Bois formula was derived from only 9 subjects — yet remains widely used.',
    'Mosteller formula (√[height × weight / 3600]) is simpler and equally accurate for most purposes.',
    'Obese patients may need dose adjustments; some protocols use ideal or adjusted body weight.',
    'Average adult BSA is approximately 1.7 m² (range 1.5–2.2 m²).',
  ],
  evidence: 'Multiple validation studies confirm Du Bois and Mosteller formulas agree within 2-3% for most adult patients. Original study published in Archives of Internal Medicine, 1916.',
  formula: 'BSA (m²) = 0.007184 × Height(cm)^0.725 × Weight(kg)^0.425',
  references: [
    { text: 'Du Bois D, Du Bois EF. A formula to estimate the approximate surface area if height and weight be known. Arch Intern Med. 1916;17:863-871.', url: 'https://pubmed.ncbi.nlm.nih.gov/2520314/' },
  ],
  links: [
    { title: 'MDCalc — BSA Calculator', url: 'https://www.mdcalc.com/calc/29/body-mass-index-bmi-body-surface-area-bsa', description: 'Combined BMI/BSA calculator' },
  ],
  interpretations: [
    { range: '<1.5', label: 'Below average', action: 'May require dose reduction in BSA-based protocols' },
    { range: '1.5-2.0', label: 'Normal range', action: 'Standard BSA-based dosing' },
    { range: '>2.0', label: 'Above average', action: 'Verify dose capping policies; consider adjusted dosing in obesity' },
  ],
  fields: [
    { key: 'weight', label: 'Weight', type: 'number', min: 1, max: 500, step: 0.1, placeholder: 'kg', hint: 'kg' },
    { key: 'height', label: 'Height', type: 'number', min: 30, max: 300, step: 0.1, placeholder: 'cm', hint: 'cm' },
  ],
  calculate: (vals) => {
    const w = parseFloat(vals.weight)
    const h = parseFloat(vals.height)
    if (!w || !h) return null
    const bsa = 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425)
    const mosteller = Math.sqrt((h * w) / 3600)
    let category = ''
    if (bsa < 1.5) category = 'Below average BSA'
    else if (bsa <= 2.0) category = 'Normal range'
    else category = 'Above average BSA'
    return {
      result: bsa.toFixed(4),
      unit: 'm²',
      interpretation: category,
      breakdown: [
        { label: 'Du Bois', value: `${bsa.toFixed(4)} m²` },
        { label: 'Mosteller', value: `${mosteller.toFixed(4)} m²` },
      ],
    }
  },
}
