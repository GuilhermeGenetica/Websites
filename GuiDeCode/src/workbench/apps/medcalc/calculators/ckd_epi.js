export default {
  id: 'ckd_epi',
  name: 'CKD-EPI (eGFR)',
  shortDescription: 'Estimated glomerular filtration rate using the 2021 CKD-EPI equation',
  system: 'nephrology',
  specialty: ['Nephrology', 'Internal Medicine', 'Primary Care'],
  tags: ['GFR', 'eGFR', 'CKD', 'kidney', 'creatinine', 'renal function'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Inker LA et al. (CKD-EPI Collaboration)',
  creatorYear: '2021',
  description: 'The 2021 CKD-EPI creatinine equation estimates glomerular filtration rate (eGFR) from serum creatinine, age, and sex. This updated equation removed the race coefficient following recommendations by the NKF-ASN Task Force, providing a single equation for all races. It is more accurate than the older MDRD equation, especially at higher GFR values.',
  whyUse: 'Standard method for estimating GFR and staging CKD. Required for drug dosing adjustments. Recommended by KDIGO 2024 guidelines. The 2021 race-free equation is now the preferred standard.',
  whenToUse: [
    'Screening and staging of chronic kidney disease',
    'Drug dose adjustments for renally cleared medications',
    'Monitoring renal function over time',
    'Pre-operative renal assessment',
  ],
  nextSteps: 'eGFR ≥ 90: Normal (Stage 1 if albuminuria present). 60-89: Mildly decreased (Stage 2). 45-59: Stage 3a. 30-44: Stage 3b. 15-29: Stage 4, nephrology referral. < 15: Stage 5, prepare for RRT.',
  pearls: [
    'The 2021 CKD-EPI equation does NOT use race — applicable to all populations.',
    'Creatinine-based eGFR is inaccurate in extremes of muscle mass (bodybuilders, amputees, cachexia).',
    'Cystatin C-based eGFR can be used for confirmation when creatinine is unreliable.',
    'eGFR should be combined with albuminuria (UACR) for complete CKD staging.',
    'Acute kidney injury: eGFR is unreliable — use urine output and creatinine trends instead.',
    'Serum creatinine must be in steady state for eGFR to be valid.',
  ],
  evidence: 'The 2021 CKD-EPI equation (Inker et al., NEJM 2021) was developed from 23,652 participants across 25 studies. Endorsed by KDIGO, NKF, ASN. Performs better than MDRD at eGFR > 60.',
  formula: 'eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^Age × (1.012 if female)\nκ = 0.7 (female), 0.9 (male)\nα = -0.241 (female), -0.302 (male)\nScr = serum creatinine (mg/dL)',
  references: [
    { text: 'Inker LA et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. N Engl J Med. 2021;385(19):1737-1749.', url: 'https://pubmed.ncbi.nlm.nih.gov/34554658/' },
  ],
  links: [
    { title: 'MDCalc — CKD-EPI', url: 'https://www.mdcalc.com/calc/3939/ckd-epi-equations-glomerular-filtration-rate-gfr', description: 'Interactive CKD-EPI calculator' },
    { title: 'KDIGO — CKD Classification', url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/', description: 'KDIGO guidelines for CKD' },
  ],
  interpretations: [
    { range: '≥90', label: 'Normal or high (G1)', action: 'Normal function; CKD only if albuminuria or structural abnormality present' },
    { range: '60-89', label: 'Mildly decreased (G2)', action: 'Monitor annually; investigate if albuminuria present' },
    { range: '45-59', label: 'Mildly to moderately decreased (G3a)', action: 'Monitor every 6 months; assess CVD risk; adjust medications' },
    { range: '30-44', label: 'Moderately to severely decreased (G3b)', action: 'Nephrology referral; manage complications (anemia, bone disease)' },
    { range: '15-29', label: 'Severely decreased (G4)', action: 'Nephrology co-management; prepare for renal replacement therapy' },
    { range: '<15', label: 'Kidney failure (G5)', action: 'Dialysis or transplant evaluation; urgent nephrology' },
  ],
  fields: [
    { key: 'creatinine', label: 'Serum Creatinine', type: 'number', min: 0.1, max: 30, step: 0.01, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'age', label: 'Age', type: 'number', min: 18, max: 120, step: 1, placeholder: 'years', hint: 'years (18+)' },
    { key: 'sex', label: 'Sex', type: 'select', options: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }] },
  ],
  calculate: (vals) => {
    const scr = parseFloat(vals.creatinine)
    const age = parseInt(vals.age)
    const sex = vals.sex
    if (!scr || !age || !sex) return null
    const kappa = sex === 'female' ? 0.7 : 0.9
    const alpha = sex === 'female' ? -0.241 : -0.302
    const sexCoeff = sex === 'female' ? 1.012 : 1.0
    const minVal = Math.min(scr / kappa, 1)
    const maxVal = Math.max(scr / kappa, 1)
    const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * sexCoeff
    let stage = ''
    if (egfr >= 90) stage = 'G1 — Normal or high'
    else if (egfr >= 60) stage = 'G2 — Mildly decreased'
    else if (egfr >= 45) stage = 'G3a — Mild-moderately decreased'
    else if (egfr >= 30) stage = 'G3b — Moderate-severely decreased'
    else if (egfr >= 15) stage = 'G4 — Severely decreased'
    else stage = 'G5 — Kidney failure'
    return {
      result: egfr.toFixed(1),
      unit: 'mL/min/1.73m²',
      interpretation: stage,
      detail: `Creatinine: ${scr} mg/dL, Age: ${age}, Sex: ${sex === 'female' ? 'Female' : 'Male'}`,
    }
  },
}
