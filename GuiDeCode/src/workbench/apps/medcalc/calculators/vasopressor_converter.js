export default {
  id: 'vasopressor_converter',
  name: 'Vasopressor Converter',
  shortDescription: 'Convert vasopressor doses between mcg/kg/min, mg/hr, and mL/hr.',
  system: 'pharmacology',
  specialty: ['Critical Care', 'Emergency Medicine', 'Anesthesiology', 'Cardiology'],
  tags: ['vasopressor', 'norepinephrine', 'dopamine', 'dobutamine', 'epinephrine', 'infusion', 'ICU', 'dose conversion'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Clinical Pharmacology Consensus',
  creatorYear: '2020',
  description: 'Converts vasopressor/inotrope infusion rates between clinical dose units. Covers norepinephrine, epinephrine, dopamine, dobutamine, phenylephrine, and vasopressin. Essential for ICU and emergency settings.',
  whyUse: 'Unit conversion errors for vasopressors are among the most dangerous medication errors in critical care. This tool standardizes dose communication and calculation.',
  whenToUse: [
    'Initiating or titrating vasopressor infusions in ICU/ED',
    'Converting between mcg/kg/min and mL/hr for pump programming',
    'Cross-checking orders when changing concentrations or patient weight',
    'Teaching and cross-unit handoffs',
  ],
  nextSteps: 'Program infusion pump with calculated mL/hr. Always verify drug, concentration, and patient weight at bedside before starting or adjusting infusion.',
  pearls: [
    'Standard concentrations vary by institution — always verify your pharmacy preparation.',
    'Norepinephrine: typical concentrations 4 mg/250 mL (16 mcg/mL) or 8 mg/250 mL (32 mcg/mL).',
    'Dopamine: typically 400 mg/250 mL (1600 mcg/mL) or 200 mg/250 mL (800 mcg/mL).',
    'Vasopressin is dosed in units/hr, not mcg/kg/min.',
    'Epinephrine and norepinephrine: dose ≥0.25 mcg/kg/min is considered high-dose vasopressor support.',
  ],
  evidence: 'Derived from standard critical care pharmacology references and ASHP guidelines.',
  formula: `mL/hr = (Dose_mcg_kg_min × Weight_kg × 60) / Concentration_mcg_mL
mg/hr = Dose_mcg_kg_min × Weight_kg × 60 / 1000
mcg/kg/min = (mL/hr × Concentration_mcg_mL) / (Weight_kg × 60)`,
  references: [
    { text: 'ASHP. Guidelines on Handling Hazardous Drugs. AJHP. 2018.', url: 'https://www.ashp.org/pharmacy-practice/policy-positions-and-guidelines/browse-by-document-type/guidelines' },
    { text: 'Hollenberg SM. Vasoactive drugs in circulatory shock. Am J Respir Crit Care Med. 2011;183(7):847-855.', url: 'https://pubmed.ncbi.nlm.nih.gov/21097695/' },
  ],
  links: [
    { title: 'MDCalc — Vasopressor Dosing', url: 'https://www.mdcalc.com/calc/10023/vasopressors-inopressors-dosing', description: 'Vasopressor dosing reference' },
  ],
  interpretations: [],
  fields: [
    {
      key: 'direction', label: 'Convert from', type: 'select',
      options: [
        { value: 'mcg_to_ml', label: 'mcg/kg/min → mL/hr' },
        { value: 'ml_to_mcg', label: 'mL/hr → mcg/kg/min' },
        { value: 'mg_to_ml', label: 'mg/hr → mL/hr (from concentration)' },
      ],
    },
    { key: 'weight', label: 'Patient Weight', type: 'number', unit: 'kg', min: 1, max: 300, placeholder: 'e.g. 70' },
    { key: 'concentration', label: 'Drug Concentration in Bag', type: 'number', unit: 'mcg/mL', min: 0.1, max: 10000, placeholder: 'e.g. 64 (for norepinephrine 16mg/250mL)' },
    { key: 'dose_input', label: 'Dose to Convert', type: 'number', unit: 'see direction', min: 0, max: 100000, placeholder: 'e.g. 0.1 for mcg/kg/min or 5 for mL/hr' },
  ],
  calculate(fields) {
    const dir = fields.direction
    const wt = parseFloat(fields.weight)
    const conc = parseFloat(fields.concentration)
    const dose = parseFloat(fields.dose_input)
    let mlhr, mcgkgmin, mghr
    if (dir === 'mcg_to_ml') {
      mcgkgmin = dose
      mlhr = (dose * wt * 60) / conc
      mghr = dose * wt * 60 / 1000
    } else if (dir === 'ml_to_mcg') {
      mlhr = dose
      mcgkgmin = (dose * conc) / (wt * 60)
      mghr = (dose * conc) / 1000
    } else {
      mghr = dose
      mlhr = (dose * 1000) / conc
      mcgkgmin = (mghr * 1000) / (wt * 60)
    }
    const breakdown = [
      { label: 'Rate (mL/hr)', value: mlhr.toFixed(2) + ' mL/hr' },
      { label: 'Dose (mcg/kg/min)', value: mcgkgmin.toFixed(4) + ' mcg/kg/min' },
      { label: 'Dose (mg/hr)', value: mghr.toFixed(3) + ' mg/hr' },
      { label: 'Weight used', value: wt + ' kg' },
      { label: 'Concentration', value: conc + ' mcg/mL' },
    ]
    const doseLevel = mcgkgmin < 0.05 ? 'Low dose' : mcgkgmin < 0.15 ? 'Moderate dose' : mcgkgmin < 0.25 ? 'High dose' : 'Very high dose (consider additional vasopressors)'
    return {
      result: mlhr.toFixed(2),
      unit: 'mL/hr',
      interpretation: `${mcgkgmin.toFixed(4)} mcg/kg/min = ${mlhr.toFixed(2)} mL/hr = ${mghr.toFixed(3)} mg/hr — ${doseLevel}`,
      breakdown,
    }
  },
}
