export default {
  id: 'rsbi',
  name: 'RSBI (Rapid Shallow Breathing Index)',
  shortDescription: 'Predicts success of ventilator weaning — f/VT ratio',
  system: 'critical_care',
  specialty: ['Critical Care', 'Pulmonology', 'Respiratory Therapy'],
  tags: ['RSBI', 'ventilator', 'weaning', 'extubation', 'respiratory', 'ICU'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Yang KL, Tobin MJ',
  creatorYear: '1991',
  description: 'The Rapid Shallow Breathing Index (RSBI) is the ratio of respiratory frequency (f) to tidal volume (VT) measured during a spontaneous breathing trial (SBT). An RSBI < 105 breaths/min/L predicts successful extubation with high sensitivity. It is the most widely used and validated predictor of weaning outcome.',
  whyUse: 'Most validated single predictor of weaning success. Simple bedside measurement. High sensitivity (97%) at threshold < 105 for successful extubation. Part of standard SBT assessment protocols.',
  whenToUse: [
    'Before or during a spontaneous breathing trial (SBT)',
    'Assessment of extubation readiness',
    'Daily weaning screen in mechanically ventilated patients',
  ],
  nextSteps: 'RSBI < 105: Favorable — proceed with SBT/extubation if other criteria met. RSBI > 105: Unfavorable — likely to fail weaning; investigate and treat underlying cause (secretions, weakness, fluid overload, anxiety). Repeat assessment after optimization.',
  pearls: [
    'Measure during spontaneous breathing (T-piece or low PSV 5-8 cmH₂O), NOT on full ventilator support.',
    'RSBI should be measured within the first 1-3 minutes of the SBT.',
    'RSBI < 105 has ~97% sensitivity but only ~65% specificity — some patients with RSBI < 105 still fail.',
    'RSBI > 105 does NOT mean the patient cannot be extubated — it means higher failure risk.',
    'VT must be in LITERS for the calculation (not mL).',
    'Consider RSBI alongside other factors: mental status, cough strength, secretion burden, fluid balance.',
  ],
  evidence: 'Derived by Yang and Tobin (N Engl J Med, 1991) in 100 medical ICU patients. RSBI < 105 had sensitivity 97%, specificity 64%, PPV 78%, NPV 95%. Extensively validated and universally adopted.',
  formula: 'RSBI = f / VT\nf = respiratory rate (breaths/min)\nVT = tidal volume (liters)\nThreshold: < 105 breaths/min/L = favorable',
  references: [
    { text: 'Yang KL, Tobin MJ. A prospective study of indexes predicting the outcome of trials of weaning from mechanical ventilation. N Engl J Med. 1991;324(21):1445-1450.', url: 'https://pubmed.ncbi.nlm.nih.gov/2023603/' },
  ],
  links: [
    { title: 'MDCalc — RSBI', url: 'https://www.mdcalc.com/calc/1751/rapid-shallow-breathing-index-rsbi', description: 'Interactive RSBI calculator' },
  ],
  interpretations: [
    { range: '<80', label: 'Very favorable for weaning', action: 'Proceed with extubation if other criteria met' },
    { range: '80-105', label: 'Favorable for weaning', action: 'Proceed with full SBT; plan extubation if SBT successful' },
    { range: '105-120', label: 'Borderline — higher failure risk', action: 'Optimize before extubation; treat reversible factors' },
    { range: '>120', label: 'Unfavorable — likely to fail', action: 'Continue ventilatory support; address underlying issues; retry after optimization' },
  ],
  fields: [
    { key: 'rr', label: 'Respiratory Rate (during SBT)', type: 'number', min: 1, max: 80, step: 1, placeholder: 'breaths/min', hint: 'breaths/min' },
    { key: 'vt', label: 'Tidal Volume (during SBT)', type: 'number', min: 50, max: 2000, step: 10, placeholder: 'mL', hint: 'mL (will be converted to L)' },
  ],
  calculate: (vals) => {
    const rr = parseFloat(vals.rr)
    const vtMl = parseFloat(vals.vt)
    if (!rr || !vtMl || vtMl <= 0) return null
    const vtL = vtMl / 1000
    const rsbi = rr / vtL
    let interp = ''
    if (rsbi < 80) interp = 'Very favorable — high likelihood of successful extubation'
    else if (rsbi < 105) interp = 'Favorable — proceed with SBT and plan extubation'
    else if (rsbi < 120) interp = 'Borderline — higher risk of weaning failure'
    else interp = 'Unfavorable — likely to fail extubation; continue vent support'
    return {
      result: Math.round(rsbi).toString(),
      unit: 'breaths/min/L',
      interpretation: interp,
      detail: `RR: ${rr}/min, VT: ${vtMl} mL (${vtL.toFixed(2)} L)`,
    }
  },
}
