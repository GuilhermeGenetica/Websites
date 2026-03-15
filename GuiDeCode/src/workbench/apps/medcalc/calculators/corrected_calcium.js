export default {
  id: 'corrected_calcium',
  name: 'Corrected Calcium',
  shortDescription: 'Adjusts total calcium for hypoalbuminemia',
  system: 'endocrinology',
  specialty: ['Internal Medicine', 'Endocrinology', 'Nephrology', 'Critical Care'],
  tags: ['calcium', 'albumin', 'hypocalcemia', 'hypercalcemia', 'electrolytes'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Payne RB et al.',
  creatorYear: '1973',
  description: 'Corrected calcium adjusts the measured total serum calcium for the level of serum albumin. Since approximately 40% of circulating calcium is bound to albumin, hypoalbuminemia can cause a falsely low total calcium while the physiologically active ionized fraction remains normal. This calculator provides the corrected value to guide clinical decision-making.',
  whyUse: 'Prevents misdiagnosis of hypocalcemia in hypoalbuminemic patients. Essential in critically ill, malnourished, or cirrhotic patients. Quick bedside correction when ionized calcium is unavailable.',
  whenToUse: [
    'Interpreting total calcium in patients with low albumin',
    'ICU patients with hypoalbuminemia',
    'Cirrhosis, nephrotic syndrome, or malnutrition',
    'When ionized calcium measurement is not available',
  ],
  nextSteps: 'If corrected calcium is abnormal, confirm with ionized calcium. Investigate underlying cause of hypocalcemia or hypercalcemia. Ionized calcium is always preferred when available.',
  pearls: [
    'The correction formula is an estimate — ionized calcium is the gold standard.',
    'For every 1 g/dL decrease in albumin below 4.0, total calcium decreases by ~0.8 mg/dL.',
    'This correction is less reliable in critically ill patients, acid-base disturbances, and renal failure.',
    'In alkalosis, more calcium binds to albumin, so ionized calcium drops even with normal total.',
    'Do NOT use this correction if albumin is normal or elevated.',
  ],
  evidence: 'Payne et al. (BMJ 1973) demonstrated the linear relationship between albumin and total calcium. Widely used clinically though imperfect. Multiple studies show ionized calcium is superior, especially in ICU populations.',
  formula: 'Corrected Ca (mg/dL) = Measured Ca + 0.8 × (4.0 - Albumin)\nAssumes normal albumin = 4.0 g/dL',
  references: [
    { text: 'Payne RB et al. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-646.', url: 'https://pubmed.ncbi.nlm.nih.gov/4758544/' },
  ],
  links: [
    { title: 'MDCalc — Corrected Calcium', url: 'https://www.mdcalc.com/calc/31/calcium-correction-hypoalbuminemia', description: 'Interactive corrected calcium calculator' },
  ],
  interpretations: [
    { range: '<8.5', label: 'Hypocalcemia', action: 'Check ionized Ca, PTH, Mg, Vitamin D. Evaluate symptoms (Chvostek, Trousseau).' },
    { range: '8.5-10.5', label: 'Normal', action: 'No further calcium workup needed.' },
    { range: '>10.5', label: 'Hypercalcemia', action: 'Check PTH, PTHrP, Vitamin D, malignancy workup. Hydrate if symptomatic.' },
  ],
  fields: [
    { key: 'calcium', label: 'Total Calcium', type: 'number', min: 1, max: 20, step: 0.1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'albumin', label: 'Serum Albumin', type: 'number', min: 0.5, max: 6, step: 0.1, placeholder: 'g/dL', hint: 'g/dL' },
  ],
  calculate: (vals) => {
    const ca = parseFloat(vals.calcium)
    const alb = parseFloat(vals.albumin)
    if (!ca || !alb) return null
    const corrected = ca + 0.8 * (4.0 - alb)
    let interp = ''
    if (corrected < 8.5) interp = 'Corrected hypocalcemia'
    else if (corrected <= 10.5) interp = 'Corrected calcium within normal range'
    else interp = 'Corrected hypercalcemia'
    return {
      result: corrected.toFixed(1),
      unit: 'mg/dL',
      interpretation: interp,
      detail: `Measured Ca: ${ca} mg/dL, Albumin: ${alb} g/dL, Correction: +${(0.8 * (4.0 - alb)).toFixed(1)} mg/dL`,
    }
  },
}
