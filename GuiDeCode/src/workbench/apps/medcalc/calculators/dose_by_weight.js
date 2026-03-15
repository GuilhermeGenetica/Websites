export default {
  id: 'dose_by_weight',
  name: 'Drug Dose by Weight (mg/kg → mL)',
  shortDescription: 'Converts weight-based dosing to administered volume using drug concentration',
  system: 'pharmacology',
  specialty: ['Pediatrics', 'Emergency Medicine', 'Critical Care', 'Pharmacy', 'Anesthesia'],
  tags: ['dosing', 'mg/kg', 'pediatric', 'weight-based', 'concentration', 'volume', 'pharmacology'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard pharmacological calculation',
  creatorYear: '',
  description: 'A universal weight-based dosing calculator that converts a prescribed dose (mg/kg) to the actual dose (mg) and volume to administer (mL) based on patient weight and drug concentration (mg/mL). Essential for pediatric dosing, emergency medications, and any weight-based drug calculation.',
  whyUse: 'Prevents dosing errors in weight-based medications. Essential for pediatric drug calculations. Converts between units seamlessly. Quick bedside tool for emergency medications.',
  whenToUse: [
    'Any weight-based medication dosing (mg/kg)',
    'Pediatric drug calculations',
    'Emergency medication administration',
    'Converting dose to volume for parenteral administration',
  ],
  nextSteps: 'Verify calculated dose against safe dose ranges (mg/kg/dose and mg/kg/day). Check for maximum single-dose limits. Consider renal/hepatic dose adjustments. Round to practical volumes for administration.',
  pearls: [
    'Always verify units: mg/kg, mcg/kg, units/kg — they are NOT interchangeable.',
    'Double-check drug concentration on the vial/ampule label.',
    'For obese patients, consider ideal body weight (IBW) or adjusted body weight (ABW) for certain drugs.',
    'Maximum dose limits exist for many medications regardless of weight — always check.',
    'In pediatrics, decimal errors are a major safety concern — always double-check calculations.',
    'Some drugs use mcg/kg — convert appropriately (1 mg = 1000 mcg).',
  ],
  evidence: 'Standard pharmaceutical calculation principles. ISMP (Institute for Safe Medication Practices) recommends independent double-checks for weight-based dosing, especially in pediatrics.',
  formula: 'Total Dose (mg) = Dose (mg/kg) × Weight (kg)\nVolume (mL) = Total Dose (mg) / Concentration (mg/mL)\nNumber of doses = consider frequency/interval',
  references: [
    { text: 'Institute for Safe Medication Practices (ISMP). Guidelines for standard order sets and weight-based dosing.', url: 'https://www.ismp.org/' },
  ],
  links: [],
  interpretations: [],
  fields: [
    { key: 'weight', label: 'Patient Weight', type: 'number', min: 0.1, max: 500, step: 0.1, placeholder: 'kg', hint: 'kg' },
    { key: 'dose_per_kg', label: 'Dose per kg', type: 'number', min: 0.001, max: 10000, step: 0.001, placeholder: 'mg/kg', hint: 'mg/kg per dose' },
    { key: 'concentration', label: 'Drug Concentration', type: 'number', min: 0.001, max: 10000, step: 0.001, placeholder: 'mg/mL', hint: 'mg/mL (from vial label)' },
    { key: 'max_dose', label: 'Maximum single dose (optional)', type: 'number', min: 0.1, max: 100000, step: 0.1, placeholder: 'mg', hint: 'mg — leave blank if no cap', required: false },
  ],
  calculate: (vals) => {
    const wt = parseFloat(vals.weight)
    const dosePerKg = parseFloat(vals.dose_per_kg)
    const conc = parseFloat(vals.concentration)
    if (!wt || !dosePerKg || !conc || conc <= 0) return null
    let totalDose = dosePerKg * wt
    let capped = false
    const maxDose = parseFloat(vals.max_dose)
    if (maxDose && maxDose > 0 && totalDose > maxDose) {
      totalDose = maxDose
      capped = true
    }
    const volume = totalDose / conc
    let interp = `Administer ${volume < 1 ? volume.toFixed(2) : volume.toFixed(1)} mL (${totalDose < 1 ? totalDose.toFixed(3) : totalDose.toFixed(1)} mg)`
    if (capped) interp += ' ⚠ CAPPED at maximum single dose'
    return {
      result: volume < 1 ? volume.toFixed(2) : volume.toFixed(1),
      unit: 'mL to administer',
      interpretation: interp,
      breakdown: [
        { label: 'Total dose', value: `${totalDose < 1 ? totalDose.toFixed(3) : totalDose.toFixed(1)} mg` },
        { label: 'Volume', value: `${volume < 1 ? volume.toFixed(2) : volume.toFixed(1)} mL` },
        { label: 'Dose/kg', value: `${dosePerKg} mg/kg` },
        { label: 'Concentration', value: `${conc} mg/mL` },
        { label: 'Weight', value: `${wt} kg` },
      ],
    }
  },
}
