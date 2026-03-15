export default {
  id: 'scorten',
  name: 'SCORTEN',
  shortDescription: 'Severity-of-illness score for toxic epidermal necrolysis (TEN/SJS)',
  system: 'dermatology',
  specialty: ['Dermatology', 'Critical Care', 'Emergency Medicine', 'Burns'],
  tags: ['SCORTEN', 'TEN', 'SJS', 'Stevens-Johnson', 'toxic epidermal necrolysis', 'drug reaction'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Bastuji-Garin S et al.',
  creatorYear: '2000',
  description: 'SCORTEN predicts mortality in patients with Stevens-Johnson syndrome (SJS) and toxic epidermal necrolysis (TEN) based on 7 clinical and laboratory variables assessed within the first 24 hours of admission. It guides the level of care and treatment intensity.',
  whyUse: 'Best validated mortality predictor for SJS/TEN. Guides ICU vs. ward disposition. Facilitates prognosis discussions with patients/families. Supports early transfer to specialized burn/dermatology centers.',
  whenToUse: [
    'Confirmed or suspected SJS/TEN at admission',
    'Within first 24 hours (day 1) and again at day 3',
    'Guiding level of care and treatment intensity',
  ],
  nextSteps: 'SCORTEN 0-1: ~3-12% mortality — close monitoring, ward may be sufficient. SCORTEN 2: ~12% — consider ICU. SCORTEN 3: ~35% — ICU admission, burn center transfer. SCORTEN ≥ 4: ~58-90% — ICU/burn center essential; aggressive supportive care.',
  pearls: [
    'Calculate at admission (day 1) and repeat at day 3 — day 3 SCORTEN is more predictive.',
    'Immediate discontinuation of the causative drug is the most important intervention.',
    'BSA detachment ≥ 10% scores +1; this is the TEN threshold.',
    'SCORTEN was specifically validated for SJS/TEN — not for other blistering diseases.',
    'Treatment is primarily supportive (wound care, fluids, pain, infection prevention).',
    'IVIG and cyclosporine may be considered but evidence is limited.',
  ],
  evidence: 'Derived by Bastuji-Garin et al. (J Invest Dermatol, 2000) in 165 patients. Validated in multiple cohorts. SCORTEN ≥ 5 associated with >90% mortality in original study.',
  formula: 'One point each for:\n1. Age ≥ 40 years\n2. Cancer/malignancy\n3. Heart rate ≥ 120 bpm\n4. Initial BSA detachment ≥ 10%\n5. Serum urea > 28 mg/dL (BUN > 28)\n6. Glucose > 252 mg/dL (14 mmol/L)\n7. Bicarbonate < 20 mEq/L',
  references: [
    { text: 'Bastuji-Garin S et al. SCORTEN: a severity-of-illness score for toxic epidermal necrolysis. J Invest Dermatol. 2000;115(2):149-153.', url: 'https://pubmed.ncbi.nlm.nih.gov/10951229/' },
  ],
  links: [
    { title: 'MDCalc — SCORTEN', url: 'https://www.mdcalc.com/calc/1099/scorten', description: 'Interactive SCORTEN calculator' },
  ],
  interpretations: [
    { range: '0-1', label: '~3.2-12% mortality', action: 'Close monitoring; may be managed on ward with dermatology consult' },
    { range: '2', label: '~12% mortality', action: 'Consider ICU admission; dermatology and ophthalmology consults' },
    { range: '3', label: '~35% mortality', action: 'ICU admission; consider burn center transfer' },
    { range: '4', label: '~58% mortality', action: 'Burn center/ICU essential; aggressive supportive care' },
    { range: '≥5', label: '~90% mortality', action: 'Maximum support; goals of care discussion' },
  ],
  fields: [
    { key: 'age40', label: 'Age ≥ 40 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'cancer', label: 'Associated malignancy', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'hr120', label: 'Heart rate ≥ 120 bpm', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'bsa10', label: 'Initial BSA epidermal detachment ≥ 10%', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'urea', label: 'Serum urea (BUN) > 28 mg/dL', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'glucose', label: 'Glucose > 252 mg/dL (14 mmol/L)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'bicarb', label: 'Bicarbonate < 20 mEq/L', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['age40', 'cancer', 'hr120', 'bsa10', 'urea', 'glucose', 'bicarb']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const mortTable = { 0: '~3.2%', 1: '~12.1%', 2: '~12.1%', 3: '~35.3%', 4: '~58.3%', 5: '~90%' }
    let interp = ''
    if (score <= 1) interp = 'Low-moderate risk — close monitoring, dermatology consult'
    else if (score <= 2) interp = 'Moderate risk — consider ICU admission'
    else if (score === 3) interp = 'High risk — ICU/burn center transfer'
    else interp = 'Very high risk — maximum support, goals of care discussion'
    return {
      result: String(score),
      unit: 'points (0-7)',
      interpretation: interp,
      detail: `Predicted mortality: ${mortTable[Math.min(score, 5)] || '>90%'}`,
    }
  },
}
