export default {
  id: 'gir',
  name: 'GIR (Glucose Infusion Rate)',
  shortDescription: 'Glucose/dextrose infusion rate in mg/kg/min for TPN and IV dextrose management',
  system: 'nutrition',
  specialty: ['Neonatology', 'Pediatrics', 'Critical Care', 'Nutrition'],
  tags: ['GIR', 'glucose', 'dextrose', 'TPN', 'infusion', 'neonatal', 'hypoglycemia'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard neonatal/ICU calculation',
  creatorYear: '',
  description: 'Calculates the Glucose Infusion Rate (GIR) in mg/kg/min from the concentration of dextrose solution and the infusion rate. GIR is essential for neonatal glucose management, TPN administration, and preventing hypoglycemia or hyperglycemia in critically ill patients.',
  whyUse: 'Prevents neonatal hypoglycemia and hyperglycemia. Guides TPN dextrose titration. Essential for NICU glucose management. Monitors glucose delivery in critically ill patients.',
  whenToUse: [
    'Neonatal IV glucose management',
    'TPN initiation and adjustment',
    'Insulin infusion management in ICU',
    'Calculating glucose delivery from maintenance fluids',
  ],
  nextSteps: 'Target GIR: Neonates 4-6 mg/kg/min (start), up to 12 mg/kg/min max. Adults on TPN: typically 3-5 mg/kg/min. GIR > 10-12 may cause hepatic steatosis. Monitor blood glucose every 1-6 hours during adjustments.',
  pearls: [
    'D10W at maintenance rate provides ~5-6 mg/kg/min in neonates — a typical starting GIR.',
    'D5W provides roughly half the GIR of D10W at the same rate.',
    'Max GIR for neonates: ~12 mg/kg/min. Exceeding this risks hyperglycemia and hepatic steatosis.',
    'Adults on TPN: keep GIR < 4-5 mg/kg/min to avoid hyperglycemia.',
    'Dextrose concentrations: D5 = 5 g/100mL = 50 mg/mL, D10 = 100 mg/mL, D50 = 500 mg/mL.',
    'If GIR is adequate but hypoglycemia persists, consider hyperinsulinism, adrenal insufficiency, or metabolic disease.',
  ],
  evidence: 'Standard neonatal and critical care practice. AAP neonatal glucose management guidelines recommend maintaining adequate GIR to prevent hypoglycemia (blood glucose > 45 mg/dL in neonates).',
  formula: 'GIR (mg/kg/min) = (Dextrose % × Rate mL/hr × 1000) / (Weight kg × 60 × 100)\nSimplified: GIR = (Dextrose concentration mg/mL × Rate mL/hr) / (Weight kg × 60)',
  references: [
    { text: 'Adamkin DH. Neonatal hypoglycemia. Semin Fetal Neonatal Med. 2017;22(1):36-43.', url: 'https://pubmed.ncbi.nlm.nih.gov/27605513/' },
  ],
  links: [],
  interpretations: [
    { range: '<4', label: 'Below typical neonatal requirement', action: 'May need to increase rate or concentration; risk of hypoglycemia' },
    { range: '4-8', label: 'Typical neonatal range', action: 'Adequate for most neonates; monitor glucose' },
    { range: '8-12', label: 'High GIR', action: 'May be needed for refractory hypoglycemia; monitor for hyperglycemia' },
    { range: '>12', label: 'Very high — exceeds typical maximum', action: 'Risk of hyperglycemia and hepatic steatosis; investigate hypoglycemia etiology' },
  ],
  fields: [
    { key: 'dextrose_pct', label: 'Dextrose Concentration', type: 'select', options: [{ value: '5', label: 'D5 (5%)' }, { value: '10', label: 'D10 (10%)' }, { value: '12.5', label: 'D12.5 (12.5%)' }, { value: '15', label: 'D15 (15%)' }, { value: '20', label: 'D20 (20%)' }, { value: '25', label: 'D25 (25%)' }, { value: '50', label: 'D50 (50%)' }] },
    { key: 'rate', label: 'Infusion Rate', type: 'number', min: 0.1, max: 2000, step: 0.1, placeholder: 'mL/hr', hint: 'mL/hr' },
    { key: 'weight', label: 'Patient Weight', type: 'number', min: 0.2, max: 300, step: 0.01, placeholder: 'kg', hint: 'kg' },
  ],
  calculate: (vals) => {
    const dexPct = parseFloat(vals.dextrose_pct)
    const rate = parseFloat(vals.rate)
    const wt = parseFloat(vals.weight)
    if (!dexPct || !rate || !wt || wt <= 0) return null
    const concMgMl = dexPct * 10
    const gir = (concMgMl * rate) / (wt * 60)
    const glucosePerDay = concMgMl * rate * 24 / 1000
    let interp = ''
    if (gir < 4) interp = 'Below typical neonatal requirement — risk of hypoglycemia'
    else if (gir <= 8) interp = 'Typical neonatal range — adequate glucose delivery'
    else if (gir <= 12) interp = 'High GIR — monitor for hyperglycemia'
    else interp = 'Very high — exceeds typical max; risk of hepatic steatosis'
    return {
      result: gir.toFixed(1),
      unit: 'mg/kg/min',
      interpretation: interp,
      breakdown: [
        { label: 'GIR', value: `${gir.toFixed(1)} mg/kg/min` },
        { label: 'Dextrose concentration', value: `D${dexPct} (${concMgMl} mg/mL)` },
        { label: 'Glucose delivered/day', value: `${glucosePerDay.toFixed(0)} g/day` },
        { label: 'Calories from dextrose/day', value: `${(glucosePerDay * 3.4).toFixed(0)} kcal/day` },
      ],
    }
  },
}
