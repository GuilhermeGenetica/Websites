export default {
  id: 'dose_by_bsa',
  name: 'Dose by BSA (mg/m²)',
  shortDescription: 'Converts BSA-based dosing (mg/m²) to actual dose using patient height and weight',
  system: 'pharmacology',
  specialty: ['Oncology', 'Hematology', 'Pharmacy', 'Pediatrics'],
  tags: ['BSA', 'dose', 'mg/m2', 'chemotherapy', 'oncology', 'body surface area'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard oncology dosing method',
  creatorYear: '',
  description: 'Calculates actual drug dose from a BSA-based prescription (mg/m²). Uses the Mosteller formula (BSA = √(height × weight / 3600)) to compute BSA, then multiplies by the prescribed dose per m². Essential for chemotherapy dosing, some pediatric medications, and other BSA-based protocols.',
  whyUse: 'Standard method for chemotherapy dose calculation. Accounts for body size variability. Required for most oncology regimens. Prevents dosing errors in BSA-based medications.',
  whenToUse: [
    'Chemotherapy dose calculation',
    'Any medication dosed by BSA (mg/m²)',
    'Pediatric dosing when BSA-based dosing is specified',
  ],
  nextSteps: 'Verify BSA and calculated dose with a second provider. Check for dose-capping rules (e.g., BSA cap at 2.0 m² for some agents). Adjust for organ function (renal, hepatic). Round to practical dose based on available vial sizes.',
  pearls: [
    'Some institutions cap BSA at 2.0 m² for dosing — check institutional policy.',
    'Obese patients: consider ideal or adjusted BSA; discuss with oncologist.',
    'Mosteller formula (√(H×W/3600)) and Du Bois formula agree within ~3% for most patients.',
    'ALWAYS have chemotherapy doses independently verified by two providers.',
    'Round doses to practical amounts based on available vial sizes.',
  ],
  evidence: 'BSA-based dosing is the standard for most chemotherapy regimens since the 1950s. While imperfect (does not account for pharmacokinetics), it remains the universal standard in oncology practice.',
  formula: 'BSA (m²) = √(Height cm × Weight kg / 3600) [Mosteller]\nActual Dose (mg) = Dose per m² × BSA',
  references: [
    { text: 'Mosteller RD. Simplified calculation of body surface area. N Engl J Med. 1987;317(17):1098.', url: 'https://pubmed.ncbi.nlm.nih.gov/3657876/' },
  ],
  links: [],
  interpretations: [],
  fields: [
    { key: 'weight', label: 'Weight', type: 'number', min: 1, max: 500, step: 0.1, placeholder: 'kg', hint: 'kg' },
    { key: 'height', label: 'Height', type: 'number', min: 30, max: 250, step: 0.1, placeholder: 'cm', hint: 'cm' },
    { key: 'dose_per_m2', label: 'Dose per m²', type: 'number', min: 0.01, max: 10000, step: 0.01, placeholder: 'mg/m²', hint: 'mg/m² (from protocol)' },
    { key: 'bsa_cap', label: 'BSA cap (optional)', type: 'number', min: 1, max: 3, step: 0.1, placeholder: 'm²', hint: 'm² — leave blank if no cap', required: false },
  ],
  calculate: (vals) => {
    const wt = parseFloat(vals.weight)
    const ht = parseFloat(vals.height)
    const dosePerM2 = parseFloat(vals.dose_per_m2)
    if (!wt || !ht || !dosePerM2) return null
    let bsa = Math.sqrt((ht * wt) / 3600)
    const bsaCap = parseFloat(vals.bsa_cap)
    let capped = false
    if (bsaCap && bsaCap > 0 && bsa > bsaCap) {
      bsa = bsaCap
      capped = true
    }
    const actualDose = dosePerM2 * bsa
    let interp = `Actual dose: ${actualDose.toFixed(1)} mg (${dosePerM2} mg/m² × ${bsa.toFixed(2)} m²)`
    if (capped) interp += ' ⚠ BSA capped'
    return {
      result: actualDose.toFixed(1),
      unit: 'mg',
      interpretation: interp,
      breakdown: [
        { label: 'BSA (Mosteller)', value: `${bsa.toFixed(2)} m²${capped ? ' (capped)' : ''}` },
        { label: 'Dose per m²', value: `${dosePerM2} mg/m²` },
        { label: 'Actual dose', value: `${actualDose.toFixed(1)} mg` },
      ],
    }
  },
}
