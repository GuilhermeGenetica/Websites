export default {
  id: 'vancomycin_dosing',
  name: 'Vancomycin AUC Dosing',
  shortDescription: 'AUC/MIC-guided vancomycin dosing and monitoring per ASHP/IDSA/SIDP 2020 guidelines.',
  system: 'pharmacology',
  specialty: ['Infectious Disease', 'Critical Care', 'Clinical Pharmacy', 'Internal Medicine'],
  tags: ['vancomycin', 'AUC', 'MIC', 'antibiotic', 'dosing', 'MRSA', 'pharmacokinetics'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'ASHP/IDSA/SIDP Guidelines',
  creatorYear: '2020',
  description: 'AUC/MIC-guided vancomycin dosing calculator based on 2020 ASHP/IDSA/SIDP consensus guidelines. Replaces trough-only monitoring. Targets AUC24/MIC of 400-600 mg·h/L for MRSA infections (assuming MIC ≤1 mg/L).',
  whyUse: 'AUC-guided monitoring reduces nephrotoxicity while maintaining efficacy compared to trough-only strategies. Now the recommended approach per major guidelines.',
  whenToUse: [
    'Adults requiring vancomycin for serious infections (MRSA bacteremia, endocarditis, pneumonia, meningitis)',
    'Patients at high risk of nephrotoxicity',
    'AUC-based monitoring with two-level Bayesian or first-order PK estimation',
    'Determining initial empiric dosing based on renal function',
  ],
  nextSteps: 'Target AUC24/MIC = 400-600 mg·h/L. For empiric dosing: 15-20 mg/kg IV q8-12h (based on CrCl). Obtain two levels (pre and post-distribution) for AUC calculation after 3rd or 4th dose.',
  pearls: [
    'Target AUC24 400-600 mg·h/L; avoid AUC >600 to reduce nephrotoxicity.',
    'Assumes S. aureus MIC ≤1 mg/L by broth microdilution — if MIC=2, alternative agents preferred.',
    'Loading dose: 25-30 mg/kg for critically ill patients.',
    'Dose on actual body weight (ABW); for obese patients use adjusted body weight.',
    'CrCl by Cockcroft-Gault using actual body weight for dosing interval selection.',
    'Adjust dose/interval every 2-3 days based on AUC monitoring.',
  ],
  evidence: 'Rybak et al. ASHP/IDSA/SIDP 2020 Vancomycin Consensus Guidelines. Am J Health Syst Pharm. 2020;77(11):835-864.',
  formula: `Empiric dose: 15-20 mg/kg q8-12h based on CrCl
Loading dose (critically ill): 25-30 mg/kg × 1
Vd (L/kg) ≈ 0.7 (range 0.4-1.0)
ke (hr⁻¹) = 0.00083 × CrCl + 0.0044
t½ = 0.693/ke
AUC24 = Dose_total_24h / CrCl_adj (Bayesian preferred in practice)`,
  references: [
    { text: 'Rybak MJ et al. Therapeutic monitoring of vancomycin for serious methicillin-resistant Staphylococcus aureus infections: a revised consensus guideline. Am J Health Syst Pharm. 2020;77(11):835-864.', url: 'https://pubmed.ncbi.nlm.nih.gov/32191793/' },
  ],
  links: [
    { title: 'MDCalc — Vancomycin Dosing', url: 'https://www.mdcalc.com/calc/10240/vancomycin-dosing-continuous-infusion', description: 'Vancomycin dosing calculator' },
    { title: 'ASHP 2020 Guidelines', url: 'https://www.ashp.org/pharmacy-practice/policy-positions-and-guidelines', description: 'Full guideline document' },
  ],
  interpretations: [
    { range: '0-400', label: 'AUC24 <400 — Subtherapeutic', action: 'Increase dose or decrease interval; risk of treatment failure' },
    { range: '400-600', label: 'AUC24 400-600 — Therapeutic target', action: 'Maintain current regimen; continue monitoring' },
    { range: '600-800', label: 'AUC24 >600 — Supratherapeutic', action: 'Reduce dose or extend interval; nephrotoxicity risk increased' },
  ],
  fields: [
    { key: 'weight', label: 'Actual Body Weight', type: 'number', unit: 'kg', min: 1, max: 300, placeholder: 'e.g. 70' },
    { key: 'height', label: 'Height', type: 'number', unit: 'cm', min: 100, max: 250, placeholder: 'e.g. 170' },
    { key: 'age', label: 'Age', type: 'number', unit: 'years', min: 18, max: 120, placeholder: 'e.g. 60' },
    { key: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
    { key: 'scr', label: 'Serum Creatinine', type: 'number', unit: 'mg/dL', min: 0.1, max: 20, step: 0.01, placeholder: 'e.g. 1.0' },
    { key: 'critically_ill', label: 'Critically ill / Sepsis', type: 'select', options: [{ value: 'yes', label: 'Yes — consider loading dose' }, { value: 'no', label: 'No' }] },
    { key: 'mic', label: 'Organism MIC (if known)', type: 'number', unit: 'mg/L', min: 0.125, max: 4, step: 0.125, placeholder: 'e.g. 1.0 (default)' },
  ],
  calculate(fields) {
    const wt = parseFloat(fields.weight)
    const ht = parseFloat(fields.height)
    const age = parseFloat(fields.age)
    const sex = fields.sex
    const scr = parseFloat(fields.scr)
    const mic = parseFloat(fields.mic || 1)
    const ibw = sex === 'male' ? 50 + 2.3 * ((ht / 2.54) - 60) : 45.5 + 2.3 * ((ht / 2.54) - 60)
    const abw = wt > ibw * 1.2 ? ibw + 0.4 * (wt - ibw) : wt
    const crcl = ((140 - age) * abw) / (72 * scr) * (sex === 'female' ? 0.85 : 1)
    const ke = 0.00083 * crcl + 0.0044
    const thalf = (0.693 / ke).toFixed(1)
    const vd = 0.7 * wt
    let interval, dose
    if (crcl >= 90) { interval = 8; dose = Math.round(17.5 * wt / 250) * 250 }
    else if (crcl >= 60) { interval = 12; dose = Math.round(17.5 * wt / 250) * 250 }
    else if (crcl >= 30) { interval = 24; dose = Math.round(15 * wt / 250) * 250 }
    else { interval = 48; dose = Math.round(12.5 * wt / 250) * 250 }
    const loadingDose = fields.critically_ill === 'yes' ? Math.round(27.5 * wt / 250) * 250 : null
    const maxDose = Math.min(dose, 3000)
    const cappedDose = Math.min(maxDose, 3000)
    const targetAUC = `400-600 mg·h/L (AUC24/MIC target: ${(400/mic).toFixed(0)}-${(600/mic).toFixed(0)} for MIC=${mic} mg/L)`
    const breakdown = [
      { label: 'CrCl (Cockcroft-Gault)', value: crcl.toFixed(1) + ' mL/min' },
      { label: 'Adj. body weight used', value: abw.toFixed(1) + ' kg' },
      { label: 'IBW', value: ibw.toFixed(1) + ' kg' },
      { label: 'ke (elimination rate)', value: ke.toFixed(4) + ' hr⁻¹' },
      { label: 'Half-life (t½)', value: thalf + ' hr' },
      { label: 'Vd estimate', value: vd.toFixed(0) + ' L (0.7 L/kg)' },
      { label: 'Empiric dose', value: `${cappedDose} mg q${interval}h` },
      ...(loadingDose ? [{ label: 'Loading dose (critically ill)', value: `${Math.min(loadingDose, 3000)} mg × 1 dose` }] : []),
    ]
    let warning = ''
    if (mic > 1) warning = ' ⚠ MIC >1 mg/L: consider alternative agents (linezolid, daptomycin).'
    return {
      result: `${cappedDose} mg q${interval}h`,
      unit: '(empiric — adjust per AUC monitoring)',
      interpretation: `Target: ${targetAUC}.${warning} Obtain two levels after 3rd-4th dose for AUC calculation.`,
      breakdown,
    }
  },
}
