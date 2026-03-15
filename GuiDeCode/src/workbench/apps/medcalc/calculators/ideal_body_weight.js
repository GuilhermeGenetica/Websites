export default {
  id: 'ideal_body_weight',
  name: 'Ideal Body Weight (IBW) & Adjusted BW',
  shortDescription: 'Devine formula for IBW, plus adjusted body weight for obese patients',
  system: 'utilities',
  specialty: ['Internal Medicine', 'Pharmacy', 'Critical Care', 'Anesthesia', 'Pulmonology'],
  tags: ['IBW', 'ideal body weight', 'adjusted body weight', 'Devine', 'tidal volume', 'dosing'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Devine BJ',
  creatorYear: '1974',
  description: 'Calculates Ideal Body Weight (IBW) using the Devine formula and Adjusted Body Weight (AdjBW) for obese patients. IBW is used for lung-protective tidal volume calculation (6-8 mL/kg IBW), many medication dosing adjustments, and nutritional calculations. AdjBW (IBW + 0.4 × excess weight) is used for certain drug dosing in obese patients.',
  whyUse: 'Lung-protective ventilation (tidal volume 6-8 mL/kg IBW). Drug dosing in obesity (aminoglycosides, vancomycin, heparin). Nutritional assessment baseline.',
  whenToUse: [
    'Setting ventilator tidal volumes (ARDS, all mechanical ventilation)',
    'Drug dosing adjustments for obesity',
    'Nutritional assessment',
    'BMI interpretation context',
  ],
  nextSteps: 'For ventilator: TV = 6-8 mL/kg IBW. For drug dosing: check specific drug guidelines (IBW vs. ABW vs. AdjBW). For nutrition: use actual weight for caloric needs but IBW or AdjBW for protein calculations in some guidelines.',
  pearls: [
    'Lung-protective TV is ALWAYS based on IBW, not actual weight.',
    'IBW formula is height-based — does not account for body composition.',
    'AdjBW = IBW + 0.4 × (Actual Weight - IBW) — used for some drug dosing in obesity.',
    'Vancomycin and aminoglycosides: use actual body weight (AdjBW or TBW depending on drug).',
    'For patients shorter than 5 feet (152.4 cm): the formula may give very low values — use clinical judgment.',
    'Some references use 0.25 instead of 0.4 for the AdjBW correction factor — check specific drug guidelines.',
  ],
  evidence: 'Devine formula (1974) originally for drug dosing. Adopted for ventilator management after ARDSNet trial (NEJM 2000). IBW-based tidal volumes (6 mL/kg IBW) reduced mortality by 22% in ARDS.',
  formula: 'Male IBW (kg) = 50 + 2.3 × (height in inches - 60)\nFemale IBW (kg) = 45.5 + 2.3 × (height in inches - 60)\nAdjBW = IBW + 0.4 × (Actual Weight - IBW)\nTV range = 6-8 mL/kg IBW',
  references: [
    { text: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.', url: 'https://scholar.google.com/scholar?q=Devine+gentamicin+therapy+1974' },
    { text: 'ARDSNet. Ventilation with lower tidal volumes for ALI and ARDS. N Engl J Med. 2000;342(18):1301-1308.', url: 'https://pubmed.ncbi.nlm.nih.gov/10793162/' },
  ],
  links: [
    { title: 'MDCalc — Ideal Body Weight', url: 'https://www.mdcalc.com/calc/29', description: 'Interactive IBW calculator' },
  ],
  interpretations: [],
  fields: [
    { key: 'height', label: 'Height', type: 'number', min: 100, max: 250, step: 0.1, placeholder: 'cm', hint: 'cm' },
    { key: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
    { key: 'actual_weight', label: 'Actual Weight (for AdjBW)', type: 'number', min: 1, max: 500, step: 0.1, placeholder: 'kg', hint: 'kg — optional for AdjBW calculation', required: false },
  ],
  calculate: (vals) => {
    const htCm = parseFloat(vals.height)
    const sex = vals.sex
    if (!htCm || !sex) return null
    const htIn = htCm / 2.54
    let ibw
    if (sex === 'male') {
      ibw = 50 + 2.3 * (htIn - 60)
    } else {
      ibw = 45.5 + 2.3 * (htIn - 60)
    }
    if (ibw < 0) ibw = 0
    const tvLow = ibw * 6
    const tvHigh = ibw * 8
    const actualWt = parseFloat(vals.actual_weight)
    let adjBW = null
    if (actualWt && actualWt > ibw) {
      adjBW = ibw + 0.4 * (actualWt - ibw)
    }
    const breakdown = [
      { label: 'Ideal Body Weight (IBW)', value: `${ibw.toFixed(1)} kg` },
      { label: 'Tidal Volume (6 mL/kg IBW)', value: `${Math.round(tvLow)} mL` },
      { label: 'Tidal Volume (8 mL/kg IBW)', value: `${Math.round(tvHigh)} mL` },
    ]
    if (adjBW !== null) {
      breakdown.push({ label: 'Adjusted Body Weight', value: `${adjBW.toFixed(1)} kg` })
      breakdown.push({ label: 'Excess weight', value: `${(actualWt - ibw).toFixed(1)} kg above IBW` })
    }
    return {
      result: ibw.toFixed(1),
      unit: 'kg (IBW)',
      interpretation: `Tidal Volume range: ${Math.round(tvLow)}-${Math.round(tvHigh)} mL (6-8 mL/kg IBW)`,
      breakdown: breakdown,
    }
  },
}
