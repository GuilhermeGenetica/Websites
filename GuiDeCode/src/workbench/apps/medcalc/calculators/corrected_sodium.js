export default {
  id: 'corrected_sodium',
  name: 'Corrected Sodium (for Hyperglycemia)',
  shortDescription: 'Adjusts measured sodium for the dilutional effect of hyperglycemia',
  system: 'nephrology',
  specialty: ['Emergency Medicine', 'Internal Medicine', 'Endocrinology', 'Nephrology'],
  tags: ['sodium', 'hyperglycemia', 'DKA', 'HHS', 'hyponatremia', 'electrolytes', 'correction'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Katz MA / Hillier TA et al.',
  creatorYear: '1973 / 1999',
  description: 'Corrected sodium adjusts the measured serum sodium for the dilutional effect of hyperglycemia. Elevated blood glucose draws water into the intravascular space, diluting sodium. The corrected value reveals the true sodium status once glucose normalizes, which is critical in managing DKA and HHS.',
  whyUse: 'Reveals true sodium status in hyperglycemic states (DKA, HHS). Prevents inappropriate treatment of pseudohyponatremia. Guides fluid selection (normal saline vs. half-normal saline) during DKA management.',
  whenToUse: [
    'DKA or HHS with hyperglycemia and hyponatremia',
    'Any hyperglycemic patient with low measured sodium',
    'Monitoring sodium trends during DKA/HHS treatment',
  ],
  nextSteps: 'If corrected Na > 145: Use hypotonic fluids (0.45% NS) after initial resuscitation. If corrected Na < 135: True hyponatremia exists alongside hyperglycemia. Monitor corrected sodium as glucose normalizes.',
  pearls: [
    'Classic Katz correction: Na increases by 1.6 mEq/L for every 100 mg/dL glucose above 100.',
    'Hillier revision: 2.4 mEq/L correction per 100 mg/dL may be more accurate at very high glucose (> 400).',
    'As glucose drops during treatment, measured Na should rise — if it does not, suspect free water excess.',
    'This correction applies ONLY to hyperglycemia — not to other causes of pseudohyponatremia (lipemia, paraproteinemia).',
    'Use the corrected sodium to guide fluid decisions in DKA, not the measured value.',
  ],
  evidence: 'Original correction factor of 1.6 mEq/L per 100 mg/dL by Katz (1973). Hillier et al. (1999) proposed 2.4 mEq/L at glucose > 400 mg/dL based on experimental data. Both are commonly used; Katz remains the most widely referenced.',
  formula: 'Katz: Corrected Na = Measured Na + 1.6 × [(Glucose - 100) / 100]\nHillier: Corrected Na = Measured Na + 2.4 × [(Glucose - 100) / 100]',
  references: [
    { text: 'Katz MA. Hyperglycemia-induced hyponatremia: calculation of expected serum sodium depression. N Engl J Med. 1973;289(16):843-844.', url: 'https://pubmed.ncbi.nlm.nih.gov/4763428/' },
    { text: 'Hillier TA et al. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med. 1999;106(4):399-403.', url: 'https://pubmed.ncbi.nlm.nih.gov/10225241/' },
  ],
  links: [
    { title: 'MDCalc — Sodium Correction for Hyperglycemia', url: 'https://www.mdcalc.com/calc/50/sodium-correction-hyperglycemia', description: 'Interactive corrected sodium calculator' },
  ],
  interpretations: [
    { range: '<135', label: 'True hyponatremia (even after correction)', action: 'Investigate additional causes of hyponatremia beyond dilutional effect' },
    { range: '135-145', label: 'Normal corrected sodium', action: 'Pseudohyponatremia from hyperglycemia; sodium will normalize as glucose is corrected' },
    { range: '>145', label: 'True hypernatremia (masked by glucose)', action: 'Consider hypotonic fluids; patient is actually dehydrated with free water deficit' },
  ],
  fields: [
    { key: 'sodium', label: 'Measured Sodium', type: 'number', min: 100, max: 180, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'glucose', label: 'Serum Glucose', type: 'number', min: 100, max: 2000, step: 1, placeholder: 'mg/dL', hint: 'mg/dL' },
  ],
  calculate: (vals) => {
    const na = parseFloat(vals.sodium)
    const glu = parseFloat(vals.glucose)
    if (!na || !glu) return null
    const corrKatz = na + 1.6 * ((glu - 100) / 100)
    const corrHillier = na + 2.4 * ((glu - 100) / 100)
    let interp = ''
    if (corrKatz < 135) interp = 'True hyponatremia persists after glucose correction'
    else if (corrKatz <= 145) interp = 'Normal corrected sodium — pseudohyponatremia from hyperglycemia'
    else interp = 'True hypernatremia masked by hyperglycemia — free water deficit likely'
    return {
      result: corrKatz.toFixed(1),
      unit: 'mEq/L (Katz)',
      interpretation: interp,
      detail: `Measured Na: ${na} mEq/L, Glucose: ${glu} mg/dL`,
      breakdown: [
        { label: 'Katz correction (1.6/100)', value: `${corrKatz.toFixed(1)} mEq/L` },
        { label: 'Hillier correction (2.4/100)', value: `${corrHillier.toFixed(1)} mEq/L` },
        { label: 'Correction factor', value: `+${(1.6 * ((glu - 100) / 100)).toFixed(1)} mEq/L` },
      ],
    }
  },
}
