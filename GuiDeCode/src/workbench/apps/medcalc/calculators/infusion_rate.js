export default {
  id: 'infusion_rate',
  name: 'Drug Infusion Rate Calculator',
  shortDescription: 'Converts mcg/kg/min or mg/hr dose orders to pump rate (mL/hr)',
  system: 'pharmacology',
  specialty: ['Critical Care', 'Emergency Medicine', 'Pharmacy', 'Anesthesia', 'Pediatrics'],
  tags: ['infusion', 'vasopressor', 'mcg/kg/min', 'mg/hr', 'mL/hr', 'ICU', 'drip', 'pharmacology'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard ICU pharmacological calculation',
  creatorYear: '',
  description: 'Converts weight-based continuous infusion orders (mcg/kg/min) to the pump rate (mL/hr) based on drug concentration in the bag. Essential for vasopressors (norepinephrine, dopamine, dobutamine), sedatives (propofol, midazolam), and other critical care infusions. Also supports mg/hr to mL/hr conversion.',
  whyUse: 'Prevents errors in critical infusions. Bridges the gap between physician dose orders and nursing pump settings. Essential for vasopressor, sedation, and insulin titration.',
  whenToUse: [
    'Starting or titrating vasopressor infusions (norepinephrine, dopamine, epinephrine, dobutamine)',
    'Sedation infusions (propofol, midazolam, dexmedetomidine)',
    'Any continuous infusion ordered in mcg/kg/min or mg/hr',
  ],
  nextSteps: 'Verify concentration with pharmacy and vial labels. Double-check pump rate with a second provider. Monitor hemodynamic response. Titrate dose per protocol and reassess.',
  pearls: [
    'Most common vasopressor concentrations vary by institution — ALWAYS check your bag label.',
    'Common: norepinephrine 4 mg/250 mL (= 16 mcg/mL), dopamine 400 mg/250 mL (= 1600 mcg/mL).',
    'For mcg/kg/min to mL/hr: mL/hr = (Dose × Weight × 60) / (Concentration in mcg/mL).',
    'For mg/hr to mL/hr: mL/hr = (Dose in mg/hr) / (Concentration in mg/mL).',
    'Always use standardized concentrations when available to reduce errors.',
    'Pediatric infusions often use the "rule of 6": 6 × weight (kg) mg in 100 mL → 1 mL/hr = 1 mcg/kg/min.',
  ],
  evidence: 'Standard critical care pharmacology. ISMP and Society of Critical Care Medicine recommend standardized concentrations and independent double-checks for all vasoactive and high-alert infusions.',
  formula: 'mcg/kg/min → mL/hr:\nmL/hr = (Dose [mcg/kg/min] × Weight [kg] × 60) ÷ Concentration [mcg/mL]\n\nmg/hr → mL/hr:\nmL/hr = Dose [mg/hr] ÷ Concentration [mg/mL]',
  references: [
    { text: 'ISMP. High-alert medications in acute care settings.', url: 'https://www.ismp.org/recommendations/high-alert-medications-acute-list' },
  ],
  links: [],
  interpretations: [],
  fields: [
    { key: 'dose', label: 'Ordered Dose', type: 'number', min: 0.001, max: 10000, step: 0.001, placeholder: 'dose value', hint: 'Enter dose value' },
    {
      key: 'dose_unit', label: 'Dose Unit', type: 'select',
      options: [
        { value: 'mcg_kg_min', label: 'mcg/kg/min' },
        { value: 'mg_hr', label: 'mg/hr' },
        { value: 'mcg_min', label: 'mcg/min (not weight-based)' },
        { value: 'units_hr', label: 'units/hr' },
      ],
    },
    { key: 'weight', label: 'Patient Weight (if weight-based)', type: 'number', min: 0.1, max: 500, step: 0.1, placeholder: 'kg', hint: 'kg — required for mcg/kg/min', required: false },
    { key: 'drug_amount', label: 'Drug Amount in Bag', type: 'number', min: 0.01, max: 100000, step: 0.01, placeholder: 'mg or units', hint: 'Total mg (or units) in the bag' },
    { key: 'bag_volume', label: 'Bag Volume', type: 'number', min: 1, max: 5000, step: 1, placeholder: 'mL', hint: 'mL (total volume of the bag)' },
  ],
  calculate: (vals) => {
    const dose = parseFloat(vals.dose)
    const unit = vals.dose_unit
    const drugAmt = parseFloat(vals.drug_amount)
    const bagVol = parseFloat(vals.bag_volume)
    if (!dose || !unit || !drugAmt || !bagVol || bagVol <= 0 || drugAmt <= 0) return null
    const concMgMl = drugAmt / bagVol
    const concMcgMl = concMgMl * 1000
    let mlPerHr = 0
    let doseDisplay = ''
    if (unit === 'mcg_kg_min') {
      const wt = parseFloat(vals.weight)
      if (!wt) return null
      mlPerHr = (dose * wt * 60) / concMcgMl
      doseDisplay = `${dose} mcg/kg/min × ${wt} kg`
    } else if (unit === 'mcg_min') {
      mlPerHr = (dose * 60) / concMcgMl
      doseDisplay = `${dose} mcg/min`
    } else if (unit === 'mg_hr') {
      mlPerHr = dose / concMgMl
      doseDisplay = `${dose} mg/hr`
    } else if (unit === 'units_hr') {
      const concUnitsPerMl = drugAmt / bagVol
      mlPerHr = dose / concUnitsPerMl
      doseDisplay = `${dose} units/hr`
    }
    const bagDuration = bagVol / mlPerHr
    return {
      result: mlPerHr.toFixed(1),
      unit: 'mL/hr',
      interpretation: `Set pump to ${mlPerHr.toFixed(1)} mL/hr for ${doseDisplay}`,
      breakdown: [
        { label: 'Pump rate', value: `${mlPerHr.toFixed(1)} mL/hr` },
        { label: 'Concentration', value: `${concMgMl.toFixed(3)} mg/mL (${concMcgMl.toFixed(1)} mcg/mL)` },
        { label: 'Bag duration', value: `~${bagDuration.toFixed(1)} hours` },
        { label: 'Drug in bag', value: `${drugAmt} mg in ${bagVol} mL` },
      ],
    }
  },
}
