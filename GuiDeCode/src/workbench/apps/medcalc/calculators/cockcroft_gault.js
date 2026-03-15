export default {
  id: 'cockcroft_gault',
  name: 'Creatinine Clearance (Cockcroft-Gault)',
  shortDescription: 'Estimates CrCl for drug dose adjustments',
  system: 'nephrology',
  specialty: ['Nephrology', 'Pharmacology', 'Internal Medicine', 'Critical Care'],
  tags: ['creatinine clearance', 'renal function', 'GFR', 'drug dosing', 'kidney'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Cockcroft & Gault',
  creatorYear: '1976',
  description: 'The Cockcroft-Gault equation estimates creatinine clearance (CrCl) from serum creatinine, age, weight, and sex. Although not a true GFR measurement, it remains the standard for drug dose adjustments as most pharmacokinetic studies used this formula. It tends to overestimate GFR in obese patients and should use adjusted body weight in that population.',
  whyUse: 'Most drug prescribing information and pharmacokinetic studies use Cockcroft-Gault for renal dose adjustments. It is the preferred equation when adjusting doses for renally cleared medications.',
  whenToUse: [
    'Drug dose adjustment for renally cleared medications',
    'Assessment of renal function in elderly patients',
    'Anticoagulant dosing (DOACs, enoxaparin)',
    'Antibiotic dose adjustment (vancomycin, aminoglycosides)',
  ],
  nextSteps: 'Use CrCl value to adjust medication doses per drug labeling. Consider using adjusted body weight for obese patients (ABW = IBW + 0.4 × [TBW − IBW]). For CKD staging, prefer CKD-EPI equation instead.',
  pearls: [
    'Cockcroft-Gault is NOT recommended for CKD staging — use CKD-EPI eGFR for that purpose.',
    'In obese patients (>130% IBW), use adjusted body weight to avoid overestimation.',
    'Creatinine-based equations are unreliable in AKI, muscle wasting, extremes of age, and amputees.',
    'The equation assumes stable creatinine — do not use in rapidly changing renal function.',
    'In elderly patients with very low muscle mass, a "normal" creatinine may mask significant renal impairment.',
  ],
  evidence: 'Original derivation in 249 male patients. Validated extensively over decades. Remains FDA-preferred for pharmacokinetic labeling despite known limitations in extremes of body weight.',
  formula: 'CrCl (mL/min) = [(140 - Age) × Weight (kg)] / [72 × Serum Creatinine (mg/dL)]\n× 0.85 if Female',
  references: [
    { text: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.', url: 'https://pubmed.ncbi.nlm.nih.gov/1244564/' },
    { text: 'Dowling TC et al. Is there a need for Cockcroft-Gault? Pharmacotherapy. 2013;33(9):912-918.', url: 'https://pubmed.ncbi.nlm.nih.gov/23625823/' },
  ],
  links: [
    { title: 'MDCalc — Cockcroft-Gault', url: 'https://www.mdcalc.com/calc/43/creatinine-clearance-cockcroft-gault-equation', description: 'Interactive CrCl calculator with clinical guidance' },
    { title: 'KDIGO Guidelines', url: 'https://kdigo.org/guidelines/', description: 'KDIGO CKD evaluation and management guidelines' },
  ],
  interpretations: [
    { range: '≥90', label: 'Normal or high (G1)', action: 'Standard drug dosing' },
    { range: '60-89', label: 'Mildly decreased (G2)', action: 'Check drug labeling for dose adjustments' },
    { range: '45-59', label: 'Mild-to-moderate decrease (G3a)', action: 'Dose adjustment likely required for many drugs' },
    { range: '30-44', label: 'Moderate-to-severe decrease (G3b)', action: 'Significant dose reductions; avoid nephrotoxins' },
    { range: '15-29', label: 'Severely decreased (G4)', action: 'Major dose adjustments; nephrology referral' },
    { range: '<15', label: 'Kidney failure (G5)', action: 'Dialysis consideration; many drugs contraindicated' },
  ],
  fields: [
    { key: 'age', label: 'Age', type: 'number', min: 1, max: 120, placeholder: 'years', hint: 'years' },
    { key: 'weight', label: 'Weight', type: 'number', min: 1, max: 500, step: 0.1, placeholder: 'kg', hint: 'kg (use ABW if obese)' },
    { key: 'creatinine', label: 'Serum Creatinine', type: 'number', min: 0.1, max: 30, step: 0.01, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'sex', label: 'Sex', type: 'radio', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
  ],
  calculate: (vals) => {
    const age = parseFloat(vals.age)
    const w = parseFloat(vals.weight)
    const cr = parseFloat(vals.creatinine)
    const sex = vals.sex
    if (!age || !w || !cr || !sex) return null
    let crcl = ((140 - age) * w) / (72 * cr)
    if (sex === 'female') crcl *= 0.85
    let stage = ''
    if (crcl >= 90) stage = 'Normal or high — G1'
    else if (crcl >= 60) stage = 'Mildly decreased — G2'
    else if (crcl >= 45) stage = 'Mild-to-moderate decrease — G3a'
    else if (crcl >= 30) stage = 'Moderate-to-severe decrease — G3b'
    else if (crcl >= 15) stage = 'Severely decreased — G4'
    else stage = 'Kidney failure — G5'
    return {
      result: crcl.toFixed(1),
      unit: 'mL/min',
      interpretation: stage,
      detail: `Age ${age}y, Weight ${w} kg, SCr ${cr} mg/dL, ${sex === 'female' ? 'Female' : 'Male'}`,
    }
  },
}
